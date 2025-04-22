import {
  users, User, InsertUser,
  quests, Quest, InsertQuest,
  userQuests, UserQuest, InsertUserQuest,
  proposals, Proposal, InsertProposal,
  votes, Vote, InsertVote,
  tokens, Token, InsertToken,
  transactions, Transaction, InsertTransaction
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, count, sql, asc } from "drizzle-orm";
import { IStorage } from "./storage";

// Database implementation of storage
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(address: string): Promise<User | undefined> {
    // Use direct SQL query first to ensure we get accurate results
    try {
      const directQuery = await db.execute(
        sql`SELECT * FROM users WHERE address = ${address}`
      );
      
      if (directQuery.length > 0) {
        // Found a user with direct SQL
        const userId = directQuery[0].id;
        console.log(`[UserLookup] Found user with ID ${userId} using direct SQL`);
        
        // Now fetch the full user object through drizzle
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        return user;
      }
      
      // Fallback to the ORM approach if direct SQL yields no results
      console.log(`[UserLookup] No user found with direct SQL for ${address}, falling back to ORM`);
      const [user] = await db.select().from(users).where(eq(users.address, address));
      return user;
    } catch (error) {
      console.error("Error in getUser:", error);
      // Fallback to the original approach if there's an error
      const [user] = await db.select().from(users).where(eq(users.address, address));
      return user;
    }
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
    
    // Critical: Check if this swap is exactly the 5th swap of the day
    // If so, trigger immediate points recalculation
    if (currentDailySwapNumber === 5) {
      console.log(`[SwapCounter] ⭐⭐⭐ User ${userId} just completed their 5th swap today! Triggering automatic points recalculation ⭐⭐⭐`);
      
      try {
        // Force immediate points recalculation
        setTimeout(async () => {
          const pointsBefore = await this.getUserPointsById(userId);
          console.log(`[PointsSystem] SWAP-TRIGGERED recalculation for user ${userId} starting. Current points: ${pointsBefore}`);
          
          const newPoints = await this.recalculatePointsForUser(userId);
          
          console.log(`[PointsSystem] ✅ SWAP-TRIGGERED recalculation completed. User ${userId}: Points ${pointsBefore} → ${newPoints}`);
          
          // Force cache refresh to update UI
          this.refreshLeaderboardCache();
        }, 100); // Small delay to ensure the transaction is fully recorded first
      } catch (error) {
        console.error(`[PointsSystem] ERROR in swap-triggered recalculation for user ${userId}:`, error);
      }
    }
    
    return updatedUser.totalSwaps || 0;
  }
  
  // Get user's rank on the leaderboard based on points (primary) and swap count (secondary)
  async getUserRank(address: string): Promise<number | null> {
    if (!address) return null;
    
    try {
      // Normalize address
      const normalizedAddress = address.toLowerCase();
      
      // Get user's data
      const [user] = await db
        .select()
        .from(users)
        .where(sql`LOWER(${users.address}) = ${normalizedAddress}`);
      
      if (!user) return null;
      
      // Get points and swap count for ranking
      const userPoints = user.points || 0;
      const userSwaps = user.totalSwaps || 0;
      
      // First, count users with strictly more points
      const { higherPointsCount } = await db
        .select({
          higherPointsCount: sql<number>`COUNT(*)`
        })
        .from(users)
        .where(sql`${users.points} > ${userPoints}`)
        .then(rows => rows[0]);
        
      // Next, count users with equal points but more swaps
      const { equalPointsMoreSwapsCount } = await db
        .select({
          equalPointsMoreSwapsCount: sql<number>`COUNT(*)`
        })
        .from(users)
        .where(sql`${users.points} = ${userPoints} AND ${users.totalSwaps} > ${userSwaps}`)
        .then(rows => rows[0]);
        
      // Count users with the exact same rank (same points and same swaps)
      const { sameRankCount } = await db
        .select({
          sameRankCount: sql<number>`COUNT(*)`
        })
        .from(users)
        .where(sql`${users.points} = ${userPoints} AND ${users.totalSwaps} = ${userSwaps} AND LOWER(${users.address}) != ${normalizedAddress}`)
        .then(rows => rows[0]);
        
      // Add 1 to get the user's rank (1-indexed)
      // Users with equal points and swaps share the same rank
      return higherPointsCount + equalPointsMoreSwapsCount + 1;
    } catch (error) {
      console.error("Error in getUserRank:", error);
      return null;
    }
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
    console.log(`Fetching historical points for user ID: ${userId}, period: ${period}`);

    // Get the user for the current point balance
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      console.log(`User ${userId} not found - returning empty historical data`);
      return {
        periods: [],
        pointsData: [],
        swapData: [],
        totalPoints: 0,
        currentPoints: 0,
      };
    }
    
    // IMPORTANT FIX: First recalculate the points to ensure accuracy
    await this.recalculatePointsForUser(userId);
    
    // Get the updated user record with recalculated points
    const [updatedUser] = await db.select().from(users).where(eq(users.id, userId));
    const currentPoints = updatedUser?.points || 0;
    
    // Set time range based on period
    const now = new Date();
    let startDate: Date;
    let periodFormat: string;
    
    switch (period) {
      case 'day':
        // Last 24 hours, grouped by hour
        startDate = new Date(now);
        startDate.setHours(now.getHours() - 24);
        periodFormat = 'hourly';
        break;
        
      case 'week':
        // Last 7 days, grouped by day
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        periodFormat = 'daily';
        break;
        
      case 'month':
        // Last 30 days, grouped by day
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        periodFormat = 'daily';
        break;
        
      case 'all':
      default:
        // All time, grouped by week
        startDate = new Date('2024-01-01'); // From beginning of 2024
        periodFormat = 'weekly';
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
    
    console.log(`Found ${swapTransactions.length} swap transactions in the time period`);
    
    // Structure to hold processed data:
    // - For each day, track the number of swaps and calculated points
    // - For each period (hour, day, or week), aggregate data from the daily tracking
    type SwapDay = {
      swapCount: number;  // Number of swaps on this day
      points: number;     // Points earned on this day (capped at 2.5)
    };
    
    type PeriodData = {
      totalSwaps: number;  // Total swaps in this period
      points: number;      // Points earned in this period
      periodLabel: string; // Display label for this period
    };
    
    // Track swaps by date to enforce daily limits
    const swapsByDay: Record<string, SwapDay> = {};
    
    // Track aggregated data by display period
    const periodMap: Record<string, PeriodData> = {};
    
    // Process all transactions
    for (const tx of swapTransactions) {
      // Extract date components for grouping
      const txDate = new Date(tx.timestamp);
      const txDay = txDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Determine period key for aggregation
      let periodKey: string;
      let periodLabel: string;
      
      if (periodFormat === 'hourly') {
        // For hourly, use YYYY-MM-DD HH format
        const hour = txDate.getHours().toString().padStart(2, '0');
        periodKey = `${txDay} ${hour}`;
        periodLabel = `${hour}:00`;
      } else if (periodFormat === 'daily') {
        // For daily, use YYYY-MM-DD format
        periodKey = txDay;
        const month = txDate.toLocaleString('default', { month: 'short' });
        const day = txDate.getDate();
        periodLabel = `${month} ${day}`;
      } else {
        // For weekly, use YYYY-WW format
        const weekNum = Math.ceil((txDate.getDate() + new Date(txDate.getFullYear(), txDate.getMonth(), 1).getDay()) / 7);
        periodKey = `${txDate.getFullYear()}-W${weekNum}`;
        periodLabel = `Week ${weekNum}`;
      }
      
      // Initialize swap day tracking if needed
      if (!swapsByDay[txDay]) {
        swapsByDay[txDay] = {
          swapCount: 0,
          points: 0
        };
      }
      
      // Initialize period data if needed
      if (!periodMap[periodKey]) {
        periodMap[periodKey] = {
          totalSwaps: 0,
          points: 0,
          periodLabel
        };
      }
      
      // Increment swap count for this day
      swapsByDay[txDay].swapCount++;
      
      // Calculate points for this swap (0.5 points per swap, max 5 swaps = 2.5 points per day)
      // IMPORTANT: Use exactly 0.5 points per swap, max 5 swaps per day
      swapsByDay[txDay].points = Math.min(swapsByDay[txDay].swapCount, 5) * 0.5;
      
      // Log the points calculation for transparency
      console.log(`[HistoricalPoints] Day ${txDay}: ${swapsByDay[txDay].swapCount} swaps × 0.5 = ${swapsByDay[txDay].points} points`);
      
      // Update period totals
      periodMap[periodKey].totalSwaps++;
    }
    
    // Calculate points for each period from the daily data
    for (const day in swapsByDay) {
      // Determine which period this day belongs to
      const dayDate = new Date(day);
      let periodKey: string;
      
      if (periodFormat === 'hourly') {
        // For hours, we need to handle differently - swaps are already counted per hour
        continue;
      } else if (periodFormat === 'daily') {
        // For daily, the day is the period
        periodKey = day;
      } else {
        // For weekly, calculate the week number
        const weekNum = Math.ceil((dayDate.getDate() + new Date(dayDate.getFullYear(), dayDate.getMonth(), 1).getDay()) / 7);
        periodKey = `${dayDate.getFullYear()}-W${weekNum}`;
      }
      
      // Add this day's points to the period
      if (periodMap[periodKey]) {
        // For daily and weekly, we need to update the points from the daily calculations
        if (periodFormat !== 'hourly') {
          periodMap[periodKey].points += swapsByDay[day].points;
        }
      }
    }
    
    // For hourly format, handle points calculation directly
    if (periodFormat === 'hourly') {
      // We need to recalculate points for each hour from the transactions
      // This is because hourly periods can span multiple days
      
      // Clear existing period data points
      for (const key in periodMap) {
        periodMap[key].points = 0;
      }
      
      // Re-process transactions to assign correct points
      for (const tx of swapTransactions) {
        const txDate = new Date(tx.timestamp);
        const txDay = txDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const hour = txDate.getHours().toString().padStart(2, '0');
        const hourKey = `${txDay} ${hour}`;
        
        // Calculate swap position for this day (1st swap, 2nd swap, etc.)
        const swapPositionToday = swapsByDay[txDay] ? 
          Math.min(swapsByDay[txDay].swapCount, 5) : 0;
        
        // Points are determined by the daily cap of 5 swaps
        // Each swap adds 0.5 points up to a max of 2.5 points per day
        // Only attribute points to this hour's transaction if it's within the first 5 swaps of the day
        const dailySwapPosition = swapTransactions
          .filter(t => new Date(t.timestamp).toISOString().split('T')[0] === txDay)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .findIndex(t => t.id === tx.id) + 1;
        
        if (dailySwapPosition <= 5 && periodMap[hourKey]) {
          // This swap is eligible for points - 0.5 points per swap, max 5 per day
          periodMap[hourKey].points += 0.5;
          console.log(`[HistoricalPoints-Hourly] Added 0.5 points for swap #${dailySwapPosition} on ${txDay} hour ${hour}`);
        }
      }
    }
    
    // Convert the period map to sorted arrays for chart display
    const sortedPeriods = Object.keys(periodMap).sort();
    
    const periods: string[] = [];
    const pointsData: number[] = [];
    const swapData: number[] = [];
    let totalPoints = 0;
    
    for (const key of sortedPeriods) {
      periods.push(periodMap[key].periodLabel);
      pointsData.push(Number(periodMap[key].points.toFixed(1))); // Round to 1 decimal place
      swapData.push(periodMap[key].totalSwaps);
      totalPoints += periodMap[key].points;
    }
    
    const result = {
      periods,
      pointsData,
      swapData,
      totalPoints: Number(totalPoints.toFixed(1)), // Round to 1 decimal place
      currentPoints
    };
    
    console.log(`Historical data for ${user.address} (${period}): ${JSON.stringify(result)}...`);
    return result;
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
    // IMPORTANT FIX: If points are explicitly provided, use them instead of calculating
    // This prevents double-counting points from various parts of the application
    console.log(`Creating transaction for user ${transaction.userId}, type: ${transaction.type}`, 
                transaction.points ? `with explicit points: ${transaction.points}` : 'without explicit points');
    
    try {
      // Convert numeric points to string for PostgreSQL compatibility
      let pointsValue = transaction.points;
      if (pointsValue !== undefined && pointsValue !== null) {
        // Ensure points are handled as a string for the database
        if (typeof pointsValue === 'number') {
          pointsValue = String(pointsValue);
        }
      }
      
      console.log(`DEBUG: Final transaction values:`, {
        ...transaction,
        points: pointsValue,
        timestamp: new Date()
      });
      
      // Try direct SQL insert first as a fallback
      let newTransaction;
      
      try {
        // Create the transaction with Drizzle ORM
        [newTransaction] = await db
          .insert(transactions)
          .values({
            ...transaction,
            points: pointsValue,
            timestamp: new Date()
          })
          .returning();
        
        console.log(`Successfully created transaction with ID ${newTransaction.id} using ORM`);
      } catch (ormError) {
        console.error("ORM insert failed, trying direct SQL:", ormError);
        
        // Fallback to direct SQL if ORM fails
        const timestamp = new Date();
        const result = await pool.query(
          `INSERT INTO transactions (
            user_id, type, from_token, to_token, from_amount, to_amount, 
            tx_hash, status, block_number, points, timestamp
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
          [
            transaction.userId,
            transaction.type,
            transaction.fromToken,
            transaction.toToken,
            transaction.fromAmount,
            transaction.toAmount,
            transaction.txHash,
            transaction.status || "completed",
            transaction.blockNumber || null,
            pointsValue,
            timestamp
          ]
        );
        
        newTransaction = result.rows[0];
        console.log(`Successfully created transaction with ID ${newTransaction.id} using direct SQL`);
      }
      
      // Points are handled in different ways:
      // 1. If points explicitly provided - that value is used directly with no additional points added
      // 2. If points not provided - calculate and add points based on transaction type
      
      if (transaction.points === undefined) {
        // No points explicitly provided - calculate them
        const points = await this.getTransactionPoints(newTransaction);
        if (points > 0) {
          console.log(`Calculated ${points} points for user ${transaction.userId} ${transaction.type} transaction`);
          
          // Add points to the user
          await this.addUserPoints(transaction.userId, points);
          
          // Update the transaction record with calculated points
          await pool.query(
            `UPDATE transactions SET points = $1 WHERE id = $2`,
            [String(points), newTransaction.id]
          );
            
          console.log(`Updated transaction ${newTransaction.id} with calculated ${points} points`);
        }
      } else if (transaction.points !== null && Number(transaction.points) > 0) {
        // Points explicitly provided - add points to the user (was missing before)
        const numPoints = Number(transaction.points);
        console.log(`Transaction created with explicit ${numPoints} points value - adding points directly`);
        
        // Add the explicit points to the user
        await this.addUserPoints(transaction.userId, numPoints);
        
        console.log(`Updated user ${transaction.userId} points with explicit ${numPoints} points`);
      }
      
      // Get the updated transaction to return - use direct SQL to ensure it's fetched
      const updatedResult = await pool.query(
        `SELECT * FROM transactions WHERE id = $1`,
        [newTransaction.id]
      );
      
      // Update the total swaps for the user to ensure it's consistent
      await pool.query(
        `UPDATE users SET total_swaps = (SELECT COUNT(*) FROM transactions WHERE user_id = $1 AND type = 'swap') WHERE id = $1`,
        [transaction.userId]
      );
      
      const updatedTransaction = updatedResult.rows[0];
      return updatedTransaction || newTransaction;
    } catch (err) {
      console.error("Error creating transaction:", err);
      throw err;
    }
  }
  
  async getTransactionPoints(transaction: Transaction): Promise<number> {
    // UPDATED POINTS CALCULATION - FIX FOR INCORRECT POINTS
    // Calculate points based on transaction type with a single point source: swap transactions
    // IMPORTANT: Always awards exactly 0.5 points per swap, max 5 swaps per day (2.5 points total)
    
    if (transaction.type === 'swap') {
      // Check daily swap count to determine points
      const userId = transaction.userId;
      
      // Get timestamp of this transaction to determine if it's valid for today
      const txDate = transaction.timestamp ? new Date(transaction.timestamp) : new Date();
      const txDay = new Date(txDate);
      txDay.setHours(0, 0, 0, 0);
      
      // Count swaps made today BEFORE this one (to determine if this swap is eligible for points)
      const swapsBeforeThisOne = await db
        .select({ count: count() })
        .from(transactions)
        .where(and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'swap'),
          eq(transactions.status, 'completed'),
          sql`DATE(${transactions.timestamp}) = DATE(${txDate})`,
          transaction.id ? sql`${transactions.id} < ${transaction.id}` : sql`1=1` // If we have an ID, count only transactions before this one
        ));
      
      const swapsBeforeCount = Number(swapsBeforeThisOne[0]?.count || 0);
      
      // Only award points for the first 5 swaps of the day (EXACTLY 0.5 points per swap)
      if (swapsBeforeCount < 5) {
        // CRITICAL FIX: Forcing exactly 0.5 points per swap, ensuring it displays correctly
        const POINTS_PER_SWAP = 0.5;
        console.log(`[PointsSystem] Awarded ${POINTS_PER_SWAP} points for swap #${swapsBeforeCount + 1} to user ${userId}`);
        console.log(`[PointsDebug] swap=${transaction.type}, userId=${userId}, return=${POINTS_PER_SWAP}`);
        
        return POINTS_PER_SWAP; // FIXED: Always exactly 0.5 points per eligible swap
      } else {
        console.log(`[PointsCalc] No points awarded - already reached 5 swaps for the day for user ${userId}`);
        return 0;
      }
    } else if (transaction.type === 'nft_stake') {
      // NFT staking is handled on a separate site and has its own reward system
      // No points are awarded for NFT staking on this platform
      console.log(`[PointsCalc] NFT staking has no points - it's handled on a separate site`);
      return 0;
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
    
    const currentCount = result?.count || 0;
    
    // If the user has just reached exactly 5 swaps for the day, trigger a full recalculation
    // This ensures all points are properly calculated after daily limit is reached
    if (currentCount === 4) { // Trigger on 4 swaps since this is being checked BEFORE the 5th swap is processed
      console.log(`[PointsSystem] User ${userId} is about to reach the daily limit of 5 swaps. Will perform automatic recalculation after transaction is processed.`);
    } else if (currentCount === 5) {
      console.log(`[PointsSystem] ⭐ User ${userId} has reached daily limit of 5 swaps. Triggering IMMEDIATE automatic full recalculation. ⭐`);
      
      // Run immediately to ensure recalculation happens right away
      try {
        const pointsBefore = await this.getUserPointsById(userId);
        console.log(`[PointsSystem] IMMEDIATE recalculation for user ${userId} starting. Current points: ${pointsBefore}`);
        
        const newPoints = await this.recalculatePointsForUser(userId);
        
        // Get user address for better logging
        const [user] = await db.select().from(users).where(eq(users.id, userId));
        const userAddress = user?.address || 'unknown';
        
        console.log(`[PointsSystem] ✅ IMMEDIATE recalculation completed successfully for user ${userId} (${userAddress.substring(0, 8)}...): Points: ${pointsBefore} → ${newPoints}`);
        
        // After successful recalculation, force a leaderboard cache refresh
        // This ensures all UI displays are updated with the newest point values
        this.refreshLeaderboardCache();
      } catch (error) {
        console.error(`[PointsSystem] 🔴 CRITICAL ERROR in immediate recalculation for user ${userId}:`, error);
      }
    }
    
    return currentCount;
  }
  
  // Helper method to refresh leaderboard cache
  private async refreshLeaderboardCache(): Promise<void> {
    console.log(`[PointsSystem] 🔄 Force refreshing leaderboard cache after points recalculation`);
    try {
      // Clear all user data from cache
      console.log(`[CacheManager] Clearing user cache to force update on next access`);
      
      // We don't have direct access to queryClient from here, so we're setting a flag
      // that will trigger a full cache refresh in other parts of the application
      global.FORCE_CACHE_REFRESH = true;
      
      // Get the latest global points total for WebSocket notification
      try {
        // Calculate total global points across all users
        const [totalPointsResult] = await db
          .select({
            sum: sql<number>`SUM(${users.points})`,
            count: sql<number>`COUNT(*)`
          })
          .from(users);
        
        const totalGlobalPoints = totalPointsResult?.sum || 0;
        const userCount = totalPointsResult?.count || 0;
        
        // Import the broadcast function from routes.ts
        const { broadcastNotification } = require('./routes');
        
        // Send a notification to all connected clients
        if (typeof broadcastNotification === 'function') {
          console.log(`[WebSocket] Broadcasting leaderboard update with total points: ${totalGlobalPoints}`);
          
          broadcastNotification({
            type: 'leaderboard_update',
            totalGlobalPoints,
            userCount,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`[WebSocket] Error broadcasting leaderboard update:`, error);
      }
    } catch (error) {
      console.error(`[CacheManager] Failed to refresh cache:`, error);
    }
  }
  
  // Helper function to recalculate points for a single user
  async recalculatePointsForUser(userId: number): Promise<number> {
    // Get user
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      console.log(`[PointsSystem] Cannot recalculate for userId ${userId} - user not found`);
      return 0;
    }
    
    const pointsBefore = user.points || 0;
    console.log(`[PointsSystem] Recalculating points for user ${userId} (${user.address}) - currently has ${pointsBefore} points`);
    
    // Get all swap transactions for this user
    const swapTransactions = await db
      .select()
      .from(transactions)
      .where(and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'swap'),
        eq(transactions.status, 'completed')
      ))
      .orderBy(sql`${transactions.timestamp} ASC`); // Ensure chronological order
    
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
      // Only count the first 5 swaps each day toward points
      const pointSwapsForDay = Math.min(daySwaps.length, 5);
      
      pointEarningSwaps += pointSwapsForDay;
      const pointsForDay = pointSwapsForDay * 0.5; // Exactly 0.5 points per swap
      
      console.log(`[PointsCalc] User ${userId} earned ${pointsForDay.toFixed(1)} points from ${pointSwapsForDay} swaps (0.5 × ${pointSwapsForDay}) on ${day}`);
      newPoints += pointsForDay;
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
      
    console.log(`[PointsSystem] User ${userId} (${user.address.substring(0, 8)}...): ${pointsBefore} points → ${newPoints} points | ${swapTransactions.length} total swaps`);
    
    // Broadcast individual user points update via WebSocket if points changed
    if (pointsBefore !== newPoints) {
      try {
        // Import the broadcast function from routes.ts
        const { broadcastNotification } = require('./routes');
        
        if (typeof broadcastNotification === 'function') {
          console.log(`[WebSocket] Broadcasting points update for user ${userId}: ${pointsBefore} → ${newPoints}`);
          
          broadcastNotification({
            type: 'points_update',
            userId,
            address: user.address,
            pointsBefore,
            pointsAfter: newPoints,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error(`[WebSocket] Error broadcasting points update:`, error);
      }
    }
    
    return newPoints;
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
  
  async getUserPointsById(userId: number): Promise<number> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return 0;
    return user.points || 0;
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
  
  async getTotalUsersCount(): Promise<{ count: number }> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(users);
      
      // Log for debugging
      console.log(`Total users count from direct DB query: ${result[0]?.count || 0}`);
      return result[0] || { count: 0 };
    } catch (error) {
      console.error("Error getting total users count:", error);
      return { count: 0 };
    }
  }
  
  /**
   * Get global swap statistics
   * This includes total swaps, eligible swaps (those that earn points), and ineligible swaps
   */
  async getGlobalSwapStats(): Promise<{
    totalSwaps: number;
    eligibleSwaps: number;
    ineligibleSwaps: number;
  }> {
    try {
      // Get total swaps from transactions table
      const [totalSwapsResult] = await db
        .select({
          count: sql<number>`COUNT(*)`
        })
        .from(transactions)
        .where(eq(transactions.type, 'swap'));
      
      // Calculate total transactions that were eligible for points (max 5 per day per user)
      // First, we need to group transactions by user and day
      const swapsByUserAndDay = await db
        .select({
          userId: transactions.userId,
          day: sql<string>`DATE(${transactions.timestamp})`,
          count: sql<number>`COUNT(*)`
        })
        .from(transactions)
        .where(eq(transactions.type, 'swap'))
        .groupBy(transactions.userId, sql`DATE(${transactions.timestamp})`);
      
      // Now calculate eligible swaps (max 5 per user per day)
      let eligibleSwaps = 0;
      for (const entry of swapsByUserAndDay) {
        eligibleSwaps += Math.min(entry.count, 5);
      }
      
      const totalSwaps = totalSwapsResult?.count || 0;
      const ineligibleSwaps = totalSwaps - eligibleSwaps;
      
      return {
        totalSwaps,
        eligibleSwaps,
        ineligibleSwaps
      };
    } catch (error) {
      console.error("Error getting global swap stats:", error);
      return {
        totalSwaps: 0,
        eligibleSwaps: 0,
        ineligibleSwaps: 0
      };
    }
  }

  async getLeaderboard(limit: number = 20, page: number = 1): Promise<{
    users: User[],
    totalGlobalPoints: number
  }> {
    try {
      // Calculate offset based on page and limit for pagination
      const offset = (page - 1) * limit;
      
      // Get top users by points as primary criteria, then by swaps as secondary
      // This ensures users with the same points but more swaps rank higher
      const result = await db
        .select()
        .from(users)
        .orderBy(sql`${users.points} DESC, ${users.totalSwaps} DESC`)
        .limit(limit)
        .offset(offset);
      
      // Calculate total global points across all users
      const [totalPointsResult] = await db
        .select({
          sum: sql<number>`SUM(${users.points})`
        })
        .from(users);
      
      const totalGlobalPoints = totalPointsResult?.sum || 0;
      
      console.log(`Found ${result.length} users for leaderboard (page ${page}, limit ${limit}), total global points: ${totalGlobalPoints}`);
      return {
        users: result,
        totalGlobalPoints
      };
    } catch (error) {
      console.error("Error in getLeaderboard:", error);
      return {
        users: [],
        totalGlobalPoints: 0
      };
    }
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
  
  async resetAllUserPointsAndTransactions(): Promise<{
    usersReset: number; 
    transactionsDeleted: number;
    pointsReset: number;
  }> {
    console.log("[PointsSystem] Starting complete reset of all user data, points and transactions");
    
    let usersReset = 0;
    let pointsReset = 0;
    let transactionsDeleted = 0;
    
    try {
      // Delete all transactions (not just swaps)
      const deletedTransactions = await db
        .delete(transactions)
        .returning();
        
      transactionsDeleted = deletedTransactions.length;
      console.log(`[PointsSystem] Deleted ${transactionsDeleted} total transactions`);

      // Delete all users EXCEPT the demo user (for testing)
      const demoUserAddress = "0xf4b08b6c0401c9568f3f3abf2a10c2950df98eae";
      
      // Get all users
      const allUsers = await db.select().from(users);
      
      // Reset points for all users or delete them completely
      for (const user of allUsers) {
        // Track current points for logging
        const currentPoints = user.points || 0;
        
        if (user.address.toLowerCase() === demoUserAddress.toLowerCase()) {
          // Just reset the demo user's points
          await db
            .update(users)
            .set({ 
              points: 0,
              totalSwaps: 0,
              totalClaims: 0
            })
            .where(eq(users.id, user.id));
            
          console.log(`[PointsSystem] Reset demo user ${user.id} (${user.address})`);
        } else {
          // Delete other users completely
          await db
            .delete(users)
            .where(eq(users.id, user.id));
            
          console.log(`[PointsSystem] Deleted user ${user.id} (${user.address})`);
        }
        
        if (currentPoints > 0) {
          pointsReset += currentPoints;
          usersReset++;
        }
      }
      
      console.log(`[PointsSystem] Reset complete: ${usersReset} users had points reset or were deleted, ${pointsReset} total points removed, ${transactionsDeleted} transactions deleted`);
      
      return {
        usersReset,
        transactionsDeleted,
        pointsReset
      };
    } catch (error) {
      console.error("[PointsSystem] Error during full reset:", error);
      throw error;
    }
  }
  
  /**
   * Complete database reset - this is a more comprehensive reset than resetAllUserPointsAndTransactions
   * It wipes everything except the demo user and completely cleans the database of any user data
   */
  async completeReset(): Promise<{
    usersDeleted: number;
    transactionsDeleted: number;
    userQuestsDeleted: number;
    votesDeleted: number;
  }> {
    console.log("[DANGER] Starting COMPLETE DATABASE RESET - wiping all user data and history");
    
    let usersDeleted = 0;
    let transactionsDeleted = 0;
    let userQuestsDeleted = 0;
    let votesDeleted = 0;
    
    try {
      // Use a transaction to ensure everything succeeds or fails together
      return await db.transaction(async (tx) => {
        // 1. Save the demo user for restoration
        const demoUserAddress = "0xf4b08b6c0401c9568f3f3abf2a10c2950df98eae";
        const [demoUser] = await tx.select().from(users).where(eq(users.address, demoUserAddress));
        
        if (!demoUser) {
          console.log("[DANGER] Demo user not found, will create one after reset");
        } else {
          console.log(`[DANGER] Found demo user: ${demoUser.id} (${demoUser.address})`);
        }
        
        // 2. DELETE ALL DATA FROM ALL TABLES IN THE CORRECT ORDER (to prevent foreign key constraint violations)
        
        // First delete votes
        const deletedVotes = await tx.delete(votes).returning();
        votesDeleted = deletedVotes.length;
        console.log(`[DANGER] Deleted ${votesDeleted} votes`);
        
        // Delete transactions
        const deletedTransactions = await tx.delete(transactions).returning();
        transactionsDeleted = deletedTransactions.length;
        console.log(`[DANGER] Deleted ${transactionsDeleted} transactions`);
        
        // Delete user quests
        const deletedUserQuests = await tx.delete(userQuests).returning();
        userQuestsDeleted = deletedUserQuests.length;
        console.log(`[DANGER] Deleted ${userQuestsDeleted} user quests`);
        
        // Delete ALL users (including demo)
        const deletedUsers = await tx.delete(users).returning();
        usersDeleted = deletedUsers.length;
        console.log(`[DANGER] Deleted ${usersDeleted} users`);
        
        // 3. Recreate the demo user with no points or history
        if (demoUserAddress) {
          const newDemoUser = await tx.insert(users).values({
            address: demoUserAddress,
            lastClaim: null,
            badges: [],
            points: 0,
            totalSwaps: 0,
            totalClaims: 0
          }).returning();
          
          console.log(`[DANGER] Recreated demo user: ${newDemoUser[0].id} (${newDemoUser[0].address})`);
        }
        
        // 4. Reset all proposal votes to zero
        // Update the proposals table with the correct field names based on schema.ts
        await tx.update(proposals).set({
          yesVotes: 0,
          noVotes: 0
        });
        
        console.log(`[DANGER] Reset all proposal votes to zero`);
        
        console.log(`[DANGER] COMPLETE DATABASE RESET FINISHED SUCCESSFULLY`);
        
        return {
          usersDeleted,
          transactionsDeleted,
          userQuestsDeleted,
          votesDeleted
        };
      });
    } catch (error) {
      console.error("[DANGER] Error during complete database reset:", error);
      // Log the full error for debugging
      console.error("Full error details:", error);
      if (error && typeof error === 'object' && 'stack' in error) {
        console.error("Stack trace:", error.stack);
      }
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
            eq(transactions.type, 'swap'),
            eq(transactions.status, 'completed')
          ))
          .orderBy(sql`${transactions.timestamp} ASC`); // Ensure chronological order
        
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
          // Only count the first 5 swaps each day toward points
          const pointSwapsForDay = Math.min(daySwaps.length, 5);
          
          pointEarningSwaps += pointSwapsForDay;
          const pointsForDay = pointSwapsForDay * 0.5; // 0.5 points per swap
          
          console.log(`[PointsCalc] User ${userId} earned ${pointsForDay.toFixed(1)} points from ${pointSwapsForDay} swaps on ${day}`);
          newPoints += pointsForDay;
        }
        
        // Check for NFT staking transactions for logging/tracking only
        const nftStakeTransactions = await db
          .select()
          .from(transactions)
          .where(and(
            eq(transactions.userId, userId),
            eq(transactions.type, 'nft_stake'),
            eq(transactions.status, 'completed')
          ))
          .orderBy(sql`${transactions.timestamp} ASC`); // Ensure chronological order
          
        // NFT staking is tracked but no points are awarded since it's handled on a separate site
        const nftStaked = nftStakeTransactions.length > 0;
        if (nftStaked) {
          console.log(`[PointsCalc] NFT staking detected for user ${userId} but no points awarded - handled on separate site`);
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
        
        console.log(`[PointsSystem] User ${userId} (${user.address.substring(0, 8)}...): ${pointsBefore} points → ${newPoints} points | ${swapTransactions.length} total swaps, ${pointEarningSwaps} earning points | NFT staked: ${nftStaked ? 'Yes' : 'No'}`);
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