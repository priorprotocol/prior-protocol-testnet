import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { HiShieldExclamation, HiRefresh, HiTrash, HiLockClosed } from "react-icons/hi";
import { useStandaloneWallet } from "@/hooks/useStandaloneWallet";
import { useLocation } from "wouter";

const ADMIN_WALLET = "0x4cfc531df94339def7dcd603aac1a2deaf6888b7";

const Admin = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { address, isConnected } = useStandaloneWallet();
  const [loading, setLoading] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetResult, setResetResult] = useState<any>(null);
  const [recalcResult, setRecalcResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("reset");
  const [, setLocation] = useLocation();
  
  const isAdmin = address?.toLowerCase() === ADMIN_WALLET.toLowerCase();

  useEffect(() => {
    if (isConnected && !isAdmin) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You do not have permission to access the admin panel."
      });
      setLocation("/");
    }
  }, [isConnected, isAdmin, setLocation, toast]);

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
      const result = await apiRequest('/api/maintenance/complete-reset', {
        method: 'POST',
      });

      setResetResult(result);
      toast({
        title: "Database Reset Complete",
        description: `Deleted ${result.summary.usersDeleted} users and ${result.summary.transactionsDeleted} transactions.`
      });

      // Invalidate all cached queries
      queryClient.invalidateQueries();
      
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
      const result = await apiRequest('/api/maintenance/recalculate-points', {
        method: 'POST',
      });

      setRecalcResult(result);
      toast({
        title: "Points Recalculation Complete",
        description: `Updated ${result.summary.usersUpdated} users. Points before: ${result.summary.totalPointsBefore}, after: ${result.summary.totalPointsAfter}.`
      });

      // Invalidate all cached queries
      queryClient.invalidateQueries();
      
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

  return (
    <div className="container px-4 py-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center">
          <HiShieldExclamation className="mr-2 text-red-500" /> 
          Admin Panel
        </h1>
        <p className="text-muted-foreground mb-4">
          Warning: The actions in this panel have irreversible effects on the database.
        </p>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reset">Database Reset</TabsTrigger>
          <TabsTrigger value="recalculate">Points Recalculation</TabsTrigger>
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
      </Tabs>
    </div>
  );
};

export default Admin;