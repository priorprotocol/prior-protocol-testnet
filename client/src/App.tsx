import { Switch, Route, useLocation } from "wouter";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Faucet from "@/pages/Faucet";
import Swap from "@/pages/Swap";
import Quest from "@/pages/Quest";
import Governance from "@/pages/Governance";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/not-found";

// Create page components that are wrapped with WalletProvider 
// This avoids the circular dependency
const WrappedHome = () => <Home />;
const WrappedFaucet = () => <Faucet />;
const WrappedSwap = () => <Swap />;
const WrappedQuest = () => <Quest />;
const WrappedGovernance = () => <Governance />;
const WrappedDashboard = () => <Dashboard />;

function App() {
  const [location] = useLocation();
  
  return (
    <Layout>
      <Switch>
        <Route path="/" component={WrappedHome} />
        <Route path="/faucet" component={WrappedFaucet} />
        <Route path="/swap" component={WrappedSwap} />
        <Route path="/quest" component={WrappedQuest} />
        <Route path="/governance" component={WrappedGovernance} />
        <Route path="/dashboard" component={WrappedDashboard} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default App;
