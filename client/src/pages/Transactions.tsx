import { useWallet } from "@/context/WalletContext";
import { useStandaloneWallet } from "@/hooks/useStandaloneWallet";
import { TransactionHistory } from "@/components/TransactionHistory";
import StandaloneWalletButton from "@/components/StandaloneWalletButton";

const Transactions = () => {
  // Use both wallet systems for compatibility during transition
  const { address } = useWallet();
  const { address: standaloneAddress } = useStandaloneWallet();
  
  // Prefer standalone address
  const userAddress = standaloneAddress || address;

  if (!userAddress) {
    return (
      <div className="container mx-auto px-4 py-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Transaction History</h2>
          <p className="text-[#A0AEC0] mb-6">Please connect your wallet to view your transaction history.</p>
          <StandaloneWalletButton 
            size="lg"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-6">
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 inline-block">Transaction History</h2>
        <p className="text-blue-300/80 mt-2 max-w-2xl leading-relaxed">
          View a complete history of your activity on Prior Protocol
        </p>
      </div>
      <div className="bg-[#0F172A] p-6 rounded-lg border border-[#1E293B]">
        <TransactionHistory address={userAddress} />
      </div>
    </div>
  );
};

export default Transactions;