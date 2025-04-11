import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/context/WalletContext";
import QuestCard from "@/components/QuestCard";
import { Button } from "@/components/ui/button";

const Quest = () => {
  // Use the wallet context directly
  const { isConnected, address, openWalletModal, disconnectWallet } = useWallet();
  
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
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-space font-bold mb-4">Quests</h2>
          <p className="text-[#A0AEC0] max-w-2xl mx-auto">
            Complete testnet quests to earn additional PRIOR tokens and learn about the protocol's features.
          </p>
        </div>

        {!isConnected ? (
          <div className="bg-[#141D29] rounded-lg border border-[#2D3748] p-8 text-center mb-8 max-w-2xl mx-auto">
            <h3 className="font-space font-semibold text-xl mb-4">Connect Your Wallet</h3>
            <p className="text-[#A0AEC0] mb-6">Connect your wallet to view and track your quest progress.</p>
            <Button 
              onClick={() => {
                console.log("Quest: Opening wallet modal");
                openWalletModal();
              }}
              className="rounded-lg bg-[#1A5CFF] hover:bg-opacity-90 transition-all font-bold text-sm px-6 py-3"
            >
              Connect Wallet
            </Button>
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
