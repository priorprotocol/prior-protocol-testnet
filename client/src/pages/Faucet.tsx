import { useEffect, useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import TokenCard from "@/components/TokenCard";
import { useWalletSync } from "@/hooks/useWalletSync";
import { claimFromFaucet, getFaucetInfo } from "@/contracts/services";
import StandaloneWalletButton from "@/components/StandaloneWalletButton";
import { useStandaloneWallet } from "@/hooks/useStandaloneWallet";
import { formatAddress } from "@/lib/formatAddress";

const Faucet = () => {
  // Use both wallet systems during the transition
  const { 
    tokens,
    getTokenBalance,
    copyToClipboard
  } = useWalletSync();
  
  // Use our standalone wallet hook for wallet connection
  const {
    address,
    isConnected,
    connect: connectWallet,
    disconnect: disconnectWallet
  } = useStandaloneWallet();
  
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [localBalances, setLocalBalances] = useState<Record<string, string>>({});
  
  // Get user data with better stale time handling to ensure we have accurate claim times
  const { data: userData, isLoading: isUserDataLoading } = useQuery<{id?: number, address: string, lastClaim: string | null}>({
    queryKey: [`/api/users/${address}`],
    enabled: isConnected && !!address,
    staleTime: 30000, // Consider data stale after 30 seconds
    refetchOnMount: true, // Always refetch on component mount
    refetchOnWindowFocus: true, // Refetch when window regains focus
    retry: 3, // Retry failed requests up to 3 times
  });
  
  // State to hold the countdown time
  const [timeUntilNextClaim, setTimeUntilNextClaim] = useState("00:00:00");
  // Add a new state to track our manual timer
  const [lastClaimTime, setLastClaimTime] = useState<Date | null>(null);
  const [canClaimTokens, setCanClaimTokens] = useState(false); // Default to false until we verify
  
  // Use sessionStorage to remember the last claim time across reloads
  useEffect(() => {
    // Try to restore last claim time from sessionStorage on component mount
    const storedClaimTime = sessionStorage.getItem(`lastClaim_${address}`);
    if (storedClaimTime) {
      try {
        const parsedTime = new Date(storedClaimTime);
        console.log("Restored last claim time from session storage:", parsedTime);
        setLastClaimTime(parsedTime);
      } catch (e) {
        console.error("Failed to parse stored claim time:", e);
        // If parsing fails, we'll rely on userData instead
      }
    }
  }, [address]);
  
  // Initialize timer when userData changes
  useEffect(() => {
    console.log("User data updated:", userData);
    if (userData?.lastClaim) {
      const lastClaimDate = new Date(userData.lastClaim);
      const now = new Date();
      const nextClaimTime = new Date(lastClaimDate.getTime() + 24 * 60 * 60 * 1000);
      
      console.log("Last claim date:", lastClaimDate);
      console.log("Next claim time:", nextClaimTime);
      console.log("Current time:", now);
      console.log("Can claim?", now >= nextClaimTime);
      
      // Set the last claim time regardless - we'll use this to calculate countdown
      setLastClaimTime(lastClaimDate);
      
      // Store the last claim time in sessionStorage for persistence across page reloads
      try {
        sessionStorage.setItem(`lastClaim_${address}`, lastClaimDate.toISOString());
      } catch (e) {
        console.error("Failed to store claim time in sessionStorage:", e);
      }
      
      // Only update canClaimTokens if needed (we have a separate effect for this)
      if (now >= nextClaimTime) {
        setCanClaimTokens(true);
      } else {
        setCanClaimTokens(false);
      }
    } else if (!isUserDataLoading) {
      // Only consider them as a first-time user if we've actually loaded the data
      // and confirmed there's no lastClaim field
      if (userData) {
        // First time user with no claim history - can claim
        setCanClaimTokens(true);
      }
    }
  }, [userData, isUserDataLoading, address]);
  
  // Check if the user can claim tokens based on our tracked timestamp
  const checkCanClaim = useCallback(() => {
    if (!lastClaimTime) return true;
    
    const nextClaimTime = new Date(lastClaimTime.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    
    return now >= nextClaimTime;
  }, [lastClaimTime]);
  
  // Update claim state whenever lastClaimTime changes
  useEffect(() => {
    setCanClaimTokens(checkCanClaim());
  }, [lastClaimTime, checkCanClaim]);
  
  // Separate effect for the timer to run continuously
  useEffect(() => {
    // Don't run timer if no claim has been made
    if (!lastClaimTime) {
      setTimeUntilNextClaim("00:00:00");
      return;
    }
    
    console.log("Starting timer with lastClaimTime:", lastClaimTime);
    
    // Function to update the timer
    const updateTimer = () => {
      // Calculate next claim time (24 hours after last claim)
      const nextClaimTime = new Date(lastClaimTime.getTime() + 24 * 60 * 60 * 1000);
      const now = new Date();
      
      // Check if it's time to claim
      if (now >= nextClaimTime) {
        setTimeUntilNextClaim("00:00:00");
        setCanClaimTokens(true);
        return;
      }
      
      // Calculate time difference
      const diffTime = nextClaimTime.getTime() - now.getTime();
      const hours = Math.floor(diffTime / (1000 * 60 * 60));
      const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffTime % (1000 * 60)) / 1000);
      
      // Format and set the countdown string
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      setTimeUntilNextClaim(formattedTime);
      
      console.log("Timer updated:", formattedTime, "Next claim at:", nextClaimTime);
    };
    
    // Update immediately
    updateTimer();
    
    // Set interval to update every second
    const intervalId = setInterval(updateTimer, 1000);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [lastClaimTime]);
  
  // Handle token claim using blockchain contract directly
  const claimMutation = useMutation({
    mutationFn: async () => {
      if (!address) {
        return { success: false, reason: "Wallet not connected" };
      }
      
      try {
        // First check if we can claim using the smart contract
        const faucetContractInfo = await getFaucetInfo(address);
        console.log("Faucet contract info:", faucetContractInfo);
        
        if (!faucetContractInfo.canClaim) {
          const waitTimeInHours = Math.ceil(faucetContractInfo.timeRemaining / 3600);
          return { 
            success: false, 
            reason: `You must wait ${waitTimeInHours} hour(s) before claiming again. The smart contract enforces this limit.` 
          };
        }
        
        // Call the PRIOR token contract's claimFromFaucet function
        console.log("Calling claimFromFaucet with the connected wallet");
        const txReceipt = await claimFromFaucet();
        console.log("Claim transaction receipt:", txReceipt);
        
        if (!txReceipt) {
          return { 
            success: false, 
            reason: "Claim transaction failed. You may have already claimed tokens today." 
          };
        }
        
        // Handle transaction hash retrieval based on the actual structure
        let txHash = "";
        let blockNumber = 0;
        
        if (txReceipt && typeof txReceipt === 'object') {
          // Safely access receipt properties with type checking
          txHash = (
            'transactionHash' in txReceipt ? String(txReceipt.transactionHash) :
            'hash' in txReceipt ? String(txReceipt.hash) : 
            `faucet_claim_${Date.now()}`  // Fallback identifier if no hash found
          );
          
          blockNumber = (
            'blockNumber' in txReceipt ? Number(txReceipt.blockNumber) : 
            0  // Default block number if not available
          );
        }
        
        // Also update our backend to track the claim
        try {
          // Update the claim record in our backend
          const response = await apiRequest('POST', '/api/claim', { 
            address,
            txHash,
            amount: '1',
            blockNumber
          });
          console.log("Backend claim response:", response);
          
          // Record the transaction in our transaction history
          try {
            // Make sure userId is a number (casting to avoid type errors)
            const userId = userData?.id ? Number(userData.id) : undefined;
            
            const txResponse = await apiRequest('POST', '/api/transactions', {
              userId,
              type: 'faucet_claim',
              fromToken: null,
              toToken: 'PRIOR',
              fromAmount: null,
              toAmount: '1',
              txHash,
              status: 'completed',
              blockNumber: Number(blockNumber)
            });
            console.log("Transaction recorded:", txResponse);
          } catch (txError) {
            console.error("Failed to record transaction:", txError);
          }
          
          // Immediately fetch updated user data to ensure lastClaim is updated
          if (address) {
            try {
              const updatedUserData = await apiRequest('GET', `/api/users/${address}`);
              console.log("Updated user data after claim:", updatedUserData);
            } catch (userError) {
              console.error("Failed to refresh user data:", userError);
            }
          }
          
          // Get the API response directly - apiRequest already handles the JSON parsing
          return {
            txReceipt,
            apiResponse: response
          };
        } catch (apiError) {
          // If the blockchain claim worked but the API failed, still consider it a success
          console.error("API claim error:", apiError);
          return {
            txReceipt,
            apiResponse: null
          };
        }
      } catch (error) {
        console.error("Error in claim mutation:", error);
        return { 
          success: false, 
          reason: "Failed to claim tokens. You may have already claimed today." 
        };
      }
    },
    onSuccess: (data) => {
      console.log("Claim successful:", data);
      
      // Immediately update UI to show "Already Claimed" state
      setCanClaimTokens(false);
      
      // Update our local timer state directly - this is the most important part for the UI
      const now = new Date();
      setLastClaimTime(now);
      console.log("Setting lastClaimTime after successful claim to:", now);
      
      // Store the claim time in sessionStorage for persistence across page refreshes
      try {
        sessionStorage.setItem(`lastClaim_${address}`, now.toISOString());
        console.log("Stored claim time in sessionStorage for address:", address);
      } catch (e) {
        console.error("Failed to store claim time in sessionStorage:", e);
      }
      
      // Force update the query cache if userData exists
      if (userData) {
        const updatedUserData = {
          ...userData,
          lastClaim: now.toISOString()
        };
        // Use this for local state until the query refreshes
        queryClient.setQueryData([`/api/users/${address}`], updatedUserData);
      }
      
      // Show success toast for token claim
      toast({
        title: "Token claimed successfully!",
        description: "1 PRIOR token has been sent to your wallet.",
      });
      
      // Refresh the user data and balances
      if (address) {
        // Force refetch to ensure we get the latest data
        queryClient.invalidateQueries({ queryKey: [`/api/users/${address}`] });
        updateLocalBalances();
      }
    },
    onError: (error: any) => {
      console.error("Claim error:", error);
      
      // Check for specific error messages
      let errorMessage = "An error occurred during the claim process";
      let errorTitle = "Already Claimed Today";
      let errorVariant: "default" | "destructive" = "default";
      
      const errorStr = String(error.message || error.reason || "").toLowerCase();
      
      // For ALL faucet-related errors, simplify to a user-friendly message about already claimed
      // This ensures users never see technical error messages
      errorMessage = "You have already claimed your PRIOR tokens today. Please come back tomorrow for your next claim.";
      
      // Immediately update UI to show "Already Claimed" state
      setCanClaimTokens(false);
      
      // Set lastClaim if we suspect this is because they already claimed
      const now = new Date();
      
      // Always update our local timer state regardless of userData
      setLastClaimTime(now);
      console.log("Setting lastClaimTime after claim error to:", now);
      
      // Store the claim time in sessionStorage even on error
      // This is crucial for maintaining state across refreshes/reconnects
      try {
        sessionStorage.setItem(`lastClaim_${address}`, now.toISOString());
        console.log("Stored claim time in sessionStorage after error for address:", address);
      } catch (e) {
        console.error("Failed to store claim time in sessionStorage:", e);
      }
      
      if (userData) {
        // If we get an error and don't have a lastClaim set, assume it's because they claimed
        // and set the lastClaim to now
        if (!userData.lastClaim) {
          const updatedUserData = {
            ...userData,
            lastClaim: now.toISOString()
          };
          // Use this for local state until the query refreshes
          queryClient.setQueryData([`/api/users/${address}`], updatedUserData);
        }
      }
      
      // We're always going to refresh the user data to get the updated claim time
      if (address) {
        // Immediately fetch updated user data
        apiRequest('GET', `/api/users/${address}`)
          .then(freshUserData => {
            console.log("Got fresh user data after error:", freshUserData);
            if (freshUserData?.lastClaim) {
              queryClient.setQueryData([`/api/users/${address}`], freshUserData);
            }
            
            // Then invalidate to ensure we sync with backend
            queryClient.invalidateQueries({ queryKey: [`/api/users/${address}`] });
          })
          .catch(err => {
            console.error("Error fetching fresh user data:", err);
            // Still invalidate the query to ensure we try again
            queryClient.invalidateQueries({ queryKey: [`/api/users/${address}`] });
          });
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: errorVariant
      });
    }
  });
  
  // Add a function to update local balances
  const updateLocalBalances = async () => {
    if (!tokens || tokens.length === 0 || !address) return;
    
    try {
      const balances: Record<string, string> = {};
      
      for (const token of tokens) {
        try {
          console.log(`Getting balance for ${token.symbol} at address ${token.address}`);
          const result = await getTokenBalance(token.symbol);
          console.log(`Balance for ${token.symbol}: ${result}`);
          balances[token.symbol] = result;
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
      updateLocalBalances();
    }
  }, [address, tokens]);
  
  const handleClaimTokens = async () => {
    if (!isConnected) {
      try {
        // Use the standalone connect function
        console.log("Connecting via standalone wallet...");
        await connectWallet();
        return;
      } catch (error) {
        console.error("Wallet connection failed:", error);
        toast({
          title: "Connection Failed",
          description: "Please make sure MetaMask is installed and unlocked.",
          variant: "destructive"
        });
      }
      return;
    }
    
    // First check if user data shows they've already claimed today
    // This provides a better UX by avoiding unnecessary contract calls
    if (userData?.lastClaim && !canClaimTokens) {
      const lastClaim = new Date(userData.lastClaim);
      const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
      const now = new Date();
      const hoursRemaining = Math.ceil((nextClaim.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      toast({
        title: "Already Claimed Today",
        description: `You have already claimed tokens today. Please check back in approximately ${hoursRemaining} hour${hoursRemaining !== 1 ? 's' : ''}.`,
        variant: "default"
      });
      return;
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
      setLocalBalances({});
      
      // Then call the global disconnect method from wallet context
      disconnectWallet();
      
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
                <StandaloneWalletButton 
                  variant="outline"
                  size="sm"
                  className="text-xs text-[#FF5757] hover:text-red-400 transition-colors flex items-center gap-1"
                />
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
          
          {!isConnected ? (
            <StandaloneWalletButton
              onConnect={(newAddress) => {
                console.log("Wallet connected:", newAddress);
              }}
              className="w-full rounded-lg py-4 uppercase tracking-wide"
              size="lg"
            />
          ) : canClaimTokens ? (
            <button 
              onClick={handleClaimTokens}
              disabled={claimMutation.isPending}
              className="w-full rounded-lg bg-[#1A5CFF] hover:bg-opacity-90 transition-all font-bold text-sm px-8 py-4 uppercase tracking-wide"
            >
              {claimMutation.isPending ? "Claiming..." : "Claim 1 PRIOR Token"}
            </button>
          ) : (
            <div className="w-full rounded-lg bg-gradient-to-r from-[#1a2334] to-[#1e2a3b] border border-blue-900/30 p-5 text-center">
              <div className="text-[#A0AEC0] mb-2">Already Claimed Today</div>
              <div className="font-bold text-white font-mono text-xl bg-blue-900/20 rounded-md p-2 border border-blue-800/30">
                <i className="fas fa-clock mr-2 text-blue-400"></i>
                {timeUntilNextClaim}
              </div>
              <div className="text-blue-400 text-xs mt-3">Come back in {timeUntilNextClaim.split(':')[0]} hours to claim again</div>
            </div>
          )}
          
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
                balance: localBalances[token.symbol] || getTokenBalance(token.symbol) || "0.00"
              };
              return <TokenCard key={token.symbol} token={tokenWithLocalBalance} />;
            })}
          </div>
        </div>
        
        <div className="mt-12 text-center">
          <a 
            href="/dashboard" 
            className="inline-flex items-center gap-2 text-[#1A5CFF] hover:text-blue-400 transition-colors"
          >
            <i className="fas fa-history mr-1"></i>
            Click here to see your transaction history
          </a>
        </div>
      </div>
    </section>
  );
};

export default Faucet;