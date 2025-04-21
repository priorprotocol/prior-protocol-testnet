import { Switch, Route, useLocation } from "wouter";
import { useEffect, FC } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Faucet from "@/pages/Faucet";
import Swap from "@/pages/Swap";
import Quest from "@/pages/Quest";
import Governance from "@/pages/Governance";
import Dashboard from "@/pages/Dashboard";
import Transactions from "@/pages/Transactions"; // Added Transactions page
import Admin from "@/pages/Admin"; // Added Admin page
import About from "@/pages/About";
import Documentation from "@/pages/Documentation";
import Redirect from "@/pages/Redirect";
import Learn from "@/pages/Learn";
import QuizPage from "@/pages/QuizPage";
import QuizResultPage from "@/pages/QuizResultPage";
import NotFound from "@/pages/not-found";
import { apiRequest } from "@/lib/queryClient";
import { useStandaloneWallet } from "@/hooks/useStandaloneWallet";
import { Redirect as RedirectPage } from "wouter";
import { WebSocketProvider } from "@/components/WebSocketProvider";

// Admin wallet address for protected routes
const ADMIN_WALLET = "0x4cfc531df94339def7dcd603aac1a2deaf6888b7";

// Create page components that are wrapped with WalletProvider 
// This avoids the circular dependency
const WrappedHome = () => <Home />;
const WrappedFaucet = () => <Faucet />;
const WrappedSwap = () => <Swap />;
const WrappedQuest = () => <Quest />;
const WrappedGovernance = () => <Governance />;
const WrappedDashboard = () => <Dashboard />;
const WrappedTransactions = () => <Transactions />; // Add transactions component
const WrappedAdmin = () => <Admin />; // Add admin component
const WrappedAbout = () => <About />;
const WrappedDocumentation = () => <Documentation />;
const WrappedRedirect = () => <Redirect />;
const WrappedLearn = () => <Learn />;
const WrappedQuizPage = () => <QuizPage />;
const WrappedQuizResultPage = () => <QuizResultPage />;

// Protected route component to restrict access to admin only
const ProtectedAdminRoute: FC = () => {
  const { address } = useStandaloneWallet();
  const isAdmin = address?.toLowerCase() === ADMIN_WALLET.toLowerCase();

  // If the user is not an admin, redirect to home
  if (!isAdmin) {
    // Silently redirect non-admin users to home page without showing any message
    return <RedirectPage to="/" />;
  }

  // If the user is an admin, render the admin component
  return <Admin />;
}

function App() {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  
  // Prefetch and keep leaderboard data up-to-date globally
  // This ensures the leaderboard is always available and fresh throughout the app
  useEffect(() => {
    // Immediately prefetch leaderboard on app start
    const prefetchGlobalData = async () => {
      console.log("App mounted - prefetching global leaderboard data");
      
      try {
        // Prefetch leaderboard data
        await queryClient.prefetchQuery({
          queryKey: ['/api/leaderboard'],
          queryFn: () => apiRequest('/api/leaderboard'),
          staleTime: 5000 // Consider stale after 5 seconds
        });
        console.log("Global leaderboard data prefetched successfully");
        
        // Set up regular refresh interval for leaderboard
        const refreshInterval = setInterval(() => {
          queryClient.invalidateQueries({ queryKey: ['/api/leaderboard'] });
        }, 5000); // Refresh every 5 seconds
        
        return () => clearInterval(refreshInterval);
      } catch (error) {
        console.error("Error prefetching global leaderboard data:", error);
      }
    };
    
    prefetchGlobalData();
  }, [queryClient]);
  
  return (
    <WebSocketProvider>
      <Layout>
        <Switch>
          <Route path="/" component={WrappedHome} />
          <Route path="/faucet" component={WrappedFaucet} />
          <Route path="/swap" component={WrappedSwap} />
          <Route path="/quest" component={WrappedQuest} />
          <Route path="/governance" component={WrappedGovernance} />
          <Route path="/dashboard" component={WrappedDashboard} />
          <Route path="/transactions" component={WrappedTransactions} />
          <Route path="/admin" component={ProtectedAdminRoute} />
          <Route path="/about" component={WrappedAbout} />
          <Route path="/docs" component={WrappedDocumentation} />
          <Route path="/redirect" component={WrappedRedirect} />
          <Route path="/learn" component={WrappedLearn} />
          <Route path="/quiz/:quizId/:userQuizId" component={WrappedQuizPage} />
          <Route path="/quiz-result/:userQuizId" component={WrappedQuizResultPage} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
    </WebSocketProvider>
  );
}

export default App;
