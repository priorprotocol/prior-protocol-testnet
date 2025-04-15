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
  // Use the wallet context for connection status
  const { address, isConnected, openWalletModal } = useWallet();
  
  const { toast } = useToast();
  
  // Mutation for starting a quest
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
  
  // Mutation for completing a quest
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
  
  // Get the target page URL based on quest title
  const getTargetPage = () => {
    if (quest.title.toLowerCase().includes("swap")) {
      return "/swap";
    }
    if (quest.title.toLowerCase().includes("governance") || 
        quest.title.toLowerCase().includes("vote") || 
        quest.title.toLowerCase().includes("proposal")) {
      return "/governance";
    }
    return null;
  };

  // Main function to handle the button click
  const handleButtonClick = async () => {
    // If not connected, show wallet modal
    if (!isConnected) {
      openWalletModal();
      return;
    }
    
    // Don't do anything for coming soon quests
    if (quest.status === 'coming_soon') {
      return;
    }
    
    const targetPage = getTargetPage();

    // If this is a quest that redirects to another page
    if (targetPage) {
      // Start the quest if not already started
      if (!userQuest) {
        try {
          await startQuestMutation.mutateAsync();
        } catch (error) {
          return; // Stop if there was an error starting the quest
        }
      }
      
      // Use a reliable navigation method - direct URL change
      window.location.href = targetPage;
      return;
    }
    
    // For standard quests without redirection
    if (!userQuest) {
      // Start a new quest
      startQuestMutation.mutate();
    } else if (userQuest.status === 'in_progress') {
      // Complete an in-progress quest
      completeQuestMutation.mutate();
    }
  };
  
  // Get the appropriate button text
  const getButtonText = () => {
    // Show loading states
    if (startQuestMutation.isPending) return "Starting...";
    if (completeQuestMutation.isPending) return "Completing...";
    
    // For coming soon quests
    if (quest.status === 'coming_soon') return "Coming Soon";
    
    const targetPage = getTargetPage();
    
    // For quests with redirection
    if (targetPage) {
      // Differentiate based on quest title and status
      const type = targetPage === "/swap" ? "Swap" : "Governance";
      
      if (!userQuest) return `Go to ${type}`;
      if (userQuest.status === 'in_progress') return `Go to ${type}`;
      if (userQuest.status === 'completed') return `Visit ${type} Page`;
    }
    
    // For standard quests
    if (!userQuest) return "Start Quest";
    if (userQuest.status === 'in_progress') return "Complete Quest";
    if (userQuest.status === 'completed') return "Completed";
    
    return "Start Quest";
  };
  
  // Check if the button should be disabled
  const isButtonDisabled = () => {
    // Always enable redirection quests (even when completed)
    if (getTargetPage() && userQuest?.status === 'completed') {
      return false;
    }
    
    // Otherwise disable for coming soon, completed quests or during loading
    return (
      quest.status === 'coming_soon' ||
      userQuest?.status === 'completed' ||
      startQuestMutation.isPending ||
      completeQuestMutation.isPending
    );
  };
  
  // Get the appropriate button styling class
  const getButtonClass = () => {
    // Different style for coming soon quests
    if (quest.status === 'coming_soon') {
      return "w-full rounded-lg bg-[#A0AEC0] bg-opacity-20 text-[#A0AEC0] cursor-not-allowed font-bold text-sm px-6 py-3 uppercase tracking-wide";
    }
    
    // Different style for completed quests
    if (userQuest?.status === 'completed') {
      // Completed redirection quests get hover effects
      if (getTargetPage()) {
        return "w-full rounded-lg bg-green-600 hover:bg-green-700 transition-all font-bold text-sm px-6 py-3 uppercase tracking-wide";
      }
      return "w-full rounded-lg bg-green-600 font-bold text-sm px-6 py-3 uppercase tracking-wide";
    }
    
    // Standard button style
    return "w-full rounded-lg bg-[#1A5CFF] hover:bg-opacity-90 transition-all font-bold text-sm px-6 py-3 uppercase tracking-wide";
  };

  // The component render function
  return (
    <div className={`gradient-border bg-[#141D29] p-6 shadow-lg ${quest.status === 'coming_soon' ? 'opacity-75' : ''}`}>
      {/* Header with icon and difficulty */}
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
      
      {/* Quest title and description */}
      <h3 className="font-space font-semibold text-xl mb-2">{quest.title}</h3>
      <p className="text-[#A0AEC0] text-sm mb-4">
        {quest.description}
      </p>
      
      {/* Reward information */}
      <div className="flex justify-between items-center text-sm mb-4">
        <span className="text-[#A0AEC0]">Reward</span>
        <span className="font-bold">{quest.reward} Points</span>
      </div>
      <div className="flex justify-between items-center text-xs mb-4">
        <span className="text-[#A0AEC0]">Convertible to PRIOR at TGE</span>
      </div>
      
      {/* Action button */}
      <button 
        onClick={handleButtonClick}
        disabled={isButtonDisabled()}
        className={getButtonClass()}
      >
        {getButtonText()}
      </button>
    </div>
  );
};

export default QuestCard;