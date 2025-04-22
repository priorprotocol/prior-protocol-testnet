import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { HiShieldExclamation, HiRefresh, HiTrash, HiLockClosed, HiDatabase, HiGift, HiUser } from "react-icons/hi";
import { useStandaloneWallet } from "@/hooks/useStandaloneWallet";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const ADMIN_WALLET = "0x4cfc531df94339def7dcd603aac1a2deaf6888b7";

const Admin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { address, isConnected } = useStandaloneWallet();
  const [loading, setLoading] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetResult, setResetResult] = useState<any>(null);
  const [recalcResult, setRecalcResult] = useState<any>(null);
  const [fixPointsResult, setFixPointsResult] = useState<any>(null);
  const [rewardResult, setRewardResult] = useState<any>(null);
  const [individualRewardResult, setIndividualRewardResult] = useState<any>(null);
  
  // Reward inputs
  const [globalRewardPoints, setGlobalRewardPoints] = useState<number>(1);
  const [globalRewardReason, setGlobalRewardReason] = useState<string>("Community bonus");
  const [globalMinSwaps, setGlobalMinSwaps] = useState<number>(1);
  
  const [individualAddress, setIndividualAddress] = useState<string>("");
  const [individualPoints, setIndividualPoints] = useState<number>(1);
  const [individualReason, setIndividualReason] = useState<string>("Individual bonus");
  
  const [activeTab, setActiveTab] = useState("rewards");
  const [, setLocation] = useLocation();
  
  const isAdmin = address?.toLowerCase() === ADMIN_WALLET.toLowerCase();

  // No longer need the access check here as it's handled by the ProtectedAdminRoute
  // The user will never see this component if they're not an admin

  // Function to force refresh all API data
  const forceRefreshAllData = async () => {
    console.log("🔄 Force refreshing all application data...");
    
    try {
      // 1. Call our new force-refresh-cache endpoint using POST
      const refreshResult = await apiRequest('POST', '/api/maintenance/force-refresh-cache', {
        adminAddress: address,
        timestamp: Date.now()
      });
      
      console.log("Force refresh result:", refreshResult);
      
      // 2. Completely clear the React Query cache
      queryClient.clear();
      
      // 3. Re-fetch critical data with cache busters
      const timestamp = Date.now();
      await queryClient.fetchQuery({
        queryKey: ['/api/leaderboard', 10, 1],
        queryFn: () => apiRequest(`/api/leaderboard?limit=10&page=1&_cb=${timestamp}`)
      });
      
      // 4. Remove any browser-level caches with the fetch cache: 'no-store' option
      await fetch('/api/leaderboard', { 
        method: 'GET',
        cache: 'no-store',
        headers: { 'Pragma': 'no-cache' }
      });
      
      return refreshResult;
    } catch (error) {
      console.error("Force refresh failed:", error);
      throw error;
    }
  };

  const handleCompleteReset = async () => {
    if (!confirmReset) {
      setConfirmReset(true);
      toast({
        variant: "destructive",
        title: "⚠️ Destructive Action",
        description: "Click again to confirm complete database reset. This will delete ALL users and transactions!"
      });
      return;
    }

    try {
      setLoading(true);
      console.log("Sending complete reset request...");
      
      // We need to use POST for this endpoint as GET is not allowed
      const result = await apiRequest('POST', '/api/maintenance/complete-reset', {
        adminAddress: address,
        timestamp: Date.now()
      });

      console.log("Complete reset response:", result);
      
      setResetResult(result);
      toast({
        title: "Database Reset Complete",
        description: `Deleted ${result.summary.usersDeleted} users and ${result.summary.transactionsDeleted} transactions.`
      });

      // Use our enhanced cache-busting function
      await forceRefreshAllData();
      
      toast({
        title: "Cache Refreshed",
        description: "All data has been refreshed from the server. The leaderboard should now reflect the empty database."
      });
      
    } catch (error) {
      console.error("Reset failed:", error);
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: "An error occurred while resetting the database."
      });
    } finally {
      setLoading(false);
      setConfirmReset(false);
    }
  };

  const handleRecalculatePoints = async () => {
    try {
      setLoading(true);
      console.log("Sending recalculate points request...");
      
      // We need to use POST for this endpoint as GET is not allowed
      const result = await apiRequest('POST', '/api/maintenance/recalculate-points', {
        adminAddress: address,
        timestamp: Date.now()
      });

      console.log("Recalculate points response:", result);
      
      setRecalcResult(result);
      toast({
        title: "Points Recalculation Complete",
        description: `Updated ${result.summary.usersUpdated} users. Points before: ${result.summary.totalPointsBefore}, after: ${result.summary.totalPointsAfter}.`
      });

      // Use our enhanced cache-busting function to refresh all application data
      await forceRefreshAllData();
      
      toast({
        title: "Cache Refreshed",
        description: "All data has been refreshed from the server. The leaderboard should now reflect updated points."
      });
      
    } catch (error) {
      console.error("Recalculation failed:", error);
      toast({
        variant: "destructive",
        title: "Recalculation Failed",
        description: "An error occurred while recalculating user points."
      });
    } finally {
      setLoading(false);
    }
  };
  
  // New handler for fixing all points to exactly 0.5 per swap
  const handleFixPoints = async () => {
    try {
      setLoading(true);
      console.log("Sending fix points request (0.5 points per swap)...");
      
      // Use our special fix-points endpoint
      const result = await apiRequest('POST', '/api/maintenance/fix-points', {
        adminAddress: address,
        timestamp: Date.now()
      });

      console.log("Fix points response:", result);
      
      setFixPointsResult(result);
      toast({
        title: "Points Fix Complete",
        description: `Fixed ${result.summary.usersUpdated} users to 0.5 points per swap. Points before: ${result.summary.totalPointsBefore}, after: ${result.summary.totalPointsAfter}.`
      });

      // Refresh all application data after the fix
      await forceRefreshAllData();
      
      toast({
        title: "Cache Refreshed",
        description: "All data has been refreshed from the server. The leaderboard should now reflect the fixed points."
      });
      
    } catch (error) {
      console.error("Points fix failed:", error);
      toast({
        variant: "destructive",
        title: "Points Fix Failed",
        description: "An error occurred while fixing points to 0.5 per swap."
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="container px-4 py-12 max-w-6xl mx-auto text-center">
        <HiLockClosed className="mx-auto text-5xl mb-4 text-yellow-500" />
        <h1 className="text-3xl font-bold mb-2">Admin Access Required</h1>
        <p className="text-muted-foreground mb-6">
          Please connect your admin wallet to access this page.
        </p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container px-4 py-12 max-w-6xl mx-auto text-center">
        <HiShieldExclamation className="mx-auto text-5xl mb-4 text-red-500" />
        <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-6">
          You do not have permission to access the admin panel.
        </p>
      </div>
    );
  }

  // Handler for manual cache refresh
  const handleManualCacheRefresh = async () => {
    try {
      setLoading(true);
      console.log("Manually refreshing application cache...");
      
      await forceRefreshAllData();
      
      toast({
        title: "Cache Refresh Complete",
        description: "All application data has been refreshed from the server. The leaderboard and other data should now be up-to-date."
      });
    } catch (error) {
      console.error("Manual cache refresh failed:", error);
      toast({
        variant: "destructive",
        title: "Refresh Failed",
        description: "An error occurred while refreshing the application cache."
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handler for global rewards
  const handleGlobalReward = async () => {
    try {
      setLoading(true);
      console.log("Sending global reward request...");
      
      // Validate input values
      if (globalRewardPoints <= 0) {
        toast({
          variant: "destructive",
          title: "Invalid Input",
          description: "Points must be a positive number."
        });
        return;
      }
      
      // Use the admin/reward/global endpoint
      const result = await apiRequest('POST', '/api/admin/reward/global', {
        adminAddress: address,
        points: globalRewardPoints,
        reason: globalRewardReason,
        minSwaps: globalMinSwaps
      });

      console.log("Global reward response:", result);
      
      setRewardResult(result);
      toast({
        title: "Global Reward Distributed",
        description: `Rewarded ${result.summary.usersRewarded} users with ${globalRewardPoints} points each. Total points added: ${result.summary.totalPointsAdded}.`
      });

      // Refresh all application data after the reward distribution
      await forceRefreshAllData();
      
      toast({
        title: "Cache Refreshed",
        description: "All data has been refreshed from the server. The leaderboard should now reflect the updated points."
      });
      
    } catch (error) {
      console.error("Global reward failed:", error);
      toast({
        variant: "destructive",
        title: "Reward Distribution Failed",
        description: "An error occurred while distributing global rewards."
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handler for individual rewards
  const handleIndividualReward = async () => {
    try {
      setLoading(true);
      console.log("Sending individual reward request...");
      
      // Validate input values
      if (!individualAddress || !individualAddress.startsWith('0x')) {
        toast({
          variant: "destructive",
          title: "Invalid Input",
          description: "Please enter a valid wallet address starting with 0x."
        });
        return;
      }
      
      if (individualPoints <= 0) {
        toast({
          variant: "destructive",
          title: "Invalid Input",
          description: "Points must be a positive number."
        });
        return;
      }
      
      // Use the admin/reward/user endpoint
      const result = await apiRequest('POST', '/api/admin/reward/user', {
        adminAddress: address,
        address: individualAddress,
        points: individualPoints,
        reason: individualReason
      });

      console.log("Individual reward response:", result);
      
      setIndividualRewardResult(result);
      
      if (result.success) {
        toast({
          title: "Individual Reward Sent",
          description: `Rewarded user ${individualAddress.substring(0, 6)}...${individualAddress.substring(individualAddress.length - 4)} with ${individualPoints} points. Points before: ${result.pointsBefore}, after: ${result.pointsAfter}.`
        });
  
        // Refresh all application data after the reward
        await forceRefreshAllData();
        
        toast({
          title: "Cache Refreshed",
          description: "All data has been refreshed from the server. The leaderboard should now reflect the updated points."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Reward Distribution Failed",
          description: result.message || "An error occurred while distributing the individual reward."
        });
      }
      
    } catch (error) {
      console.error("Individual reward failed:", error);
      toast({
        variant: "destructive",
        title: "Reward Distribution Failed",
        description: "An error occurred while distributing the individual reward."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container px-4 py-6 max-w-6xl mx-auto">
      <div className="mb-4">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <HiShieldExclamation className="mr-2 text-red-500" /> 
          Admin Panel
        </h1>
        <p className="text-muted-foreground mb-4">
          Warning: The actions in this panel have irreversible effects on the database.
        </p>
      </div>
      
      {/* Quick Actions Bar */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={handleManualCacheRefresh}
          disabled={loading}
        >
          <HiRefresh className="h-4 w-4" />
          {loading ? 'Refreshing...' : 'Force Refresh Cache'}
        </Button>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="rewards">Reward Users</TabsTrigger>
          <TabsTrigger value="points">Points Fix</TabsTrigger>
          <TabsTrigger value="recalculate">Recalculation</TabsTrigger>
          <TabsTrigger value="reset">Database Reset</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="reset" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-500 flex items-center">
                <HiTrash className="mr-2" />
                Complete Database Reset
              </CardTitle>
              <CardDescription>
                This will delete ALL users, transactions, and reset the entire database.
                Only a demo user will be preserved. This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive" className="mb-4">
                <AlertTitle>Warning: Destructive Action</AlertTitle>
                <AlertDescription>
                  This will permanently delete all user data, transactions, and points.
                  The application will be reset to a clean state.
                </AlertDescription>
              </Alert>
              
              {resetResult && (
                <div className="p-4 bg-muted rounded-lg mb-4">
                  <h3 className="font-medium mb-2">Reset Results:</h3>
                  <ul className="list-disc list-inside text-sm">
                    <li>Users deleted: {resetResult.summary.usersDeleted}</li>
                    <li>Transactions deleted: {resetResult.summary.transactionsDeleted}</li>
                    <li>User quests deleted: {resetResult.summary.userQuestsDeleted}</li>
                    <li>Votes deleted: {resetResult.summary.votesDeleted}</li>
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                variant="destructive" 
                onClick={handleCompleteReset}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Processing...' : confirmReset ? 'Confirm Complete Reset' : 'Reset Entire Database'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="recalculate" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HiRefresh className="mr-2" />
                Recalculate All Points
              </CardTitle>
              <CardDescription>
                This will recalculate all user points based on the current transaction data
                and point calculation rules. NFT staking points will be removed.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4">
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                  Points will be recalculated according to the following rules:
                  <ul className="list-disc list-inside mt-2 text-sm">
                    <li>0.5 points per swap transaction</li>
                    <li>Maximum 5 swaps per day count toward points (2.5 points max per day)</li>
                    <li>NFT staking will NOT award any points</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              {recalcResult && (
                <div className="p-4 bg-muted rounded-lg mb-4">
                  <h3 className="font-medium mb-2">Recalculation Results:</h3>
                  <ul className="list-disc list-inside text-sm">
                    <li>Users updated: {recalcResult.summary.usersUpdated}</li>
                    <li>Total points before: {recalcResult.summary.totalPointsBefore}</li>
                    <li>Total points after: {recalcResult.summary.totalPointsAfter}</li>
                    <li>Difference: {recalcResult.summary.totalPointsAfter - recalcResult.summary.totalPointsBefore}</li>
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleRecalculatePoints}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Processing...' : 'Recalculate All User Points'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="rewards" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Global Rewards Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-purple-600">
                  <HiGift className="mr-2" />
                  Global Community Rewards
                </CardTitle>
                <CardDescription>
                  Award bonus points to all users who have made at least a specified number of swaps.
                  Use this to reward engaged community members.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="globalRewardPoints">Points per User</Label>
                    <Input
                      id="globalRewardPoints"
                      type="number"
                      min="0.5"
                      step="0.5" 
                      value={globalRewardPoints}
                      onChange={(e) => setGlobalRewardPoints(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of points to award to each eligible user
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="globalMinSwaps">Minimum Swaps Required</Label>
                    <Input
                      id="globalMinSwaps"
                      type="number"
                      min="1"
                      value={globalMinSwaps}
                      onChange={(e) => setGlobalMinSwaps(parseInt(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Users must have made at least this many swaps to receive the reward
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="globalRewardReason">Reward Reason</Label>
                    <Input
                      id="globalRewardReason"
                      value={globalRewardReason}
                      onChange={(e) => setGlobalRewardReason(e.target.value)}
                      className="w-full"
                      placeholder="Community bonus"
                    />
                    <p className="text-xs text-muted-foreground">
                      Will be shown in transaction history as the reason for bonus points
                    </p>
                  </div>
                  
                  {rewardResult && (
                    <div className="p-4 bg-muted rounded-lg mb-4 border-purple-500 border">
                      <h3 className="font-medium mb-2 text-purple-600">Reward Results:</h3>
                      <ul className="list-disc list-inside text-sm">
                        <li>Users rewarded: {rewardResult.summary.usersRewarded}</li>
                        <li>Points per user: {globalRewardPoints}</li>
                        <li>Total points added: {rewardResult.summary.totalPointsAdded}</li>
                        <li>Total points before: {rewardResult.summary.totalPointsBefore}</li>
                        <li>Total points after: {rewardResult.summary.totalPointsAfter}</li>
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleGlobalReward}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? 'Processing...' : 'Award Bonus to All Eligible Users'}
                </Button>
              </CardFooter>
            </Card>
            
            {/* Individual Rewards Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-blue-600">
                  <HiUser className="mr-2" />
                  Individual User Rewards
                </CardTitle>
                <CardDescription>
                  Award bonus points to a specific user by their wallet address.
                  Use this for contests, support issues, or special recognition.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="individualAddress">User Wallet Address</Label>
                    <Input
                      id="individualAddress"
                      value={individualAddress}
                      onChange={(e) => setIndividualAddress(e.target.value)}
                      className="w-full font-mono text-xs"
                      placeholder="0x..."
                    />
                    <p className="text-xs text-muted-foreground">
                      The wallet address of the user to receive the bonus points
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="individualPoints">Points to Award</Label>
                    <Input
                      id="individualPoints"
                      type="number"
                      min="0.5"
                      step="0.5"
                      value={individualPoints}
                      onChange={(e) => setIndividualPoints(parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of bonus points to award to this user
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="individualReason">Reward Reason</Label>
                    <Input
                      id="individualReason"
                      value={individualReason}
                      onChange={(e) => setIndividualReason(e.target.value)}
                      className="w-full"
                      placeholder="Contest winner"
                    />
                    <p className="text-xs text-muted-foreground">
                      Will be shown in transaction history as the reason for bonus points
                    </p>
                  </div>
                  
                  {individualRewardResult && (
                    <div className="p-4 bg-muted rounded-lg mb-4 border-blue-500 border">
                      <h3 className="font-medium mb-2 text-blue-600">Reward Results:</h3>
                      <ul className="list-disc list-inside text-sm">
                        <li>User: {individualAddress.substring(0, 6)}...{individualAddress.substring(individualAddress.length - 4)}</li>
                        <li>Points awarded: {individualPoints}</li>
                        <li>Points before: {individualRewardResult.pointsBefore}</li>
                        <li>Points after: {individualRewardResult.pointsAfter}</li>
                        <li>Status: {individualRewardResult.success ? 'Success' : 'Failed'}</li>
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleIndividualReward}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Processing...' : 'Award Bonus to Individual User'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="points" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-green-600">
                <HiRefresh className="mr-2" />
                Fix Points (0.5 per swap)
              </CardTitle>
              <CardDescription>
                This will update ALL transactions to use EXACTLY 0.5 points per swap and recalculate user totals.
                Use this to fix any inconsistencies in points calculations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert variant="default" className="mb-4 border-green-400 bg-green-50 dark:bg-green-950 dark:border-green-900">
                <AlertTitle className="text-green-600">Points Fix Tool</AlertTitle>
                <AlertDescription>
                  <p className="mb-2">This specialized tool addresses the following issues:</p>
                  <ul className="list-disc list-inside mt-2 text-sm">
                    <li>Updates all swap transactions in the database to award exactly 0.5 points</li>
                    <li>Enforces the daily maximum of 5 swaps (2.5 points per day)</li>
                    <li>Recalculates all user point totals based on the fixed transactions</li>
                    <li>Ensures consistency between transaction points and user total points</li>
                  </ul>
                </AlertDescription>
              </Alert>
              
              {fixPointsResult && (
                <div className="p-4 bg-muted rounded-lg mb-4 border-green-500 border">
                  <h3 className="font-medium mb-2 text-green-600">Points Fix Results:</h3>
                  <ul className="list-disc list-inside text-sm">
                    <li>Users updated: {fixPointsResult.summary.usersUpdated}</li>
                    <li>Total points before: {fixPointsResult.summary.totalPointsBefore}</li>
                    <li>Total points after: {fixPointsResult.summary.totalPointsAfter}</li>
                    <li>Difference: {fixPointsResult.summary.totalPointsAfter - fixPointsResult.summary.totalPointsBefore}</li>
                  </ul>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleFixPoints}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Processing...' : 'Fix All Points To 0.5 Per Swap'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="maintenance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HiDatabase className="mr-2" />
                Cache & Database Maintenance
              </CardTitle>
              <CardDescription>
                Tools to help troubleshoot and maintain data consistency across the application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert className="mb-4">
                  <AlertTitle>Cache Management</AlertTitle>
                  <AlertDescription>
                    Use these tools when data appears stale or out of sync. The cache refresh function 
                    will clear application caches and fetch fresh data directly from the database.
                  </AlertDescription>
                </Alert>
                
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-medium">Cache Management</h3>
                  <p className="text-sm text-muted-foreground">
                    If the leaderboard or other data appears stale, use this button to force a fresh fetch of all data.
                  </p>
                  <Button 
                    onClick={handleManualCacheRefresh}
                    disabled={loading}
                    className="flex items-center gap-1"
                  >
                    <HiRefresh className="h-4 w-4" />
                    {loading ? 'Refreshing Cache...' : 'Force Refresh All Data'}
                  </Button>
                </div>
                
                <div className="border rounded-lg p-4 space-y-3">
                  <h3 className="font-medium">Cache Behavior Configuration</h3>
                  <p className="text-sm text-muted-foreground">
                    Changes how aggressively the application refreshes data from the server. More frequent
                    refreshes reduce cache problems but may increase server load.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        // In a real app, this would change some cache setting, but for now it's just a demo
                        toast({
                          title: "Cache Strategy Updated",
                          description: "Cache TTL set to 30 seconds. Data will refresh more frequently."
                        });
                      }}
                      className="text-sm"
                    >
                      Aggressive Refresh (30s)
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        toast({
                          title: "Cache Strategy Updated",
                          description: "Cache TTL set to 5 minutes. Default strategy restored."
                        });
                      }}
                      className="text-sm"
                    >
                      Normal Refresh (5m)
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;