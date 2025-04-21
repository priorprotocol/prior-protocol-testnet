import { Link } from "wouter";
import { Leaderboard } from "@/components/Leaderboard";
import { FaTrophy, FaExchangeAlt } from "react-icons/fa";

const Home = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="pt-12 pb-12">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-space font-bold leading-tight mb-6">
              Welcome to <span className="text-[#1A5CFF]">Prior Protocol</span> Testnet
            </h1>
            <p className="text-[#A0AEC0] text-lg md:text-xl mb-12 max-w-3xl mx-auto">
              Experience the future of decentralized finance on Base Sepolia testnet. Swap tokens, complete quests, and participate in governance.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/faucet" className="rounded-full bg-[#1A5CFF] hover:bg-opacity-90 transition-all font-bold text-sm px-8 py-3 uppercase tracking-wide">
                Claim Tokens
              </Link>
              <a 
                href="https://priorprotocol.gitbook.io/whitepaper" 
                target="_blank" 
                rel="noopener noreferrer"
                className="rounded-full bg-transparent border border-[#1A5CFF] text-[#1A5CFF] hover:bg-[#1A5CFF] hover:bg-opacity-10 transition-all font-bold text-sm px-8 py-3 uppercase tracking-wide"
              >
                Read Whitepaper
              </a>
            </div>
          </div>
        </div>
      </section>
      
      {/* Real-time Leaderboard Section */}
      <section className="py-10 bg-gradient-to-b from-[#0B1118] to-[#131B25]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center bg-blue-900/30 px-4 py-2 rounded-full mb-4">
              <FaTrophy className="text-amber-500 mr-2" />
              <span className="text-blue-200 font-medium">Real-time Leaderboard</span>
              <span className="ml-2 bg-green-500 animate-pulse h-2 w-2 rounded-full"></span>
            </div>
            <h2 className="text-3xl md:text-4xl font-space font-bold mb-4">Prior Protocol Community Rankings</h2>
            <div className="flex justify-center items-center gap-2">
              <FaExchangeAlt className="text-blue-400" />
              <p className="text-[#A0AEC0]">
                <span className="text-emerald-400 font-bold">1.5 points</span> per swap, max <span className="text-emerald-400 font-bold">5 swaps daily</span> (7.5 points max)
              </p>
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <Leaderboard limit={10} />
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-[#0B1118] bg-opacity-40">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-space font-bold mb-4">Testnet Features</h2>
            <p className="text-[#A0AEC0] max-w-2xl mx-auto">
              Explore the full range of Prior Protocol features in a safe testnet environment.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="gradient-border bg-[#141D29] p-6 shadow-lg">
              <div className="w-12 h-12 rounded-full bg-[#1A5CFF] flex items-center justify-center mb-4">
                <i className="fas fa-faucet text-xl"></i>
              </div>
              <h3 className="font-space font-semibold text-xl mb-2">Token Faucet</h3>
              <p className="text-[#A0AEC0] text-sm">
                Claim free testnet tokens daily to interact with the protocol and test its features.
              </p>
              <Link
                href="/faucet"
                className="mt-4 inline-block text-[#1A5CFF] font-medium hover:underline"
              >
                Get tokens <i className="fas fa-arrow-right ml-1"></i>
              </Link>
            </div>
            
            {/* Feature 2 */}
            <div className="gradient-border bg-[#141D29] p-6 shadow-lg">
              <div className="w-12 h-12 rounded-full bg-[#FF6B00] flex items-center justify-center mb-4">
                <i className="fas fa-exchange-alt text-xl"></i>
              </div>
              <h3 className="font-space font-semibold text-xl mb-2">Token Swap</h3>
              <p className="text-[#A0AEC0] text-sm">
                Swap between various testnet tokens with our decentralized exchange interface.
              </p>
              <Link
                href="/swap"
                className="mt-4 inline-block text-[#FF6B00] font-medium hover:underline"
              >
                Start swapping <i className="fas fa-arrow-right ml-1"></i>
              </Link>
            </div>
            
            {/* Feature 3 */}
            <div className="gradient-border bg-[#141D29] p-6 shadow-lg">
              <div className="w-12 h-12 rounded-full bg-[#1A5CFF] flex items-center justify-center mb-4">
                <i className="fas fa-tasks text-xl"></i>
              </div>
              <h3 className="font-space font-semibold text-xl mb-2">Quests</h3>
              <p className="text-[#A0AEC0] text-sm">
                Complete tasks to earn additional tokens and learn about the protocol features.
              </p>
              <Link
                href="/quest"
                className="mt-4 inline-block text-[#1A5CFF] font-medium hover:underline"
              >
                View quests <i className="fas fa-arrow-right ml-1"></i>
              </Link>
            </div>
            
            {/* Feature 4 */}
            <div className="gradient-border bg-[#141D29] p-6 shadow-lg">
              <div className="w-12 h-12 rounded-full bg-[#FF6B00] flex items-center justify-center mb-4">
                <i className="fas fa-vote-yea text-xl"></i>
              </div>
              <h3 className="font-space font-semibold text-xl mb-2">Governance</h3>
              <p className="text-[#A0AEC0] text-sm">
                Vote on test proposals and participate in decentralized governance.
              </p>
              <Link
                href="/governance"
                className="mt-4 inline-block text-[#FF6B00] font-medium hover:underline"
              >
                Participate <i className="fas fa-arrow-right ml-1"></i>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Home;
