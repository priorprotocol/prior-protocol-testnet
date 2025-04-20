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
  
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
    
    // This counts the number of swaps already completed today BEFORE this swap
    const dailySwaps = await this.getDailySwapCount(userId);
    
    // The current swap will be the Nth daily swap where N = dailySwaps + 1
    const currentDailySwapNumber = dailySwaps + 1;
    
    console.log(`[SwapCounter] User ${userId} completing swap #${currentDailySwapNumber} today (total swaps: ${newSwapCount})`);
    
    // Update the user with the new swap count only
    const [updatedUser] = await db
      .update(users)
      .set({ 
        totalSwaps: newSwapCount
      })
      .where(eq(users.id, userId))
      .returning();
    
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
  
  /**
   * Get historical points data for a user over time
   * @param userId The user ID
   * @param period The time period to retrieve ('day', 'week', 'month', 'all')
   */
  async getUserHistoricalPoints(userId: number, period = 'week'): Promise<{
    periods: string[];
    pointsData: number[];
    swapData: number[];
    totalPoints: number;
    currentPoints: number;
  }> {
    // Get the user for the current point balance
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      return {
        periods: [],
        pointsData: [],
        swapData: [],
        totalPoints: 0,
        currentPoints: 0,
      };
    }
    
    // Current points from user record
    const currentPoints = user.points || 0;
    
    // Set time range based on period
    const now = new Date();
    let startDate: Date;
    let groupByFormat: string;
    let labelFormat: (date: Date) => string;
    
    switch (period) {
      case 'day':
        // Last 24 hours, grouped by hour
        startDate = new Date(now);
        startDate.setHours(now.getHours() - 24);
        groupByFormat = '%Y-%m-%d %H:00:00';
        labelFormat = (date) => date.toLocaleTimeString(undefined, { hour: '2-digit' });
        break;
        
      case 'week':
        // Last 7 days, grouped by day
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        groupByFormat = '%Y-%m-%d';
        labelFormat = (date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        break;
        
      case 'month':
        // Last 30 days, grouped by day
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        groupByFormat = '%Y-%m-%d';
        labelFormat = (date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        break;
        
      case 'all':
      default:
        // All time, grouped by week
        startDate = new Date('2024-01-01'); // From beginning of 2024
        groupByFormat = '%Y-%U'; // Year-Week format
        labelFormat = (date) => {
          const weekNum = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
          return `Week ${weekNum}`;
        };
        break;
    }
    
    // Get all swap transactions for the specified time range
    const swapTransactions = await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'swap'),
        sql`${transactions.timestamp} >= ${startDate}`
      ))
      .orderBy(asc(transactions.timestamp));
    
    // Group transactions by date and calculate points per period
    const periodData: Record<string, { points: number, swaps: number }> = {};
    const allPeriods: Set<string> = new Set();
    
    // Process transactions
    for (const tx of swapTransactions) {
      const txDate = new Date(tx.timestamp);
      
      // Generate period key based on our format
      let periodKey: string;
      if (period === 'day') {
        periodKey = txDate.toISOString().substring(0, 13) + ':00:00'; // YYYY-MM-DDTHH:00:00
      } else if (period === 'week' || period === 'month') {
        periodKey = txDate.toISOString().substring(0, 10); // YYYY-MM-DD
      } else {
        // For 'all', use year-week format
        const weekNum = Math.floor((txDate.getTime() - new Date(txDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
        periodKey = `${txDate.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;
      }
      
      // Initialize period data if not exists
      if (!periodData[periodKey]) {
        periodData[periodKey] = { points: 0, swaps: 0 };
      }
      
      // Each swap adds 0.5 points up to 5 swaps (2.5 points) per day
      // For daily periods, cap at 5 swaps
      if (period === 'day') {
        if (periodData[periodKey].swaps < 5) {
          periodData[periodKey].points += 0.5;
          periodData[periodKey].swaps += 1;
        }
      } else {
        // For longer periods, we need to track daily caps
        const txDay = txDate.toISOString().substring(0, 10); // YYYY-MM-DD
        if (!periodData[periodKey][txDay]) {
          periodData[periodKey][txDay] = { swaps: 0 };
        }
        
        if (periodData[periodKey][txDay].swaps < 5) {
          periodData[periodKey].points += 0.5;
          periodData[periodKey].swaps += 1;
          periodData[periodKey][txDay].swaps += 1;
        }
      }
      
      allPeriods.add(periodKey);
    }
    
    // Create a sorted array of period keys
    const sortedPeriods = Array.from(allPeriods).sort();
    
    // Create arrays for points and swaps per period
    const periods: string[] = [];
    const pointsData: number[] = [];
    const swapData: number[] = [];
    
    for (const periodKey of sortedPeriods) {
      // Convert period key to human-readable format
      let label: string;
      if (period === 'day') {
        const date = new Date(periodKey);
        label = date.toLocaleTimeString(undefined, { hour: '2-digit' });
      } else if (period === 'week' || period === 'month') {
        const date = new Date(periodKey);
        label = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } else {
        // For 'all', extract year and week number
        const [year, weekPart] = periodKey.split('-');
        const weekNum = parseInt(weekPart.substring(1), 10);
        label = `Week ${weekNum}`;
      }
      
      periods.push(label);
      pointsData.push(periodData[periodKey].points);
      swapData.push(periodData[periodKey].swaps);
    }
    
    // Calculate total points from transactions
    const totalPoints = pointsData.reduce((sum, points) => sum + points, 0);
    
    return {
      periods,
      pointsData,
      swapData,
      totalPoints,
      currentPoints
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
    // Create the transaction
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        ...transaction,
        timestamp: new Date()
      })
      .returning();
    
    // Calculate and add points for this transaction
    const points = await this.getTransactionPoints(newTransaction);
    if (points > 0) {
      console.log(`Adding ${points} points to user ${transaction.userId} for ${transaction.type} transaction`);
      await this.addUserPoints(transaction.userId, points);
    }
    
    return newTransaction;
  }
  
  async getTransactionPoints(transaction: Transaction): Promise<number> {
    // Calculate points based on transaction type
    if (transaction.type === 'swap') {
      // Check daily swap count to determine points
      const userId = transaction.userId;
      
      // Get timestamp of this transaction to determine if it's valid for today
      const txDate = transaction.timestamp ? new Date(transaction.timestamp) : new Date();
      const txDay = new Date(txDate);
      txDay.setHours(0, 0, 0, 0);
      
      // Count swaps made today BEFORE this one 
      const swapsBeforeThisOne = await db
        .select({ count: count() })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'swap'),
          sql`${transactions.timestamp} >= ${txDay}`,
          transaction.id ? sql`${transactions.id} < ${transaction.id}` : sql`1=1` // If we have an ID, count only transactions before this one
        ));
      
      const swapsBeforeCount = swapsBeforeThisOne[0]?.count || 0;
      
      // Only award points for the first 5 swaps of the day
      if (swapsBeforeCount < 5) {
        console.log(`[PointsCalc] Awarding 0.5 points for swap #${swapsBeforeCount + 1} to user ${userId}`);
        return 0.5; // 0.5 points per swap for first 5 swaps
      } else {
        console.log(`[PointsCalc] No points awarded - already reached 5 swaps for the day for user ${userId}`);
        return 0;
      }
    } else if (transaction.type === 'nft_stake') {
      // Points for NFT staking (1 point)
      const POINTS_FOR_NFT_STAKE = 1.0;
      const userId = transaction.userId;
      
      // Check if this user has any existing NFT stake transactions (excluding the current one)
      const existingStakes = await db
        .select({ count: count() })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'nft_stake'),
          transaction.id ? sql`${transactions.id} != ${transaction.id}` : sql`1=1` // Exclude this transaction
        ));
      
      const existingStakeCount = existingStakes[0]?.count || 0;
      
      // Only award points for the first successful NFT stake
      if (existingStakeCount === 0) {
        console.log(`[PointsCalc] Awarding ${POINTS_FOR_NFT_STAKE} point for NFT staking to user ${userId}`);
        return POINTS_FOR_NFT_STAKE;
      } else {
        console.log(`[PointsCalc] No additional points for repeated NFT staking to user ${userId}`);
        return 0;
      }
    } else {
      // No points for any other transaction types
      console.log(`[PointsCalc] No points for transaction type: ${transaction.type}`);
      return 0;
    }
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
    
    // Update the user with the new claim count (NOT adding points directly here anymore)
    const [updatedUser] = await db
      .update(users)
      .set({ 
        totalClaims: newClaimCount,
        lastClaim: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    
    console.log(`[ClaimCounter] User ${userId} completed faucet claim #${newClaimCount}`);
    
    // Record this transaction - points will be added in createTransaction
    await this.createTransaction({
      userId,
      type: 'faucet_claim',
      txHash: `claim_${Date.now()}`, // Placeholder for actual transaction hash
      status: 'completed'
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
  
  async removePointsForFaucetClaims(): Promise<number> {
    console.log("[PointsSystem] Starting removal of all points from faucet claims in database");
    
    let totalPointsRemoved = 0;
    let usersUpdated = 0;
    
    try {
      // Get all users with faucet claim transactions
      const userClaims = await db
        .select({
          userId: transactions.userId,
          claimCount: count(transactions.id)
        })
        .from(transactions)
        .where(eq(transactions.type, 'faucet_claim'))
        .groupBy(transactions.userId);
        
      // For each user, find and deduct points from faucet claims
      for (const userClaim of userClaims) {
        const { userId, claimCount } = userClaim;
        
        // Get current user points
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        if (!user) continue;
        
        const currentPoints = user.points || 0;
        const pointsToDeduct = claimCount; // 1 point per claim
        const newPoints = Math.max(0, currentPoints - pointsToDeduct);
        
        // Update user points
        const [updatedUser] = await db
          .update(users)
          .set({ points: newPoints })
          .where(eq(users.id, userId))
          .returning();
          
        const pointsRemoved = currentPoints - (updatedUser.points || 0);
        totalPointsRemoved += pointsRemoved;
        usersUpdated++;
        
        console.log(`[PointsSystem] Removed ${pointsRemoved} points from user ${userId} (${user.address}) for ${claimCount} faucet claims`);
      }
      
      console.log(`[PointsSystem] Completed removal of ${totalPointsRemoved} total points from ${usersUpdated} users in database`);
      return totalPointsRemoved;
    } catch (error) {
      console.error("Error removing points for faucet claims:", error);
      return 0;
    }
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
          address: "0x2B744c80C4895fDC2003108E186aBD7613c0ec7E", // Fixed USDT address to match client
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
  
  async recalculateAllUserPoints(): Promise<{
    usersUpdated: number;
    totalPointsBefore: number;
    totalPointsAfter: number;
    userDetails: Array<{
      userId: number;
      address: string;
      pointsBefore: number;
      pointsAfter: number;
      totalSwaps: number;
      pointEarningSwaps: number;
      nftStaked: boolean;
    }>;
  }> {
    console.log("[PointsSystem] Starting points recalculation for all users");
    
    const userDetails: Array<{
      userId: number;
      address: string;
      pointsBefore: number;
      pointsAfter: number;
      totalSwaps: number;
      pointEarningSwaps: number;
      nftStaked: boolean;
    }> = [];
    
    let totalPointsBefore = 0;
    let totalPointsAfter = 0;
    let usersUpdated = 0;
    
    try {
      // Get all users
      const allUsers = await db.select().from(users);
      
      // Process each user
      for (const user of allUsers) {
        const userId = user.id;
        const pointsBefore = user.points || 0;
        totalPointsBefore += pointsBefore;
        
        // Get all swap transactions for this user
        const swapTransactions = await db
          .select()
          .from(transactions)
          .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, 'swap')
          ))
          .orderBy(transactions.timestamp);
        
        // Group transactions by day for swap points calculation
        const transactionsByDay: Record<string, Transaction[]> = {};
        let pointEarningSwaps = 0;
        
        for (const tx of swapTransactions) {
          const txDate = new Date(tx.timestamp);
          const day = txDate.toISOString().substring(0, 10); // YYYY-MM-DD
          
          if (!transactionsByDay[day]) {
            transactionsByDay[day] = [];
          }
          
          transactionsByDay[day].push(tx);
        }
        
        // Calculate swap points: 0.5 per swap, max 5 swaps per day
        let newPoints = 0;
        
        for (const day in transactionsByDay) {
          const daySwaps = transactionsByDay[day];
          const pointSwapsForDay = Math.min(daySwaps.length, 5);
          
          pointEarningSwaps += pointSwapsForDay;
          newPoints += pointSwapsForDay * 0.5; // 0.5 points per swap
        }
        
        // Check for NFT staking transactions
        const nftStakeTransactions = await db
          .select()
          .from(transactions)
          .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, 'nft_stake'),
            eq(transactions.status, 'completed')
          ))
          .orderBy(transactions.timestamp);
          
        // If user has staked NFTs, add points accordingly
        const nftStaked = nftStakeTransactions.length > 0;
        if (nftStaked) {
          // Add 1 point for NFT staking (this can be adjusted based on your requirements)
          newPoints += 1;
          console.log(`[PointsCalc] Adding 1 point for NFT staking to user ${userId}`);
        }
        
        // Round to 1 decimal place for clean display
        newPoints = Math.round(newPoints * 10) / 10;
        
        // Update user with new points
        await db
          .update(users)
          .set({ 
            points: newPoints,
            totalSwaps: swapTransactions.length
          })
          .where(eq(users.id, userId));
        
        totalPointsAfter += newPoints;
        usersUpdated++;
        
        // Record the user's details for the report
        userDetails.push({
          userId,
          address: user.address,
          pointsBefore,
          pointsAfter: newPoints,
          totalSwaps: swapTransactions.length,
          pointEarningSwaps,
          nftStaked
        });
        
        console.log(`[PointsSystem] User ${userId} (${user.address.substring(0, 8)}...): ${pointsBefore} points → ${newPoints} points | ${swapTransactions.length} total swaps, ${pointEarningSwaps} earning points | NFT staked: ${nftStaked}`);
      }
      
      console.log(`[PointsSystem] Recalculation complete. Updated ${usersUpdated} users.`);
      console.log(`[PointsSystem] Total points before: ${totalPointsBefore}, after: ${totalPointsAfter}`);
      
      return {
        usersUpdated,
        totalPointsBefore,
        totalPointsAfter,
        userDetails
      };
    } catch (error) {
      console.error("[PointsSystem] Error during points recalculation:", error);
      throw error;
    }
  }
}