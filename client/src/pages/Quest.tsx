import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/context/WalletContext";
import { useStandaloneWallet } from "@/hooks/useStandaloneWallet";
import QuestCard from "@/components/QuestCard";
import { Button } from "@/components/ui/button";
import StandaloneWalletButton from "@/components/StandaloneWalletButton";
import { LogOut } from "lucide-react";

const Quest = () => {
  // Use both wallet systems for compatibility during transition
  const { address: contextAddress } = useWallet();
  const { address: standaloneAddress, isConnected, disconnect } = useStandaloneWallet();
  
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
                    <span className="text-green-400">1.5 points</span> for each swap
                  </p>
                  <p className="text-[#A0AEC0] text-sm">
                    <span className="text-blue-400">Maximum 5 swaps daily</span> (7.5 pts max per day)
                  </p>
                  <p className="text-[#A0AEC0] text-sm mt-1">
                    <span className="text-yellow-400">Points convert to PRIOR</span> at TGE
                  </p>
                </div>
              </div>
              
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">ℹ️</span>
                </div>
                <div>
                  <h4 className="font-semibold">Other Activities</h4>
                  <p className="text-[#A0AEC0] text-sm">
                    <span className="text-gray-400">0 points</span> for all other activities currently
                  </p>
                  <p className="text-[#A0AEC0] text-sm">
                    Under the new simplified points system, only swaps earn points
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#141D29] rounded-lg p-4 border border-[#2D3748]">
              <h4 className="font-semibold mb-2">How Points Work</h4>
              <ul className="text-sm space-y-3">
                <li className="flex items-start">
                  <div className="min-w-6 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-2 mt-0.5">
                    <span className="text-white font-bold text-xs">1</span>
                  </div>
                  <span className="text-[#A0AEC0]">
                    Complete activities to earn points
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="min-w-6 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-2 mt-0.5">
                    <span className="text-white font-bold text-xs">2</span>
                  </div>
                  <span className="text-[#A0AEC0]">
                    Track your progress in the Dashboard
                  </span>
                </li>
                <li className="flex items-start">
                  <div className="min-w-6 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center mr-2 mt-0.5">
                    <span className="text-white font-bold text-xs">3</span>
                  </div>
                  <span className="text-[#A0AEC0]">
                    All points will be converted to PRIOR tokens at TGE
                  </span>
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
          <p className="text-[#A0AEC0] max-w-2xl mx-auto mb-6">
            More quests will be added as the protocol evolves. Complete the available quests to earn rewards and learn about Prior Protocol features.
          </p>
          
          {isConnected && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={disconnect}
              className="mx-auto mt-2"
            >
              <LogOut size={16} className="mr-2" />
              Disconnect Wallet
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export default Quest;
