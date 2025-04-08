import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertVoteSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes prefix
  const apiPrefix = "/api";
  
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
      
      if (!user) {
        user = await storage.createUser({ address, lastClaim: null });
      }
      
      res.json(user);
    } catch (error) {
      res.status(400).json({ message: "Invalid wallet address format" });
    }
  });
  
  // Claim tokens (update last claim time)
  app.post(`${apiPrefix}/claim`, async (req, res) => {
    const addressSchema = z.object({
      address: z.string().min(42).max(42),
    });
    
    try {
      const { address } = addressSchema.parse(req.body);
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
      
      res.json({
        message: "Tokens claimed successfully",
        user: updatedUser,
        nextClaimTime: new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid wallet address format" });
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

  const httpServer = createServer(app);

  return httpServer;
}
