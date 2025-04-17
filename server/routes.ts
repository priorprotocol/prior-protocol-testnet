import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertVoteSchema, insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import transactionRoutes from "./routes/transactions-fixed";
import { log } from "./vite";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix
  const apiPrefix = "/api";
  
  // Register modular transaction routes
  app.use(apiPrefix, transactionRoutes);
  
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
      let user = await storage.getUser(address);
      
      if (!user) {
        user = await storage.createUser({ address, lastClaim: null });
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
      const updatedUser = await storage.updateUserLastClaim(address);
      
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
    const user = await storage.getUser(address);
    
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
      
      const quest = await storage.getQuest(questId);
      if (!quest) {
        return res.status(404).json({ message: "Quest not found" });
      }
      
      if (quest.status !== 'active') {
        return res.status(400).json({ message: "This quest is not active yet" });
      }
      
      let user = await storage.getUser(address);
      if (!user) {
        user = await storage.createUser({ address, lastClaim: null });
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
      
      const quest = await storage.getQuest(questId);
      if (!quest) {
        return res.status(404).json({ message: "Quest not found" });
      }
      
      let user = await storage.getUser(address);
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
    
    let user = await storage.getUser(address);
    
    // Auto-create user if not found
    if (!user) {
      console.log(`Auto-creating user for address: ${address} when requesting stats`);
      user = await storage.createUser({
        address: address.toLowerCase(),
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
      
      const user = await storage.getUser(address);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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
    
    const user = await storage.getUser(address);
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
    
    let user = await storage.getUser(address);
    if (!user) {
      console.log(`Auto-creating user for address: ${address} when requesting transactions`);
      user = await storage.createUser({
        address: address.toLowerCase(),
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
    
    let user = await storage.getUser(address);
    if (!user) {
      console.log(`Auto-creating user for address: ${address} when requesting transactions by type`);
      user = await storage.createUser({
        address: address.toLowerCase(),
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
        user = await storage.getUser(address);
      }
      // If we have a direct userId that looks like a wallet address (e.g. from Swap.tsx)
      else if (typeof userId === 'string' && userId.startsWith('0x')) {
        address = userId;
        user = await storage.getUser(address);
      }
      
      // If the user doesn't exist, create a new user account
      if (address && !user) {
        console.log(`User with address ${address} not found, creating new user account`);
        user = await storage.createUser({ address, lastClaim: null });
        console.log(`Created new user:`, user);
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
      
      // Find user
      const user = await storage.getUser(address);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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
      
      // Find user
      const user = await storage.getUser(address);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
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
      
      // Increment the user's swap count
      await storage.incrementUserSwapCount(user.id);
      
      res.status(201).json(transaction);
    } catch (error) {
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
        const user = await storage.getUser(userIdOrAddress);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
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
        let user = await storage.getUser(userIdOrAddress);
        
        // If user doesn't exist, create a new user
        if (!user) {
          console.log(`User with address ${userIdOrAddress} not found, creating new user account`);
          user = await storage.createUser({ address: userIdOrAddress, lastClaim: null });
          console.log(`Created new user:`, user);
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
        let user = await storage.getUser(userIdOrAddress);
        
        // If user doesn't exist, create a new user
        if (!user) {
          console.log(`User with address ${userIdOrAddress} not found, creating new user account`);
          user = await storage.createUser({ address: userIdOrAddress, lastClaim: null });
          console.log(`Created new user:`, user);
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
