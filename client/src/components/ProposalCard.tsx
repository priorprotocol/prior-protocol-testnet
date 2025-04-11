import React, { useState } from "react";
import { useWallet } from "@/context/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";

interface ProposalCardProps {
  proposal: {
    id: number;
    title: string;
    description: string;
    status: string;
    endTime: string;
    yesVotes: number;
    noVotes: number;
  };
}

const ProposalCard: React.FC<ProposalCardProps> = ({ proposal }) => {
  // Use the wallet context directly
  const { address, isConnected, userId, openWalletModal } = useWallet();
  
  const { toast } = useToast();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const totalVotes = proposal.yesVotes + proposal.noVotes;
  const yesPercentage = totalVotes > 0 ? Math.round((proposal.yesVotes / totalVotes) * 100) : 0;
  const noPercentage = totalVotes > 0 ? Math.round((proposal.noVotes / totalVotes) * 100) : 0;
  
  // Calculate time remaining
  const endDate = new Date(proposal.endTime);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Check if user has voted
  const { data: userVote } = useQuery<{id: number, userId: number, proposalId: number, vote: string, votedAt: string}>({
    queryKey: [`/api/users/${address}/proposals/${proposal.id}/vote`],
    enabled: isConnected && !!userId
  });
  
  const hasVoted = !!userVote?.id;
  
  // Vote mutation
  const voteMutation = useMutation({
    mutationFn: async ({ vote }: { vote: string }) => {
      const response = await apiRequest('POST', `/api/proposals/${proposal.id}/vote`, {
        userId,
        vote
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Vote cast successfully!",
        description: "Your vote has been recorded on the proposal.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/proposals`] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${address}/proposals/${proposal.id}/vote`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to cast vote",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  const handleVote = (vote: string) => {
    if (!isConnected) {
      openWalletModal();
      return;
    }
    
    voteMutation.mutate({ vote });
  };
  
  return (
    <div className="gradient-border bg-[#141D29] p-6 shadow-lg">
      <div className="flex flex-col md:flex-row justify-between mb-4 gap-4">
        <div>
          <h4 className="font-space font-semibold text-lg mb-2">{proposal.title}</h4>
          <p className="text-[#A0AEC0] text-sm">
            {proposal.description}
          </p>
        </div>
        <div className="flex flex-col items-end">
          <div className="px-3 py-1 bg-green-500 bg-opacity-20 text-green-500 rounded-full text-xs font-medium mb-2">
            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
          </div>
          <div className="text-sm text-[#A0AEC0]">
            {diffDays > 0 ? `Ends in ${diffDays} ${diffDays === 1 ? 'day' : 'days'}` : 'Ended'}
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-[#A0AEC0] mb-2">
          <span>Votes</span>
          <span>{yesPercentage}% Yes / {noPercentage}% No</span>
        </div>
        <div className="w-full h-2 bg-[#0B1118] rounded-full overflow-hidden">
          <div 
            className="h-full bg-green-500 rounded-full" 
            style={{ width: `${yesPercentage}%` }}
          ></div>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <button 
          onClick={() => handleVote('yes')}
          disabled={hasVoted || voteMutation.isPending}
          className={`rounded-lg ${hasVoted ? 'bg-opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'} transition-all font-medium text-sm px-5 py-2 bg-green-600`}
        >
          {voteMutation.isPending ? "Voting..." : "Vote Yes"}
        </button>
        <button 
          onClick={() => handleVote('no')}
          disabled={hasVoted || voteMutation.isPending}
          className={`rounded-lg ${hasVoted ? 'bg-opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'} transition-all font-medium text-sm px-5 py-2 bg-red-600`}
        >
          {voteMutation.isPending ? "Voting..." : "Vote No"}
        </button>
        <button 
          onClick={() => setIsDetailsOpen(!isDetailsOpen)}
          className="rounded-lg bg-[#111827] hover:bg-opacity-90 transition-all font-medium text-sm px-5 py-2"
        >
          {isDetailsOpen ? "Hide Details" : "View Details"}
        </button>
      </div>
      
      {isDetailsOpen && (
        <div className="mt-4 p-4 bg-[#0B1118] rounded-lg">
          <div className="mb-2">
            <span className="text-sm font-semibold">Proposal Details</span>
          </div>
          <p className="text-sm text-[#A0AEC0] mb-2">
            {proposal.description}
          </p>
          <div className="text-sm text-[#A0AEC0]">
            <div>ID: {proposal.id}</div>
            <div>Status: {proposal.status}</div>
            <div>End Date: {new Date(proposal.endTime).toLocaleString()}</div>
            <div>Yes Votes: {proposal.yesVotes}</div>
            <div>No Votes: {proposal.noVotes}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalCard;
