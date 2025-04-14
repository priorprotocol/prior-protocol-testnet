import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/context/WalletContext";
import { useStandaloneWallet } from "@/hooks/useStandaloneWallet";
import QuestCard from "@/components/QuestCard";
import { Button } from "@/components/ui/button";
import StandaloneWalletButton from "@/components/StandaloneWalletButton";

const Quest = () => {
  // Use both wallet systems for compatibility during transition
  const { address: contextAddress } = useWallet();
  const { address: standaloneAddress, isConnected } = useStandaloneWallet();
  
  // Prefer standalone address but fall back to context address
  const address = standaloneAddress || contextAddress;
  
  // Define types for quests and user quests
  interface Quest {
    id: number;
    title: string;
    description: string;
    reward: number;
    difficulty: string;
    status: string;
    icon: string;
  }
  
  interface UserQuest {
    id: number;
    questId: number;
    status: string;
    completedAt: string | null;
  }
  
  // Get all quests
  const { data: quests = [], isLoading: questsLoading } = useQuery<Quest[]>({
    queryKey: [`/api/quests`],
  });
  
  // Get user quests if connected
  const { data: userQuests = [], isLoading: userQuestsLoading } = useQuery<UserQuest[]>({
    queryKey: [`/api/users/${address}/quests`],
    enabled: isConnected && !!address,
  });
  
  const isLoading = questsLoading || (isConnected && userQuestsLoading);
  
  return (
    <section id="quest" className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-space font-bold mb-4">Quests</h2>
          <p className="text-[#A0AEC0] max-w-2xl mx-auto mb-4">
            Complete testnet quests to earn additional PRIOR tokens and learn about the protocol's features.
          </p>
        </div>
        
        {/* Points System Card */}
        <div className="bg-[#1A1E2A] border border-[#2D3748] rounded-lg p-6 max-w-3xl mx-auto mb-12">
          <h3 className="font-space font-semibold text-xl mb-4 text-center">Points System</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">↔️</span>
                </div>
                <div>
                  <h4 className="font-semibold">Swap Tokens</h4>
                  <p className="text-[#A0AEC0] text-sm">
                    <span className="text-green-400">2 points</span> per swap when you make 10+ swaps per day
                  </p>
                  <p className="text-[#A0AEC0] text-sm">
                    <span className="text-gray-400">0 points</span> for less than 10 swaps per day
                  </p>
                  <p className="text-[#A0AEC0] text-sm mt-1">
                    <span className="text-yellow-400">Points convert to PRIOR</span> at TGE
                  </p>
                </div>
              </div>
              

              
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">🗳️</span>
                </div>
                <div>
                  <h4 className="font-semibold">Governance Voting</h4>
                  <p className="text-[#A0AEC0] text-sm">
                    <span className="text-green-400">10 points</span> for each proposal vote
                  </p>
                  <p className="text-[#A0AEC0] text-sm mt-1">
                    <span className="text-green-400">300 points</span> for voting with Prior Pioneer NFT
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">📈</span>
                </div>
                <div>
                  <h4 className="font-semibold">Liquidity Provider</h4>
                  <p className="text-[#A0AEC0] text-sm">
                    <span className="text-green-400">5 points</span> for liquidity staking
                  </p>
                  <p className="text-[#A0AEC0] text-sm mt-1">
                    <span className="text-yellow-400">Coming soon</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#141D29] rounded-lg p-4 border border-[#2D3748]">
              <h4 className="font-semibold mb-2">Earn Special Badges</h4>
              <ul className="text-sm space-y-2">
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center mr-2">
                    <span className="text-white font-bold text-xs">⭐</span>
                  </div>
                  <span>
                    <span className="font-medium text-purple-400">Power User</span>
                    <span className="text-[#A0AEC0]"> - Earn 100 points</span>
                  </span>
                </li>
                <li className="flex items-center">
                  <div className="w-6 h-6 bg-yellow-600 rounded-full flex items-center justify-center mr-2">
                    <span className="text-white font-bold text-xs">🏆</span>
                  </div>
                  <span>
                    <span className="font-medium text-yellow-400">Expert Trader</span>
                    <span className="text-[#A0AEC0]"> - Earn 500 points</span>
                  </span>
                </li>
                <li className="text-[#A0AEC0] mt-2 italic">
                  View your earned badges and points in your Dashboard
                </li>
              </ul>
            </div>
          </div>
        </div>

        {!isConnected ? (
          <div className="bg-[#141D29] rounded-lg border border-[#2D3748] p-8 text-center mb-8 max-w-2xl mx-auto">
            <h3 className="font-space font-semibold text-xl mb-4">Connect Your Wallet</h3>
            <p className="text-[#A0AEC0] mb-6">Connect your wallet to view and track your quest progress.</p>
            <StandaloneWalletButton 
              size="lg"
            />
          </div>
        ) : (
          <>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1A5CFF]"></div>
                <p className="mt-2 text-[#A0AEC0]">Loading quests...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {quests.map((quest: Quest) => {
                  const userQuest = userQuests.find((uq: UserQuest) => uq.questId === quest.id);
                  return (
                    <QuestCard 
                      key={quest.id} 
                      quest={quest} 
                      userQuest={userQuest}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
        
        <div className="mt-12 text-center">
          <p className="text-[#A0AEC0] max-w-2xl mx-auto">
            More quests will be added as the protocol evolves. Complete the available quests to earn rewards and learn about Prior Protocol features.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Quest;
