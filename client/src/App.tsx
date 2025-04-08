import { Switch, Route, useLocation } from "wouter";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Faucet from "@/pages/Faucet";
import Swap from "@/pages/Swap";
import Quest from "@/pages/Quest";
import Governance from "@/pages/Governance";
import NotFound from "@/pages/not-found";

function App() {
  const [location] = useLocation();
  
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/faucet" component={Faucet} />
        <Route path="/swap" component={Swap} />
        <Route path="/quest" component={Quest} />
        <Route path="/governance" component={Governance} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default App;
