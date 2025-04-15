import {
  users, User, InsertUser,
  quests, Quest, InsertQuest,
  userQuests, UserQuest, InsertUserQuest,
  proposals, Proposal, InsertProposal,
  votes, Vote, InsertVote,
  tokens, Token, InsertToken,
  transactions, Transaction, InsertTransaction
} from "@shared/schema";
import { db } from "./db";
import { eq, and, count, sql } from "drizzle-orm";
import { IStorage } from "./storage";

// Database implementation of storage
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(address: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.address, address));
    return user;
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  async updateUserLastClaim(address: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ lastClaim: new Date() })
      .where(eq(users.address, address))
      .returning();
    return updatedUser;
  }
  
  async getUserBadges(userId: number): Promise<string[]> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return [];
    
    return (user.badges as string[]) || [];
  }
  
  async addUserBadge(userId: number, badgeId: string): Promise<string[]> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return [];
    
    const currentBadges = (user.badges as string[]) || [];
    
    // If the badge is already in the list, just return the current badges
    if (currentBadges.includes(badgeId)) {
      return currentBadges;
    }
    
    // Add the new badge
    const newBadges = [...currentBadges, badgeId];
    
    // Update the user with the new badges
    const [updatedUser] = await db
      .update(users)
      .set({ badges: newBadges })
      .where(eq(users.id, userId))
      .returning();
    
    return (updatedUser.badges as string[]) || [];
  }
  
  async incrementUserSwapCount(userId: number): Promise<number> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return 0;
    
    const currentSwaps = user.totalSwaps || 0;
    const newSwapCount = currentSwaps + 1;
    
    // Check if user has reached 10+ daily swaps to award points (2 points per swap)
    const dailySwaps = await this.getDailySwapCount(userId);
    
    // Calculate points to award - only if user has 10 or more daily swaps
    let pointsToAdd = 0;
    if (dailySwaps >= 9) { // This will be the 10th swap
      pointsToAdd = 2; // Award 2 points for this swap
      
      // Add Prior Swap badge if user reaches 20+ total swaps
      if (newSwapCount >= 20) {
        const userBadges = await this.getUserBadges(userId);
        if (!userBadges.includes('prior_swap')) {
          await this.addUserBadge(userId, 'prior_swap');
        }
      }
    } else if (dailySwaps >= 10) {
      pointsToAdd = 2; // Continue to award 2 points per swap after reaching 10
    }
    
    // Update the user with the new swap count and add points if earned
    const [updatedUser] = await db
      .update(users)
      .set({ 
        totalSwaps: newSwapCount,
        points: user.points + pointsToAdd 
      })
      .where(eq(users.id, userId))
      .returning();
    
    // Record this transaction with points information
    await this.createTransaction({
      userId,
      type: 'swap',
      txHash: `swap_${Date.now()}`, // Placeholder for actual transaction hash
      status: 'completed',
      points: pointsToAdd
    });
    
    return updatedUser.totalSwaps || 0;
  }
  
  async getUserStats(userId: number): Promise<{
    totalFaucetClaims: number;
    totalSwaps: number;
    completedQuests: number;
    totalQuests: number;
    proposalsVoted: number;
    proposalsCreated: number;
    points: number;
  }> {
    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return {
        totalFaucetClaims: 0,
        totalSwaps: 0,
        completedQuests: 0,
        totalQuests: 0,
        proposalsVoted: 0,
        proposalsCreated: 0,
        points: 0
      };
    }
    
    // Get count of faucet claims from transaction history
    const [faucetClaimsResult] = await db
      .select({ count: count() })
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'faucet_claim')
      ));
    const totalFaucetClaims = faucetClaimsResult?.count || (user.lastClaim ? 1 : 0);
    
    // Get total swaps from user object
    const totalSwaps = user.totalSwaps || 0;
    
    // Get daily swaps for point calculation
    const dailySwaps = await this.getDailySwapCount(userId);
    
    // Count completed quests for this user
    const [completedQuestsResult] = await db
      .select({ count: count() })
      .from(userQuests)
      .where(and(
        eq(userQuests.userId, userId),
        eq(userQuests.status, 'completed')
      ));
    const completedQuests = completedQuestsResult?.count || 0;
    
    // Get total number of quests
    const [totalQuestsResult] = await db
      .select({ count: count() })
      .from(quests);
    const totalQuests = totalQuestsResult?.count || 0;
    
    // Count proposals voted on by this user
    const [proposalsVotedResult] = await db
      .select({ count: count() })
      .from(votes)
      .where(eq(votes.userId, userId));
    const proposalsVoted = proposalsVotedResult?.count || 0;
    
    // For now, we're not tracking who created proposals, so it's 0
    const proposalsCreated = 0;
    
    // Get total points from user record
    const points = user.points || 0;
    
    return {
      totalFaucetClaims,
      totalSwaps,
      completedQuests,
      totalQuests,
      proposalsVoted,
      proposalsCreated,
      points
    };
  }
  
  // Quest operations
  async getAllQuests(): Promise<Quest[]> {
    return await db.select().from(quests);
  }
  
  async getQuest(id: number): Promise<Quest | undefined> {
    const [quest] = await db.select().from(quests).where(eq(quests.id, id));
    return quest;
  }
  
  async createQuest(quest: InsertQuest): Promise<Quest> {
    const [newQuest] = await db.insert(quests).values(quest).returning();
    return newQuest;
  }
  
  // User Quest operations
  async getUserQuests(userId: number): Promise<UserQuest[]> {
    return await db.select().from(userQuests).where(eq(userQuests.userId, userId));
  }
  
  async createUserQuest(userQuest: InsertUserQuest): Promise<UserQuest> {
    const [newUserQuest] = await db.insert(userQuests).values(userQuest).returning();
    return newUserQuest;
  }
  
  async updateUserQuestStatus(id: number, status: string): Promise<UserQuest | undefined> {
    const completedAt = status === "completed" ? new Date() : null;
    const [updatedUserQuest] = await db
      .update(userQuests)
      .set({ status, completedAt })
      .where(eq(userQuests.id, id))
      .returning();
    return updatedUserQuest;
  }
  
  // Proposal operations
  async getAllProposals(): Promise<Proposal[]> {
    return await db.select().from(proposals);
  }
  
  async getProposal(id: number): Promise<Proposal | undefined> {
    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id));
    return proposal;
  }
  
  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const [newProposal] = await db
      .insert(proposals)
      .values({
        ...proposal,
        yesVotes: 0,
        noVotes: 0
      })
      .returning();
    return newProposal;
  }
  
  async updateProposalVotes(id: number, voteType: string, increment: number): Promise<Proposal | undefined> {
    const [proposal] = await db.select().from(proposals).where(eq(proposals.id, id));
    if (!proposal) return undefined;
    
    const [updatedProposal] = await db
      .update(proposals)
      .set(
        voteType === "yes" 
          ? { yesVotes: proposal.yesVotes + increment }
          : { noVotes: proposal.noVotes + increment }
      )
      .where(eq(proposals.id, id))
      .returning();
    
    return updatedProposal;
  }
  
  // Vote operations
  async getUserVote(userId: number, proposalId: number): Promise<Vote | undefined> {
    const [vote] = await db
      .select()
      .from(votes)
      .where(and(
        eq(votes.userId, userId),
        eq(votes.proposalId, proposalId)
      ));
    
    return vote;
  }
  
  async createVote(vote: InsertVote): Promise<Vote> {
    const [newVote] = await db
      .insert(votes)
      .values({
        ...vote,
        votedAt: new Date()
      })
      .returning();
    
    // Update the proposal vote count
    await this.updateProposalVotes(vote.proposalId, vote.vote, 1);
    
    return newVote;
  }
  
  // Token operations
  async getAllTokens(): Promise<Token[]> {
    return await db.select().from(tokens);
  }
  
  async getToken(symbol: string): Promise<Token | undefined> {
    const [token] = await db.select().from(tokens).where(eq(tokens.symbol, symbol));
    return token;
  }
  
  async createToken(token: InsertToken): Promise<Token> {
    const [newToken] = await db.insert(tokens).values(token).returning();
    return newToken;
  }
  
  // Transaction operations
  async getUserTransactions(userId: number, page: number = 1, limit: number = 10): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    hasMore: boolean;
  }> {
    const offset = (page - 1) * limit;
    
    // Get transactions for this user
    const transactionsList = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(sql`${transactions.timestamp} DESC`)
      .limit(limit)
      .offset(offset);
    
    // Count total transactions
    const [totalResult] = await db
      .select({ count: count() })
      .from(transactions)
      .where(eq(transactions.userId, userId));
    
    const total = totalResult?.count || 0;
    const hasMore = total > (page * limit);
    
    return {
      transactions: transactionsList,
      total,
      page,
      hasMore
    };
  }
  
  async getUserTransactionsByType(userId: number, type: string, page: number = 1, limit: number = 10): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    hasMore: boolean;
  }> {
    const offset = (page - 1) * limit;
    
    // Get transactions for this user with specific type
    const transactionsList = await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.type, type)
      ))
      .orderBy(sql`${transactions.timestamp} DESC`)
      .limit(limit)
      .offset(offset);
    
    // Count total transactions of this type
    const [totalResult] = await db
      .select({ count: count() })
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.type, type)
      ));
    
    const total = totalResult?.count || 0;
    const hasMore = total > (page * limit);
    
    return {
      transactions: transactionsList,
      total,
      page,
      hasMore
    };
  }
  
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        ...transaction,
        timestamp: new Date()
      })
      .returning();
    
    return newTransaction;
  }
  
  async getTransactionPoints(transaction: Transaction): Promise<number> {
    // Calculate points based on transaction type
    if (transaction.type === 'swap') {
      // Check if user has 10+ daily swaps
      const userId = transaction.userId;
      const dailySwaps = await this.getDailySwapCount(userId);
      
      if (dailySwaps >= 10) {
        return 2; // 2 points per swap when user has 10+ daily swaps
      }
    } else if (transaction.type === 'governance_vote') {
      return 10; // 10 points per governance vote
    }
    
    return 0; // Default: 0 points
  }
  
  async getDailySwapCount(userId: number): Promise<number> {
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Query transactions for swaps made today
    const [result] = await db
      .select({ count: count() })
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'swap'),
        sql`${transactions.timestamp} >= ${today}`
      ));
    
    return result?.count || 0;
  }
  
  async incrementUserClaimCount(userId: number): Promise<number> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return 0;
    
    const currentClaims = user.totalClaims || 0;
    const newClaimCount = currentClaims + 1;
    
    // Update the user with the new claim count
    const [updatedUser] = await db
      .update(users)
      .set({ 
        totalClaims: newClaimCount,
        lastClaim: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    // Record this transaction
    await this.createTransaction({
      userId,
      type: 'faucet_claim',
      txHash: `claim_${Date.now()}`, // Placeholder for actual transaction hash
      status: 'completed',
      points: 0  // No points for faucet claims
    });
    
    return updatedUser.totalClaims || 0;
  }
  
  async addUserPoints(userId: number, points: number): Promise<number> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return 0;
    
    const currentPoints = user.points || 0;
    const newPoints = currentPoints + points;
    
    // Update the user with the new points total
    const [updatedUser] = await db
      .update(users)
      .set({ points: newPoints })
      .where(eq(users.id, userId))
      .returning();
    
    return updatedUser.points || 0;
  }
  
  async getLeaderboard(limit: number = 20): Promise<User[]> {
    // Get top users by points, ensuring we get the top 20 swap users highlighted
    return await db
      .select()
      .from(users)
      .orderBy(sql`${users.points} DESC, ${users.totalSwaps} DESC`)
      .limit(limit);
  }
  
  // Function to seed the database with initial data
  async seedDatabase(): Promise<void> {
    try {
      // Check if data already exists
      const existingTokens = await this.getAllTokens();
      if (existingTokens.length > 0) {
        console.log("Database already has data, skipping seed operation");
        return;
      }
      
      console.log("Seeding database with initial data...");
      
      // Seed tokens with Base Sepolia testnet addresses
      const initialTokens: InsertToken[] = [
        {
          symbol: "PRIOR",
          name: "Prior Protocol Token",
          address: "0xD4d41fd29d1557566B1e3729d63559DC9DA32C79", // Prior Token
          decimals: 18,
          logoColor: "#1A5CFF"
        },
        {
          symbol: "USDC",
          name: "USD Coin",
          address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC on Base Sepolia
          decimals: 6,
          logoColor: "#2775CA"
        },
        {
          symbol: "USDT",
          name: "Tether",
          address: "0x708374D87A11B3740610Dd1eCB1e6Ce38DeA0a98", // USDT on Base Sepolia
          decimals: 6,
          logoColor: "#26A17B"
        },
        {
          symbol: "DAI",
          name: "Dai Stablecoin",
          address: "0x6Bb6F022104caF36F3a84900Cd46D32A1D6D2DF1", // DAI on Base Sepolia
          decimals: 18,
          logoColor: "#F5AC37"
        },
        {
          symbol: "WETH",
          name: "Wrapped ETH",
          address: "0x4200000000000000000000000000000000000006", // WETH on Base Sepolia
          decimals: 18,
          logoColor: "#627EEA"
        }
      ];
      
      for (const token of initialTokens) {
        await this.createToken(token);
      }
      console.log("Tokens seeded");
      
      // Seed quests
      const initialQuests: InsertQuest[] = [
        {
          title: "First Swap",
          description: "Complete your first token swap on PriorSwap to earn 50 PRIOR tokens.",
          reward: 50,
          difficulty: "Beginner",
          status: "active",
          icon: "exchange-alt"
        },
        {
          title: "Governance Vote",
          description: "Participate in a test governance proposal to earn 100 PRIOR tokens.",
          reward: 100,
          difficulty: "Intermediate",
          status: "active",
          icon: "vote-yea"
        },
        {
          title: "Liquidity Provider",
          description: "Add liquidity to a trading pair and maintain it for 24 hours.",
          reward: 200,
          difficulty: "Advanced",
          status: "coming_soon",
          icon: "chart-line"
        }
      ];
      
      for (const quest of initialQuests) {
        await this.createQuest(quest);
      }
      console.log("Quests seeded");
      
      // Seed proposals
      const now = new Date();
      const twoDaysLater = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      const fiveDaysLater = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
      
      const initialProposals: InsertProposal[] = [
        {
          title: "PIP-001: Update Token Distribution",
          description: "Proposal to update the testnet token distribution model for better community involvement.",
          status: "active",
          endTime: twoDaysLater,
        },
        {
          title: "PIP-002: Add New Test Token Pair",
          description: "Proposal to add a new test token trading pair to the protocol.",
          status: "active",
          endTime: fiveDaysLater,
        }
      ];
      
      for (const proposal of initialProposals) {
        const newProposal = await this.createProposal(proposal);
        // Add some initial votes
        await this.updateProposalVotes(newProposal.id, 'yes', 65);
        await this.updateProposalVotes(newProposal.id, 'no', 35);
      }
      console.log("Proposals seeded");
      
      console.log("Database seeding completed successfully");
    } catch (error) {
      console.error("Error seeding database:", error);
      throw error;
    }
  }
}