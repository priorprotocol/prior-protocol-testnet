import { useWallet } from "@/context/WalletContext";
import { useToast } from "@/hooks/use-toast";

const WalletModal = () => {
  const { toast } = useToast();
  
  try {
    const { 
      isWalletModalOpen, 
      closeWalletModal, 
      connectWithMetaMask,
      connectWithWalletConnect,
      connectWithCoinbaseWallet
    } = useWallet();
    
    // Add a direct connection handler for debugging
    const handleMetaMaskConnect = async () => {
      try {
        console.log("Attempting direct MetaMask connection from wallet modal...");
        
        // Direct connect using window.ethereum
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
          if (accounts && accounts.length > 0) {
            console.log("Successfully connected to account:", accounts[0]);
            // Save to localStorage for persistence
            localStorage.setItem('walletState', JSON.stringify({
              address: accounts[0],
              timestamp: Date.now()
            }));
            
            // Call connect after successful connection
            await connectWithMetaMask();
            
            // Close modal on success
            closeWalletModal();
            return;
          }
        }
        
        // Fallback to normal connect
        await connectWithMetaMask();
      } catch (error) {
        console.error("MetaMask connection error:", error);
        toast({
          title: "Connection Error",
          description: "Failed to connect to MetaMask. Please make sure it's installed and try again.",
          variant: "destructive"
        });
      }
    };
    
    if (!isWalletModalOpen) return null;
    
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div 
          className="absolute inset-0 bg-black bg-opacity-75"
          onClick={closeWalletModal}
        ></div>
        <div className="gradient-border bg-[#141D29] p-6 max-w-md w-full relative z-10 rounded-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-space font-semibold text-xl">Connect Wallet</h3>
            <button 
              onClick={closeWalletModal}
              className="text-[#A0AEC0] hover:text-white transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="space-y-4 mb-6">
            <button 
              onClick={handleMetaMaskConnect}
              className="w-full flex items-center justify-between bg-[#111827] hover:bg-opacity-80 transition-colors p-4 rounded-lg"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-[#F6851B] rounded-full flex items-center justify-center mr-3">
                  <i className="fas fa-fox text-white"></i>
                </div>
                <span className="font-medium">MetaMask</span>
              </div>
              <i className="fas fa-chevron-right text-[#A0AEC0]"></i>
            </button>
            
            <button 
              onClick={connectWithCoinbaseWallet}
              className="w-full flex items-center justify-between bg-[#111827] hover:bg-opacity-80 transition-colors p-4 rounded-lg"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-[#0052FF] rounded-full flex items-center justify-center mr-3">
                  <i className="fas fa-wallet text-white"></i>
                </div>
                <span className="font-medium">Coinbase Wallet</span>
              </div>
              <i className="fas fa-chevron-right text-[#A0AEC0]"></i>
            </button>
            
            <button 
              onClick={connectWithWalletConnect}
              className="w-full flex items-center justify-between bg-[#111827] hover:bg-opacity-80 transition-colors p-4 rounded-lg"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-[#3B99FC] rounded-full flex items-center justify-center mr-3">
                  <i className="fas fa-link text-white"></i>
                </div>
                <span className="font-medium">WalletConnect</span>
              </div>
              <i className="fas fa-chevron-right text-[#A0AEC0]"></i>
            </button>
          </div>
          
          <div className="text-sm text-[#A0AEC0] text-center">
            <p>By connecting your wallet, you agree to the <a href="#" className="text-[#1A5CFF] hover:underline">Terms of Service</a> and <a href="#" className="text-[#1A5CFF] hover:underline">Privacy Policy</a>.</p>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    // If WalletProvider is not available, don't render anything
    return null;
  }
};

export default WalletModal;
