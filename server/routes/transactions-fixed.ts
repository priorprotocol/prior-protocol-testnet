import express, { Request, Response } from 'express';
import { storage } from '../storage';
import { insertTransactionSchema } from '@shared/schema';
import { z } from 'zod';
import { getTransactionHistory, getTokenTransactionHistory } from '../basescan';

// Create a router instance
const router = express.Router();

// Validate and parse transaction type
const validateTransactionType = (type: string): string => {
  const validTypes = ['swap', 'faucet_claim', 'governance_vote', 'liquidity_stake', 'nft_mint'];
  return validTypes.includes(type) ? type : 'other';
};

// Get transaction points based on type and user context
const getTransactionPoints = async (userId: number, type: string, txData: any): Promise<number> => {
  // Daily swap threshold
  const DAILY_SWAP_THRESHOLD = 10;
  
  if (type === 'swap') {
    // Check if user has done swaps in the current day
    const dailySwapCount = await storage.getDailySwapCount(userId);
    
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
    
    // This is the first swap of the day if there are no swaps before it on the same day
    const isFirstSwapOfDay = swapsBeforeThisOne.length === 0;
    
    // Award 4 points for the first swap of the day
    if (isFirstSwapOfDay) {
      console.log(`[PointsCalc] Awarding 4 points for first swap of day to user ${userId}`);
      return 4;
    }
    // Award 2 points per swap ONLY if they've done 10+ swaps today
    else if (dailySwapCount >= DAILY_SWAP_THRESHOLD) {
      console.log(`[PointsCalc] Awarding 2 points for 10+ daily swaps to user ${userId}`);
      return 2;
    }
    console.log(`[PointsCalc] No points awarded - not first swap and under 10 daily total for user ${userId}`);
    return 0;
  } 
  else if (type === 'faucet_claim') {
    // 1 point for each faucet claim
    console.log(`[PointsCalc] Awarding 1 point for faucet claim to user ${userId}`);
    return 1;
  }
  else if (type === 'governance_vote') {
    // 10 points for each governance vote
    return 10;
  }
  else if (type === 'liquidity_stake') {
    // 5 points for liquidity staking
    return 5;
  }
  else if (type === 'nft_mint') {
    // Special handling for NFTs could be added here
    return 0;
  }
  
  // No points for other transaction types
  return 0;
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
    
    console.log(`Processing sync-transactions request for address: ${normalizedAddress}`);
    
    // Get or create user
    let user = await storage.getUser(normalizedAddress);
    if (!user) {
      user = await storage.createUser({ address: normalizedAddress, lastClaim: null });
      console.log(`Created new user for address ${normalizedAddress} during transaction sync`);
    }
    
    console.log(`Syncing ${transactions.length} historical transactions for user ${user.id} (${address})`);
    
    // Track stats for response
    const stats = {
      newTransactions: 0,
      swaps: 0,
      claims: 0,
      points: 0
    };
    
    // Get user's existing transactions to avoid duplicates
    const existingTxs = await storage.getUserTransactions(user.id);
    const existingTxHashes = new Set(existingTxs.transactions.map(tx => tx.txHash));
    
    console.log(`User has ${existingTxHashes.size} existing transactions in database`);
    
    // Sort transactions by block number (ascending) to process oldest first
    const sortedTransactions = [...transactions].sort((a, b) => a.blockNumber - b.blockNumber);
    
    // Process each transaction
    for (const tx of sortedTransactions) {
      // Skip if transaction already exists
      if (existingTxHashes.has(tx.txHash)) {
        continue;
      }
      
      // Create a new transaction record
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
      console.log(`Added new ${tx.type} transaction: ${tx.txHash}`);
      
      // Track transaction type
      if (tx.type === 'swap') {
        stats.swaps++;
        
        // If it's a swap, increment the user's swap count
        await storage.incrementUserSwapCount(user.id);
        
        // Award swap badge if this is their first swap
        const userStats = await storage.getUserStats(user.id);
        if (userStats.totalSwaps === 1) {
          await storage.addUserBadge(user.id, "swap_completed");
        }
      } else if (tx.type === 'faucet_claim') {
        stats.claims++;
        await storage.incrementUserClaimCount(user.id);
        
        // Award token_claimed badge if they don't have it
        const badges = await storage.getUserBadges(user.id);
        if (!badges.includes('token_claimed')) {
          await storage.addUserBadge(user.id, "token_claimed");
        }
      }
      
      // Calculate and add points
      const points = await getTransactionPoints(user.id, tx.type, tx);
      if (points > 0) {
        await storage.addUserPoints(user.id, points);
        stats.points += points;
        console.log(`Awarded ${points} points for transaction ${tx.txHash}`);
      }
      
      // Add to set of existing hashes to avoid processing duplicates in this batch
      existingTxHashes.add(tx.txHash);
    }
    
    // Get updated user stats after all transactions are processed
    const updatedStats = await storage.getUserStats(user.id);
    
    res.json({
      success: true,
      message: `Synced ${stats.newTransactions} new transactions`,
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