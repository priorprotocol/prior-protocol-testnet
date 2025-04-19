import React, { useState, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserContext } from '@/contexts/UserContext';
import QuizList from '@/components/QuizList';

export function LearnPage() {
  const { user, isConnected } = useContext(UserContext);
  const [activeTab, setActiveTab] = useState('quizzes');
  const [filter, setFilter] = useState('all');

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  return (
    <div className="container max-w-7xl py-6 lg:py-10">
      <PageHeader
        heading="Learn & Earn"
        text="Learn about blockchain technology, DeFi, and Prior Protocol while earning rewards."
      />

      <Tabs defaultValue="quizzes" className="mt-6" onValueChange={handleTabChange}>
        <TabsList className="mb-4">
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
        </TabsList>

        <div className="mb-4 flex justify-start space-x-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => handleFilterChange('all')}
          >
            All
          </Button>
          <Button 
            variant={filter === 'beginner' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => handleFilterChange('beginner')}
          >
            Beginner
          </Button>
          <Button 
            variant={filter === 'intermediate' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => handleFilterChange('intermediate')}
          >
            Intermediate
          </Button>
          <Button 
            variant={filter === 'advanced' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => handleFilterChange('advanced')}
          >
            Advanced
          </Button>
        </div>

        <TabsContent value="quizzes">
          {isConnected ? (
            <QuizList userId={user?.id} address={user?.address} filter={filter} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Connect Your Wallet</CardTitle>
                <CardDescription>
                  Connect your wallet to access quizzes and earn rewards.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>
                  By connecting your wallet, you'll be able to take quizzes, track your progress,
                  and earn points for completing educational content.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Resources</CardTitle>
              <CardDescription>
                Helpful articles and guides to understand blockchain technology.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2">
                <li><a href="https://ethereum.org/en/what-is-ethereum/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">What is Ethereum?</a></li>
                <li><a href="https://docs.base.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Base Documentation</a></li>
                <li><a href="https://ethereum.org/en/defi/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Introduction to DeFi</a></li>
                <li><a href="https://ethereum.org/en/nft/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">What are NFTs?</a></li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="videos">
          <Card>
            <CardHeader>
              <CardTitle>Educational Videos</CardTitle>
              <CardDescription>
                Video tutorials about blockchain, DeFi, and Web3 concepts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Video content coming soon!</p>
              <p className="text-muted-foreground text-sm">We're working on creating high-quality educational videos to help you learn about blockchain technology and Prior Protocol.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default LearnPage;