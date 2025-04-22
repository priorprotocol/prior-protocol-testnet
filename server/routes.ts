import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertVoteSchema, insertTransactionSchema, transactions, users } from "@shared/schema";
import { z } from "zod";
import transactionRoutes from "./routes/transactions";
import healthRoutes from "./routes/health";
import quizRoutes from "./routes/quizzes";
import { log } from "./vite";
import { db, pool } from "./db";
import { eq, and, count, sql } from "drizzle-orm";
import { userTrackerMiddleware } from "./middleware/userTracker";

// Global WebSocket server instance
export let wss: WebSocketServer;

// Notification types 
interface PointsNotification {
  type: 'points_update';
  userId: number;
  address: string;
  pointsBefore: number;
  pointsAfter: number;
  timestamp: string;
}

interface LeaderboardNotification {
  type: 'leaderboard_update';
  totalGlobalPoints: number;
  userCount: number;
  timestamp: string;
}

export type PointsSystemNotification = PointsNotification | LeaderboardNotification;

// Helper to broadcast notifications to all connected clients
export function broadcastNotification(notification: PointsSystemNotification): void {
  if (!wss) {
    console.error('[WebSocket] Cannot broadcast - WebSocket server not initialized');
    return;
  }
  
  console.log(`[WebSocket] Broadcasting ${notification.type} notification to all clients`);
  
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(notification));
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix
  const apiPrefix = "/api";
  
  // Apply global middleware
  // Automatically track and create users when requests have wallet addresses
  app.use(`${apiPrefix}/users/:address`, userTrackerMiddleware);
  
  // Register modular transaction routes
  app.use(apiPrefix, transactionRoutes);
  
  // Register health check routes for Railway monitoring
  app.use(apiPrefix, healthRoutes);
  
  // Register quiz routes for blockchain education feature
  app.use(apiPrefix, quizRoutes);
  
  // Maintenance endpoint to remove all faucet claim points
  app.post(`${apiPrefix}/maintenance/remove-faucet-points`, async (req, res) => {
    try {
      console.log("Removing all faucet claim points as per maintenance request");
      const pointsRemoved = await storage.removePointsForFaucetClaims();
      
      return res.status(200).json({
        success: true,
        message: `Successfully removed ${pointsRemoved} points from faucet claims`,
        pointsRemoved
      });
    } catch (error) {
      console.error("Error during faucet points removal:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while removing faucet points",
        error: String(error)
      });
    }
  });
  
  // Maintenance endpoint to reset all user points and swap transactions
  app.post(`${apiPrefix}/maintenance/reset-points-and-transactions`, async (req, res) => {
    try {
      console.log("Starting complete reset of all user points and swap transactions");
      const result = await storage.resetAllUserPointsAndTransactions();
      
      return res.status(200).json({
        success: true,
        message: `Successfully reset points for ${result.usersReset} users and deleted ${result.transactionsDeleted} transactions`,
        summary: {
          usersReset: result.usersReset,
          transactionsDeleted: result.transactionsDeleted,
          pointsReset: result.pointsReset
        }
      });
    } catch (error) {
      console.error("Error during points and transactions reset:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while resetting points and transactions",
        error: String(error)
      });
    }
  });
  
  // CRITICAL MAINTENANCE ENDPOINT: Complete database wipe
  // This endpoint will completely wipe all data except for the demo user
  app.post(`${apiPrefix}/maintenance/complete-reset`, async (req, res) => {
    try {
      console.log("⚠️ DANGER: Starting COMPLETE DATABASE RESET - wiping all user data with cache-busting");
      console.log("Headers:", req.headers);
      console.log("Method:", req.method);
      console.log("Body:", req.body);
      
      // Run a direct SQL query to get the true user count before reset
      // This will help us verify there's no caching issue in our storage layer
      const actualCountResult = await pool.query('SELECT COUNT(*) FROM users');
      const actualUserCount = parseInt(actualCountResult?.rows?.[0]?.count || '0');
      console.log(`[CACHE-DEBUG] Before reset - Direct SQL count shows ${actualUserCount} users in database`);
      
      // Add a verification step before performing reset to ensure we're doing the right thing
      const verificationCheck = await storage.getTotalUsersCount();
      console.log(`[CACHE-DEBUG] Storage layer reports ${verificationCheck.count} users (should match SQL count)`);
      
      // Perform the complete reset
      const result = await storage.completeReset();
      
      // Run another direct SQL query after reset to confirm it worked
      const postResetResult = await pool.query('SELECT COUNT(*) FROM users');
      const postResetCount = parseInt(postResetResult?.rows?.[0]?.count || '0');
      console.log(`[CACHE-DEBUG] After reset - Direct SQL count shows ${postResetCount} users in database (should be 1 - just demo user)`);
      
      console.log("Database reset completed successfully:", result);
      
      // Set strong cache control headers to prevent any caching of this response
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      return res.status(200).json({
        success: true,
        message: `⚠️ COMPLETE DATABASE RESET SUCCESSFUL. Deleted ${result.usersDeleted} users, ${result.transactionsDeleted} transactions, ${result.userQuestsDeleted} quests, and ${result.votesDeleted} votes. Only the demo user remains.`,
        summary: {
          usersDeleted: result.usersDeleted,
          transactionsDeleted: result.transactionsDeleted,
          userQuestsDeleted: result.userQuestsDeleted,
          votesDeleted: result.votesDeleted,
          beforeCount: actualUserCount,
          afterCount: postResetCount
        },
        timestamp: new Date().toISOString(), // Add timestamp for cache validation
        cacheRefreshed: true
      });
    } catch (error: unknown) {
      console.error("⚠️ CRITICAL ERROR during complete database reset:", error);
      const errorStack = error instanceof Error ? error.stack : 'Stack not available';
      console.error("Error stack:", errorStack);
      return res.status(500).json({
        success: false,
        message: "A critical error occurred during the complete database reset",
        error: String(error),
        stack: errorStack,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Duplicate endpoint for GET requests to support both POST and GET
  app.get(`${apiPrefix}/maintenance/complete-reset`, async (req, res) => {
    res.status(405).json({
      success: false,
      message: "Method not allowed. Please use POST for this endpoint."
    });
  });

  // Maintenance endpoint to recalculate points for all users
  app.post(`${apiPrefix}/maintenance/recalculate-points`, async (req, res) => {
    try {
      console.log("Starting points recalculation for all users");
      console.log("Headers:", req.headers);
      console.log("Method:", req.method);
      console.log("Body:", req.body);
      
      const result = await storage.recalculateAllUserPoints();
      
      console.log("Points recalculation completed successfully:", result);
      
      return res.status(200).json({
        success: true,
        message: `Successfully recalculated points for ${result.usersUpdated} users`,
        summary: {
          usersUpdated: result.usersUpdated,
          totalPointsBefore: result.totalPointsBefore,
          totalPointsAfter: result.totalPointsAfter,
          difference: result.totalPointsAfter - result.totalPointsBefore
        },
        details: result.userDetails
      });
    } catch (error: unknown) {
      console.error("Error during points recalculation:", error);
      const errorStack = error instanceof Error ? error.stack : 'Stack not available';
      console.error("Error stack:", errorStack);
      return res.status(500).json({
        success: false,
        message: "An error occurred while recalculating points",
        error: String(error),
        stack: errorStack
      });
    }
  });
  
  // Admin endpoint to award bonus points to all users who have swapped
  app.post(`${apiPrefix}/admin/reward/global`, async (req, res) => {
    try {
      // Parse request body
      const { points, reason, minSwaps, adminAddress } = req.body;
      
      // Validate the admin address
      const ADMIN_WALLET = "0x4cfc531df94339def7dcd603aac1a2deaf6888b7";
      if (!adminAddress || adminAddress.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized - Admin access required"
        });
      }
      
      // Validate points input
      if (!points || isNaN(Number(points)) || Number(points) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid points value - must be a positive number"
        });
      }
      
      // Parse and validate minimum swaps requirement
      const minSwapsCount = minSwaps ? parseInt(minSwaps) : 1;
      if (isNaN(minSwapsCount) || minSwapsCount < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid minimum swaps value - must be a positive integer"
        });
      }
      
      // Parse the reward reason
      const rewardReason = reason || `Admin global bonus: ${points} points`;
      
      // Call the storage method to add bonus points to all eligible users
      const result = await storage.addBonusPointsToAllSwapUsers(Number(points), rewardReason, minSwapsCount);
      
      // Return successful response
      return res.status(200).json({
        success: true,
        message: `Successfully rewarded ${result.usersRewarded} users with ${points} points each`,
        summary: {
          usersRewarded: result.usersRewarded,
          totalPointsAdded: result.totalPointsAdded,
          totalPointsBefore: result.totalPointsBefore,
          totalPointsAfter: result.totalPointsAfter
        },
        details: result.userDetails
      });
    } catch (error: unknown) {
      console.error("Error during global rewards distribution:", error);
      const errorStack = error instanceof Error ? error.stack : 'Stack not available';
      console.error("Error stack:", errorStack);
      return res.status(500).json({
        success: false,
        message: "An error occurred while distributing rewards",
        error: String(error),
        stack: errorStack
      });
    }
  });
  
  // Admin endpoint to award bonus points to a specific user by wallet address
  app.post(`${apiPrefix}/admin/reward/user`, async (req, res) => {
    try {
      // Parse request body
      const { address, points, reason, adminAddress } = req.body;
      
      // Validate the admin address
      const ADMIN_WALLET = "0x4cfc531df94339def7dcd603aac1a2deaf6888b7";
      if (!adminAddress || adminAddress.toLowerCase() !== ADMIN_WALLET.toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized - Admin access required"
        });
      }
      
      // Validate address input
      if (!address || !address.startsWith('0x')) {
        return res.status(400).json({
          success: false,
          message: "Invalid wallet address"
        });
      }
      
      // Validate points input
      if (!points || isNaN(Number(points)) || Number(points) <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid points value - must be a positive number"
        });
      }
      
      // Parse the reward reason
      const rewardReason = reason || `Admin individual bonus: ${points} points`;
      
      // Call the storage method to add bonus points to the specific user
      const result = await storage.addPointsByWalletAddress(address, Number(points), rewardReason);
      
      // Return appropriate response based on result
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: result.message,
          userId: result.userId,
          pointsBefore: result.pointsBefore,
          pointsAfter: result.pointsAfter
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error: unknown) {
      console.error("Error during individual reward distribution:", error);
      const errorStack = error instanceof Error ? error.stack : 'Stack not available';
      console.error("Error stack:", errorStack);
      return res.status(500).json({
        success: false,
        message: "An error occurred while distributing rewards",
        error: String(error),
        stack: errorStack
      });
    }
  });
  
  // Special endpoint to fix all swap points to be exactly 0.5 per swap
  app.post(`${apiPrefix}/maintenance/fix-points`, async (req, res) => {
    try {
      console.log("Starting special points fix for all users (forcing 0.5 points per swap)");
      console.log("Headers:", req.headers);
      console.log("Method:", req.method);
      console.log("Body:", req.body);
      
      // Import the fix script dynamically to avoid circular dependencies
      const { fixAllTransactionPoints } = await import('../scripts/fix-points.js');
      
      // Execute the fix script
      const result = await fixAllTransactionPoints();
      
      console.log("Points fix completed successfully:", result);
      
      return res.status(200).json({
        success: true,
        message: `Successfully fixed points for ${result.usersUpdated} users to 0.5 points per swap`,
        summary: {
          usersUpdated: result.usersUpdated,
          totalPointsBefore: result.totalPointsBefore,
          totalPointsAfter: result.totalPointsAfter,
          difference: result.totalPointsAfter - result.totalPointsBefore
        }
      });
    } catch (error: unknown) {
      console.error("Error during points fix process:", error);
      const errorStack = error instanceof Error ? error.stack : 'Stack not available';
      console.error("Error stack:", errorStack);
      return res.status(500).json({
        success: false,
        message: "An error occurred while fixing points",
        error: String(error),
        stack: errorStack
      });
    }
  });
  
  // Duplicate endpoint for GET requests to support both POST and GET for fix-points
  app.get(`${apiPrefix}/maintenance/fix-points`, async (req, res) => {
    res.status(405).json({
      success: false,
      message: "Method not allowed. Please use POST for this endpoint."
    });
  });
  
  // Duplicate endpoint for GET requests to support both POST and GET
  app.get(`${apiPrefix}/maintenance/recalculate-points`, async (req, res) => {
    res.status(405).json({
      success: false,
      message: "Method not allowed. Please use POST for this endpoint."
    });
  });
  
  // New maintenance endpoint to force refresh cache
  app.post(`${apiPrefix}/maintenance/force-refresh-cache`, async (req, res) => {
    try {
      console.log("Starting force cache refresh for all data");
      
      // Set cache control headers
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // 1. Get true database counts directly from SQL for verification
      const usersCountResult = await pool.query('SELECT COUNT(*) FROM users');
      const transactionsCountResult = await pool.query('SELECT COUNT(*) FROM transactions');
      
      const actualUserCount = parseInt(usersCountResult?.rows?.[0]?.count || '0');
      const actualTransactionCount = parseInt(transactionsCountResult?.rows?.[0]?.count || '0');
      
      console.log(`[CACHE-REFRESH] Direct SQL count: ${actualUserCount} users, ${actualTransactionCount} transactions`);
      
      // 2. Return fresh data with timestamp to indicate it's a fresh response
      return res.status(200).json({
        success: true,
        message: "Cache refresh completed. All data should now be fresh.",
        stats: {
          userCount: actualUserCount,
          transactionCount: actualTransactionCount
        },
        timestamp: new Date().toISOString(),
        cacheRefreshForced: true
      });
    } catch (error: unknown) {
      console.error("Error during cache refresh:", error);
      const errorStack = error instanceof Error ? error.stack : 'Stack not available';
      console.error("Error stack:", errorStack);
      return res.status(500).json({
        success: false,
        message: "An error occurred while refreshing the cache",
        error: String(error),
        stack: errorStack,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Get all tokens
  app.get(`${apiPrefix}/tokens`, async (req, res) => {
    const tokens = await storage.getAllTokens();
    res.json(tokens);
  });
  
  // Get user by wallet address
  app.get(`${apiPrefix}/users/:address`, async (req, res) => {
    const { address } = req.params;
    const user = await storage.getUser(address);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  });
  
  // Create or get user by wallet address
  app.post(`${apiPrefix}/users`, async (req, res) => {
    const addressSchema = z.object({
      address: z.string().min(42).max(42),
    });
    
    try {
      const { address } = addressSchema.parse(req.body);
      let user = await storage.getUser(address);
      let isNewUser = false;
      
      if (!user) {
        user = await storage.createUser({ address, lastClaim: null });
        isNewUser = true;
      }
      
      // Badge functionality has been removed
      
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid wallet address format" });
    }
  });
  
  // Claim tokens (update last claim time)
  app.post(`${apiPrefix}/claim`, async (req, res) => {
    const claimSchema = z.object({
      address: z.string().min(42).max(42),
      txHash: z.string().optional(),
      amount: z.string().optional(),
      blockNumber: z.number().optional()
    });
    
    try {
      const { address, txHash, amount, blockNumber } = claimSchema.parse(req.body);
      
      // Normalize address
      const normalizedAddress = address.toLowerCase();
      console.log(`Processing token claim for address: ${normalizedAddress}`);
      
      let user = await storage.getUser(normalizedAddress);
      
      if (!user) {
        user = await storage.createUser({ 
          address: normalizedAddress, 
          lastClaim: null 
        });
        console.log(`Created new user with ID ${user.id} for faucet claim`);
      }
      
      // Check if user has claimed in the last 24 hours
      if (user.lastClaim) {
        const lastClaim = new Date(user.lastClaim);
        const now = new Date();
        const timeDiff = now.getTime() - lastClaim.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          return res.status(400).json({ 
            message: "You have already claimed tokens in the last 24 hours",
            nextClaimTime: new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000)
          });
        }
      }
      
      // Update last claim time
      const updatedUser = await storage.updateUserLastClaim(normalizedAddress);
      
      // Badge functionality has been removed
      
      // If a transaction hash is provided, record the transaction
      if (txHash && updatedUser) {
        await storage.createTransaction({
          userId: updatedUser.id,
          type: 'faucet_claim',
          fromToken: null,
          toToken: 'PRIOR',
          fromAmount: null,
          toAmount: amount || '1',
          txHash,
          status: 'completed',
          blockNumber: blockNumber || null
        });
      }
      
      res.json({
        message: "Tokens claimed successfully",
        user: updatedUser,
        nextClaimTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request format" });
    }
  });
  
  // Get all quests
  app.get(`${apiPrefix}/quests`, async (req, res) => {
    const quests = await storage.getAllQuests();
    res.json(quests);
  });
  
  // Get user quests
  app.get(`${apiPrefix}/users/:address/quests`, async (req, res) => {
    const { address } = req.params;
    
    // Normalize the address to lowercase
    const normalizedAddress = address.startsWith('0x') 
      ? address.toLowerCase() 
      : `0x${address}`.toLowerCase();
    
    console.log(`Processing quest retrieval for address: ${normalizedAddress}`);
    
    const user = await storage.getUser(normalizedAddress);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const userQuests = await storage.getUserQuests(user.id);
    res.json(userQuests);
  });
  
  // Start a quest
  app.post(`${apiPrefix}/quests/:questId/start`, async (req, res) => {
    const addressSchema = z.object({
      address: z.string().min(42).max(42),
    });
    
    try {
      const { address } = addressSchema.parse(req.body);
      const questId = parseInt(req.params.questId);
      
      // Normalize address
      const normalizedAddress = address.toLowerCase();
      console.log(`Processing quest start for address: ${normalizedAddress}`);
      
      const quest = await storage.getQuest(questId);
      if (!quest) {
        return res.status(404).json({ message: "Quest not found" });
      }
      
      if (quest.status !== 'active') {
        return res.status(400).json({ message: "This quest is not active yet" });
      }
      
      let user = await storage.getUser(normalizedAddress);
      if (!user) {
        user = await storage.createUser({ 
          address: normalizedAddress, 
          lastClaim: null 
        });
        console.log(`Created new user with ID ${user.id} for quest start`);
      }
      
      // Check if user already started this quest
      const userQuests = await storage.getUserQuests(user.id);
      const existingQuest = userQuests.find(uq => uq.questId === questId);
      
      if (existingQuest) {
        return res.status(400).json({ message: "You have already started this quest" });
      }
      
      // Start the quest
      const userQuest = await storage.createUserQuest({
        userId: user.id,
        questId,
        status: 'in_progress'
      });
      
      res.json({
        message: "Quest started successfully",
        userQuest
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request format" });
    }
  });
  
  // Complete a quest
  app.post(`${apiPrefix}/quests/:questId/complete`, async (req, res) => {
    const addressSchema = z.object({
      address: z.string().min(42).max(42),
    });
    
    try {
      const { address } = addressSchema.parse(req.body);
      const questId = parseInt(req.params.questId);
      
      // Normalize address
      const normalizedAddress = address.toLowerCase();
      console.log(`Processing quest completion for address: ${normalizedAddress}`);
      
      const quest = await storage.getQuest(questId);
      if (!quest) {
        return res.status(404).json({ message: "Quest not found" });
      }
      
      let user = await storage.getUser(normalizedAddress);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if user has started this quest
      const userQuests = await storage.getUserQuests(user.id);
      const existingQuest = userQuests.find(uq => uq.questId === questId);
      
      if (!existingQuest) {
        return res.status(400).json({ message: "You have not started this quest yet" });
      }
      
      if (existingQuest.status === 'completed') {
        return res.status(400).json({ message: "You have already completed this quest" });
      }
      
      // Complete the quest
      const updatedUserQuest = await storage.updateUserQuestStatus(existingQuest.id, 'completed');
      
      // Badge functionality has been removed
      
      res.json({
        message: `Quest completed successfully! You earned ${quest.reward} PRIOR tokens.`,
        userQuest: updatedUserQuest,
        reward: quest.reward
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request format" });
    }
  });
  
  // Get all proposals
  app.get(`${apiPrefix}/proposals`, async (req, res) => {
    const proposals = await storage.getAllProposals();
    res.json(proposals);
  });
  
  // Badge functionality has been removed
  
  // Get user's stats by address
  app.get(`${apiPrefix}/users/:address/stats`, async (req, res) => {
    const { address } = req.params;
    
    // Normalize the address to lowercase
    const normalizedAddress = address.startsWith('0x') 
      ? address.toLowerCase() 
      : `0x${address}`.toLowerCase();
    
    console.log(`Processing stats request for address: ${normalizedAddress}`);
    
    let user = await storage.getUser(normalizedAddress);
    
    // Auto-create user if not found
    if (!user) {
      console.log(`Auto-creating user for address: ${normalizedAddress} when requesting stats`);
      user = await storage.createUser({
        address: normalizedAddress,
        lastClaim: null
      });
      
      // If the user has connected their wallet before but somehow not registered,
      // let's check if they have any transactions on the blockchain
      try {
        // We won't actually query the blockchain here because that's handled by the frontend
        // but we'll create a placeholder record
        console.log(`New user created with ID: ${user.id}`);
      } catch (err) {
        console.error("Error checking blockchain for user:", err);
      }
    }
    
    const stats = await storage.getUserStats(user.id);
    res.json(stats);
  });
  
  // Get user's historical points data by address
  app.get(`${apiPrefix}/users/:address/historical-points`, async (req, res) => {
    const { address } = req.params;
    const { period = 'week' } = req.query; // Options: 'day', 'week', 'month', 'all'
    
    // Set explicit CORS headers for this critical endpoint
    const origin = req.headers.origin;
    if (origin) {
      // Allow specific Netlify domains
      if (origin.includes('priortestnetv2.netlify.app') || 
          origin.includes('prior-protocol-testnet.netlify.app') ||
          origin.includes('testnetpriorprotocol.netlify.app') ||
          origin.includes('replit.app')) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
      }
    }
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    // Normalize the address to lowercase
    const normalizedAddress = address.startsWith('0x') 
      ? address.toLowerCase() 
      : `0x${address}`.toLowerCase();
    
    console.log(`Processing historical points request for address: ${normalizedAddress}, period: ${period}`);
    console.log(`DEBUG - What's in the database (using direct SQL):`);
    
    // Use direct SQL query to check the database state
    const directSqlResult = await pool.query(`
      SELECT id, address, points, total_swaps 
      FROM users 
      WHERE address = $1
    `, [normalizedAddress]);
    
    const directUsers = directSqlResult.rows || [];
    console.log(`DEBUG - Direct SQL found ${directUsers.length} users with address ${normalizedAddress}:`);
    directUsers.forEach(u => {
      console.log(`- ID: ${u.id}, Address: ${u.address}, Points: ${u.points}, Swaps: ${u.total_swaps}`);
    });
    
    // Also check transactions directly
    const directTxsResult = await pool.query(`
      SELECT t.id, t.user_id, t.type, t.points, t.tx_hash
      FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE u.address = $1
    `, [normalizedAddress]);
    
    const directTxs = directTxsResult.rows || [];
    console.log(`DEBUG - Direct SQL found ${directTxs.length} transactions for ${normalizedAddress}:`);
    directTxs.forEach(tx => {
      console.log(`- TxID: ${tx.id}, UserID: ${tx.user_id}, Type: ${tx.type}, Points: ${tx.points}, Hash: ${tx.tx_hash}`);
    });
    
    try {
      // IMPORTANT FIX: Use direct SQL results if available, don't trust the ORM here
      let user = null;
      
      if (directUsers.length > 0) {
        // Take the first user from direct SQL results, which we trust more
        const directUser = directUsers[0];
        console.log(`Using existing user with ID ${directUser.id} from direct SQL query`);
        
        // Get the full user object from the ORM now that we know the ID
        [user] = await db.select().from(users).where(eq(users.id, directUser.id));
      } else {
        // Try the ORM method as fallback
        user = await storage.getUser(normalizedAddress);
        console.log(`ORM getUser result for ${normalizedAddress}:`, user ? `Found user ID ${user.id}` : "No user found");
      }
      
      if (!user) {
        console.log(`No user found for address ${normalizedAddress}, creating default empty user`);
        // Create a new user if they don't exist yet
        user = await storage.createUser({ 
          address: normalizedAddress,
          lastClaim: null
        });
      }
      
      console.log(`Fetching historical points for user ID: ${user.id}, period: ${period}`);
      const historicalData = await storage.getUserHistoricalPoints(user.id, period as string);
      
      // Add debug log to see what's being returned
      console.log(`Historical data for ${normalizedAddress} (${period}):`, JSON.stringify(historicalData).substring(0, 200) + '...');
      
      return res.json(historicalData);
    } catch (error) {
      console.error('Error fetching historical points:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch historical points data',
        message: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });
  
  // Get user's stats by userId
  app.get(`${apiPrefix}/users/:userId/stats`, async (req, res) => {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      // If userId is not a number, assume it's an address and forward to address endpoint
      return res.redirect(`${apiPrefix}/users/${req.params.userId}/stats`);
    }
    
    try {
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats for userId:", userId, error);
      res.status(500).json({ message: "Error fetching user stats" });
    }
  });
  
  // Get leaderboard (top users by points)
  app.get(`${apiPrefix}/leaderboard`, async (req, res) => {
    const limitParam = req.query.limit ? parseInt(req.query.limit as string) : 15;
    const limit = isNaN(limitParam) ? 15 : limitParam;
    
    const pageParam = req.query.page ? parseInt(req.query.page as string) : 1;
    const page = isNaN(pageParam) ? 1 : pageParam;
    
    // Extract cache buster parameter if present (added for force refresh)
    const cacheBuster = req.query._cb ? req.query._cb : null;
    
    try {
      console.log("Fetching leaderboard data with limit:", limit, "page:", page, 
                  cacheBuster ? `(cache buster: ${cacheBuster})` : '');
      
      // Add cache control headers to prevent browser/CDN caching
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Get total users count for accurate pagination - add direct SQL count for verification
      const totalUsersResult = await storage.getTotalUsersCount();
      const totalUsers = totalUsersResult?.count || 0;
      
      // Get paginated users for leaderboard and total global points
      const leaderboardResult = await storage.getLeaderboard(limit, page);
      const users = leaderboardResult.users || [];
      const totalGlobalPoints = leaderboardResult.totalGlobalPoints || 0;
      
      console.log(`Leaderboard data fetched, users count: ${users.length}, total in DB: ${totalUsers}`);
      
      // Format the response to match the expected frontend structure
      const leaderboardData = {
        users: users,
        total: totalUsers,
        totalGlobalPoints: totalGlobalPoints, // Add the total global points
        page: page,
        totalPages: Math.ceil(totalUsers / limit) || 1,
        timestamp: new Date().toISOString(), // Add timestamp for cache invalidation
        cacheBuster: cacheBuster // Echo back cache buster if provided
      };
      
      // Log first 100 chars of the response to help debug
      console.log("Returning leaderboard data:", JSON.stringify(leaderboardData).substring(0, 100) + "...");
      res.json(leaderboardData);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({
        users: [],
        total: 0,
        page: 1,
        totalPages: 1,
        error: "Failed to fetch leaderboard data",
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Get user rank in leaderboard
  app.get(`${apiPrefix}/users/:address/rank`, async (req, res) => {
    const { address } = req.params;
    
    // Normalize the address to lowercase
    const normalizedAddress = address.startsWith('0x') 
      ? address.toLowerCase() 
      : `0x${address}`.toLowerCase();
      
    const rank = await storage.getUserRank(normalizedAddress);
    res.json({ rank });
  });
  
  // Record a swap for a user
  app.post(`${apiPrefix}/users/:address/swaps`, async (req, res) => {
    const swapSchema = z.object({
      txHash: z.string().optional(),
      fromToken: z.string().optional(),
      toToken: z.string().optional(),
      fromAmount: z.string().optional(),
      toAmount: z.string().optional(),
      blockNumber: z.number().optional()
    });
    
    try {
      const { address } = req.params;
      const { txHash, fromToken, toToken, fromAmount, toAmount, blockNumber } = swapSchema.parse(req.body);
      
      // Normalize address
      const normalizedAddress = address.startsWith('0x') 
        ? address.toLowerCase() 
        : `0x${address}`.toLowerCase();
      
      console.log(`Processing swap for address: ${normalizedAddress}`);
      
      // Find or auto-create user
      let user = await storage.getUser(normalizedAddress);
      if (!user) {
        console.log(`Auto-creating user for address: ${normalizedAddress} during swap`);
        user = await storage.createUser({
          address: normalizedAddress,
          lastClaim: null
        });
      }
      
      // Increment the swap count
      const newCount = await storage.incrementUserSwapCount(user.id);
      
      // Badge functionality has been removed
      
      // If transaction details are provided, record it
      // Note: The createTransaction method will automatically award points to the user
      if (txHash && fromToken && toToken && fromAmount && toAmount) {
        const transaction = await storage.createTransaction({
          userId: user.id,
          type: 'swap',
          fromToken,
          toToken,
          fromAmount,
          toAmount,
          txHash,
          status: 'completed',
          blockNumber: blockNumber || null
        });
        console.log(`[PointsAudit] Swap transaction record created. Points awarded: ${await storage.getTransactionPoints(transaction)}`);
      }
      
      res.json({ 
        message: "Swap recorded successfully",
        totalSwaps: newCount 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request format" });
    }
  });
  
  // Get user's vote on a proposal
  app.get(`${apiPrefix}/users/:address/proposals/:proposalId/vote`, async (req, res) => {
    const { address, proposalId } = req.params;
    
    // Normalize address
    const normalizedAddress = address.startsWith('0x') 
      ? address.toLowerCase() 
      : `0x${address}`.toLowerCase();
    
    console.log(`Processing vote retrieval for address: ${normalizedAddress}`);
    
    const user = await storage.getUser(normalizedAddress);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const proposal = await storage.getProposal(parseInt(proposalId));
    if (!proposal) {
      return res.status(404).json({ message: "Proposal not found" });
    }
    
    const vote = await storage.getUserVote(user.id, parseInt(proposalId));
    
    res.json(vote || { hasVoted: false });
  });
  
  // Vote on a proposal
  app.post(`${apiPrefix}/proposals/:proposalId/vote`, async (req, res) => {
    try {
      const proposalId = parseInt(req.params.proposalId);
      const payload = insertVoteSchema.parse(req.body);
      
      const proposal = await storage.getProposal(proposalId);
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      
      if (proposal.status !== 'active') {
        return res.status(400).json({ message: "This proposal is not active" });
      }
      
      // Check if user has already voted
      const existingVote = await storage.getUserVote(payload.userId, proposalId);
      if (existingVote) {
        return res.status(400).json({ message: "You have already voted on this proposal" });
      }
      
      // Cast the vote
      const vote = await storage.createVote({
        userId: payload.userId,
        proposalId,
        vote: payload.vote
      });
      
      // Badge functionality has been removed
      
      // Get updated proposal
      const updatedProposal = await storage.getProposal(proposalId);
      
      res.json({
        message: "Vote cast successfully",
        vote,
        proposal: updatedProposal
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request format" });
    }
  });

  // Get user's transaction history (all types) with pagination
  app.get(`${apiPrefix}/users/:address/transactions`, async (req, res) => {
    const { address } = req.params;
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '10');
    
    // Normalize the address to lowercase
    const normalizedAddress = address.startsWith('0x') 
      ? address.toLowerCase() 
      : `0x${address}`.toLowerCase();
    
    console.log(`Processing transaction history request for address: ${normalizedAddress}`);
    
    // Use direct SQL query to check the database state
    const directSqlResult = await pool.query(`
      SELECT id, address, points, total_swaps 
      FROM users 
      WHERE address = $1
    `, [normalizedAddress]);
    
    const directUsers = directSqlResult.rows || [];
    
    // IMPORTANT FIX: Use direct SQL results if available, don't trust the ORM here
    let user = null;
    
    if (directUsers.length > 0) {
      // Take the first user from direct SQL results, which we trust more
      const directUser = directUsers[0];
      console.log(`Using existing user with ID ${directUser.id} from direct SQL query`);
      
      // Get the full user object from the ORM now that we know the ID
      [user] = await db.select().from(users).where(eq(users.id, directUser.id));
    } else {
      // Try the ORM method as fallback
      user = await storage.getUser(normalizedAddress);
    }
    
    if (!user) {
      console.log(`Auto-creating user for address: ${normalizedAddress} when requesting transactions`);
      user = await storage.createUser({
        address: normalizedAddress,
        lastClaim: null
      });
    }
    
    const result = await storage.getUserTransactions(user.id, page, limit);
    
    // Add points information to each transaction
    const transactionsWithPoints = await Promise.all(
      result.transactions.map(async (tx) => {
        const points = await storage.getTransactionPoints(tx);
        return {
          ...tx,
          points
        };
      })
    );
    
    res.json({
      ...result,
      transactions: transactionsWithPoints
    });
  });

  // Get user's transaction history by type with pagination
  app.get(`${apiPrefix}/users/:address/transactions/:type`, async (req, res) => {
    const { address, type } = req.params;
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '10');
    
    // Normalize the address to lowercase
    const normalizedAddress = address.startsWith('0x') 
      ? address.toLowerCase() 
      : `0x${address}`.toLowerCase();
    
    console.log(`Processing transaction history by type request for address: ${normalizedAddress}`);
    
    // Use direct SQL query to check the database state
    const directSqlResult = await pool.query(`
      SELECT id, address, points, total_swaps 
      FROM users 
      WHERE address = $1
    `, [normalizedAddress]);
    
    const directUsers = directSqlResult.rows || [];
    
    // IMPORTANT FIX: Use direct SQL results if available, don't trust the ORM here
    let user = null;
    
    if (directUsers.length > 0) {
      // Take the first user from direct SQL results, which we trust more
      const directUser = directUsers[0];
      console.log(`Using existing user with ID ${directUser.id} from direct SQL query`);
      
      // Get the full user object from the ORM now that we know the ID
      [user] = await db.select().from(users).where(eq(users.id, directUser.id));
    } else {
      // Try the ORM method as fallback
      user = await storage.getUser(normalizedAddress);
    }
    
    if (!user) {
      console.log(`Auto-creating user for address: ${normalizedAddress} when requesting transactions by type`);
      user = await storage.createUser({
        address: normalizedAddress,
        lastClaim: null
      });
    }
    
    const result = await storage.getUserTransactionsByType(user.id, type, page, limit);
    
    // Add points information to each transaction
    const transactionsWithPoints = await Promise.all(
      result.transactions.map(async (tx) => {
        const points = await storage.getTransactionPoints(tx);
        return {
          ...tx,
          points
        };
      })
    );
    
    res.json({
      ...result,
      transactions: transactionsWithPoints
    });
  });
  
  // Get user's transaction history by user ID (for internal use) with pagination
  app.get(`${apiPrefix}/users/:userId/transactions`, async (req, res) => {
    const userId = parseInt(req.params.userId);
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '10');
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Since we can't access the private 'users' Map directly, we'll just proceed with
    // the transaction lookup and handle not finding any as an empty result
    try {
      const result = await storage.getUserTransactions(userId, page, limit);
      
      // Add points information to each transaction
      const transactionsWithPoints = await Promise.all(
        result.transactions.map(async (tx) => {
          const points = await storage.getTransactionPoints(tx);
          return {
            ...tx,
            points
          };
        })
      );
      
      res.json({
        ...result,
        transactions: transactionsWithPoints
      });
    } catch (error) {
      console.error("Error fetching transactions for userId:", userId, error);
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });
  
  // Get user's transaction history by user ID and type (for internal use) with pagination
  app.get(`${apiPrefix}/users/:userId/transactions/:type`, async (req, res) => {
    const userId = parseInt(req.params.userId);
    const { type } = req.params;
    const page = parseInt(req.query.page as string || '1');
    const limit = parseInt(req.query.limit as string || '10');
    
    if (isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    // Since we can't access the private 'users' Map directly, we'll just proceed with
    // the transaction lookup by type and handle not finding any as an empty result
    try {
      const result = await storage.getUserTransactionsByType(userId, type, page, limit);
      
      // Add points information to each transaction
      const transactionsWithPoints = await Promise.all(
        result.transactions.map(async (tx) => {
          const points = await storage.getTransactionPoints(tx);
          return {
            ...tx,
            points
          };
        })
      );
      
      res.json({
        ...result,
        transactions: transactionsWithPoints
      });
    } catch (error) {
      console.error("Error fetching transactions for userId:", userId, "type:", type, error);
      res.status(500).json({ message: "Error fetching transactions" });
    }
  });

  // Record a transaction
  app.post(`${apiPrefix}/transactions`, async (req, res) => {
    try {
      // Check if we received userId or userAddress
      let userId = req.body.userId;
      let user = null;
      let address = null;
      
      // If we have a wallet address instead of userId
      if (!userId && req.body.userAddress) {
        address = req.body.userAddress;
      }
      // If we have a direct userId that looks like a wallet address (e.g. from Swap.tsx)
      else if (typeof userId === 'string' && userId.startsWith('0x')) {
        address = userId;
      }
      // If userId is specified with address format in other fields
      else if (!userId && req.body.address) {
        address = req.body.address;
      }
      
      // Normalize address if we have one
      if (address) {
        const normalizedAddress = address.startsWith('0x') 
          ? address.toLowerCase() 
          : `0x${address}`.toLowerCase();
        
        console.log(`Looking up user for address: ${normalizedAddress}`);
        user = await storage.getUser(normalizedAddress);
        
        // If the user doesn't exist, create a new user account
        if (!user) {
          console.log(`User with address ${normalizedAddress} not found, creating new user account`);
          user = await storage.createUser({ 
            address: normalizedAddress, 
            lastClaim: null 
          });
          console.log(`Created new user with ID ${user.id}`);
        }
      }
      
      // Ensure we have a valid userId
      if (user) {
        userId = user.id;
      }
      
      // If we still don't have a valid userId, return an error
      if (!userId || typeof userId !== 'number') {
        return res.status(400).json({ message: "Invalid user ID or address" });
      }
      
      // Validate the transaction data
      const transactionData = insertTransactionSchema.parse({
        ...req.body,
        userId: userId
      });
      
      // Create the transaction with user ID
      const transaction = await storage.createTransaction(transactionData);
      
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating transaction:", error);
      res.status(400).json({ message: "Invalid transaction data", error: String(error) });
    }
  });

  // Record a faucet claim transaction
  app.post(`${apiPrefix}/transactions/faucet-claim`, async (req, res) => {
    try {
      const { address, txHash, amount, blockNumber } = req.body;
      
      if (!address || !txHash) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Normalize address
      const normalizedAddress = address.startsWith('0x') 
        ? address.toLowerCase() 
        : `0x${address}`.toLowerCase();
      
      console.log(`Processing faucet claim for address: ${normalizedAddress}`);
      
      // Find user or auto-create if not found
      let user = await storage.getUser(normalizedAddress);
      if (!user) {
        console.log(`Auto-creating user for address: ${normalizedAddress} during faucet claim`);
        user = await storage.createUser({
          address: normalizedAddress,
          lastClaim: null
        });
      }
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId: user.id,
        type: 'faucet_claim',
        fromToken: null,
        toToken: 'PRIOR',
        fromAmount: null,
        toAmount: amount || '1',
        txHash,
        status: 'completed',
        blockNumber: blockNumber || null
      });
      
      res.status(201).json(transaction);
    } catch (error) {
      res.status(400).json({ message: "Failed to record transaction" });
    }
  });

  // Record a swap transaction
  app.post(`${apiPrefix}/transactions/swap`, async (req, res) => {
    try {
      const { address, txHash, fromToken, toToken, fromAmount, toAmount, blockNumber } = req.body;
      
      if (!address || !txHash || !fromToken || !toToken || !fromAmount || !toAmount) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Normalize address
      const normalizedAddress = address.startsWith('0x') 
        ? address.toLowerCase() 
        : `0x${address}`.toLowerCase();
      
      console.log(`Processing swap transaction for address: ${normalizedAddress}`);
      
      // Use direct SQL query to ensure we find the existing user
      const directSqlResult = await pool.query(`
        SELECT id, address, points, total_swaps 
        FROM users 
        WHERE address = $1
      `, [normalizedAddress]);
      
      const directUsers = directSqlResult.rows || [];
      
      // IMPORTANT FIX: Use direct SQL results if available, don't trust the ORM here
      let user = null;
      
      if (directUsers.length > 0) {
        // Take the first user from direct SQL results, which we trust more
        const directUser = directUsers[0];
        console.log(`Using existing user with ID ${directUser.id} from direct SQL query for swap transaction`);
        
        // Get the full user object from the ORM now that we know the ID
        [user] = await db.select().from(users).where(eq(users.id, directUser.id));
      } else {
        // Try the ORM method as fallback
        user = await storage.getUser(normalizedAddress);
      }
      
      if (!user) {
        console.log(`Auto-creating user for address: ${normalizedAddress} during swap`);
        user = await storage.createUser({
          address: normalizedAddress,
          lastClaim: null
        });
      }
      
      // First, increment the user's swap count
      await storage.incrementUserSwapCount(user.id);
      
      // Determine if this is the first swap of the day for points calculation
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingSwapsToday = await db
        .select({ count: count() })
        .from(transactions)
        .where(and(
          eq(transactions.userId, user.id),
          eq(transactions.type, 'swap'),
          sql`${transactions.timestamp} >= ${today}`
        ));
      
      const swapCountToday = existingSwapsToday[0]?.count || 0;
      console.log(`User ${user.id} has ${swapCountToday} swaps today before this one`);
      
      // Calculate points based on NEW SIMPLIFIED points system
      // 0.5 points per swap for first 5 swaps each day (max 2.5 points)
      const MAX_DAILY_SWAPS_FOR_POINTS = 5;
      const POINTS_PER_SWAP = 0.5;
      
      let points = 0;
      if (swapCountToday < MAX_DAILY_SWAPS_FOR_POINTS) {
        // Award 0.5 points for each of the first 5 swaps
        points = POINTS_PER_SWAP;
        console.log(`[PointsSystem] Awarded ${POINTS_PER_SWAP} points for swap #${swapCountToday + 1} to user ${user.id}`);
      } else {
        console.log(`[PointsSystem] No points awarded - already reached ${MAX_DAILY_SWAPS_FOR_POINTS} swaps for the day for user ${user.id}`);
      }
      
          // Create transaction record with explicitly set points
      // IMPORTANT: Fixed now to properly handle explicit points value in createTransaction
      console.log(`Creating swap transaction with the following data:`, {
        userId: user.id,
        type: 'swap',
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        txHash,
        points
      });
      
      // Create the transaction with points as a string
      const txData = {
        userId: user.id,
        type: 'swap',
        fromToken,
        toToken,
        fromAmount,
        toAmount,
        txHash,
        status: 'completed',
        blockNumber: blockNumber || null,
        points: points.toString() // Convert to string explicitly for PostgreSQL compatibility
      };
      
      console.log(`Creating transaction with data:`, txData);
      
      // Try storage approach first
      let transaction;
      try {
        transaction = await storage.createTransaction(txData);
        console.log(`Successfully created transaction through storage layer: ${JSON.stringify(transaction)}`);
      } catch (storageError) {
        console.error("Storage layer failed to create transaction:", storageError);
        
        // If storage layer fails, try direct SQL insert as a fallback
        try {
          console.log("Falling back to direct SQL insert");
          const result = await pool.query(`
            INSERT INTO transactions (
              user_id, type, from_token, to_token, from_amount, to_amount, 
              tx_hash, status, block_number, points, timestamp
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
            RETURNING *
          `, [
            user.id,
            'swap',
            fromToken,
            toToken,
            fromAmount,
            toAmount,
            txHash,
            'completed',
            blockNumber || null,
            points.toString()
          ]);
          
          transaction = result.rows[0];
          console.log(`Successfully created transaction with direct SQL: ${JSON.stringify(transaction)}`);
          
          // Also update the user's points and swap count immediately
          await pool.query(`
            UPDATE users 
            SET points = points + $1, 
                total_swaps = total_swaps + 1
            WHERE id = $2
          `, [points, user.id]);
        } catch (sqlError) {
          console.error("Direct SQL insert also failed:", sqlError);
          throw sqlError;
        }
      }
      
      // After creating transaction, let's make sure their points are consistent
      // by triggering a recalculation
      await storage.recalculatePointsForUser(user.id);
      
      // Prepare response payload with numeric points for API consistency
      const responsePayload = {
        ...transaction,
        points // Use the numeric points for the response
      };
      
      res.status(201).json(responsePayload);
    } catch (error) {
      console.error("Error recording swap transaction:", error);
      res.status(500).json({ 
        message: "Failed to record transaction", 
        error: error.message || String(error)
      });
    }
  });
  
  // Increment user swap count
  // Get daily swap count for a user
  app.get(`${apiPrefix}/users/:userIdOrAddress/daily-swap-count`, async (req, res) => {
    try {
      const { userIdOrAddress } = req.params;
      let userId: number;
      
      // Check if this is a wallet address or a numeric ID
      if (userIdOrAddress.startsWith('0x')) {
        // This is a wallet address
        // Normalize address
        const normalizedAddress = userIdOrAddress.toLowerCase();
        console.log(`Processing daily swap count check for address: ${normalizedAddress}`);
        
        let user = await storage.getUser(normalizedAddress);
        if (!user) {
          console.log(`Auto-creating user for address: ${normalizedAddress} during daily swap count check`);
          user = await storage.createUser({
            address: normalizedAddress,
            lastClaim: null
          });
        }
        userId = user.id;
      } else {
        // This is a numeric ID
        userId = parseInt(userIdOrAddress);
        if (isNaN(userId)) {
          return res.status(400).json({ message: "Invalid user ID format" });
        }
      }
      
      // Get daily swap count
      const count = await storage.getDailySwapCount(userId);
      
      res.json({ count });
    } catch (error) {
      console.error("Error getting daily swap count:", error);
      res.status(500).json({ message: "Error getting daily swap count" });
    }
  });

  // Replaced direct swap count increment with daily swap count check
  // to prevent double-counting when transactions are recorded in multiple places
  app.post(`${apiPrefix}/users/:userIdOrAddress/increment-swap-count`, async (req, res) => {
    try {
      const { userIdOrAddress } = req.params;
      let userId: number;
      
      // Check if this is a wallet address or a numeric ID
      if (userIdOrAddress && userIdOrAddress.toString().startsWith('0x')) {
        // It's a wallet address
        // Normalize address
        const normalizedAddress = userIdOrAddress.toString().toLowerCase();
        console.log(`Processing increment swap count for address: ${normalizedAddress}`);
        
        let user = await storage.getUser(normalizedAddress);
        
        // If user doesn't exist, create a new user
        if (!user) {
          console.log(`User with address ${normalizedAddress} not found, creating new user account`);
          user = await storage.createUser({ 
            address: normalizedAddress, 
            lastClaim: null 
          });
          console.log(`Created new user with ID ${user.id}`);
        }
        
        userId = user.id;
      } else {
        // It's a numeric ID
        userId = parseInt(userIdOrAddress, 10);
        if (isNaN(userId)) {
          return res.status(400).json({ message: "Invalid user ID" });
        }
      }
      
      // REMOVED DIRECT INCREMENT - now just returning current count
      // to prevent double-counting with the transaction recording
      const user = await storage.getUserById(userId);
      const swapCount = user?.totalSwaps || 0;
      
      console.log(`[DEPRECATED] increment-swap-count endpoint called - this is now handled by transaction recording`);
      
      res.json({ 
        userId, 
        swapCount,
        message: "Note: Swap counts now updated automatically with transaction recording"
      });
    } catch (error) {
      console.error("Error in swap count endpoint:", error);
      res.status(500).json({ message: "Error processing swap count request" });
    }
  });
  
  // Add points to user
  app.post(`${apiPrefix}/users/:userIdOrAddress/add-points`, async (req, res) => {
    try {
      const { userIdOrAddress } = req.params;
      let userId: number;
      
      // Parse points from request body - now supports decimal points
      const points = parseFloat(req.body.points || "0");
      if (isNaN(points) || points <= 0) {
        return res.status(400).json({ message: "Invalid points value" });
      }
      
      console.log(`Adding ${points} points from API request for user ${userIdOrAddress}`);
      
      // Check if this is a wallet address or a numeric ID
      if (userIdOrAddress && userIdOrAddress.toString().startsWith('0x')) {
        // It's a wallet address
        // Normalize address
        const normalizedAddress = userIdOrAddress.toString().toLowerCase();
        console.log(`Processing add points for address: ${normalizedAddress}`);
        
        let user = await storage.getUser(normalizedAddress);
        
        // If user doesn't exist, create a new user
        if (!user) {
          console.log(`User with address ${normalizedAddress} not found, creating new user account`);
          user = await storage.createUser({ 
            address: normalizedAddress, 
            lastClaim: null 
          });
          console.log(`Created new user with ID ${user.id}`);
        }
        
        userId = user.id;
      } else {
        // It's a numeric ID
        userId = parseInt(userIdOrAddress, 10);
        if (isNaN(userId)) {
          return res.status(400).json({ message: "Invalid user ID" });
        }
      }
      
      // Add points to the user
      const newPointsTotal = await storage.addUserPoints(userId, points);
      
      // Badge functionality has been removed
      
      res.json({ userId, points: newPointsTotal, added: points });
    } catch (error) {
      console.error("Error adding points:", error);
      res.status(500).json({ message: "Error adding points" });
    }
  });

  // Create an HTTP server from the Express app
  const httpServer = createServer(app);
  
  // Initialize WebSocket server on a distinct path to avoid conflicts with Vite's HMR websocket
  wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws',
    // Add CORS settings that match our Express CORS configuration
    verifyClient: (info, callback) => {
      const origin = info.origin;
      console.log(`[WebSocket] Connection attempt from origin: ${origin}`);
      
      // List of allowed WebSocket origins - should mirror our Express CORS config
      const allowedWsOrigins = [
        // Custom domains
        'https://testnetpriorprotocol.xyz',
        'http://testnetpriorprotocol.xyz',
        'https://www.testnetpriorprotocol.xyz',
        'http://www.testnetpriorprotocol.xyz',
        // Netlify domains
        'https://priortestnetv2.netlify.app',
        'http://priortestnetv2.netlify.app',
        'https://prior-protocol-testnet.netlify.app',
        'http://prior-protocol-testnet.netlify.app',
        'https://testnetpriorprotocol.netlify.app',
        'http://testnetpriorprotocol.netlify.app',
        'https://prior-testnet.netlify.app',
        'http://prior-testnet.netlify.app',
        'https://prior-test.netlify.app',
        'http://prior-test.netlify.app',
        'https://prior-protocol.netlify.app',
        'http://prior-protocol.netlify.app',
        // Replit domains
        'https://prior-protocol-testnet-priorprotocol.replit.app',
        'http://prior-protocol-testnet-priorprotocol.replit.app'
      ];
      
      // Allow connections from recognized origins or in development
      if (
        !origin || // Allow connections without origin (some clients don't send it)
        allowedWsOrigins.includes(origin) ||
        origin.includes('localhost') ||
        origin.includes('replit.dev') ||
        origin.includes('replit.app') ||
        origin.includes('janeway.replit') || 
        origin.includes('netlify.app') ||
        origin.includes('netlify.com')
      ) {
        console.log(`[WebSocket] Accepting connection from origin: ${origin}`);
        callback(true);
      } else {
        console.log(`[WebSocket] Rejecting connection from unauthorized origin: ${origin}`);
        callback(false, 403, 'Unauthorized origin');
      }
    },
    // Increase ping timeout for Replit environment which can have higher latency
    clientTracking: true,
  });
  
  // Set up ping interval for keeping connections alive
  // This is especially important in Replit's environment
  const pingInterval = setInterval(() => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.ping();
      }
    });
  }, 30000); // 30 second interval
  
  // Handle WebSocket connections
  wss.on('connection', (ws, req) => {
    console.log('[WebSocket] Client connected');
    
    // Track if the client is alive with a isAlive property
    (ws as any).isAlive = true;
    
    // Handle pong responses from clients
    ws.on('pong', () => {
      (ws as any).isAlive = true;
    });
    
    // Log connection details for debugging
    const clientIp = req.socket.remoteAddress;
    const forwardedFor = req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];
    
    console.log(`[WebSocket] Client details - IP: ${clientIp}, Forwarded-For: ${forwardedFor}, UA: ${userAgent}`);
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({ 
      type: 'connection_established',
      message: 'Connected to Prior Protocol WebSocket server',
      timestamp: new Date().toISOString()
    }));
    
    // Handle incoming messages (if needed)
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('[WebSocket] Received message:', data);
      } catch (error) {
        console.error('[WebSocket] Error parsing message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      console.log('[WebSocket] Client disconnected');
    });
    
    // Handle errors
    ws.on('error', (error) => {
      console.error('[WebSocket] Client connection error:', error);
    });
  });
  
  // Check for dead clients that haven't responded to pings
  const terminateInterval = setInterval(() => {
    wss.clients.forEach(client => {
      if ((client as any).isAlive === false) {
        console.log('[WebSocket] Terminating inactive client');
        return client.terminate();
      }
      
      (client as any).isAlive = false;
    });
  }, 40000); // Check slightly after ping interval
  
  // Clean up intervals when server closes
  wss.on('close', () => {
    clearInterval(pingInterval);
    clearInterval(terminateInterval);
  });
  
  console.log('WebSocket server initialized on path: /ws');
  
  return httpServer;
}
