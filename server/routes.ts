import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertVoteSchema, insertTransactionSchema, transactions } from "@shared/schema";
import { z } from "zod";
import transactionRoutes from "./routes/transactions";
import healthRoutes from "./routes/health";
import quizRoutes from "./routes/quizzes";
import { log } from "./vite";
import { db } from "./db";
import { eq, and, count, sql } from "drizzle-orm";
import { userTrackerMiddleware } from "./middleware/userTracker";

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
    
    // Normalize the address to lowercase
    const normalizedAddress = address.startsWith('0x') 
      ? address.toLowerCase() 
      : `0x${address}`.toLowerCase();
    
    console.log(`Processing historical points request for address: ${normalizedAddress}, period: ${period}`);
    
    let user = await storage.getUser(normalizedAddress);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    try {
      const historicalData = await storage.getUserHistoricalPoints(user.id, period as string);
      res.json(historicalData);
    } catch (error) {
      console.error('Error fetching historical points:', error);
      res.status(500).json({ error: 'Failed to fetch historical points data' });
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
    
    const leaderboard = await storage.getLeaderboard(limit);
    res.json(leaderboard);
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
      if (txHash && fromToken && toToken && fromAmount && toAmount) {
        await storage.createTransaction({
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
    
    let user = await storage.getUser(normalizedAddress);
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
    
    let user = await storage.getUser(normalizedAddress);
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
      
      // Find user or auto-create if not found
      let user = await storage.getUser(normalizedAddress);
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
        console.log(`Awarding ${POINTS_PER_SWAP} points for swap #${swapCountToday + 1} to user ${user.id}`);
      } else {
        console.log(`No points awarded - already reached ${MAX_DAILY_SWAPS_FOR_POINTS} swaps for the day for user ${user.id}`);
      }
      
      // Create transaction record 
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
      
      // Manually add points if needed (beyond what createTransaction handles)
      if (points > 0) {
        await storage.addUserPoints(user.id, points);
      }
      
      res.status(201).json({
        ...transaction,
        points
      });
    } catch (error) {
      console.error("Error recording swap transaction:", error);
      res.status(400).json({ message: "Failed to record transaction" });
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
      
      // Increment the swap count
      const newSwapCount = await storage.incrementUserSwapCount(userId);
      
      res.json({ userId, swapCount: newSwapCount });
    } catch (error) {
      console.error("Error incrementing swap count:", error);
      res.status(500).json({ message: "Error incrementing swap count" });
    }
  });
  
  // Add points to user
  app.post(`${apiPrefix}/users/:userIdOrAddress/add-points`, async (req, res) => {
    try {
      const { userIdOrAddress } = req.params;
      let userId: number;
      
      // Parse points from request body
      const points = parseInt(req.body.points || "0", 10);
      if (isNaN(points) || points <= 0) {
        return res.status(400).json({ message: "Invalid points value" });
      }
      
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

  const httpServer = createServer(app);

  return httpServer;
}
