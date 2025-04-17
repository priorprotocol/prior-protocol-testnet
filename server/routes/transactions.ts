import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { insertTransactionSchema } from '@shared/schema';
import { z } from 'zod';
import { log } from '../vite';

const router = Router();

// Get all user transactions
router.get('/users/:identifier/transactions', async (req: Request, res: Response) => {
  try {
    const { identifier } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Identifier can be either userId (number) or wallet address (string)
    const isAddress = isNaN(parseInt(identifier));
    
    let userId: number;
    
    if (isAddress) {
      // Handle case where identifier is a wallet address
      const address = identifier.toLowerCase();
      let user = await storage.getUser(address);
      
      if (!user) {
        // Auto-create user account if address is provided but not found
        log(`Creating new user for address: ${address}`);
        user = await storage.createUser({
          address,
          totalClaims: 0,
          totalSwaps: 0,
          points: 0,
          badges: [],
          lastClaim: null
        });
      }
      
      userId = user.id;
    } else {
      // If identifier is numeric, treat as userId
      userId = parseInt(identifier);
    }
    
    const transactionData = await storage.getUserTransactions(userId, page, limit);
    
    res.json(transactionData);
  } catch (error) {
    console.error('Error getting user transactions:', error);
    res.status(500).json({ error: 'Failed to get user transactions' });
  }
});

// Get transactions by type for a user
router.get('/users/:identifier/transactions/:type', async (req: Request, res: Response) => {
  try {
    const { identifier, type } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Identifier can be either userId (number) or wallet address (string)
    const isAddress = isNaN(parseInt(identifier));
    
    let userId: number;
    
    if (isAddress) {
      // Handle case where identifier is a wallet address
      const address = identifier.toLowerCase();
      let user = await storage.getUser(address);
      
      if (!user) {
        // Auto-create user account if address is provided but not found
        log(`Creating new user for address: ${address}`);
        user = await storage.createUser({
          address,
          totalClaims: 0,
          totalSwaps: 0,
          points: 0,
          badges: [],
          lastClaim: null
        });
      }
      
      userId = user.id;
    } else {
      // If identifier is numeric, treat as userId
      userId = parseInt(identifier);
    }
    
    const transactionData = await storage.getUserTransactionsByType(userId, type, page, limit);
    
    res.json(transactionData);
  } catch (error) {
    console.error('Error getting user transactions by type:', error);
    res.status(500).json({ error: 'Failed to get user transactions by type' });
  }
});

// Sync transactions from block explorer
router.post('/sync-transactions', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      address: z.string().min(1),
      transactions: z.array(z.object({
        txHash: z.string(),
        type: z.string(),
        status: z.string(),
        fromToken: z.string().nullable().optional(),
        toToken: z.string().nullable().optional(),
        fromAmount: z.string().nullable().optional(),
        toAmount: z.string().nullable().optional(),
        timestamp: z.string(),
        blockNumber: z.number().optional(),
        points: z.number().optional()
      }))
    });

    const { address, transactions } = schema.parse(req.body);
    
    let user = await storage.getUser(address);
    
    // Auto-create user if needed
    if (!user) {
      user = await storage.createUser({
        address: address.toLowerCase(),
        totalClaims: 0,
        totalSwaps: 0,
        points: 0,
        badges: [],
        lastClaim: null
      });
    }
    
    // Track stats for update
    let totalSwaps = 0;
    let totalClaims = 0;
    let totalPoints = 0;
    
    // Process each transaction
    for (const tx of transactions) {
      try {
        // Check if transaction already exists (avoid duplicates)
        const existingTxData = await storage.getUserTransactions(user.id, 1, 100);
        const existingTx = existingTxData.transactions.find(t => t.txHash === tx.txHash);
        
        if (!existingTx && tx.status === 'completed') {
          // Create the transaction record
          const newTx = await storage.createTransaction({
            userId: user.id,
            txHash: tx.txHash,
            type: tx.type,
            status: tx.status,
            fromToken: tx.fromToken || null,
            toToken: tx.toToken || null, 
            fromAmount: tx.fromAmount || null,
            toAmount: tx.toAmount || null,
            timestamp: tx.timestamp,
            blockNumber: tx.blockNumber || null
          });
          
          // Update stats based on transaction type
          if (tx.type === 'swap') {
            totalSwaps++;
            
            // Calculate points for this transaction
            const swapPoints = await storage.getTransactionPoints(newTx);
            totalPoints += swapPoints;
          } else if (tx.type === 'faucet_claim') {
            totalClaims++;
            // Award 1 point per faucet claim
            totalPoints += 1;
          }
        }
      } catch (txError) {
        console.error(`Error processing transaction ${tx.txHash}:`, txError);
        // Continue with other transactions even if one fails
      }
    }
    
    // Update user stats if we processed any new transactions
    if (totalSwaps > 0 || totalClaims > 0 || totalPoints > 0) {
      // Update total swaps count
      if (totalSwaps > 0) {
        for (let i = 0; i < totalSwaps; i++) {
          await storage.incrementUserSwapCount(user.id);
        }
      }
      
      // Update total claims count
      if (totalClaims > 0) {
        for (let i = 0; i < totalClaims; i++) {
          await storage.incrementUserClaimCount(user.id);
        }
      }
      
      // Add points if earned
      if (totalPoints > 0) {
        await storage.addUserPoints(user.id, totalPoints);
      }
    }
    
    res.json({ 
      success: true, 
      user: await storage.getUser(address),
      stats: {
        newTransactions: totalSwaps + totalClaims,
        swaps: totalSwaps,
        claims: totalClaims,
        points: totalPoints
      }
    });
  } catch (error) {
    console.error('Error syncing transactions:', error);
    res.status(500).json({ error: 'Failed to sync transactions' });
  }
});

// Create a new transaction
router.post('/transactions', async (req: Request, res: Response) => {
  try {
    const transactionData = insertTransactionSchema.parse(req.body);
    
    // Get the user first
    const user = await storage.getUser(transactionData.userAddress);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Add userId to the transaction
    const transaction = await storage.createTransaction({
      ...transactionData,
      userId: user.id
    });
    
    // Update user stats based on transaction type
    if (transaction.type === 'swap') {
      await storage.incrementUserSwapCount(user.id);
      
      // Calculate and award points based on transaction
      const points = await storage.getTransactionPoints(transaction);
      if (points > 0) {
        await storage.addUserPoints(user.id, points);
      }
    } else if (transaction.type === 'faucet_claim') {
      await storage.incrementUserClaimCount(user.id);
      // Award 1 point for each faucet claim
      await storage.addUserPoints(user.id, 1);
    }
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(400).json({ error: 'Failed to create transaction' });
  }
});

export default router;