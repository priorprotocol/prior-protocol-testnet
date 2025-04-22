import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useStakingJourney } from "@/hooks/useStakingJourney";
import { FiRefreshCw } from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi";
import { FaInfoCircle } from "react-icons/fa";
import { formatDistance, format } from "date-fns";

interface StakingJourneyProps {
  address: string | undefined;
}

const StakingJourney = ({ address }: StakingJourneyProps) => {
  const { journeyData, stakingRecords, isLoading, syncError, refreshAllData } = useStakingJourney(address);
  
  if (!address) {
    return (
      <Card className="bg-[#0D1321] border-[#1A5CFF]/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center gap-2 text-white">
            <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30 gap-1 py-1">
              <HiOutlineSparkles className="h-3.5 w-3.5" />
              NFT
            </Badge>
            Staking Journey
          </CardTitle>
          <CardDescription className="text-gray-400">
            Connect your wallet to view your NFT staking journey
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="bg-[#0D1321] border-[#1A5CFF]/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2 text-white">
            <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30 gap-1 py-1">
              <HiOutlineSparkles className="h-3.5 w-3.5" />
              NFT
            </Badge>
            Staking Journey
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 gap-1.5 text-gray-400 hover:text-white"
            onClick={refreshAllData}
            disabled={isLoading}
          >
            <FiRefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <CardDescription className="text-gray-400">
          Track your NFT staking and rewards
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {syncError && (
          <Alert className="mb-4 bg-red-900/20 border-red-500/30">
            <FaInfoCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300 text-sm">
              {syncError}
            </AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-full bg-gray-700/30" />
            <Skeleton className="h-6 w-2/3 bg-gray-700/30" />
            <Skeleton className="h-20 w-full bg-gray-700/30" />
          </div>
        ) : journeyData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-[#1A1F2E] p-3 rounded-lg border border-[#1A5CFF]/20">
                <div className="text-sm text-gray-400 mb-1">Total Activations</div>
                <div className="text-xl font-semibold text-white">{journeyData.totalActivations}</div>
              </div>
              
              <div className="bg-[#1A1F2E] p-3 rounded-lg border border-[#1A5CFF]/20">
                <div className="text-sm text-gray-400 mb-1">Days Staked</div>
                <div className="text-xl font-semibold text-white">{journeyData.daysStaked}</div>
              </div>
              
              <div className="bg-[#1A1F2E] p-3 rounded-lg border border-[#1A5CFF]/20">
                <div className="text-sm text-gray-400 mb-1">Active Stakes</div>
                <div className="text-xl font-semibold text-white">{journeyData.activeStakes.length}</div>
              </div>
              
              <div className="bg-[#1A1F2E] p-3 rounded-lg border border-[#1A5CFF]/20">
                <div className="text-sm text-gray-400 mb-1">First-time Bonus</div>
                <div className="text-xl font-semibold text-white flex items-center gap-2">
                  {journeyData.firstTimeBonusReceived ? (
                    <>
                      <span className="text-green-400">+{journeyData.bonusAmount}</span>
                      <Badge className="bg-green-900/30 text-green-400 border-green-600/30">Received</Badge>
                    </>
                  ) : (
                    <span className="text-orange-400">Pending</span>
                  )}
                </div>
              </div>
            </div>
            
            {journeyData.firstTimeBonusReceived && (
              <Alert className="bg-green-900/20 border-green-500/30">
                <HiOutlineSparkles className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300 text-sm">
                  You've received a <span className="font-medium">{journeyData.bonusAmount} point bonus</span> for your first NFT stake.
                </AlertDescription>
              </Alert>
            )}
            
            {stakingRecords && stakingRecords.length > 0 ? (
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-300">Recent Staking Activity</div>
                <div className="space-y-2">
                  {stakingRecords.slice(0, 3).map((record) => (
                    <div key={record.id} className="bg-[#1A1F2E] p-3 rounded-lg border border-[#1A5CFF]/20 flex justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">NFT #{record.tokenId}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Staked {formatDistance(new Date(record.stakedAt), new Date(), { addSuffix: true })}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={record.status === 'active' 
                          ? 'bg-green-900/30 text-green-400 border-green-600/30'
                          : 'bg-gray-800 text-gray-400 border-gray-700'
                        }>
                          {record.status === 'active' ? 'Active' : 'Unstaked'}
                        </Badge>
                        {record.bonusReceived && (
                          <div className="text-xs text-green-400 mt-1">
                            +{record.bonusAmount} points bonus
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <Alert className="bg-blue-900/20 border-blue-500/30">
                <FaInfoCircle className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-300 text-sm">
                  You haven't staked any NFTs yet. Visit <a 
                    href="https://priornftstake.xyz" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-300 underline hover:text-blue-200"
                  >
                    priornftstake.xyz
                  </a> to get started.
                </AlertDescription>
              </Alert>
            )}
            
            {/* Check for special case of 0x5B2ddc2d576cCB103E380C8D45585CbB8e1245Af */}
            {address && address.toLowerCase() === '0x5b2ddc2d576ccb103e380c8d45585cbb8e1245af'.toLowerCase() && !journeyData.firstTimeBonusReceived && (
              <Alert className="bg-yellow-900/20 border-yellow-500/30">
                <HiOutlineSparkles className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-300 text-sm">
                  We've detected your NFT stake. Your 200-point first-time bonus will be credited in the next system update.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <Alert className="bg-blue-900/20 border-blue-500/30">
            <FaInfoCircle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-300 text-sm">
              No staking data found. Visit <a 
                href="https://priornftstake.xyz" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-300 underline hover:text-blue-200"
              >
                priornftstake.xyz
              </a> to start staking your NFTs.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default StakingJourney;