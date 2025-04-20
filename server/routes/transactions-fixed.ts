import express, { Request, Response } from 'express';
import { storage } from '../storage';
import { insertTransactionSchema } from '@shared/schema';
import { z } from 'zod';
import { getTransactionHistory, getTokenTransactionHistory } from '../basescan';

// Create a router instance
const router = express.Router();

// Validate and parse transaction type
const validateTransactionType = (type: string): string => {
  const validTypes = ['swap', 'faucet_claim', 'governance_vote', 'liquidity_stake', 'nft_mint', 'nft_stake'];
  return validTypes.includes(type) ? type : 'other';
};

// Get transaction points based on type and user context - NEW SIMPLIFIED POINTS SYSTEM
const getTransactionPoints = async (userId: number, type: string, txData: any): Promise<number> => {
  // Daily swap limit for points (max 5 swaps)
  const MAX_DAILY_SWAPS_FOR_POINTS = 5;
  // Points per swap (0.5 points)
  const POINTS_PER_SWAP = 0.5;
  // Points for NFT staking (1 point)
  const POINTS_FOR_NFT_STAKE = 1.0;
  
  if (type === 'swap') {
    // Get the date for this transaction
    const txDate = txData.timestamp ? new Date(txData.timestamp) : new Date();
    const txDay = new Date(txDate);
    txDay.setHours(0, 0, 0, 0);
    
    // Count swaps made on this day BEFORE this one
    const allUserTransactions = await storage.getUserTransactionsByType(userId, 'swap');
    const swapsBeforeThisOne = allUserTransactions.transactions.filter(tx => {
      // Skip this transaction
      if (tx.txHash === txData.txHash) return false;
      
      // Get the date for the transaction
      const thisTxDate = new Date(tx.timestamp);
      const thisTxDay = new Date(thisTxDate);
      thisTxDay.setHours(0, 0, 0, 0);
      
      // Check if it's the same day and has a smaller ID (happened before)
      return thisTxDay.getTime() === txDay.getTime() && 
             (txData.id ? tx.id < txData.id : true);
    });
    
    // Count number of swaps today before this one
    const swapsCountToday = swapsBeforeThisOne.length;
    
    // Award 0.5 points for each swap up to 5 swaps per day
    if (swapsCountToday < MAX_DAILY_SWAPS_FOR_POINTS) {
      console.log(`[PointsCalc] Awarding ${POINTS_PER_SWAP} points for swap #${swapsCountToday + 1} to user ${userId}`);
      return POINTS_PER_SWAP;
    } else {
      console.log(`[PointsCalc] No points awarded - already reached ${MAX_DAILY_SWAPS_FOR_POINTS} swaps for the day for user ${userId}`);
      return 0;
    }
  } 
  // Award points for NFT staking
  else if (type === 'nft_stake') {
    // Check if the user has already staked an NFT
    const existingStakes = await storage.getUserTransactionsByType(userId, 'nft_stake');
    
    // Only award points for the first successful stake
    if (existingStakes.transactions.length <= 1) { // 1 because the current transaction is included
      console.log(`[PointsCalc] Awarding ${POINTS_FOR_NFT_STAKE} points for NFT staking to user ${userId}`);
      return POINTS_FOR_NFT_STAKE;
    } else {
      console.log(`[PointsCalc] No additional points for repeated NFT staking to user ${userId}`);
      return 0;
    }
  }
  // NO POINTS FOR ANY OTHER ACTIVITY UNDER NEW SYSTEM
  else {
    console.log(`[PointsCalc] No points for ${type} transaction under new points system`);
    return 0;
  }
};

