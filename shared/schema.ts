import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  address: text("address").notNull().unique(),
  lastClaim: timestamp("last_claim"),
  badges: jsonb("badges").default([]).notNull(),  // Array of badge IDs
  totalSwaps: integer("total_swaps").default(0).notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  badges: true,
  totalSwaps: true,
});

// Quests table
export const quests = pgTable("quests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  reward: integer("reward").notNull(),
  difficulty: text("difficulty").notNull(),
  status: text("status").notNull().default("active"),
  icon: text("icon").notNull(),
});

export const insertQuestSchema = createInsertSchema(quests).omit({
  id: true,
});

// User quests progress
export const userQuests = pgTable("user_quests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  questId: integer("quest_id").notNull(),
  status: text("status").notNull().default("in_progress"),
  completedAt: timestamp("completed_at"),
});

export const insertUserQuestSchema = createInsertSchema(userQuests).omit({
  id: true,
});

// Governance proposals
export const proposals = pgTable("proposals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("active"),
  endTime: timestamp("end_time").notNull(),
  yesVotes: integer("yes_votes").notNull().default(0),
  noVotes: integer("no_votes").notNull().default(0),
});

export const insertProposalSchema = createInsertSchema(proposals).omit({
  id: true,
  yesVotes: true,
  noVotes: true,
});

// User votes on proposals
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  proposalId: integer("proposal_id").notNull(),
  vote: text("vote").notNull(), // 'yes' or 'no'
  votedAt: timestamp("voted_at").notNull().defaultNow(),
});

export const insertVoteSchema = createInsertSchema(votes).omit({
  id: true,
  votedAt: true,
});

// Token List with contract addresses
export const tokens = pgTable("tokens", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  address: text("address").notNull().unique(),
  decimals: integer("decimals").notNull(),
  logoColor: text("logo_color").notNull(),
});

export const insertTokenSchema = createInsertSchema(tokens).omit({
  id: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertQuest = z.infer<typeof insertQuestSchema>;
export type Quest = typeof quests.$inferSelect;

export type InsertUserQuest = z.infer<typeof insertUserQuestSchema>;
export type UserQuest = typeof userQuests.$inferSelect;

export type InsertProposal = z.infer<typeof insertProposalSchema>;
export type Proposal = typeof proposals.$inferSelect;

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

export type InsertToken = z.infer<typeof insertTokenSchema>;
export type Token = typeof tokens.$inferSelect;
