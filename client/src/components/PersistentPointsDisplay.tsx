import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FaLock, FaSync } from "react-icons/fa";
import { usePersistentPoints } from "@/hooks/usePersistentPoints";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from 'date-fns';

interface PersistentPointsDisplayProps {
  address: string | null;
}

/**
 * Component to display persistent points
 * These are points calculated directly from swap transactions and never get wiped
 */
const PersistentPointsDisplay = ({ address }: PersistentPointsDisplayProps) => {
  const {
    persistentPoints,
    lastSync,
    isLoading,
    syncPersistentPoints,
    isSyncing
  } = usePersistentPoints(address);

  // Format the last sync time
  const formattedLastSync = lastSync 
    ? formatDistanceToNow(lastSync, { addSuffix: true }) 
    : 'Never';

  return (
    <Card className="shadow-md h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-semibold flex items-center">
            <FaLock className="mr-2 text-green-500" />
            Persistent Points
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs">
                  GUARANTEED
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  Persistent points are calculated directly from your on-chain swap transactions.
                  These points are guaranteed to survive any server resets or maintenance.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>
          Points calculated from verified on-chain transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-3xl font-bold">
              {persistentPoints.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground flex justify-between items-center">
              <span>Last synced: {formattedLastSync}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => syncPersistentPoints()}
                disabled={isSyncing || !address}
                className="flex items-center gap-1"
              >
                <FaSync className={isSyncing ? "animate-spin" : ""} />
                Sync
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PersistentPointsDisplay;