// Get user's transaction history (all types) with pagination
router.get('/users/:identifier/transactions', async (req: Request, res: Response) => {
  const { identifier } = req.params;
  const page = parseInt(req.query.page as string || '1');
  const limit = parseInt(req.query.limit as string || '10');
  
  try {
    let userId: number;
    
    // Check if identifier is a wallet address or a user ID
    if (identifier.startsWith('0x')) {
      // Normalize the address to lowercase
      const normalizedAddress = identifier.toLowerCase();
      
      // It's an address, get or create the user
      let user = await storage.getUser(normalizedAddress);
      if (!user) {
        // Auto-create user if not exists
        user = await storage.createUser({ 
          address: normalizedAddress, 
          lastClaim: null 
        });
        console.log(`Auto-created user for address ${normalizedAddress} in transactions endpoint`);
      }
      userId = user.id;
    } else {
      // It's a user ID
      userId = parseInt(identifier);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user identifier" });
      }
    }
    
    // Get paginated transactions
    const result = await storage.getUserTransactions(userId, page, limit);
    
    // Add points information to each transaction
    const transactionsWithPoints = await Promise.all(
      result.transactions.map(async (tx) => {
        const points = await storage.getTransactionPoints(tx);
        return { ...tx, points };
      })
    );
    
    res.json({
      transactions: transactionsWithPoints,
      total: result.total,
      page: result.page,
      hasMore: result.hasMore
    });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ message: "Error fetching transaction history" });
  }
});

// Get user's transaction history by type with pagination
router.get('/users/:identifier/transactions/:type', async (req: Request, res: Response) => {
  const { identifier, type } = req.params;
  const page = parseInt(req.query.page as string || '1');
  const limit = parseInt(req.query.limit as string || '10');
  
  try {
    let userId: number;
    
    // Check if identifier is a wallet address or a user ID
    if (identifier.startsWith('0x')) {
      // Normalize the address to lowercase
      const normalizedAddress = identifier.toLowerCase();
      
      // It's an address, get or create the user
      let user = await storage.getUser(normalizedAddress);
      if (!user) {
        // Auto-create user if not exists
        user = await storage.createUser({ 
          address: normalizedAddress, 
          lastClaim: null 
        });
        console.log(`Auto-created user for address ${normalizedAddress} in transactions-by-type endpoint`);
      }
      userId = user.id;
    } else {
      // It's a user ID
      userId = parseInt(identifier);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user identifier" });
      }
    }
    
    // Validate transaction type or use 'all'
    const validatedType = validateTransactionType(type);
    
    // Get paginated transactions by type
    const result = await storage.getUserTransactionsByType(userId, validatedType, page, limit);
    
    // Add points information to each transaction
    const transactionsWithPoints = await Promise.all(
      result.transactions.map(async (tx) => {
        const points = await storage.getTransactionPoints(tx);
        return { ...tx, points };
      })
    );
    
    res.json({
      transactions: transactionsWithPoints,
      total: result.total,
      page: result.page,
      hasMore: result.hasMore
    });
  } catch (error) {
    console.error("Error fetching transactions by type:", error);
    res.status(500).json({ message: "Error fetching transaction history" });
  }
});

