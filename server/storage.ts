import {
  users, User, InsertUser,
  quests, Quest, InsertQuest,
  userQuests, UserQuest, InsertUserQuest,
  proposals, Proposal, InsertProposal,
  votes, Vote, InsertVote,
  tokens, Token, InsertToken,
  transactions, Transaction, InsertTransaction,
  quizzes, Quiz, InsertQuiz,
  quizQuestions, QuizQuestion, InsertQuizQuestion,
  userQuizzes, UserQuiz, InsertUserQuiz
} from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(address: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserLastClaim(address: string): Promise<User | undefined>;
  getUserBadges(userId: number): Promise<string[]>; 
  addUserBadge(userId: number, badgeId: string): Promise<string[]>;
  incrementUserSwapCount(userId: number): Promise<number>;
  incrementUserClaimCount(userId: number): Promise<number>;
  addUserPoints(userId: number, points: number): Promise<number>;
  removePointsForFaucetClaims(): Promise<number>; // Method to remove all faucet claim points
  getTotalUsersCount(): Promise<{ count: number }>;
  getGlobalSwapStats(): Promise<{
    totalSwaps: number;
    eligibleSwaps: number;
    ineligibleSwaps: number;
  }>;
  getLeaderboard(limit?: number, page?: number): Promise<{
    users: User[],
    totalGlobalPoints: number
  }>;
  getUserRank(address: string): Promise<number | null>;
  getUserStats(userId: number): Promise<{
    totalFaucetClaims: number;
    totalSwaps: number;
    completedQuests: number;
    totalQuests: number;
    proposalsVoted: number;
    proposalsCreated: number;
    points: number;
  }>;
  getUserHistoricalPoints(userId: number, period?: string): Promise<{
    periods: string[];
    pointsData: number[];
    swapData: number[];
    totalPoints: number;
    currentPoints: number;
    // Add any additional data needed for the dashboard
  }>;
  getDailySwapCount(userId: number): Promise<number>; // New method to track daily swap count
  
  // Quest operations
  getAllQuests(): Promise<Quest[]>;
  getQuest(id: number): Promise<Quest | undefined>;
  createQuest(quest: InsertQuest): Promise<Quest>;
  
  // User Quest operations
  getUserQuests(userId: number): Promise<UserQuest[]>;
  createUserQuest(userQuest: InsertUserQuest): Promise<UserQuest>;
  updateUserQuestStatus(id: number, status: string): Promise<UserQuest | undefined>;
  
  // Proposal operations
  getAllProposals(): Promise<Proposal[]>;
  getProposal(id: number): Promise<Proposal | undefined>;
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  updateProposalVotes(id: number, voteType: string, increment: number): Promise<Proposal | undefined>;
  
  // Vote operations
  getUserVote(userId: number, proposalId: number): Promise<Vote | undefined>;
  createVote(vote: InsertVote): Promise<Vote>;
  
  // Token operations
  getAllTokens(): Promise<Token[]>;
  getToken(symbol: string): Promise<Token | undefined>;
  createToken(token: InsertToken): Promise<Token>;
  
  // Transaction operations
  getUserTransactions(userId: number, page?: number, limit?: number): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    hasMore: boolean;
  }>;
  getUserTransactionsByType(userId: number, type: string, page?: number, limit?: number): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    hasMore: boolean;
  }>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionPoints(transaction: Transaction): Promise<number>; // New method to get points for a transaction
  
  // Points system management
  resetAllUserPointsAndTransactions(): Promise<{
    usersReset: number;
    transactionsDeleted: number;
    pointsReset: number;
  }>;
  
  // Complete database reset - more comprehensive than resetAllUserPointsAndTransactions
  completeReset(): Promise<{
    usersDeleted: number;
    transactionsDeleted: number;
    userQuestsDeleted: number;
    votesDeleted: number;
  }>;
  
  recalculateAllUserPoints(): Promise<{
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
    }>;
  }>;
  
  // Add required method for user points recalculation
  recalculatePointsForUser(userId: number): Promise<number>;
  
  // Quiz operations
  getAllQuizzes(): Promise<Quiz[]>;
  getQuiz(id: number): Promise<Quiz | undefined>;
  createQuiz(quiz: InsertQuiz): Promise<Quiz>;
  
  // Quiz Question operations
  getQuizQuestions(quizId: number): Promise<QuizQuestion[]>;
  getQuizQuestion(id: number): Promise<QuizQuestion | undefined>;
  createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion>;
  
  // User Quiz operations
  getUserQuizzes(userId: number): Promise<UserQuiz[]>;
  getUserQuiz(id: number): Promise<UserQuiz | undefined>;
  getUserQuizByUserAndQuizId(userId: number, quizId: number): Promise<UserQuiz | undefined>;
  createUserQuiz(userQuiz: InsertUserQuiz): Promise<UserQuiz>;
  updateUserQuiz(id: number, updates: Partial<Omit<UserQuiz, 'id'>>): Promise<UserQuiz | undefined>;
}

