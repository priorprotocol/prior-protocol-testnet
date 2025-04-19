import React from 'react';
import { useParams, useLocation } from 'wouter';
import QuizResultComponent from '@/components/QuizResult';

export function QuizResultPage() {
  const { userQuizId } = useParams();
  const [, navigate] = useLocation();

  if (!userQuizId) {
    return (
      <div className="container max-w-7xl py-6 lg:py-10">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Results Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The requested quiz results could not be found.
          </p>
          <button 
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2"
            onClick={() => navigate('/learn')}
          >
            Back to Learn
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl py-6 lg:py-10">
      <QuizResultComponent userQuizId={parseInt(userQuizId)} />
    </div>
  );
}

export default QuizResultPage;