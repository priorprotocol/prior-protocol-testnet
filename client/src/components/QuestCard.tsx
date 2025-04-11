import React from "react";
import { useWallet } from "@/context/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

interface QuestCardProps {
  quest: {
    id: number;
    title: string;
    description: string;
    reward: number;
    difficulty: string;
    status: string;
    icon: string;
  };
  userQuest?: {
    id: number;
    status: string;
    completedAt: string | null;
  };
}

const QuestCard: React.FC<QuestCardProps> = ({ quest, userQuest }) => {
  // Use the wallet context directly
  const { address, isConnected, connectWallet, openWalletModal } = useWallet();
  
  const { toast } = useToast();
  
  const startQuestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/quests/${quest.id}/start`, { address });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Quest started!",
        description: `You've started the "${quest.title}" quest.`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${address}/quests`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to start quest",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const completeQuestMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/quests/${quest.id}/complete`, { address });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Quest completed!",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${address}/quests`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to complete quest",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleQuestAction = async () => {
    if (!isConnected) {
      openWalletModal();
      return; // Open wallet modal and wait for user to connect
    }
    
    if (quest.status === 'coming_soon') {
      return;
    }
    
    if (!userQuest) {
      startQuestMutation.mutate();
    } else if (userQuest.status === 'in_progress') {
      completeQuestMutation.mutate();
    }
  };
  
  const getButtonText = () => {
    if (startQuestMutation.isPending) return "Starting...";
    if (completeQuestMutation.isPending) return "Completing...";
    
    if (quest.status === 'coming_soon') return "Coming Soon";
    if (!userQuest) return "Start Quest";
    if (userQuest.status === 'in_progress') return "Complete Quest";
    if (userQuest.status === 'completed') return "Completed";
    
    return "Start Quest";
  };
  
  const isButtonDisabled = () => {
    return (
      quest.status === 'coming_soon' ||
      userQuest?.status === 'completed' ||
      startQuestMutation.isPending ||
      completeQuestMutation.isPending
    );
  };
  
  const getButtonClass = () => {
    if (quest.status === 'coming_soon') {
      return "w-full rounded-lg bg-[#A0AEC0] bg-opacity-20 text-[#A0AEC0] cursor-not-allowed font-bold text-sm px-6 py-3 uppercase tracking-wide";
    }
    
    if (userQuest?.status === 'completed') {
      return "w-full rounded-lg bg-green-600 font-bold text-sm px-6 py-3 uppercase tracking-wide";
    }
    
    return "w-full rounded-lg bg-[#1A5CFF] hover:bg-opacity-90 transition-all font-bold text-sm px-6 py-3 uppercase tracking-wide";
  };
  
  return (
    <div className={`gradient-border bg-[#141D29] p-6 shadow-lg ${quest.status === 'coming_soon' ? 'opacity-75' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="w-12 h-12 rounded-full bg-[#1A5CFF] flex items-center justify-center">
          <i className={`fas fa-${quest.icon} text-xl`}></i>
        </div>
        <div className={`${quest.difficulty === 'Beginner' 
          ? 'bg-[#1A5CFF] bg-opacity-20 text-[#1A5CFF]' 
          : quest.difficulty === 'Intermediate' 
          ? 'bg-[#1A5CFF] bg-opacity-20 text-[#1A5CFF]' 
          : 'bg-[#FF6B00] bg-opacity-20 text-[#FF6B00]'} 
          px-3 py-1 rounded-full text-xs font-medium`}
        >
          {quest.difficulty}
        </div>
      </div>
      <h3 className="font-space font-semibold text-xl mb-2">{quest.title}</h3>
      <p className="text-[#A0AEC0] text-sm mb-4">
        {quest.description}
      </p>
      <div className="flex justify-between items-center text-sm mb-4">
        <span className="text-[#A0AEC0]">Reward</span>
        <span className="font-bold">{quest.reward} PRIOR</span>
      </div>
      <button 
        onClick={handleQuestAction}
        disabled={isButtonDisabled()}
        className={getButtonClass()}
      >
        {getButtonText()}
      </button>
    </div>
  );
};

export default QuestCard;
