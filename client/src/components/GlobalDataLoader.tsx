import { useStandaloneWallet } from "@/hooks/useStandaloneWallet";
import { useImmediateDataLoader } from "@/hooks/useImmediateDataLoader";

/**
 * This component loads user data globally as soon as the wallet connects
 * It doesn't render anything - it just triggers the data loading hooks
 */
const GlobalDataLoader: React.FC = () => {
  // Get the current wallet address from our standalone wallet hook
  const { address } = useStandaloneWallet();
  
  // This hook will handle all the immediate data loading
  // Including both global data (loaded immediately) and user data (when wallet connects)
  useImmediateDataLoader(address);
  
  // This component doesn't render anything - it's just for side effects
  return null;
};

export default GlobalDataLoader;