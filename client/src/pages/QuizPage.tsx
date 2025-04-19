import React, { useContext } from 'react';
import { useParams, useLocation } from 'wouter';
import { UserContext } from '@/contexts/UserContext';
import QuizComponent from '@/components/Quiz';
import { Button } from '@/components/ui/button';

export function QuizPage() {
  const { quizId, userQuizId } = useParams();
  const { user, isConnected } = useContext(UserContext);
  const [, navigate] = useLocation();

  if (!isConnected || !user) {
    return (
      <div className="container max-w-7xl py-6 lg:py-10">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-muted-foreground mb-6">
            You need to connect your wallet to take a quiz.
          </p>
          <Button onClick={() => navigate('/learn')}>
            Back to Learn
          </Button>
        </div>
      </div>
    );
  }

  if (!quizId || !userQuizId) {
    return (
      <div className="container max-w-7xl py-6 lg:py-10">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Quiz Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The requested quiz could not be found.
          </p>
          <Button onClick={() => navigate('/learn')}>
            Back to Learn
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-6 lg:py-10">
      <QuizComponent 
        quizId={parseInt(quizId)} 
        userQuizId={parseInt(userQuizId)} 
        userId={user.id} 
      />
    </div>
  );
}

export default QuizPage;