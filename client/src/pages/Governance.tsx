import { useStandaloneWallet } from "@/hooks/useStandaloneWallet";
import StandaloneWalletButton from "@/components/StandaloneWalletButton";
import { motion } from "framer-motion";

// Import the global type definitions
declare global {
  interface Window {
    disconnectWallet?: () => void;
  }
}

const Governance = () => {
  const { isConnected } = useStandaloneWallet();
  
  return (
    <section id="governance" className="py-16 bg-[#0B1118] bg-opacity-40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-space font-bold mb-4">Governance</h2>
          <p className="text-[#A0AEC0] max-w-2xl mx-auto">
            Participate in decentralized governance by voting on proposals using your PRIOR tokens.
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          {!isConnected ? (
            <div className="bg-[#141D29] rounded-lg border border-[#2D3748] p-8 text-center mb-8">
              <h3 className="font-space font-semibold text-xl mb-4">Connect Your Wallet</h3>
              <p className="text-[#A0AEC0] mb-6">Connect your wallet to prepare for governance participation.</p>
              <StandaloneWalletButton 
                size="lg"
              />
            </div>
          ) : (
            <div className="text-center">
              {/* Disconnect wallet button */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => {
                    // Call the global disconnect function from window
                    if (typeof window !== 'undefined' && window.disconnectWallet) {
                      window.disconnectWallet();
                    }
                  }}
                  className="flex items-center gap-2 bg-[#1E2A3B] hover:bg-[#283548] text-[#A0AEC0] px-3 py-1 rounded text-sm transition-colors"
                >
                  <i className="fas fa-power-off text-red-500"></i>
                  Disconnect Wallet
                </button>
              </div>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-[#141D29] rounded-lg border border-[#2D3748] p-12 text-center mb-8 relative overflow-hidden"
              >
                {/* Decorative elements */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"></div>
                
                <div className="mb-6">
                  <div className="w-20 h-20 rounded-full bg-[#1A5CFF] bg-opacity-20 flex items-center justify-center mx-auto">
                    <i className="fas fa-landmark text-[#1A5CFF] text-3xl"></i>
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold mb-4">Governance Coming Soon</h2>
                <p className="text-[#A0AEC0] text-lg max-w-2xl mx-auto mb-8">
                  The governance module is currently under development. Soon you'll be able to create 
                  and vote on proposals that shape the future of the Prior Protocol.
                </p>
                
                <div className="inline-flex items-center px-4 py-2 rounded-md bg-[#1A5CFF] bg-opacity-10 text-[#1A5CFF]">
                  <i className="fas fa-clock mr-2"></i>
                  <span>Check back for updates</span>
                </div>
              </motion.div>
              
              <div className="px-4 py-6 bg-[#141D29] bg-opacity-50 border border-[#2D3748] rounded-md text-[#A0AEC0] inline-block">
                <p>
                  <i className="fas fa-info-circle mr-2 text-[#1A5CFF]"></i>
                  Governance participation will earn you 10 points per vote and 300 points with a Prior Pioneer NFT
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Governance;
