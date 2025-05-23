/**
 * Quiz API Routes
 * Handles all quiz-related endpoints for the blockchain education feature
 */
import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { insertQuizSchema, insertQuizQuestionSchema, insertUserQuizSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Get all available quizzes
router.get('/quizzes', async (_req: Request, res: Response) => {
  try {
    const quizzes = await storage.getAllQuizzes();
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ message: 'Failed to fetch quizzes' });
  }
});

// Get a specific quiz by ID
router.get('/quizzes/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid quiz ID' });
    }
    
    const quiz = await storage.getQuiz(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ message: 'Failed to fetch quiz' });
  }
});

// Get all questions for a specific quiz
router.get('/quizzes/:id/questions', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: 'Invalid quiz ID' });
    }
    
    const quiz = await storage.getQuiz(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    const questions = await storage.getQuizQuestions(id);
    
    // Don't send the correct answer in the response to prevent cheating
    const safeQuestions = questions.map(q => ({
      id: q.id,
      quizId: q.quizId,
      question: q.question,
      options: q.options,
      order: q.order,
      points: q.points
      // Omitting correctOptionIndex and explanation
    }));
    
    res.json(safeQuestions);
  } catch (error) {
    console.error('Error fetching quiz questions:', error);
    res.status(500).json({ message: 'Failed to fetch quiz questions' });
  }
});

// Get all quizzes attempted by a user
router.get('/users/:identifier/quizzes', async (req: Request, res: Response) => {
  try {
    const identifier = req.params.identifier;
    let user;
    
    // Check if identifier is an address or ID
    if (identifier.startsWith('0x')) {
      user = await storage.getUser(identifier);
    } else {
      const id = parseInt(identifier);
      if (isNaN(id)) {
        return res.status(400).json({ message: 'Invalid user ID or address' });
      }
      user = await storage.getUserById(id);
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userQuizzes = await storage.getUserQuizzes(user.id);
    
    // Fetch the full quiz details for each user quiz
    const quizDetails = await Promise.all(
      userQuizzes.map(async (userQuiz) => {
        const quiz = await storage.getQuiz(userQuiz.quizId);
        return {
          ...userQuiz,
          quizTitle: quiz?.title || 'Unknown Quiz',
          quizDescription: quiz?.description || '',
          quizCategory: quiz?.category || '',
          quizDifficulty: quiz?.difficulty || ''
        };
      })
    );
    
    res.json(quizDetails);
  } catch (error) {
    console.error('Error fetching user quizzes:', error);
    res.status(500).json({ message: 'Failed to fetch user quizzes' });
  }
});

// Start a new quiz attempt
router.post('/quizzes/:id/start', async (req: Request, res: Response) => {
  try {
    const quizId = parseInt(req.params.id);
    if (isNaN(quizId)) {
      return res.status(400).json({ message: 'Invalid quiz ID' });
    }
    
    // Validation schema for request body
    const startQuizSchema = z.object({
      userId: z.number()
    });
    
    // Validate request body
    const validationResult = startQuizSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid request data',
        errors: validationResult.error.errors 
      });
    }
    
    const { userId } = validationResult.data;
    
    // Check if user exists
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if quiz exists
    const quiz = await storage.getQuiz(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Check if user already has an in-progress attempt for this quiz
    const existingAttempt = await storage.getUserQuizByUserAndQuizId(userId, quizId);
    if (existingAttempt && existingAttempt.status === 'in_progress') {
      return res.json(existingAttempt); // Return the existing attempt
    }
    
    // Get all questions for this quiz to determine max score
    const questions = await storage.getQuizQuestions(quizId);
    const maxScore = questions.reduce((total, q) => total + q.points, 0);
    
    // Create a new quiz attempt
    const newUserQuiz = await storage.createUserQuiz({
      userId,
      quizId,
      score: 0,
      maxScore,
      status: 'in_progress',
      pointsEarned: 0
    });
    
    res.status(201).json(newUserQuiz);
  } catch (error) {
    console.error('Error starting quiz:', error);
    res.status(500).json({ message: 'Failed to start quiz' });
  }
});

