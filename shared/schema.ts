import { pgTable, text, serial, integer, boolean, timestamp, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  address: text("address").notNull().unique(),
  lastClaim: timestamp("last_claim"),
  badges: jsonb("badges").default([]).notNull(),  // Array of badge IDs
  totalSwaps: integer("total_swaps").default(0).notNull(),
  totalClaims: integer("total_claims").default(0).notNull(),
  points: numeric("points", { precision: 5, scale: 1 }).default("0").notNull(),  // Tracks total points for leaderboard (DECIMAL supporting 0.5)
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  badges: true,
  totalSwaps: true,
  totalClaims: true,
  points: true,
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

// Transaction history table
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // 'faucet_claim', 'swap', etc.
  fromToken: text("from_token"),
  toToken: text("to_token"),
  fromAmount: text("from_amount"),
  toAmount: text("to_amount"),
  txHash: text("tx_hash").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  status: text("status").notNull().default("completed"), // 'completed', 'pending', 'failed'
  blockNumber: integer("block_number"),
  points: numeric("points", { precision: 5, scale: 1 }).default("0"), // Points earned for this transaction (DECIMAL supporting 0.5)
  metadata: jsonb("metadata"), // Additional transaction metadata as JSON
  createdAt: timestamp("created_at").notNull().defaultNow(), // When the record was created
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  timestamp: true,
  createdAt: true,
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

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

// Quizzes table
export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  difficulty: text("difficulty").notNull(), // 'beginner', 'intermediate', 'advanced'
  category: text("category").notNull(), // 'blockchain', 'defi', 'nft', etc.
  pointsReward: integer("points_reward").notNull().default(5),
  status: text("status").notNull().default("active"), // 'active', 'inactive', 'draft'
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertQuizSchema = createInsertSchema(quizzes).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Quiz questions table
export const quizQuestions = pgTable("quiz_questions", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  question: text("question").notNull(),
  options: jsonb("options").notNull(), // Array of answer options
  correctOptionIndex: integer("correct_option_index").notNull(),
  explanation: text("explanation"), // Explanation for the correct answer
  points: integer("points").notNull().default(1),
  order: integer("order").notNull(), // Order of questions within quiz
});

export const insertQuizQuestionSchema = createInsertSchema(quizQuestions).omit({
  id: true,
});

// User quiz attempts
export const userQuizzes = pgTable("user_quizzes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  quizId: integer("quiz_id").notNull(),
  score: integer("score").notNull().default(0),
  maxScore: integer("max_score").notNull(),
  status: text("status").notNull().default("in_progress"), // 'in_progress', 'completed'
  pointsEarned: integer("points_earned").default(0),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  answers: jsonb("answers").default([]), // Array of {questionId, selectedOptionIndex}
});

export const insertUserQuizSchema = createInsertSchema(userQuizzes).omit({
  id: true,
  startedAt: true,
  completedAt: true,
});

// Types for the quiz feature
export type InsertQuiz = z.infer<typeof insertQuizSchema>;
export type Quiz = typeof quizzes.$inferSelect;

export type InsertQuizQuestion = z.infer<typeof insertQuizQuestionSchema>;
export type QuizQuestion = typeof quizQuestions.$inferSelect;

export type InsertUserQuiz = z.infer<typeof insertUserQuizSchema>;
export type UserQuiz = typeof userQuizzes.$inferSelect;
