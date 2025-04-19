import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { 
  Alert, 
  AlertTitle, 
  AlertDescription 
} from '@/components/ui/alert';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  CheckCircle2,
  XCircle,
  Trophy,
  Clock,
  Award,
  Info,
} from 'lucide-react';
import { QuizResult, QuizQuestionResult } from './QuizTypes';
import { useLocation } from 'wouter';

interface QuizResultComponentProps {
  userQuizId: number;
}

export default function QuizResultComponent({ userQuizId }: QuizResultComponentProps) {
  const [, navigate] = useLocation();
  
  // Fetch quiz result
  const { data: result, isLoading } = useQuery({
    queryKey: ['/api/quizzes/results', userQuizId],
    queryFn: () => apiRequest(`/api/quizzes/results/${userQuizId}`),
    staleTime: 60000, // 1 minute
  });
  
  if (isLoading) {
    return <div className="py-6 text-center">Loading results...</div>;
  }
  
  if (!result) {
    return (
      <div className="py-6 text-center">
        <h2 className="text-xl font-bold mb-2">Results Not Found</h2>
        <p className="mb-4">We couldn't find the requested quiz results.</p>
        <Button onClick={() => navigate('/learn')}>Back to Learn</Button>
      </div>
    );
  }
  
  const score = result.score;
  const maxScore = result.maxScore;
  const percentage = Math.round((score / maxScore) * 100);
  const passingScore = 70;
  const isPassing = percentage >= passingScore;
  
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl">Quiz Results</CardTitle>
            <Badge variant={isPassing ? 'default' : 'outline'}>
              {isPassing ? 'PASSED' : 'FAILED'}
            </Badge>
          </div>
          <CardDescription>
            Completed on {new Date(result.completedAt).toLocaleDateString()} at {new Date(result.completedAt).toLocaleTimeString()}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span>Score: {score}/{maxScore} ({percentage}%)</span>
              <span>Passing: {passingScore}%</span>
            </div>
            <Progress
              value={percentage}
              className="h-2"
              indicatorClassName={isPassing ? 'bg-green-600' : 'bg-red-600'}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card className="bg-muted/50">
              <CardContent className="p-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-medium">Points Earned</div>
                  <div className="text-2xl font-bold">{result.pointsEarned}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-muted/50">
              <CardContent className="p-4 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-sm font-medium">Correct Answers</div>
                  <div className="text-2xl font-bold">
                    {result.results.filter(r => r.isCorrect).length}/{result.results.length}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-muted/50">
              <CardContent className="p-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-medium">Achievement</div>
                  <div className="text-lg font-bold">
                    {percentage >= 90 ? 'Expert' : 
                     percentage >= 80 ? 'Advanced' : 
                     percentage >= 70 ? 'Proficient' : 
                     percentage >= 60 ? 'Intermediate' : 'Beginner'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {isPassing ? (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle>Congratulations!</AlertTitle>
              <AlertDescription>
                You've passed this quiz and earned {result.pointsEarned} points.
                These points have been added to your account.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertTitle>Quiz Not Passed</AlertTitle>
              <AlertDescription>
                You need to score at least {passingScore}% to pass this quiz and earn points.
                You can retry the quiz to improve your score.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-wrap gap-2 justify-end">
          <Button variant="outline" onClick={() => navigate('/learn')}>
            Back to Learn
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            View Dashboard
          </Button>
        </CardFooter>
      </Card>
      
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-4">Detailed Results</h2>
        <Accordion type="single" collapsible className="w-full">
          {result.results.map((questionResult: QuizQuestionResult, index: number) => (
            <AccordionItem key={index} value={`question-${index}`}>
              <AccordionTrigger className="flex items-center gap-2 py-4">
                <div className="flex items-center gap-2">
                  {questionResult.isCorrect ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  )}
                  <span className="text-left">
                    Question {index + 1}: {questionResult.question}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pl-8">
                <div className="space-y-3 pl-0.5">
                  {questionResult.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className={`p-3 rounded-md ${
                        optionIndex === questionResult.correctOptionIndex
                          ? 'bg-green-50 border border-green-200'
                          : optionIndex === questionResult.selectedOptionIndex &&
                            optionIndex !== questionResult.correctOptionIndex
                          ? 'bg-red-50 border border-red-200'
                          : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex gap-2">
                        {optionIndex === questionResult.correctOptionIndex ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                        ) : optionIndex === questionResult.selectedOptionIndex &&
                          optionIndex !== questionResult.correctOptionIndex ? (
                          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5"></div>
                        )}
                        <span>{option}</span>
                      </div>
                    </div>
                  ))}
                  
                  {questionResult.explanation && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex gap-2">
                        <Info className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div>
                          <div className="font-medium">Explanation</div>
                          <div className="text-sm">{questionResult.explanation}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}