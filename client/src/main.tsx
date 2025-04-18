import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { WalletProvider } from "./context/WalletContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NetworkBanner from "./components/NetworkBanner";
import WalletModal from "./components/WalletModal";
import GlobalDataLoader from "./components/GlobalDataLoader";

// Create a bootstrapped app to avoid circular dependencies
const BootstrapApp = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProvider>
      {/* GlobalDataLoader will load data immediately upon wallet connection */}
      <GlobalDataLoader />
      <NetworkBanner />
      <App />
      <WalletModal />
      <Toaster />
    </WalletProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<BootstrapApp />);