// In-memory implementation of storage
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private usersByAddress: Map<string, User>;
  private quests: Map<number, Quest>;
  private userQuests: Map<number, UserQuest>;
  private proposals: Map<number, Proposal>;
  private votes: Map<number, Vote>;
  private tokens: Map<number, Token>;
  private tokensBySymbol: Map<string, Token>;
  private transactions: Map<number, Transaction>;
  
  private userId: number;
  private questId: number;
  private userQuestId: number;
  private proposalId: number;
  private voteId: number;
  private tokenId: number;
  private transactionId: number;
  
  // New fields for quiz feature
  private quizzes: Map<number, Quiz>;
  private quizQuestions: Map<number, QuizQuestion>;
  private userQuizzes: Map<number, UserQuiz>;
  private quizId: number;
  private quizQuestionId: number;
  private userQuizId: number;
  
  constructor() {
    this.users = new Map();
    this.usersByAddress = new Map();
    this.quests = new Map();
    this.userQuests = new Map();
    this.proposals = new Map();
    this.votes = new Map();
    this.tokens = new Map();
    this.tokensBySymbol = new Map();
    this.transactions = new Map();
    this.quizzes = new Map();
    this.quizQuestions = new Map();
    this.userQuizzes = new Map();
    
    this.userId = 1;
    this.questId = 1;
    this.userQuestId = 1;
    this.proposalId = 1;
    this.voteId = 1;
    this.tokenId = 1;
    this.transactionId = 1;
    this.quizId = 1;
    this.quizQuestionId = 1;
    this.userQuizId = 1;
    
    // Initialize with sample tokens
    this.initializeTokens();
    // Initialize with sample quests
    this.initializeQuests();
    // Initialize with sample proposals
    this.initializeProposals();
    // Initialize with sample quizzes
    this.initializeQuizzes();
    
    // Initialize sample transaction data - do this asynchronously
    setTimeout(() => {
      this.initializeSampleData().catch(err => 
        console.error("Error initializing sample data:", err)
      );
    }, 1000);
  }
  
  private initializeTokens() {
    // Update tokens setup with actual contract addresses from Base Sepolia testnet
    const initialTokens: InsertToken[] = [
      {
        symbol: "PRIOR",
        name: "Prior Protocol Token",
        address: "0xBc8697476a56679534b15994C0f1122556bBF9F4", // Real PRIOR token address
        decimals: 18,
        logoColor: "#1A5CFF"
      },
      {
        symbol: "USDC",
        name: "Mock USD Coin",
        address: "0xc6d67115Cf17A55F9F22D29b955654A7c96781C5", // Real mUSDC address
        decimals: 6,
        logoColor: "#2775CA"
      },
      {
        symbol: "USDT",
        name: "Mock Tether",
        address: "0x2B744c80C4895fDC2003108E186aBD7613c0ec7E", // Consistent USDT address
        decimals: 6,
        logoColor: "#26A17B"
      }
      // Removing DAI and WETH as they're not needed in the updated contracts
    ];
    
    initialTokens.forEach(token => {
      this.createToken(token);
    });
  }
  
  private initializeQuests() {
    const initialQuests: InsertQuest[] = [
      {
        title: "Daily Swap Quest",
        description: "Complete swaps to earn 0.5 Prior points per swap, up to 5 swaps daily (max 2.5 points/day, convertible to PRIOR at TGE).",
        reward: 0.5,
        difficulty: "Beginner",
        status: "active",
        icon: "exchange-alt"
      },
      {
        title: "Governance Participation",
        description: "Participate in governance proposals to help shape the future of Prior Protocol (feature coming soon).",
        reward: 0,
        difficulty: "Intermediate",
        status: "active",
        icon: "vote-yea"
      },
      {
        title: "Liquidity Provider",
        description: "Add liquidity to a trading pair to support the Protocol ecosystem (feature coming soon).",
        reward: 0,
        difficulty: "Advanced",
        status: "coming_soon",
        icon: "chart-line"
      }
    ];
    
    initialQuests.forEach(quest => {
      this.createQuest(quest);
    });
  }
  
  private initializeProposals() {
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
    
    initialProposals.forEach(async proposal => {
      const createdProposal = await this.createProposal(proposal);
      // Add some initial votes
      await this.updateProposalVotes(createdProposal.id, 'yes', 65);
      await this.updateProposalVotes(createdProposal.id, 'no', 35);
    });
  }
  
  private async initializeSampleData() {
    // Create a demo user if not exists
    const demoUserAddress = "0xf4b08b6c0401c9568f3f3abf2a10c2950df98eae";
    const demoUser = this.usersByAddress.get(demoUserAddress);
    
    if (!demoUser) {
      console.log("Creating demo user and sample transaction data");
      const now = new Date();
      const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Create main demo user
      const user = await this.createUser({ 
        address: demoUserAddress, 
        lastClaim: twelveHoursAgo 
      });
      
      // First create a user to ensure it exists in our in-memory database
      if (user && user.id) {
        // Add sample transactions - faucet claim transaction
        await this.createTransaction({
          userId: user.id,
          type: 'faucet_claim',
          fromToken: null,
          toToken: 'PRIOR',
          fromAmount: null,
          toAmount: '1',
          txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
          status: 'completed',
          blockNumber: 123456
        });
        
        // Sample swap transaction - PRIOR to USDC
        await this.createTransaction({
          userId: user.id,
          type: 'swap',
          fromToken: 'PRIOR',
          toToken: 'USDC',
          fromAmount: '0.1',
          toAmount: '1',
          txHash: '0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef',
          status: 'completed',
          blockNumber: 123457
        });
        
        // Sample swap transaction - USDC to USDT
        await this.createTransaction({
          userId: user.id,
          type: 'swap',
          fromToken: 'USDC',
          toToken: 'USDT',
          fromAmount: '5',
          toAmount: '5',
          txHash: '0xaabbccddeeff11223344556677889900aabbccddeeff1122334455667788990',
          status: 'completed',
          blockNumber: 123458
        });
        
        // Now create additional leaderboard users
        const additionalUsers = [
          { address: "0x57c4e8d937f2f63b15619f75b9475e0b7c1bdcac", points: 25.0 },
          { address: "0xc1c85e7fde7d1aab88da17e6f4e5d4178d4537fd", points: 15.0 },
          { address: "0xb788e62f7f29ba4ed9838d527036a8e8fc09a234", points: 10.0 },
          { address: "0x1bf4bd3e75c0119da5a4e2b5eb89c927cb6e8933", points: 9.0 },
          { address: "0x29f92d12237f4be8fd1db28c35eef9a99e425038", points: 8.0 },
          { address: "0x3f349bbafec1551819b8be1efea2fc46ca749aa1", points: 7.0 },
          { address: "0x9e42e938dee47bbe167b02d92da6d81351055ffc", points: 6.0 },
          { address: "0x2ddc1dc61ad5a84e8f27bea32db85d2b212ce81e", points: 5.5 },
          { address: "0x4cfc531df94339def7dcd603aac1a1d2e63569da", points: 5.0 },
          { address: "0x63abbc5e9c197fbc3c57bc378667b92e79d8e656", points: 3.5 },
          { address: "0x789c7d9a896d194da6e438fb68239db7cb2fd1e5", points: 3.0 },
          { address: "0x56e9ae915938da26bdc02e23f20f6a3ce3ae3a78", points: 2.0 },
          { address: "0x12a83136a82a35bf73a117c5c19e7e83d7eb3a93", points: 1.0 }
        ];
        
        for (const additionalUser of additionalUsers) {
          const user = await this.createUser({
            address: additionalUser.address,
            lastClaim: new Date(now.getTime() - Math.random() * 48 * 60 * 60 * 1000)
          });
          
          if (user) {
            // Set points directly
            user.points = additionalUser.points;
            user.totalSwaps = Math.round(additionalUser.points * 2); // Approximate swap count
            user.totalClaims = Math.round(additionalUser.points / 5); // Approximate claim count
            
            // Update user in both maps
            this.users.set(user.id, user);
            this.usersByAddress.set(user.address, user);
            
            // Add a sample transaction to make it realistic
            await this.createTransaction({
              userId: user.id,
              type: 'swap',
              fromToken: 'PRIOR',
              toToken: 'USDC',
              fromAmount: (Math.random() * 10).toFixed(2),
              toAmount: (Math.random() * 20).toFixed(2),
              txHash: `0x${user.id}swap${Math.random().toString(16).substring(2)}`,
              status: 'completed',
              blockNumber: 123400 + Math.floor(Math.random() * 100)
            });
          }
        }
      }
    }
  }
  
  // User operations
  async getUser(address: string): Promise<User | undefined> {
    return this.usersByAddress.get(address);
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async createUser(user: InsertUser): Promise<User> {
    const id = this.userId++;
    const newUser: User = { 
      ...user, 
      id,
      lastClaim: user.lastClaim || null, // Ensure lastClaim is always defined
      badges: [],
      totalSwaps: 0,
      totalClaims: 0,
      points: 0
    };
    
    this.users.set(id, newUser);
    this.usersByAddress.set(user.address, newUser);
    
    return newUser;
  }
  
  async updateUserLastClaim(address: string): Promise<User | undefined> {
    const user = this.usersByAddress.get(address);
    if (!user) return undefined;
    
    const updatedUser: User = { 
      ...user, 
      lastClaim: new Date() 
    };
    
    this.users.set(user.id, updatedUser);
    this.usersByAddress.set(address, updatedUser);
    
    // Increment claim count and add points when a user claims from the faucet
    await this.incrementUserClaimCount(user.id);
    
    return updatedUser;
  }
  
  async getUserBadges(userId: number): Promise<string[]> {
    const user = this.users.get(userId);
    if (!user) return [];
    
    return (user.badges as string[]) || [];
  }
  
  async addUserBadge(userId: number, badgeId: string): Promise<string[]> {
    const user = this.users.get(userId);
    if (!user) return [];
    
    const currentBadges = (user.badges as string[]) || [];
    
    // If the badge is already in the list, just return the current badges
    if (currentBadges.includes(badgeId)) {
      return currentBadges;
    }
    
    // Add the new badge
    const newBadges = [...currentBadges, badgeId];
    
    // Update the user with the new badges
    const updatedUser: User = {
      ...user,
      badges: newBadges
    };
    
    this.users.set(userId, updatedUser);
    this.usersByAddress.set(user.address, updatedUser);
    
    return newBadges;
  }
  
  async incrementUserSwapCount(userId: number): Promise<number> {
    const user = this.users.get(userId);
    if (!user) return 0;
    
    const currentSwapsCount = user.totalSwaps || 0;
    const newSwapCount = currentSwapsCount + 1;
    
    // Update the user with the new swap count
    const updatedUser: User = {
      ...user,
      totalSwaps: newSwapCount
    };
    
    this.users.set(userId, updatedUser);
    this.usersByAddress.set(user.address, updatedUser);
    
    // Get current daily swap count
    const dailySwapCount = await this.getDailySwapCount(userId);
    
    // NEW SIMPLIFIED POINTS SYSTEM:
    // Award 0.5 points for each of the first 5 swaps per day (max 2.5 points daily)
    const MAX_DAILY_SWAPS_FOR_POINTS = 5;
    const POINTS_PER_SWAP = 0.5;
    
    let pointsToAdd = 0;
    
    // Award points only for first 5 swaps each day
    if (dailySwapCount <= MAX_DAILY_SWAPS_FOR_POINTS) {
      pointsToAdd = POINTS_PER_SWAP;
      console.log(`[PointsSystem] Awarded ${POINTS_PER_SWAP} points for swap #${dailySwapCount} to user ${userId}`);
    } else {
      console.log(`[PointsSystem] No points for swap #${dailySwapCount} - max ${MAX_DAILY_SWAPS_FOR_POINTS} swaps per day for user ${userId}`);
    }
    
    if (pointsToAdd > 0) {
      await this.addUserPoints(userId, pointsToAdd);
    }
    
    return newSwapCount;
  }
  
  async incrementUserClaimCount(userId: number): Promise<number> {
    const user = this.users.get(userId);
    if (!user) return 0;
    
    const currentClaims = user.totalClaims || 0;
    const newClaimCount = currentClaims + 1;
    
    // Update the user with the new claim count
    const updatedUser: User = {
      ...user,
      totalClaims: newClaimCount
    };
    
    this.users.set(userId, updatedUser);
    this.usersByAddress.set(user.address, updatedUser);
    
    // Under the NEW SIMPLIFIED points system, faucet claims don't award points anymore
    // Only the first 5 swaps each day award 0.5 points each
    console.log(`[PointsSystem] No points awarded for faucet claim by user ${userId} under new points system`);
    
    return newClaimCount;
  }
  
  async addUserPoints(userId: number, points: number): Promise<number> {
    const user = this.users.get(userId);
    if (!user) return 0;
    
    const currentPoints = user.points || 0;
    const newPoints = currentPoints + points;
    
    // Update the user with the new points
    const updatedUser: User = {
      ...user,
      points: newPoints
    };
    
    this.users.set(userId, updatedUser);
    this.usersByAddress.set(user.address, updatedUser);
    
    return newPoints;
  }
  
  // Implement recalculatePointsForUser for MemStorage
  async recalculatePointsForUser(userId: number): Promise<number> {
    console.log(`[MemStorage] Recalculating points for user ${userId}`);
    const user = this.users.get(userId);
    if (!user) {
      console.log(`[MemStorage] User ${userId} not found for recalculation`);
      return 0;
    }
    
    const swapTransactions = Array.from(this.transactions.values())
      .filter(tx => 
        tx.userId === userId && 
        tx.type === 'swap' && 
        tx.status === 'completed'
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Group transactions by day for points calculation (max 5 swaps per day at 0.5 points each)
    const transactionsByDay: Record<string, Transaction[]> = {};
    
    for (const tx of swapTransactions) {
      const txDate = new Date(tx.timestamp);
      const day = txDate.toISOString().substring(0, 10); // YYYY-MM-DD
      
      if (!transactionsByDay[day]) {
        transactionsByDay[day] = [];
      }
      
      transactionsByDay[day].push(tx);
    }
    
    // Calculate points: 0.5 per swap, max 5 swaps per day
    let newPoints = 0;
    let totalPointEarningSwaps = 0;
    
    for (const day in transactionsByDay) {
      const daySwaps = transactionsByDay[day];
      // Only count the first 5 swaps each day toward points
      const pointSwapsForDay = Math.min(daySwaps.length, 5);
      
      totalPointEarningSwaps += pointSwapsForDay;
      const pointsForDay = pointSwapsForDay * 0.5; // 0.5 points per swap
      
      console.log(`[MemStorage] User ${userId} earned ${pointsForDay.toFixed(1)} points from ${pointSwapsForDay} swaps on ${day}`);
      newPoints += pointsForDay;
    }
    
    // Round to 1 decimal place
    newPoints = Math.round(newPoints * 10) / 10;
    
    // Update user with new points
    const updatedUser: User = {
      ...user,
      points: newPoints,
      totalSwaps: swapTransactions.length
    };
    
    this.users.set(userId, updatedUser);
    this.usersByAddress.set(user.address, updatedUser);
    
    console.log(`[MemStorage] Recalculated points for user ${userId}: ${newPoints} points`);
    return newPoints;
  }
  
  async removePointsForFaucetClaims(): Promise<number> {
    console.log("[PointsSystem] Starting removal of all points from faucet claims");
    
    let totalPointsRemoved = 0;
    let usersUpdated = 0;
    
    // Find all faucet claim transactions first to identify affected users
    const faucetClaimTransactions = Array.from(this.transactions.values())
      .filter(tx => tx.type === 'faucet_claim');
    
    // Group transactions by userId to count the number of faucet claims per user
    const userFaucetClaims = new Map<number, number>();
    
    for (const tx of faucetClaimTransactions) {
      const userId = tx.userId;
      const currentCount = userFaucetClaims.get(userId) || 0;
      userFaucetClaims.set(userId, currentCount + 1);
    }
    
    // For each user with faucet claims, deduct 1 point per claim
    for (const [userId, claimCount] of userFaucetClaims.entries()) {
      const user = this.users.get(userId);
      if (!user) continue;
      
      const currentPoints = user.points || 0;
      const pointsToDeduct = claimCount; // 1 point per faucet claim
      const newPoints = Math.max(0, currentPoints - pointsToDeduct); // Ensure points don't go below 0
      
      // Update the user with the adjusted points
      const updatedUser: User = {
        ...user,
        points: newPoints
      };
      
      this.users.set(userId, updatedUser);
      this.usersByAddress.set(user.address, updatedUser);
      
      totalPointsRemoved += (currentPoints - newPoints);
      usersUpdated++;
      
      console.log(`[PointsSystem] Removed ${currentPoints - newPoints} points from user ${userId} (${user.address}) for ${claimCount} faucet claims`);
    }
    
    console.log(`[PointsSystem] Completed removal of ${totalPointsRemoved} total points from ${usersUpdated} users`);
    return totalPointsRemoved;
  }
  
  async getTotalUsersCount(): Promise<{ count: number }> {
    return { count: this.users.size };
  }
  
  async getLeaderboard(limit: number = 15, page: number = 1): Promise<{
    users: User[],
    totalGlobalPoints: number
  }> {
    // Get all users and sort by points (highest first)
    const allSortedUsers = Array.from(this.users.values())
      .sort((a, b) => (b.points || 0) - (a.points || 0));
    
    const total = allSortedUsers.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const safePage = Math.min(Math.max(1, page), totalPages);
    
    // Calculate start and end indices for pagination
    const startIdx = (safePage - 1) * limit;
    const endIdx = Math.min(startIdx + limit, total);
    
    // Get users for the current page
    const paginatedUsers = allSortedUsers.slice(startIdx, endIdx);
    
    // Calculate total global points across all users
    const totalGlobalPoints = allSortedUsers.reduce((sum, user) => sum + (user.points || 0), 0);
    
    return {
      users: paginatedUsers,
      totalGlobalPoints
    };
  }
  
  async getUserRank(address: string): Promise<number | null> {
    if (!address) return null;
    
    // Normalize address
    const normalizedAddress = address.toLowerCase();
    
    // Get all users sorted by points 
    const allSortedUsers = Array.from(this.users.values())
      .sort((a, b) => (b.points || 0) - (a.points || 0));
    
    // Find the index of the user
    const userIndex = allSortedUsers.findIndex(
      user => user.address.toLowerCase() === normalizedAddress
    );
    
    // Return the rank (index + 1) or null if not found
    return userIndex !== -1 ? userIndex + 1 : null;
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
    const user = this.users.get(userId);
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
    
    // Count of faucet claims
    const totalFaucetClaims = user.totalClaims || 0;
    
    // Get total swaps from user object
    const totalSwaps = user.totalSwaps || 0;
    
    // Count completed quests for this user
    const userQuests = Array.from(this.userQuests.values()).filter(
      uq => uq.userId === userId
    );
    const completedQuests = userQuests.filter(uq => uq.status === 'completed').length;
    
    // Get total number of quests
    const totalQuests = this.quests.size;
    
    // Count proposals voted on by this user
    const proposalsVoted = Array.from(this.votes.values()).filter(
      v => v.userId === userId
    ).length;
    
    // For this example, we're not tracking who created proposals, so it's 0
    const proposalsCreated = 0;
    
    // Get user points
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
    return Array.from(this.quests.values());
  }
  
  async getQuest(id: number): Promise<Quest | undefined> {
    return this.quests.get(id);
  }
  
  async createQuest(quest: InsertQuest): Promise<Quest> {
    const id = this.questId++;
    const newQuest: Quest = { 
      ...quest, 
      id,
      status: quest.status || 'active' // Ensure status is always defined
    };
    
    this.quests.set(id, newQuest);
    
    return newQuest;
  }
  
  // User Quest operations
  async getUserQuests(userId: number): Promise<UserQuest[]> {
    return Array.from(this.userQuests.values()).filter(uq => uq.userId === userId);
  }
  
  async createUserQuest(userQuest: InsertUserQuest): Promise<UserQuest> {
    const id = this.userQuestId++;
    const newUserQuest: UserQuest = { 
      ...userQuest, 
      id, 
      status: userQuest.status || 'pending', // Ensure status is always defined
      completedAt: null 
    };
    
    this.userQuests.set(id, newUserQuest);
    
    return newUserQuest;
  }
  
  async updateUserQuestStatus(id: number, status: string): Promise<UserQuest | undefined> {
    const userQuest = this.userQuests.get(id);
    if (!userQuest) return undefined;
    
    const updatedUserQuest: UserQuest = { 
      ...userQuest, 
      status, 
      completedAt: status === 'completed' ? new Date() : userQuest.completedAt 
    };
    
    this.userQuests.set(id, updatedUserQuest);
    
    return updatedUserQuest;
  }
  
  // Proposal operations
  async getAllProposals(): Promise<Proposal[]> {
    return Array.from(this.proposals.values());
  }
  
  async getProposal(id: number): Promise<Proposal | undefined> {
    return this.proposals.get(id);
  }
  
  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const id = this.proposalId++;
    const newProposal: Proposal = { 
      ...proposal, 
      id,
      status: proposal.status || 'active', // Ensure status is always defined
      yesVotes: 0,
      noVotes: 0
    };
    
    this.proposals.set(id, newProposal);
    
    return newProposal;
  }
  
  async updateProposalVotes(id: number, voteType: string, increment: number): Promise<Proposal | undefined> {
    const proposal = this.proposals.get(id);
    if (!proposal) return undefined;
    
    let updatedProposal: Proposal;
    
    if (voteType === 'yes') {
      updatedProposal = { ...proposal, yesVotes: proposal.yesVotes + increment };
    } else {
      updatedProposal = { ...proposal, noVotes: proposal.noVotes + increment };
    }
    
    this.proposals.set(id, updatedProposal);
    
    return updatedProposal;
  }
  
  // Vote operations
  async getUserVote(userId: number, proposalId: number): Promise<Vote | undefined> {
    return Array.from(this.votes.values()).find(
      vote => vote.userId === userId && vote.proposalId === proposalId
    );
  }
  
  async createVote(vote: InsertVote): Promise<Vote> {
    const id = this.voteId++;
    const newVote: Vote = { 
      ...vote, 
      id,
      votedAt: new Date()
    };
    
    this.votes.set(id, newVote);
    
    // Update the proposal's vote count
    await this.updateProposalVotes(vote.proposalId, vote.vote, 1);
    
    // Under the NEW SIMPLIFIED POINTS SYSTEM, votes don't award points
    // Only the first 5 swaps each day award 0.5 points each
    console.log(`[PointsSystem] No points awarded for vote by user ${vote.userId} under new points system`);
    
    // No additional points for Pioneer NFT holders under new system either
    console.log(`[PointsSystem] No bonus points for Pioneer NFT under new points system`);
    
    return newVote;
  }
  
  // Token operations
  async getAllTokens(): Promise<Token[]> {
    return Array.from(this.tokens.values());
  }
  
  async getToken(symbol: string): Promise<Token | undefined> {
    return this.tokensBySymbol.get(symbol);
  }
  
  async createToken(token: InsertToken): Promise<Token> {
    const id = this.tokenId++;
    const newToken: Token = { ...token, id };
    
    this.tokens.set(id, newToken);
    this.tokensBySymbol.set(token.symbol, newToken);
    
    return newToken;
  }
  
  // Transaction operations
  async getUserTransactions(userId: number, page: number = 1, limit: number = 10): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    hasMore: boolean;
  }> {
    const allTransactions = Array.from(this.transactions.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Enforce a hard limit of 50 for maximum historical transactions
    const maxTransactions = allTransactions.slice(0, 50);
    const total = maxTransactions.length;
    
    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, total);
    const paginatedTransactions = maxTransactions.slice(startIndex, endIndex);
    
    return {
      transactions: paginatedTransactions,
      total,
      page,
      hasMore: endIndex < total
    };
  }
  
  async getUserTransactionsByType(userId: number, type: string, page: number = 1, limit: number = 10): Promise<{
    transactions: Transaction[];
    total: number;
    page: number;
    hasMore: boolean;
  }> {
    const allTransactions = Array.from(this.transactions.values())
      .filter(tx => tx.userId === userId && tx.type === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Enforce a hard limit of 50 for maximum historical transactions
    const maxTransactions = allTransactions.slice(0, 50);
    const total = maxTransactions.length;
    
    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, total);
    const paginatedTransactions = maxTransactions.slice(startIndex, endIndex);
    
    return {
      transactions: paginatedTransactions,
      total,
      page,
      hasMore: endIndex < total
    };
  }
  
  // Method to get points awarded for a transaction
  async getTransactionPoints(transaction: Transaction): Promise<number> {
    if (transaction.type !== 'swap') return 0;
    
    // Get all swaps by this user on the same day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const userSwapsToday = Array.from(this.transactions.values())
      .filter(tx => 
        tx.userId === transaction.userId && 
        tx.type === 'swap' &&
        new Date(tx.timestamp) >= todayStart
      );
    
    // Count how many swaps the user has made today
    const swapCountToday = userSwapsToday.length;
    
    // NEW SIMPLIFIED POINTS SYSTEM:
    // Award 0.5 points for each of the first 5 swaps per day (max 2.5 points daily)
    const MAX_DAILY_SWAPS_FOR_POINTS = 5;
    const POINTS_PER_SWAP = 0.5;
    
    // Only award points if this is one of the first 5 swaps
    if (swapCountToday <= MAX_DAILY_SWAPS_FOR_POINTS) {
      return POINTS_PER_SWAP;
    }
    
    // No points for swaps beyond the daily limit
    return 0;
  }
  
  // Method to get daily swap count for a user
  async getDailySwapCount(userId: number): Promise<number> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const userSwapsToday = Array.from(this.transactions.values())
      .filter(tx => 
        tx.userId === userId && 
        tx.type === 'swap' &&
        new Date(tx.timestamp) >= todayStart
      );
    
    return userSwapsToday.length;
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
    const user = this.users.get(userId);
    if (!user) {
      return {
        periods: [],
        pointsData: [],
        swapData: [],
        totalPoints: 0,
        currentPoints: 0,
      };
    }
    
    // Current points from user record (this is the single source of truth for points)
    const currentPoints = user.points || 0;
    
    // Set time range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case 'day':
        // Last 24 hours
        startDate = new Date(now);
        startDate.setHours(now.getHours() - 24);
        break;
        
      case 'week':
        // Last 7 days
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
        
      case 'month':
        // Last 30 days
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 30);
        break;
        
      case 'all':
      default:
        // All time (from beginning of year)
        startDate = new Date('2024-01-01');
        break;
    }
    
    // Get all swap transactions for the specified time range
    const swapTransactions = Array.from(this.transactions.values())
      .filter(tx => 
        tx.userId === userId && 
        tx.type === 'swap' && 
        new Date(tx.timestamp) >= startDate
      )
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    // Group transactions by date and distribute points per period
    const periodData: Record<string, { points: number, swaps: number }> = {};
    const periodTracker: Record<string, Record<string, { swaps: number, points: number }>> = {};
    const allPeriods: Set<string> = new Set();
    
    // First pass: count swaps per day and track which ones would earn points
    // (without assigning points yet)
    const dailySwaps: Record<string, { swaps: number, pointSwaps: number }> = {};
    
    for (const tx of swapTransactions) {
      const txDate = new Date(tx.timestamp);
      const txDay = txDate.toISOString().substring(0, 10); // YYYY-MM-DD
      
      if (!dailySwaps[txDay]) {
        dailySwaps[txDay] = { swaps: 0, pointSwaps: 0 };
      }
      
      dailySwaps[txDay].swaps++;
      
      // Only the first 5 swaps per day earn points
      if (dailySwaps[txDay].swaps <= 5) {
        dailySwaps[txDay].pointSwaps++;
      }
    }
    
    // Total up pointSwaps (swaps that earned points)
    const totalPointSwaps = Object.values(dailySwaps).reduce((sum, day) => sum + day.pointSwaps, 0);
    
    // Calculate how many points should be assigned per swap that earned points
    const pointsPerEarningSwap = totalPointSwaps > 0 ? currentPoints / totalPointSwaps : 0;
    
    // Second pass: distribute points to periods based on the calculated rate
    for (const tx of swapTransactions) {
      const txDate = new Date(tx.timestamp);
      const txDay = txDate.toISOString().substring(0, 10); // YYYY-MM-DD
      
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
        periodTracker[periodKey] = {};
      }
      
      // Initialize day tracker
      if (!periodTracker[periodKey][txDay]) {
        periodTracker[periodKey][txDay] = { swaps: 0, points: 0 };
      }
      
      // Count all swaps
      periodData[periodKey].swaps += 1;
      periodTracker[periodKey][txDay].swaps += 1;
      
      // But only add points for the first 5 swaps of each day
      const daySwapCount = periodTracker[periodKey][txDay].swaps;
      if (daySwapCount <= 5) {
        // Distribution based on user's actual points (ensuring the display matches reality)
        periodData[periodKey].points += pointsPerEarningSwap;
        periodTracker[periodKey][txDay].points += pointsPerEarningSwap;
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
    
    // We use currentPoints as the source of truth for totalPoints 
    // to ensure consistency between displayed values and actual user points
    const totalPoints = currentPoints;
    
    // Round point values to 1 decimal place for display
    const roundedPointsData = pointsData.map(points => Math.round(points * 10) / 10);
    
    return {
      periods,
      pointsData: roundedPointsData,
      swapData,
      totalPoints,
      currentPoints
    };
  }
  
  async createTransaction(transaction: InsertTransaction): Promise<Transaction> {
    const id = this.transactionId++;
    const newTransaction: Transaction = {
      ...transaction,
      id,
      timestamp: new Date(),
      status: transaction.status || 'completed',
      // Ensure all nullable fields have proper default values
      fromToken: transaction.fromToken || null,
      toToken: transaction.toToken || null,
      fromAmount: transaction.fromAmount || null,
      toAmount: transaction.toAmount || null,
      blockNumber: transaction.blockNumber || null,
      points: transaction.points !== undefined ? transaction.points : null
    };
    
    this.transactions.set(id, newTransaction);
    
    return newTransaction;
  }
  
  // Removed duplicate getTransactionPoints method - using the one defined above
  
  // Quiz feature initialization
  private initializeQuizzes() {
    const initialQuizzes: InsertQuiz[] = [
      {
        title: "Blockchain Basics",
        description: "Test your knowledge of fundamental blockchain concepts and technology.",
        difficulty: "beginner",
        category: "blockchain",
        pointsReward: 5,
        status: "active"
      },
      {
        title: "DeFi Fundamentals",
        description: "Learn about decentralized finance and how it's revolutionizing financial systems.",
        difficulty: "intermediate",
        category: "defi",
        pointsReward: 8,
        status: "active"
      },
      {
        title: "Prior Protocol Deep Dive",
        description: "Understand the technical aspects and vision behind Prior Protocol.",
        difficulty: "advanced",
        category: "prior",
        pointsReward: 10,
        status: "active"
      }
    ];
    
    // Create the quizzes and add questions to each
    initialQuizzes.forEach(async quiz => {
      const createdQuiz = await this.createQuiz(quiz);
      
      // Add questions based on quiz category
      if (quiz.category === "blockchain") {
        await this.createQuizQuestion({
          quizId: createdQuiz.id,
          question: "What is a blockchain?",
          options: [
            "A centralized database managed by banks",
            "A distributed ledger technology",
            "A programming language for smart contracts",
            "A type of cryptocurrency"
          ],
          correctOptionIndex: 1,
          explanation: "A blockchain is a distributed ledger technology that records transactions across many computers.",
          points: 1,
          order: 1
        });
        
        await this.createQuizQuestion({
          quizId: createdQuiz.id,
          question: "What is the purpose of consensus mechanisms in blockchain?",
          options: [
            "To encrypt transactions",
            "To accelerate transaction speed",
            "To agree on the state of the blockchain",
            "To reduce transaction fees"
          ],
          correctOptionIndex: 2,
          explanation: "Consensus mechanisms ensure all nodes in the network agree on the current state of the blockchain.",
          points: 1,
          order: 2
        });
        
        await this.createQuizQuestion({
          quizId: createdQuiz.id,
          question: "What makes blockchain technology secure?",
          options: [
            "Government regulations",
            "Bank oversight",
            "Cryptographic hashing and decentralization",
            "Insurance policies"
          ],
          correctOptionIndex: 2,
          explanation: "Blockchain security comes from cryptographic hashing and its decentralized nature.",
          points: 1,
          order: 3
        });
        
        await this.createQuizQuestion({
          quizId: createdQuiz.id,
          question: "What is a smart contract?",
          options: [
            "A legal agreement between two parties",
            "Self-executing code on a blockchain",
            "A contract managed by AI",
            "A document signed digitally"
          ],
          correctOptionIndex: 1,
          explanation: "Smart contracts are self-executing code that run on blockchain platforms when predetermined conditions are met.",
          points: 1,
          order: 4
        });
        
        await this.createQuizQuestion({
          quizId: createdQuiz.id,
          question: "What is the Base layer-2 solution built on?",
          options: [
            "Bitcoin",
            "Solana",
            "Ethereum",
            "Cardano"
          ],
          correctOptionIndex: 2,
          explanation: "Base is a layer-2 solution built on Ethereum, focusing on scaling and reducing transaction costs.",
          points: 1,
          order: 5
        });
      } 
      else if (quiz.category === "defi") {
        await this.createQuizQuestion({
          quizId: createdQuiz.id,
          question: "What does DeFi stand for?",
          options: [
            "Digital Finance",
            "Decentralized Finance",
            "Distributed Funding",
            "Direct Financial Instruments"
          ],
          correctOptionIndex: 1,
          explanation: "DeFi stands for Decentralized Finance, which aims to recreate traditional financial systems in a decentralized manner.",
          points: 1,
          order: 1
        });
        
        await this.createQuizQuestion({
          quizId: createdQuiz.id,
          question: "What is an AMM in DeFi?",
          options: [
            "Automated Money Market",
            "Automated Market Maker",
            "Asset Management Module",
            "Algorithmic Mining Mechanism"
          ],
          correctOptionIndex: 1,
          explanation: "AMM stands for Automated Market Maker, which uses liquidity pools instead of traditional order books.",
          points: 1,
          order: 2
        });
        
        await this.createQuizQuestion({
          quizId: createdQuiz.id,
          question: "What is the primary purpose of a stablecoin?",
          options: [
            "To increase in value over time",
            "To maintain price stability relative to an asset",
            "To replace traditional cryptocurrencies",
            "To provide staking rewards"
          ],
          correctOptionIndex: 1,
          explanation: "Stablecoins are designed to maintain price stability relative to a reference asset, often a fiat currency like USD.",
          points: 1,
          order: 3
        });
      } 
      else if (quiz.category === "prior") {
        await this.createQuizQuestion({
          quizId: createdQuiz.id,
          question: "What is Prior Protocol primarily designed to do?",
          options: [
            "Create NFTs",
            "Mine cryptocurrencies",
            "Streamline DeFi experiences and create simplified financial primitives",
            "Replace traditional banking"
          ],
          correctOptionIndex: 2,
          explanation: "Prior Protocol aims to streamline DeFi experiences and create simplified financial primitives for users.",
          points: 1,
          order: 1
        });
        
        await this.createQuizQuestion({
          quizId: createdQuiz.id,
          question: "What blockchain is the Prior Protocol testnet built on?",
          options: [
            "Ethereum Mainnet",
            "Base Sepolia",
            "Solana",
            "Polygon"
          ],
          correctOptionIndex: 1,
          explanation: "Prior Protocol's testnet is built on Base Sepolia, which is a layer-2 testnet on Ethereum.",
          points: 1,
          order: 2
        });
        
        await this.createQuizQuestion({
          quizId: createdQuiz.id,
          question: "What benefit do users get for earning points on the Prior Protocol testnet?",
          options: [
            "Immediate cash rewards",
            "NFT airdrops",
            "Points convertible to PRIOR tokens at Token Generation Event (TGE)",
            "Governance rights"
          ],
          correctOptionIndex: 2,
          explanation: "Users earn points on the testnet that will be convertible to PRIOR tokens at the Token Generation Event (TGE).",
          points: 1,
          order: 3
        });
      }
    });
  }
  
  // Quiz operations
  async getAllQuizzes(): Promise<Quiz[]> {
    return Array.from(this.quizzes.values());
  }
  
  async getQuiz(id: number): Promise<Quiz | undefined> {
    return this.quizzes.get(id);
  }
  
  async createQuiz(quiz: InsertQuiz): Promise<Quiz> {
    const id = this.quizId++;
    const now = new Date();
    
    const newQuiz: Quiz = {
      ...quiz,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.quizzes.set(id, newQuiz);
    return newQuiz;
  }
  
  // Quiz Question operations
  async getQuizQuestions(quizId: number): Promise<QuizQuestion[]> {
    return Array.from(this.quizQuestions.values())
      .filter(question => question.quizId === quizId)
      .sort((a, b) => a.order - b.order);
  }
  
  async getQuizQuestion(id: number): Promise<QuizQuestion | undefined> {
    return this.quizQuestions.get(id);
  }
  
  async createQuizQuestion(question: InsertQuizQuestion): Promise<QuizQuestion> {
    const id = this.quizQuestionId++;
    
    const newQuestion: QuizQuestion = {
      ...question,
      id
    };
    
    this.quizQuestions.set(id, newQuestion);
    return newQuestion;
  }
  
  // User Quiz operations
  async getUserQuizzes(userId: number): Promise<UserQuiz[]> {
    return Array.from(this.userQuizzes.values())
      .filter(userQuiz => userQuiz.userId === userId);
  }
  
  async getUserQuiz(id: number): Promise<UserQuiz | undefined> {
    return this.userQuizzes.get(id);
  }
  
  async getUserQuizByUserAndQuizId(userId: number, quizId: number): Promise<UserQuiz | undefined> {
    return Array.from(this.userQuizzes.values())
      .find(userQuiz => userQuiz.userId === userId && userQuiz.quizId === quizId);
  }
  
  async createUserQuiz(userQuiz: InsertUserQuiz): Promise<UserQuiz> {
    const id = this.userQuizId++;
    const startedAt = new Date();
    
    const newUserQuiz: UserQuiz = {
      ...userQuiz,
      id,
      startedAt,
      completedAt: null,
      answers: []
    };
    
    this.userQuizzes.set(id, newUserQuiz);
    return newUserQuiz;
  }
  
  async updateUserQuiz(id: number, updates: Partial<Omit<UserQuiz, 'id'>>): Promise<UserQuiz | undefined> {
    const userQuiz = this.userQuizzes.get(id);
    if (!userQuiz) return undefined;
    
    const updatedUserQuiz: UserQuiz = {
      ...userQuiz,
      ...updates
    };
    
    // If completing the quiz, award points and add badge if applicable
    if (updates.status === 'completed' && userQuiz.status !== 'completed') {
      // Award points for completing the quiz
      const quiz = await this.getQuiz(userQuiz.quizId);
      if (quiz) {
        const pointsEarned = Math.round((updatedUserQuiz.score / updatedUserQuiz.maxScore) * quiz.pointsReward);
        updatedUserQuiz.pointsEarned = pointsEarned;
        
        // Add points to user
        if (pointsEarned > 0) {
          await this.addUserPoints(userQuiz.userId, pointsEarned);
          console.log(`[PointsSystem] Awarded ${pointsEarned} points to user ${userQuiz.userId} for completing quiz ${quiz.id}`);
        }
        
        // If user scored 100%, award a badge
        if (updatedUserQuiz.score === updatedUserQuiz.maxScore) {
          const badgeId = `quiz_master_${quiz.id}`;
          await this.addUserBadge(userQuiz.userId, badgeId);
          console.log(`[BadgeSystem] Awarded ${badgeId} badge to user ${userQuiz.userId} for perfect quiz score`);
        }
      }
    }
    
    this.userQuizzes.set(id, updatedUserQuiz);
    return updatedUserQuiz;
  }
  
  /**
   * Reset all user points and swap transactions
   * This completely wipes all accumulated points and swap transaction history
   * @returns Statistics about the reset operation
   */
  async resetAllUserPointsAndTransactions(): Promise<{
    usersReset: number;
    transactionsDeleted: number;
    pointsReset: number;
  }> {
    console.log("[PointsSystem] Starting complete reset of all user data, points and transactions");
    
    let usersReset = 0;
    let pointsReset = 0;
    let transactionsDeleted = 0;
    
    // Delete all transactions
    const transactionIds = Array.from(this.transactions.keys());
    for (const id of transactionIds) {
      this.transactions.delete(id);
      transactionsDeleted++;
    }
    
    console.log(`[PointsSystem] Deleted ${transactionsDeleted} total transactions`);
    
    // Delete all users EXCEPT the demo user (for testing)
    const demoUserAddress = "0xf4b08b6c0401c9568f3f3abf2a10c2950df98eae";
    const userIds = Array.from(this.users.keys());
    
    for (const userId of userIds) {
      const user = this.users.get(userId);
      if (!user) continue;
      
      // Track current points for logging
      const currentPoints = user.points || 0;
      
      if (user.address.toLowerCase() === demoUserAddress.toLowerCase()) {
        // Just reset the demo user's points
        user.points = 0;
        user.totalSwaps = 0;
        user.totalClaims = 0;
        
        // Update in both maps
        this.users.set(userId, user);
        this.usersByAddress.set(user.address, user);
        
        console.log(`[PointsSystem] Reset demo user ${userId} (${user.address})`);
      } else {
        // Delete other users completely
        this.users.delete(userId);
        this.usersByAddress.delete(user.address);
        
        console.log(`[PointsSystem] Deleted user ${userId} (${user.address})`);
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
      // 1. Save the demo user for restoration
      const demoUserAddress = "0xf4b08b6c0401c9568f3f3abf2a10c2950df98eae";
      const demoUser = this.usersByAddress.get(demoUserAddress);
      
      // 2. DELETE ALL DATA FROM ALL TABLES
      
      // Delete transactions
      transactionsDeleted = this.transactions.size;
      this.transactions.clear();
      console.log(`[DANGER] Deleted ${transactionsDeleted} transactions`);
      
      // Delete user quests
      userQuestsDeleted = this.userQuests.size;
      this.userQuests.clear();
      console.log(`[DANGER] Deleted ${userQuestsDeleted} user quests`);
      
      // Delete votes
      votesDeleted = this.votes.size;
      this.votes.clear();
      console.log(`[DANGER] Deleted ${votesDeleted} votes`);
      
      // Delete ALL users
      usersDeleted = this.users.size;
      this.users.clear();
      this.usersByAddress.clear();
      console.log(`[DANGER] Deleted ${usersDeleted} users`);
      
      // 3. Recreate the demo user with no points or history
      if (demoUser) {
        const newDemoUser: User = {
          id: 1,
          address: demoUserAddress,
          lastClaim: null,
          points: 0,
          totalSwaps: 0,
          totalClaims: 0,
          badges: [] 
        };
        
        this.users.set(1, newDemoUser);
        this.usersByAddress.set(demoUserAddress, newDemoUser);
        this.userId = 2; // Reset counter for next user
        
        console.log(`[DANGER] Recreated demo user: ${newDemoUser.id} (${newDemoUser.address})`);
      } else {
        // Create a new demo user from scratch
        const newDemoUser: User = {
          id: 1,
          address: demoUserAddress,
          lastClaim: null,
          points: 0,
          totalSwaps: 0,
          totalClaims: 0,
          badges: []
        };
        
        this.users.set(1, newDemoUser);
        this.usersByAddress.set(demoUserAddress, newDemoUser);
        this.userId = 2; // Reset counter for next user
        
        console.log(`[DANGER] Created new demo user: ${newDemoUser.id} (${newDemoUser.address})`);
      }
      
      // 4. Reset all proposal votes to zero
      for (const proposalId of this.proposals.keys()) {
        const proposal = this.proposals.get(proposalId);
        if (proposal) {
          proposal.yesVotes = 0;
          proposal.noVotes = 0;
          proposal.abstainVotes = 0;
          this.proposals.set(proposalId, proposal);
        }
      }
      
      console.log(`[DANGER] Reset all proposal votes to zero`);
      console.log(`[DANGER] COMPLETE DATABASE RESET FINISHED SUCCESSFULLY`);
      
      return {
        usersDeleted,
        transactionsDeleted,
        userQuestsDeleted,
        votesDeleted
      };
    } catch (error) {
      console.error("[DANGER] Error during complete database reset:", error);
      throw error;
    }
  }
  
  /**
   * Recalculates points for all users based on their transaction history
   * Following the rule: 0.5 points per swap, max 5 swaps per day (max 2.5 points daily)
   * @returns Statistics about the recalculation
   */
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
    }> = [];
    
    let totalPointsBefore = 0;
    let totalPointsAfter = 0;
    
    // Process each user
    for (const user of this.users.values()) {
      const userId = user.id;
      const pointsBefore = user.points || 0;
      totalPointsBefore += pointsBefore;
      
      // Get all swap transactions for this user
      const swapTransactions = Array.from(this.transactions.values())
        .filter(tx => tx.userId === userId && tx.type === 'swap')
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      
      // Group transactions by day
      const transactionsByDay: Record<string, Array<Transaction>> = {};
      let pointEarningSwaps = 0;
      
      for (const tx of swapTransactions) {
        const txDate = new Date(tx.timestamp);
        const day = txDate.toISOString().substring(0, 10); // YYYY-MM-DD
        
        if (!transactionsByDay[day]) {
          transactionsByDay[day] = [];
        }
        
        transactionsByDay[day].push(tx);
      }
      
      // Calculate points: 0.5 per swap, max 5 swaps per day
      let newPoints = 0;
      
      for (const day in transactionsByDay) {
        const daySwaps = transactionsByDay[day];
        const pointSwapsForDay = Math.min(daySwaps.length, 5);
        
        pointEarningSwaps += pointSwapsForDay;
        newPoints += pointSwapsForDay * 0.5; // 0.5 points per swap
      }
      
      // Round to 1 decimal place
      newPoints = Math.round(newPoints * 10) / 10;
      
      // Update user with new points
      const updatedUser: User = { 
        ...user, 
        points: newPoints,
        // Update total swaps count as well
        totalSwaps: swapTransactions.length
      };
      
      this.users.set(userId, updatedUser);
      this.usersByAddress.set(user.address, updatedUser);
      
      totalPointsAfter += newPoints;
      
      // Record the user's details for the report
      userDetails.push({
        userId,
        address: user.address,
        pointsBefore,
        pointsAfter: newPoints,
        totalSwaps: swapTransactions.length,
        pointEarningSwaps
      });
      
      console.log(`[PointsSystem] User ${userId} (${user.address.substring(0, 8)}...): ${pointsBefore} points → ${newPoints} points | ${swapTransactions.length} total swaps, ${pointEarningSwaps} earned points`);
    }
    
    console.log(`[PointsSystem] Recalculation complete. Updated ${userDetails.length} users.`);
    console.log(`[PointsSystem] Total points before: ${totalPointsBefore}, after: ${totalPointsAfter}`);
    
    return {
      usersUpdated: userDetails.length,
      totalPointsBefore,
      totalPointsAfter,
      userDetails
    };
  }
}

// Export the MemStorage implementation
export const storage = new MemStorage();
