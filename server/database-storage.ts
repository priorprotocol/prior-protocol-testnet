import {
  users, User, InsertUser,
  quests, Quest, InsertQuest,
  userQuests, UserQuest, InsertUserQuest,
  proposals, Proposal, InsertProposal,
  votes, Vote, InsertVote,
  tokens, Token, InsertToken
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
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