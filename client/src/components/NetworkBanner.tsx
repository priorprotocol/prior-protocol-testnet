import { useWallet } from "@/context/WalletContext";

const NetworkBanner = () => {
  try {
    const { isConnected, chainId } = useWallet();
    
    // Check if connected to Base Sepolia testnet (chainId 84532)
    const isBaseSepoliaNetwork = chainId === 84532;
    
    if (!isConnected) return null;
    
    return (
      <div className="bg-[#FF6B00] bg-opacity-10 py-3 border-t border-b border-[#FF6B00] border-opacity-30">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center gap-2 text-sm">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6B00] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF6B00]"></span>
            </span>
            {isBaseSepoliaNetwork ? (
              <span className="text-[#FF6B00]">You are currently connected to Base Sepolia Testnet</span>
            ) : (
              <span className="text-[#FF6B00]">Please switch to Base Sepolia Testnet</span>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    // If WalletProvider is not available, don't render anything
    return null;
  }
};

export default NetworkBanner;
