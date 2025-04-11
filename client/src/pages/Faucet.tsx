import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import TokenCard from "@/components/TokenCard";
import { TokenInfo } from "@/types";
import { claimFromFaucet, getFaucetInfo, getTokenBalance } from "@/lib/contracts";
import { requestAccounts, switchToBaseSepoliaNetwork, formatTokenAmount } from "@/lib/web3";

const Faucet = () => {
  const wallet = useWallet();
  const { 
    tokens,
    copyToClipboard
  } = wallet;
  
  // Create a local wallet state that will be used if the global one fails
  const [localWalletAddress, setLocalWalletAddress] = useState<string | null>(null);
  
  // Use either the global wallet address or the local one
  const address = wallet.address || localWalletAddress;
  const isConnected = !!address;
  
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [localBalances, setLocalBalances] = useState<Record<string, string>>({});
  
  // Get user data
  const { data: userData } = useQuery<{id?: number, address: string, lastClaim: string | null}>({
    queryKey: [`/api/users/${address}`],
    enabled: isConnected && !!address,
  });
  
  // Time until next claim
  const getTimeUntilNextClaim = () => {
    if (!userData?.lastClaim) return "00:00:00";
    
    const lastClaim = new Date(userData.lastClaim);
    const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    
    if (now >= nextClaim) return "00:00:00";
    
    const diffTime = nextClaim.getTime() - now.getTime();
    const hours = Math.floor(diffTime / (1000 * 60 * 60));
    const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffTime % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const canClaimTokens = !userData?.lastClaim || 
    new Date().getTime() - new Date(userData.lastClaim).getTime() >= 24 * 60 * 60 * 1000;
  
  // Handle token claim using blockchain contract directly
  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error("Wallet not connected");
      
      try {
        // Call the PRIOR token contract's claimFromFaucet function
        console.log("Calling claimFromFaucet with the connected wallet");
        const txReceipt = await claimFromFaucet();
        console.log("Claim transaction receipt:", txReceipt);
        
        // Also update our backend to track the claim
        const response = await apiRequest('POST', '/api/claim', { address });
        
        // Get the API response directly - apiRequest already handles the JSON parsing
        return {
          txReceipt,
          apiResponse: response
        };
      } catch (error) {
        console.error("Error in claim mutation:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Claim successful:", data);
      toast({
        title: "Token claimed successfully!",
        description: "1 PRIOR token has been sent to your wallet.",
      });
      if (address) {
        queryClient.invalidateQueries({ queryKey: [`/api/users/${address}`] });
      }
    },
    onError: (error: any) => {
      console.error("Claim error:", error);
      // Check for specific error message from the Prior smart contract
      const errorMessage = error.reason?.includes("Wait 24 hours between claims") 
        ? "You must wait 24 hours between claims. The Prior smart contract enforces this limit." 
        : error.message || "An error occurred. There might be a network issue or insufficient gas.";
        
      toast({
        title: "Failed to claim token",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });
  
  // Add a function to update local balances
  const updateLocalBalances = async (userAddress: string) => {
    if (!tokens || tokens.length === 0) return;
    
    try {
      const balances: Record<string, string> = {};
      
      for (const token of tokens) {
        try {
          console.log(`Getting balance for ${token.symbol} at address ${token.address}`);
          const result = await getTokenBalance(token.address, userAddress);
          const formattedBalance = formatTokenAmount(result.balance.toString(), result.decimals);
          console.log(`Balance for ${token.symbol}: ${formattedBalance}`);
          balances[token.symbol] = formattedBalance;
        } catch (error) {
          console.error(`Error fetching balance for ${token.symbol}:`, error);
          balances[token.symbol] = "0.00";
        }
      }
      
      setLocalBalances(balances);
    } catch (error) {
      console.error("Error updating local balances:", error);
    }
  };
  
  // Update local balances when tokens or address changes
  useEffect(() => {
    if (address && tokens.length > 0) {
      updateLocalBalances(address);
    }
  }, [address, tokens]);
  
  const directConnectWallet = async () => {
    try {
      if (!window.ethereum) {
        toast({
          title: "MetaMask Not Found",
          description: "Please install MetaMask to connect your wallet.",
          variant: "destructive"
        });
        window.open('https://metamask.io/download.html', '_blank');
        return null;
      }
      
      console.log("Requesting accounts directly...");
      const account = await requestAccounts();
      if (!account) {
        toast({
          title: "No Account Found",
          description: "Please connect an account in your MetaMask wallet.",
          variant: "destructive"
        });
        return null;
      }
      
      console.log("Account connected:", account);
      
      // Set our local state first
      setLocalWalletAddress(account);
      
      // Try to update the wallet address via global debug methods
      try {
        // @ts-ignore
        if (window.__setWalletAddress) {
          // @ts-ignore
          const debugUpdate = window.__setWalletAddress(account);
          console.log("Global wallet update result:", debugUpdate);
        }
      } catch (error) {
        console.error("Error updating wallet address globally:", error);
      }
      
      // Switch to Base Sepolia
      try {
        await switchToBaseSepoliaNetwork();
      } catch (error) {
        console.error("Failed to switch network:", error);
      }
      
      // Update token balances
      await updateLocalBalances(account);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${account.substring(0, 6)}...${account.substring(account.length - 4)}`,
      });
      
      return account;
    } catch (error) {
      console.error("Error in direct connect:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to MetaMask. Please try again.",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleClaimTokens = async () => {
    if (!isConnected) {
      try {
        console.log("Trying direct wallet connection...");
        const account = await directConnectWallet();
        if (!account) {
          return;
        }
        return;
      } catch (error) {
        console.error("Failed to connect wallet:", error);
        toast({
          title: "Wallet Connection Failed",
          description: "Please make sure MetaMask is installed and try again.",
          variant: "destructive"
        });
        return;
      }
    }
    
    console.log("Claiming tokens...");
    claimMutation.mutate();
  };
  
  const handleCopyAddress = () => {
    if (address) {
      copyToClipboard(address);
      setIsCopied(true);
      
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };
  
  const handleDisconnectWallet = () => {
    try {
      console.log("Disconnecting wallet...");
      
      // First, clear local state
      setLocalWalletAddress(null);
      setLocalBalances({});
      
      // Then call the global disconnect method from wallet context
      wallet.disconnectWallet();
      
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected successfully.",
      });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect wallet. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <section id="faucet" className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-space font-bold mb-4">Prior Token Faucet</h2>
          <p className="text-[#A0AEC0] max-w-2xl mx-auto">
            Claim 1 PRIOR token every 24 hours to interact with the protocol. These testnet tokens are limited by design - use them wisely to test swapping, governance, and other protocol features.
          </p>
        </div>
        
        <div className="max-w-xl mx-auto gradient-border bg-[#141D29] p-6 md:p-8 shadow-lg">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-space font-semibold">Daily Token Claim</h3>
              <div className="flex items-center text-[#A0AEC0] text-sm">
                <i className="fas fa-clock mr-1"></i>
                <span>{getTimeUntilNextClaim()}</span> until next claim
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-[#1A5CFF] bg-opacity-10 rounded-lg border border-[#1A5CFF] border-opacity-30">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-[#1A5CFF] flex items-center justify-center mr-3">
                  <span className="font-bold">P</span>
                </div>
                <div>
                  <div className="font-space font-semibold">PRIOR Token</div>
                  <div className="text-sm text-[#A0AEC0]">Base Sepolia Testnet</div>
                </div>
              </div>
              <div className="text-xl font-bold font-space">1 PRIOR</div>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-[#A0AEC0] text-sm font-medium">Your Wallet Address</label>
              {isConnected && (
                <button 
                  onClick={handleDisconnectWallet}
                  className="text-xs text-[#FF5757] hover:text-red-400 transition-colors flex items-center gap-1"
                >
                  <i className="fas fa-sign-out-alt"></i> Disconnect
                </button>
              )}
            </div>
            <div className="flex">
              <input 
                type="text" 
                readOnly 
                value={address 
                  ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` 
                  : "0x0000...0000"
                }
                placeholder="0x0000...0000" 
                className="w-full bg-[#0B1118] border border-[#2D3748] rounded-l-lg px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-[#1A5CFF]"
              />
              <button 
                onClick={handleCopyAddress}
                className="bg-[#0E3585] px-4 rounded-r-lg border-y border-r border-[#2D3748] hover:bg-opacity-80 transition-colors" 
                title="Copy address"
              >
                <i className={`${isCopied ? 'fas fa-check' : 'far fa-copy'}`}></i>
              </button>
            </div>
          </div>
          
          <button 
            onClick={handleClaimTokens}
            disabled={isConnected && !canClaimTokens || claimMutation.isPending}
            className={`w-full rounded-lg ${isConnected && !canClaimTokens ? 'bg-[#A0AEC0] cursor-not-allowed' : 'bg-[#1A5CFF] hover:bg-opacity-90'} transition-all font-bold text-sm px-8 py-4 uppercase tracking-wide`}
          >
            {!isConnected 
              ? "Connect Wallet" 
              : claimMutation.isPending 
              ? "Claiming..." 
              : canClaimTokens 
              ? "Claim 1 PRIOR Token" 
              : "Already Claimed Today"}
          </button>
          
          <div className="mt-6 text-sm text-[#A0AEC0] text-center">
            <p>Need some ETH for gas? <a href="https://www.coinbase.com/faucets/base-sepolia-faucet" target="_blank" rel="noopener noreferrer" className="text-[#1A5CFF] hover:underline">Get Base Sepolia ETH here</a></p>
          </div>
        </div>
        
        <div className="mt-12 max-w-4xl mx-auto">
          <h3 className="text-xl font-space font-bold mb-4 text-center">Testnet Tokens</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tokens.map(token => {
              // Override the token with local balance if available
              const tokenWithLocalBalance = {
                ...token,
                balance: localBalances[token.symbol] || wallet.getTokenBalance(token.symbol) || "0.00"
              };
              return <TokenCard key={token.symbol} token={tokenWithLocalBalance} />;
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Faucet;
