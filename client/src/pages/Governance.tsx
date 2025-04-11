import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useWallet } from "@/context/WalletContext";
import ProposalCard from "@/components/ProposalCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Governance = () => {
  // Use the wallet context directly
  const { isConnected, address, getTokenBalance, openWalletModal, disconnectWallet } = useWallet();
  
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  const [daysToVote, setDaysToVote] = useState(5);
  
  // Get all proposals
  interface Proposal {
    id: number;
    title: string;
    description: string;
    status: string;
    endTime: string;
    yesVotes: number;
    noVotes: number;
  }
  
  const { data: proposals = [], isLoading: proposalsLoading } = useQuery<Proposal[]>({
    queryKey: [`/api/proposals`],
  });
  
  const userVotingPower = parseFloat(getTokenBalance("PRIOR"));
  
  const handleCreateProposal = () => {
    // This would normally connect to the blockchain to create a proposal
    toast({
      title: "Feature Coming Soon",
      description: "Proposal creation will be available in the next update.",
    });
    setIsCreateDialogOpen(false);
  };
  
  return (
    <section id="governance" className="py-16 bg-[#0B1118] bg-opacity-40">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-space font-bold mb-4">Governance</h2>
          <p className="text-[#A0AEC0] max-w-2xl mx-auto">
            Participate in decentralized governance by voting on test proposals using your PRIOR tokens.
          </p>
        </div>
        
        <div className="max-w-6xl mx-auto">
          {!isConnected ? (
            <div className="bg-[#141D29] rounded-lg border border-[#2D3748] p-8 text-center mb-8">
              <h3 className="font-space font-semibold text-xl mb-4">Connect Your Wallet</h3>
              <p className="text-[#A0AEC0] mb-6">Connect your wallet to view and participate in governance proposals.</p>
              <Button 
                onClick={async () => {
                  console.log("Governance: Opening wallet modal");
                  await openWalletModal();
                }}
                className="rounded-lg bg-[#1A5CFF] hover:bg-opacity-90 transition-all font-bold text-sm px-6 py-3"
              >
                Connect Wallet
              </Button>
            </div>
          ) : (
            <div>
              <div className="mb-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                  <div className="flex items-center space-x-4">
                    <h3 className="font-space font-semibold text-xl">Active Proposals</h3>
                    {proposals.length > 0 && (
                      <div className="px-3 py-1 bg-green-500 bg-opacity-20 text-green-500 rounded-full text-xs font-medium">
                        {proposals.filter((p: Proposal) => p.status === 'active').length} Active
                      </div>
                    )}
                  </div>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="rounded-lg bg-[#1A5CFF] hover:bg-opacity-90 transition-all font-bold text-sm px-6 py-3 uppercase tracking-wide">
                        Create Proposal
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-[#141D29] text-white border-[#2D3748]">
                      <DialogHeader>
                        <DialogTitle className="text-white">Create New Proposal</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Proposal Title</Label>
                          <Input 
                            id="title" 
                            placeholder="PIP-XXX: Your proposal title" 
                            value={proposalTitle}
                            onChange={(e) => setProposalTitle(e.target.value)}
                            className="bg-[#0B1118] border-[#2D3748] text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea 
                            id="description" 
                            placeholder="Describe your proposal in detail..." 
                            rows={5}
                            value={proposalDescription}
                            onChange={(e) => setProposalDescription(e.target.value)}
                            className="bg-[#0B1118] border-[#2D3748] text-white resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="days">Voting Period (days)</Label>
                          <Input 
                            id="days" 
                            type="number" 
                            min={1} 
                            max={30} 
                            value={daysToVote}
                            onChange={(e) => setDaysToVote(parseInt(e.target.value))}
                            className="bg-[#0B1118] border-[#2D3748] text-white"
                          />
                        </div>
                        <Button 
                          onClick={handleCreateProposal}
                          className="w-full bg-[#1A5CFF] hover:bg-opacity-90"
                        >
                          Create Proposal
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                {/* Proposal List */}
                {proposalsLoading ? (
                  <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1A5CFF]"></div>
                    <p className="mt-2 text-[#A0AEC0]">Loading proposals...</p>
                  </div>
                ) : proposals.length > 0 ? (
                  <div className="space-y-4">
                    {proposals.map((proposal: Proposal) => (
                      <ProposalCard key={proposal.id} proposal={proposal} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-[#141D29] rounded-lg border border-[#2D3748]">
                    <p className="text-[#A0AEC0]">No proposals found. Be the first to create one!</p>
                  </div>
                )}
              </div>
              
              {/* Voting Power */}
              <div className="gradient-border bg-[#141D29] p-6 shadow-lg">
                <h3 className="font-space font-semibold text-lg mb-4">Your Voting Power</h3>
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="text-[#A0AEC0] text-sm mb-2">PRIOR Balance</div>
                    <div className="text-2xl font-bold font-space">{getTokenBalance("PRIOR")} PRIOR</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[#A0AEC0] text-sm mb-2">Voting Power</div>
                    <div className="text-2xl font-bold font-space">{userVotingPower} votes</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[#A0AEC0] text-sm mb-2">Delegated To</div>
                    <div className="text-md font-medium text-[#A0AEC0]">No delegation</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Governance;
