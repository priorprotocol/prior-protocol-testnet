import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  Quiz, 
  QuizQuestion, 
  Answer 
} from './QuizTypes';
import { useLocation } from 'wouter';

interface QuizComponentProps {
  quizId: number;
  userQuizId: number;
  userId: number;
}

export default function QuizComponent({ quizId, userQuizId, userId }: QuizComponentProps) {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch quiz details
  const { data: quiz, isLoading: isLoadingQuiz } = useQuery({
    queryKey: ['/api/quizzes', quizId],
    queryFn: () => apiRequest(`/api/quizzes/${quizId}`),
    staleTime: 60000, // 1 minute
  });
  
  // Fetch quiz questions
  const { data: questions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['/api/quizzes', quizId, 'questions'],
    queryFn: () => apiRequest(`/api/quizzes/${quizId}/questions`),
    staleTime: 60000, // 1 minute
  });
  
  // Fetch user quiz
  const { data: userQuiz, isLoading: isLoadingUserQuiz } = useQuery({
    queryKey: ['/api/quizzes/results', userQuizId],
    queryFn: () => apiRequest(`/api/quizzes/results/${userQuizId}`),
    retry: false, // Don't retry if quiz not found
    staleTime: 60000, // 1 minute
  });
  
  // Navigate to results if quiz is already completed
  useEffect(() => {
    if (userQuiz && userQuiz.status === 'completed') {
      navigate(`/quiz-result/${userQuizId}`);
    }
    
    // If there are previous answers, restore them
    if (userQuiz && userQuiz.answers && userQuiz.answers.length > 0) {
      setAnswers(userQuiz.answers);
    }
  }, [userQuiz, userQuizId, navigate]);
  
  // Submit quiz mutation
  const submitQuizMutation = useMutation({
    mutationFn: (quizAnswers: Answer[]) => {
      return apiRequest(`/api/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          userQuizId,
          answers: quizAnswers,
        }),
      });
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/quizzes/results', userQuizId] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'quizzes'] });
      
      // Navigate to results page
      navigate(`/quiz-result/${userQuizId}`);
    },
    onError: (error) => {
      console.error('Error submitting quiz:', error);
      setIsSubmitting(false);
    },
  });
  
  // Handle option selection
  const handleOptionSelect = (value: number) => {
    setSelectedOption(value);
  };
  
  // Save answer and go to next question
  const handleNextQuestion = () => {
    if (selectedOption === null) return;
    
    // Add answer to state
    const currentQuestion = questions[currentQuestionIndex];
    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      selectedOptionIndex: selectedOption,
    };
    
    // Check if we're updating an existing answer
    const existingAnswerIndex = answers.findIndex(
      (a) => a.questionId === currentQuestion.id
    );
    
    let updatedAnswers;
    if (existingAnswerIndex >= 0) {
      updatedAnswers = [...answers];
      updatedAnswers[existingAnswerIndex] = newAnswer;
    } else {
      updatedAnswers = [...answers, newAnswer];
    }
    
    setAnswers(updatedAnswers);
    
    // Go to next question or finish if last question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
    }
  };
  
  // Go to previous question
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      
      // Set the previously selected option
      const previousQuestion = questions[currentQuestionIndex - 1];
      const previousAnswer = answers.find(
        (a) => a.questionId === previousQuestion.id
      );
      
      setSelectedOption(previousAnswer ? previousAnswer.selectedOptionIndex : null);
    }
  };
  
  // Submit quiz
  const handleSubmitQuiz = () => {
    if (questions.length !== answers.length) {
      alert('Please answer all questions before submitting.');
      return;
    }
    
    setIsSubmitting(true);
    submitQuizMutation.mutate(answers);
  };
  
  // When going directly to the last question, check if we already have an answer for it
  useEffect(() => {
    if (questions && questions.length > 0) {
      const currentQuestion = questions[currentQuestionIndex];
      const existingAnswer = answers.find(
        (a) => a.questionId === currentQuestion?.id
      );
      
      if (existingAnswer) {
        setSelectedOption(existingAnswer.selectedOptionIndex);
      } else {
        setSelectedOption(null);
      }
    }
  }, [currentQuestionIndex, questions, answers]);
  
  if (isLoadingQuiz || isLoadingQuestions || isLoadingUserQuiz) {
    return <div className="py-6 text-center">Loading quiz...</div>;
  }
  
  if (!quiz || !questions || questions.length === 0) {
    return (
      <div className="py-6 text-center">
        <h2 className="text-xl font-bold mb-2">Quiz Not Found</h2>
        <p className="mb-4">The requested quiz could not be found or has no questions.</p>
        <Button onClick={() => navigate('/learn')}>Back to Learn</Button>
      </div>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  const progress = (currentQuestionIndex / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const hasAnsweredAll = answers.length === questions.length;
  const hasAnsweredCurrent = answers.some(
    (a) => a.questionId === currentQuestion.id
  );
  
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
        <p className="text-muted-foreground mb-4">{quiz.description}</p>
        
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <Badge variant={quiz.difficulty === 'beginner' ? 'default' : 
            quiz.difficulty === 'intermediate' ? 'secondary' : 'destructive'}>
            {quiz.difficulty}
          </Badge>
        </div>
        
        <Progress value={progress} className="h-2" />
      </div>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-xl">
            {currentQuestion.question}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <RadioGroup
            value={selectedOption !== null ? selectedOption.toString() : undefined}
            onValueChange={(value) => handleOptionSelect(parseInt(value))}
            className="space-y-3"
          >
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          {isLastQuestion ? (
            <Button
              onClick={handleSubmitQuiz}
              disabled={!selectedOption && !hasAnsweredCurrent || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          ) : (
            <Button
              onClick={handleNextQuestion}
              disabled={selectedOption === null && !hasAnsweredCurrent}
            >
              Next
            </Button>
          )}
        </CardFooter>
      </Card>
      
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {questions.map((q, index) => (
          <Button
            key={index}
            variant={
              index === currentQuestionIndex
                ? 'default'
                : answers.some((a) => a.questionId === q.id)
                ? 'outline'
                : 'ghost'
            }
            size="sm"
            onClick={() => setCurrentQuestionIndex(index)}
            className="w-10 h-10 p-0"
          >
            {index + 1}
          </Button>
        ))}
      </div>
      
      {isLastQuestion && hasAnsweredAll && (
        <div className="text-center">
          <Button onClick={handleSubmitQuiz} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting Quiz...' : 'Submit Quiz'}
          </Button>
        </div>
      )}
    </div>
  );
}