// Synchronize blockchain transactions with our database
router.post('/sync-transactions', async (req: Request, res: Response) => {
  const syncSchema = z.object({
    address: z.string(),
    transactions: z.array(z.object({
      txHash: z.string(),
      blockNumber: z.number(),
      timestamp: z.string(),
      type: z.string(),
      fromToken: z.string().nullable().optional(),
      toToken: z.string().nullable().optional(),
      fromAmount: z.string().nullable().optional(),
      toAmount: z.string().nullable().optional(),
      status: z.string()
    }))
  });
  
  try {
    const { address, transactions } = syncSchema.parse(req.body);
    
    // Normalize address to ensure it starts with 0x and is lowercase
    const normalizedAddress = address.startsWith('0x') 
      ? address.toLowerCase() 
      : `0x${address}`.toLowerCase();
    
    console.log(`Processing fast sync for address: ${normalizedAddress}`);
    
    // IMPROVED: Process this sync request with higher priority and efficiency
    // Get or create user
    let user = await storage.getUser(normalizedAddress);
    if (!user) {
      user = await storage.createUser({ address: normalizedAddress, lastClaim: null });
      console.log(`Created new user for address ${normalizedAddress} during transaction sync`);
    }
    
    console.log(`Fast-syncing ${transactions.length} blockchain transactions for user ${user.id}`);
    
    // Track stats for response
    const stats = {
      newTransactions: 0,
      swaps: 0,
      claims: 0,
      points: 0,
      processingTime: 0
    };
    
    // Start timing the processing
    const startTime = Date.now();
    
    // IMPROVEMENT: Use a more efficient query to get just the transaction hashes
    // This is much faster than getting all transaction data when we just need to check existence
    const existingTxs = await storage.getUserTransactions(user.id);
    const existingTxHashes = new Set(existingTxs.transactions.map(tx => tx.txHash));
    
    // Count how many new vs. existing transactions we have
    const newTransactions = transactions.filter(tx => !existingTxHashes.has(tx.txHash));
    const duplicateCount = transactions.length - newTransactions.length;
    
    console.log(`Found ${newTransactions.length} new transactions to process, ${duplicateCount} already exist`);
    
    // Sort transactions by block number (ascending) to process oldest first
    const sortedTransactions = [...newTransactions].sort((a, b) => a.blockNumber - b.blockNumber);
    
    // IMPROVEMENT: Process transactions in batches for better performance
    // Process each transaction
    for (const tx of sortedTransactions) {
      // Create a new transaction record (already filtered out existing ones)
      const newTx = await storage.createTransaction({
        userId: user.id,
        type: tx.type,
        txHash: tx.txHash,
        fromToken: tx.fromToken,
        toToken: tx.toToken,
        fromAmount: tx.fromAmount,
        toAmount: tx.toAmount,
        status: 'completed',
        blockNumber: tx.blockNumber
      });
      
      stats.newTransactions++;
      
      // Track transaction type - more efficient implementation
      if (tx.type === 'swap') {
        stats.swaps++;
        
        // If it's a swap, increment the user's swap count
        await storage.incrementUserSwapCount(user.id);
        
        // Calculate and add points for swap
        const points = await getTransactionPoints(user.id, tx.type, tx);
        if (points > 0) {
          await storage.addUserPoints(user.id, points);
          stats.points += points;
        }
        
      } else if (tx.type === 'nft_stake') {
        console.log(`[Transaction] Processing NFT staking transaction for user ${user.id}`);
        
        // Calculate and add points for NFT staking
        const points = await getTransactionPoints(user.id, tx.type, tx);
        if (points > 0) {
          await storage.addUserPoints(user.id, points);
          stats.points += points;
          console.log(`[Transaction] Added ${points} points for NFT staking to user ${user.id}`);
        }
        
        // Award NFT staking badge if this is their first stake
        const badges = await storage.getUserBadges(user.id);
        if (!badges.includes('nft_staked')) {
          await storage.addUserBadge(user.id, "nft_staked");
          console.log(`[Transaction] Added 'nft_staked' badge to user ${user.id}`);
        }
        
      } else if (tx.type === 'faucet_claim') {
        stats.claims++;
        await storage.incrementUserClaimCount(user.id);
      }
      
      // Add to set of existing hashes to avoid processing duplicates in this batch
      existingTxHashes.add(tx.txHash);
    }
    
    // Calculate processing time
    stats.processingTime = Date.now() - startTime;
    
    console.log(`Sync completed in ${stats.processingTime}ms for user ${user.id}`);
    
    // Get updated user stats after all transactions are processed
    const updatedStats = await storage.getUserStats(user.id);
    
    // Award any first-time badges if needed
    if (stats.swaps > 0) {
      // Check if they have swap badge already
      const badges = await storage.getUserBadges(user.id);
      if (!badges.includes('swap_completed')) {
        await storage.addUserBadge(user.id, "swap_completed");
      }
    }
    
    if (stats.claims > 0) {
      // Check if they have token claim badge already
      const badges = await storage.getUserBadges(user.id);
      if (!badges.includes('token_claimed')) {
        await storage.addUserBadge(user.id, "token_claimed");
      }
    }
    
    res.json({
      success: true,
      message: `Synced ${stats.newTransactions} new transactions in ${stats.processingTime}ms`,
      stats,
      userStats: updatedStats
    });
    
  } catch (error) {
    console.error("Error syncing transactions:", error);
    res.status(400).json({ 
      success: false,
      message: "Error syncing transactions",
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Create a new transaction
router.post('/transactions', async (req: Request, res: Response) => {
  try {
    const transactionData = req.body;
    
    // Check if we have a wallet address (support both userId and userAddress fields)
    if (!transactionData.userAddress && !transactionData.userId && !transactionData.address) {
      return res.status(400).json({ message: "User address is required" });
    }
    
    // Determine which address field to use
    const rawAddress = transactionData.userAddress || transactionData.address || transactionData.userId;
    
    // Normalize address format - handle both string addresses and numeric IDs
    let normalizedAddress: string;
    
    if (typeof rawAddress === 'string') {
      normalizedAddress = rawAddress.startsWith('0x') 
        ? rawAddress.toLowerCase() 
        : `0x${rawAddress}`.toLowerCase();
    } else if (typeof rawAddress === 'number') {
      // This is a user ID, not an address, so we'll need to look it up
      const user = await storage.getUserById(rawAddress);
      if (!user || !user.address) {
        return res.status(404).json({ message: "User not found" });
      }
      normalizedAddress = user.address.toLowerCase();
    } else {
      return res.status(400).json({ message: "Invalid address format" });
    }
    
    console.log(`Processing transaction request for address: ${normalizedAddress}`);
    
    // Get the user first
    let user = await storage.getUser(normalizedAddress);
    
    // Create user if they don't exist
    if (!user) {
      user = await storage.createUser({ 
        address: normalizedAddress,
        lastClaim: null
      });
      console.log(`Auto-created user for address ${normalizedAddress} in transaction create endpoint`);
    }
    
    // Add userId to the transaction
    const payload = {
      ...transactionData,
      userId: user.id
    };
    
    // Validate with schema
    const validPayload = insertTransactionSchema.parse(payload);
    
    // Create the transaction
    const transaction = await storage.createTransaction(validPayload);
    
    // Calculate points based on transaction type
    const points = await getTransactionPoints(
      user.id, 
      transaction.type, 
      transaction
    );
    
    // Add points to user if applicable
    if (points > 0) {
      await storage.addUserPoints(user.id, points);
    }
    
    // Handle specific transaction types
    if (transaction.type === 'swap') {
      // Increment swap count
      await storage.incrementUserSwapCount(user.id);
      
      // Award swap badge if this is their first swap
      const userStats = await storage.getUserStats(user.id);
      if (userStats.totalSwaps === 1) {
        await storage.addUserBadge(user.id, "swap_completed");
      }
    } else if (transaction.type === 'nft_stake') {
      console.log(`[Transaction] Processing NFT staking transaction for user ${user.id}`);
      
      // Award NFT staking badge if this is their first stake
      const badges = await storage.getUserBadges(user.id);
      if (!badges.includes('nft_staked')) {
        await storage.addUserBadge(user.id, "nft_staked");
        console.log(`[Transaction] Added 'nft_staked' badge to user ${user.id}`);
      }
    } else if (transaction.type === 'faucet_claim') {
      // Increment claim count
      await storage.incrementUserClaimCount(user.id);
      
      // Award token_claimed badge
      await storage.addUserBadge(user.id, "token_claimed");
    }
    
    res.status(201).json({ 
      transaction, 
      points 
    });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(400).json({ message: "Invalid transaction data" });
  }
});

// Test endpoint for Basescan API
router.get('/basescan-test/:address', async (req: Request, res: Response) => {
  const { address } = req.params;
  
  if (!address || !address.startsWith('0x')) {
    return res.status(400).json({ error: 'Invalid address format. Must start with 0x' });
  }
  
  try {
    // Make direct calls to Basescan to debug API issues
    const [txHistory, tokenHistory] = await Promise.all([
      getTransactionHistory(address),
      getTokenTransactionHistory(address)
    ]);
    
    res.json({ 
      success: true, 
      txHistory,
      tokenHistory,
      message: 'Successfully queried Basescan API'
    });
  } catch (error) {
    console.error('Error testing Basescan API:', error);
    res.status(500).json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to query Basescan API'
    });
  }
});

// Export the router
export default router;