import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Quiz, 
  UserQuiz 
} from './QuizTypes';

interface QuizListProps {
  userId?: number;
  address?: string;
  filter?: string;
}

export default function QuizList({ userId, address, filter = 'all' }: QuizListProps) {
  const [, navigate] = useLocation();
  
  // Fetch all quizzes
  const { data: quizzes, isLoading: isLoadingQuizzes } = useQuery({
    queryKey: ['/api/quizzes'],
    queryFn: () => apiRequest('/api/quizzes'),
    staleTime: 60000, // 1 minute
  });
  
  // Fetch user's quizzes (if user is connected)
  const {
    data: userQuizzes,
    isLoading: isLoadingUserQuizzes,
  } = useQuery({
    queryKey: ['/api/users', userId, 'quizzes'],
    queryFn: () => {
      if (!userId && !address) return [];
      return apiRequest(`/api/users/${address || userId}/quizzes`);
    },
    enabled: !!userId || !!address,
    staleTime: 60000, // 1 minute
  });
  
  const handleStartQuiz = async (quizId: number) => {
    if (!userId) {
      console.error('User must be connected to start a quiz');
      return;
    }
    
    try {
      const response = await fetch(`/api/quizzes/${quizId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to start quiz');
      }
      
      const userQuiz = await response.json();
      navigate(`/quiz/${quizId}/${userQuiz.id}`);
    } catch (error) {
      console.error('Error starting quiz:', error);
    }
  };
  
  const handleContinueQuiz = (quizId: number, userQuizId: number) => {
    navigate(`/quiz/${quizId}/${userQuizId}`);
  };
  
  const handleViewResults = (userQuizId: number) => {
    navigate(`/quiz-result/${userQuizId}`);
  };
  
  const getQuizStatus = (quiz: Quiz) => {
    if (!userQuizzes) return null;
    
    const userQuiz = userQuizzes.find((uq: UserQuiz) => uq.quizId === quiz.id);
    
    if (!userQuiz) {
      return (
        <Button onClick={() => handleStartQuiz(quiz.id)}>Start Quiz</Button>
      );
    }
    
    if (userQuiz.status === 'in_progress') {
      return (
        <Button onClick={() => handleContinueQuiz(quiz.id, userQuiz.id)}>Continue Quiz</Button>
      );
    }
    
    if (userQuiz.status === 'completed') {
      return (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">
              Score: {userQuiz.score}/{userQuiz.maxScore} ({Math.round((userQuiz.score / userQuiz.maxScore) * 100)}%)
            </span>
            <Badge variant={userQuiz.score / userQuiz.maxScore >= 0.7 ? 'default' : 'outline'}>
              {userQuiz.pointsEarned} Points Earned
            </Badge>
          </div>
          <Button variant="outline" onClick={() => handleViewResults(userQuiz.id)}>
            View Results
          </Button>
          <Button onClick={() => handleStartQuiz(quiz.id)}>Retry Quiz</Button>
        </div>
      );
    }
    
    return null;
  };
  
  // Filter quizzes based on the selected filter
  const filteredQuizzes = quizzes ? quizzes.filter((quiz: Quiz) => {
    if (filter === 'all') return true;
    return quiz.difficulty.toLowerCase() === filter.toLowerCase();
  }) : [];
  
  if (isLoadingQuizzes || (userId && isLoadingUserQuizzes)) {
    return <div className="py-4">Loading quizzes...</div>;
  }
  
  if (!quizzes || quizzes.length === 0) {
    return <div className="py-4">No quizzes available.</div>;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredQuizzes.map((quiz: Quiz) => (
        <Card key={quiz.id} className="overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl">{quiz.title}</CardTitle>
              <Badge variant={quiz.difficulty === 'beginner' ? 'default' : 
                quiz.difficulty === 'intermediate' ? 'secondary' : 'destructive'}>
                {quiz.difficulty}
              </Badge>
            </div>
            <CardDescription>{quiz.description}</CardDescription>
          </CardHeader>
          
          <CardContent className="pb-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <div>Category: {quiz.category}</div>
              <div>{quiz.estimatedTime}</div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col items-stretch pt-3">
            {getQuizStatus(quiz)}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}