// Submit quiz answers
router.post('/quizzes/:id/submit', async (req: Request, res: Response) => {
  try {
    const quizId = parseInt(req.params.id);
    if (isNaN(quizId)) {
      return res.status(400).json({ message: 'Invalid quiz ID' });
    }
    
    // Validation schema for request body
    const submitQuizSchema = z.object({
      userId: z.number(),
      userQuizId: z.number(),
      answers: z.array(z.object({
        questionId: z.number(),
        selectedOptionIndex: z.number()
      }))
    });
    
    // Validate request body
    const validationResult = submitQuizSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid request data',
        errors: validationResult.error.errors 
      });
    }
    
    const { userId, userQuizId, answers } = validationResult.data;
    
    // Check if user exists
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if quiz exists
    const quiz = await storage.getQuiz(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Check if user quiz attempt exists and is in progress
    const userQuiz = await storage.getUserQuiz(userQuizId);
    if (!userQuiz) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }
    
    if (userQuiz.userId !== userId || userQuiz.quizId !== quizId) {
      return res.status(400).json({ message: 'Quiz attempt mismatch' });
    }
    
    if (userQuiz.status === 'completed') {
      return res.status(400).json({ message: 'Quiz already completed' });
    }
    
    // Get all questions for this quiz
    const questions = await storage.getQuizQuestions(quizId);
    const questionsMap = new Map(questions.map(q => [q.id, q]));
    
    // Calculate score
    let score = 0;
    const resultsWithExplanations = [];
    
    for (const answer of answers) {
      const question = questionsMap.get(answer.questionId);
      if (!question) continue;
      
      const isCorrect = answer.selectedOptionIndex === question.correctOptionIndex;
      if (isCorrect) {
        score += question.points;
      }
      
      resultsWithExplanations.push({
        questionId: question.id,
        question: question.question,
        selectedOptionIndex: answer.selectedOptionIndex,
        correctOptionIndex: question.correctOptionIndex,
        isCorrect,
        explanation: question.explanation,
        points: isCorrect ? question.points : 0
      });
    }
    
    // Update the user quiz attempt as completed
    const completedAt = new Date();
    const updatedUserQuiz = await storage.updateUserQuiz(userQuizId, {
      status: 'completed',
      score,
      completedAt,
      answers
    });
    
    // Return the quiz results with explanations
    res.json({
      userQuizId,
      score,
      maxScore: userQuiz.maxScore,
      pointsEarned: updatedUserQuiz?.pointsEarned || 0,
      completedAt,
      results: resultsWithExplanations
    });
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ message: 'Failed to submit quiz' });
  }
});

// Get quiz results
router.get('/quizzes/results/:userQuizId', async (req: Request, res: Response) => {
  try {
    const userQuizId = parseInt(req.params.userQuizId);
    if (isNaN(userQuizId)) {
      return res.status(400).json({ message: 'Invalid user quiz ID' });
    }
    
    // Check if user quiz attempt exists
    const userQuiz = await storage.getUserQuiz(userQuizId);
    if (!userQuiz) {
      return res.status(404).json({ message: 'Quiz attempt not found' });
    }
    
    if (userQuiz.status !== 'completed') {
      return res.status(400).json({ message: 'Quiz not yet completed' });
    }
    
    // Get all questions for this quiz
    const questions = await storage.getQuizQuestions(userQuiz.quizId);
    const questionsMap = new Map(questions.map(q => [q.id, q]));
    
    // Prepare results with explanations
    const results = [];
    
    for (const answer of userQuiz.answers) {
      const question = questionsMap.get(answer.questionId);
      if (!question) continue;
      
      const isCorrect = answer.selectedOptionIndex === question.correctOptionIndex;
      
      results.push({
        questionId: question.id,
        question: question.question,
        options: question.options,
        selectedOptionIndex: answer.selectedOptionIndex,
        correctOptionIndex: question.correctOptionIndex,
        isCorrect,
        explanation: question.explanation,
        points: isCorrect ? question.points : 0
      });
    }
    
    // Return the quiz results
    res.json({
      userQuizId,
      score: userQuiz.score,
      maxScore: userQuiz.maxScore,
      pointsEarned: userQuiz.pointsEarned,
      completedAt: userQuiz.completedAt,
      results
    });
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({ message: 'Failed to fetch quiz results' });
  }
});

export default router;