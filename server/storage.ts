import {
  users, User, InsertUser,
  quests, Quest, InsertQuest,
  userQuests, UserQuest, InsertUserQuest,
  proposals, Proposal, InsertProposal,
  votes, Vote, InsertVote,
  tokens, Token, InsertToken,
  transactions, Transaction, InsertTransaction
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
  getLeaderboard(limit?: number): Promise<User[]>;
  getUserStats(userId: number): Promise<{
    totalFaucetClaims: number;
    totalSwaps: number;
    completedQuests: number;
    totalQuests: number;
    proposalsVoted: number;
    proposalsCreated: number;
    points: number;
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
    
    this.userId = 1;
    this.questId = 1;
    this.userQuestId = 1;
    this.proposalId = 1;
    this.voteId = 1;
    this.tokenId = 1;
    this.transactionId = 1;
    
    // Initialize with sample tokens
    this.initializeTokens();
    // Initialize with sample quests
    this.initializeQuests();
    // Initialize with sample proposals
    this.initializeProposals();
    
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
        description: "Complete 10+ swaps in a day to earn 2 Prior points per swap (convertible to PRIOR at TGE).",
        reward: 2,
        difficulty: "Beginner",
        status: "active",
        icon: "exchange-alt"
      },
      {
        title: "Governance Participation",
        description: "Participate in governance proposals to earn 10 Prior points per vote (feature coming soon).",
        reward: 10,
        difficulty: "Intermediate",
        status: "active",
        icon: "vote-yea"
      },
      {
        title: "Liquidity Provider",
        description: "Add liquidity to a trading pair to earn 5 Prior Points (convertible at TGE).",
        reward: 5,
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
      
      // Create demo user - await the promise to get the actual user object
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
      }
    }
  }
  
  // User operations
  async getUser(address: string): Promise<User | undefined> {
    return this.usersByAddress.get(address);
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
    
    // Add points according to the reward system:
    // 1. Award 4 points for the first swap of the day
    // 2. Award 2 additional points per swap if user has 10+ swaps per day
    
    let pointsToAdd = 0;
    
    // First swap of the day gets 4 points
    if (dailySwapCount === 1) {
      pointsToAdd = 4;
    }
    // Swaps after reaching 10+ daily swaps get 2 points each
    else if (dailySwapCount >= 10) {
      pointsToAdd = 2;
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
    
    // Award 1 point per faucet claim
    await this.addUserPoints(userId, 1);
    
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
  
  async getLeaderboard(limit: number = 15): Promise<User[]> {
    // Get all users and sort by points (highest first)
    const sortedUsers = Array.from(this.users.values())
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, limit);
    
    return sortedUsers;
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
    
    // Add 10 points for each vote
    await this.addUserPoints(vote.userId, 10);
    
    // Check if user has a Prior Pioneer NFT and award 300 additional points
    // This would normally query the blockchain, but for this demo we'll
    // check if the user has the 'pioneer' badge
    const user = this.users.get(vote.userId);
    const userBadges = user?.badges;
    if (user && userBadges && Array.isArray(userBadges) && userBadges.indexOf('pioneer') >= 0) {
      await this.addUserPoints(vote.userId, 300);
    }
    
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
    
    // Award 4 points for the first swap of the day
    if (swapCountToday === 1) {
      return 4;
    }
    // Award 2 points per swap if user has reached 10+ swaps today
    else if (swapCountToday >= 10) {
      return 2;
    }
    
    // Otherwise, no points
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
}

// Export the MemStorage implementation
export const storage = new MemStorage();
