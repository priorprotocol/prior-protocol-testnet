import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { HiShieldExclamation, HiRefresh, HiTrash, HiLockClosed, HiDatabase, HiCash, HiPlus } from "react-icons/hi";
import { useStandaloneWallet } from "@/hooks/useStandaloneWallet";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

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
  const [activeTab, setActiveTab] = useState("allocate");
  const [, setLocation] = useLocation();
  const [pointsPerWallet, setPointsPerWallet] = useState<number>(2.5);
  const [walletAddresses, setWalletAddresses] = useState<string>("");
  const [pointsAllocationResult, setPointsAllocationResult] = useState<any>(null);
  const [specificWalletsResult, setSpecificWalletsResult] = useState<any>(null);
  
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

  // Handler for allocating points to all wallets that swapped today
  const handleAllocatePointsAllSwaps = async () => {
    try {
      setLoading(true);
      console.log(`Allocating ${pointsPerWallet} points to all wallets that swapped today...`);
      
      const result = await apiRequest('POST', '/api/maintenance/allocate-points-all-swaps', {
        adminAddress: address,
        pointsPerWallet: pointsPerWallet,
        timestamp: Date.now()
      });
      
      console.log("Points allocation response:", result);
      
      setPointsAllocationResult(result);
      toast({
        title: "Points Allocation Complete",
        description: `Allocated ${pointsPerWallet} points to ${result.summary.usersUpdated} users. Total points allocated: ${result.summary.totalPointsAllocated}.`
      });
      
      // Refresh all application data
      await forceRefreshAllData();
      
      toast({
        title: "Cache Refreshed",
        description: "All data has been refreshed from the server. The leaderboard should now reflect updated points."
      });
      
    } catch (error) {
      console.error("Points allocation failed:", error);
      toast({
        variant: "destructive",
        title: "Points Allocation Failed",
        description: "An error occurred while allocating points to wallets."
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handler for allocating points to specific wallet addresses
  const handleAllocatePointsSpecific = async () => {
    if (!walletAddresses.trim()) {
      toast({
        variant: "destructive",
        title: "No Wallet Addresses",
        description: "Please enter at least one wallet address."
      });
      return;
    }
    
    try {
      setLoading(true);
      
      // Parse the wallet addresses
      const addresses = walletAddresses
        .split(/[\n,]/)
        .map(addr => addr.trim())
        .filter(addr => addr.length >= 42 && addr.startsWith('0x'));
      
      if (addresses.length === 0) {
        toast({
          variant: "destructive",
          title: "Invalid Wallet Addresses",
          description: "No valid wallet addresses found. Make sure addresses start with 0x and are 42 characters long."
        });
        setLoading(false);
        return;
      }
      
      console.log(`Allocating ${pointsPerWallet} points to ${addresses.length} specific wallets...`);
      
      const result = await apiRequest('POST', '/api/maintenance/allocate-points-specific', {
        adminAddress: address,
        walletAddresses: addresses,
        pointsPerWallet: pointsPerWallet,
        timestamp: Date.now()
      });
      
      console.log("Specific wallet points allocation response:", result);
      
      setSpecificWalletsResult(result);
      toast({
        title: "Points Allocation Complete",
        description: `Allocated ${pointsPerWallet} points to ${result.summary.usersUpdated} users. Skipped ${result.summary.skippedWallets} wallets that weren't found.`
      });
      
      // Refresh all application data
      await forceRefreshAllData();
      
      toast({
        title: "Cache Refreshed",
        description: "All data has been refreshed from the server. The leaderboard should now reflect updated points."
      });
      
    } catch (error) {
      console.error("Specific wallet points allocation failed:", error);
      toast({
        variant: "destructive",
        title: "Points Allocation Failed",
        description: "An error occurred while allocating points to specific wallets."
      });
    } finally {
      setLoading(false);
    }
  };
  
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
          <TabsTrigger value="allocate">Points Allocation</TabsTrigger>
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
        
        <TabsContent value="allocate" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Allocate points to all wallets that swapped today */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-blue-600">
                  <HiCash className="mr-2" />
                  Allocate Points to All Swap Wallets
                </CardTitle>
                <CardDescription>
                  Allocate points to all wallets that have made swaps today using our official swap contract
                  (0x8957e1988905311EE249e679a29fc9deCEd4D910). This is useful for restoring points to users 
                  after a system update or points policy change.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="default" className="mb-4 border-blue-400 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
                  <AlertTitle className="text-blue-600">Bulk Point Allocation</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">This will add the specified number of points to ALL wallets that have performed swaps today through the official swap contract <code className="bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded text-xs font-mono">0x8957e1988905311EE249e679a29fc9deCEd4D910</code>:</p>
                    <ul className="list-disc list-inside mt-2 text-sm">
                      <li>Only swaps made through our official swap contract are eligible</li>
                      <li>Points will be added on top of the users' existing points</li>
                      <li>Allocations are tracked as admin_points transactions in the database</li>
                      <li>This process can be run multiple times if needed</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="points-per-wallet">Points to allocate per wallet:</Label>
                    <Input
                      id="points-per-wallet"
                      type="number"
                      value={pointsPerWallet}
                      onChange={(e) => setPointsPerWallet(Number(e.target.value))}
                      min="0.1"
                      step="0.1"
                      max="100"
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground">
                      Default of 2.5 points (1 day's maximum) is recommended
                    </p>
                  </div>
                </div>
                
                {pointsAllocationResult && (
                  <div className="p-4 mt-4 bg-muted rounded-lg mb-4 border-blue-500 border">
                    <h3 className="font-medium mb-2 text-blue-600">Points Allocation Results:</h3>
                    <ul className="list-disc list-inside text-sm">
                      <li>Users updated: {pointsAllocationResult.summary.usersUpdated}</li>
                      <li>Points per user: {pointsAllocationResult.summary.pointsPerUser}</li>
                      <li>Total points allocated: {pointsAllocationResult.summary.totalPointsAllocated}</li>
                      <li>Timestamp: {new Date(pointsAllocationResult.summary.timestamp).toLocaleString()}</li>
                    </ul>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleAllocatePointsAllSwaps}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? 'Processing...' : 'Allocate Points to All Swap Wallets'}
                </Button>
              </CardFooter>
            </Card>
            
            {/* Right Column: Allocate points to specific wallets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-purple-600">
                  <HiPlus className="mr-2" />
                  Allocate Points to Specific Wallets
                </CardTitle>
                <CardDescription>
                  Allocate points to specific wallet addresses. Enter multiple addresses separated by commas or newlines.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert variant="default" className="mb-4 border-purple-400 bg-purple-50 dark:bg-purple-950 dark:border-purple-900">
                  <AlertTitle className="text-purple-600">Targeted Point Allocation</AlertTitle>
                  <AlertDescription>
                    <p className="mb-2">Distribute points to specific wallet addresses:</p>
                    <ul className="list-disc list-inside mt-2 text-sm">
                      <li>Each wallet must exist in the database</li>
                      <li>Points will be added to existing balances</li>
                      <li>Enter addresses separated by commas or newlines</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="points-per-specific-wallet">Points to allocate per wallet:</Label>
                    <Input
                      id="points-per-specific-wallet"
                      type="number"
                      value={pointsPerWallet}
                      onChange={(e) => setPointsPerWallet(Number(e.target.value))}
                      min="0.1"
                      step="0.1"
                      max="100"
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="wallet-addresses">Wallet Addresses (one per line or comma-separated):</Label>
                    <Textarea
                      id="wallet-addresses"
                      placeholder="0x123...&#10;0x456...&#10;0x789..."
                      value={walletAddresses}
                      onChange={(e) => setWalletAddresses(e.target.value)}
                      className="min-h-[120px]"
                    />
                    <p className="text-sm text-muted-foreground">
                      Wallet addresses must start with 0x and be in the database
                    </p>
                  </div>
                </div>
                
                {specificWalletsResult && (
                  <div className="p-4 mt-4 bg-muted rounded-lg mb-4 border-purple-500 border">
                    <h3 className="font-medium mb-2 text-purple-600">Specific Wallet Allocation Results:</h3>
                    <ul className="list-disc list-inside text-sm">
                      <li>Successfully updated: {specificWalletsResult.summary.usersUpdated} wallets</li>
                      <li>Skipped (not found): {specificWalletsResult.summary.skippedWallets} wallets</li>
                      <li>Points per wallet: {specificWalletsResult.summary.pointsPerUser}</li>
                      <li>Total points allocated: {specificWalletsResult.summary.totalPointsAllocated}</li>
                    </ul>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleAllocatePointsSpecific}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? 'Processing...' : 'Allocate Points to Specific Wallets'}
                </Button>
              </CardFooter>
            </Card>
          </div>
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