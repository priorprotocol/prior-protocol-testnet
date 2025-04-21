import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, BarChart, Bar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import useHistoricalPoints from '@/hooks/useHistoricalPoints';
import { FaChartArea, FaChartBar, FaHistory, FaCalendarAlt } from 'react-icons/fa';

interface PointsHistoryDisplayProps {
  address: string;
  className?: string;
}

// Function to create the data format required by Recharts with swap and points data
// This ensures that the visualization accurately reflects the 0.5 points per swap formula
const formatChartData = (periods: string[], pointsData: number[], swapData: number[]) => {
  return periods.map((period, index) => {
    const swaps = swapData[index] || 0;
    // For consistency, we always calculate points as 0.5 per swap (capped at 5 swaps = 2.5 points)
    // This ensures visual consistency with server calculations
    const calculatedPoints = Math.min(swaps, 5) * 0.5;
    // Use the provided points data, but also include calculatedPoints for transparency
    return {
      name: period,
      points: pointsData[index] || 0,
      swaps: swaps,
      calculatedPoints: Number(calculatedPoints.toFixed(1)), // Round to 1 decimal place
      pointsPerSwap: swaps > 0 ? Number((pointsData[index] / swaps).toFixed(1)) : 0
    };
  });
};

export const PointsHistoryDisplay: React.FC<PointsHistoryDisplayProps> = ({ address, className = '' }) => {
  const [period, setPeriod] = useState<string>('week');
  const [chartType, setChartType] = useState<'area' | 'bar'>('bar');
  
  const { 
    data: historicalData,
    isLoading: isLoadingHistoricalData,
    isError: isHistoricalError
  } = useHistoricalPoints(address, period);
  
  // Format the data for the charts
  const chartData = historicalData ? 
    formatChartData(historicalData.periods, historicalData.pointsData, historicalData.swapData) : 
    [];
  
  return (
    <Card className={`bg-[#0F172A] border-[#1E293B] overflow-hidden ${className}`}>
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-indigo-500 bg-opacity-20 flex items-center justify-center">
                <FaHistory className="text-indigo-400" size={12} />
              </div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-300">
                Points History
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-gray-400 mt-1">
              Visualizing your earned points over time (0.5 points per swap, max 2.5 daily)
            </CardDescription>
          </div>
          
          <div className="flex gap-2">
            <Tabs value={chartType} onValueChange={(v) => setChartType(v as 'area' | 'bar')} className="h-8">
              <TabsList className="bg-[#1A2234] border border-indigo-900/30 p-0.5">
                <TabsTrigger 
                  value="area" 
                  className="h-6 px-2 data-[state=active]:bg-indigo-900/30"
                >
                  <FaChartArea size={10} />
                </TabsTrigger>
                <TabsTrigger 
                  value="bar" 
                  className="h-6 px-2 data-[state=active]:bg-indigo-900/30"
                >
                  <FaChartBar size={10} />
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Tabs value={period} onValueChange={setPeriod} className="h-8">
              <TabsList className="bg-[#1A2234] border border-indigo-900/30">
                <TabsTrigger 
                  value="day" 
                  className="h-6 px-2 text-xs data-[state=active]:bg-indigo-900/30"
                >
                  24H
                </TabsTrigger>
                <TabsTrigger 
                  value="week" 
                  className="h-6 px-2 text-xs data-[state=active]:bg-indigo-900/30"
                >
                  7D
                </TabsTrigger>
                <TabsTrigger 
                  value="month" 
                  className="h-6 px-2 text-xs data-[state=active]:bg-indigo-900/30"
                >
                  30D
                </TabsTrigger>
                <TabsTrigger 
                  value="all" 
                  className="h-6 px-2 text-xs data-[state=active]:bg-indigo-900/30"
                >
                  All
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoadingHistoricalData ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-6 h-6 border-t-2 border-b-2 border-indigo-500 rounded-full animate-spin"></div>
            <span className="ml-2 text-[#A0AEC0]">Loading historical data...</span>
          </div>
        ) : isHistoricalError ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-red-400 text-center">
              <div className="mb-2">Failed to load historical data</div>
              <div className="text-xs text-gray-300 mb-2">
                Ensure your wallet is connected and try again
              </div>
              <button 
                onClick={() => {
                  // Force a refresh of the data
                  setPeriod('day');
                  setTimeout(() => setPeriod(period), 500);
                }}
                className="px-3 py-1 bg-red-900/20 border border-red-700/30 text-red-400 text-xs rounded-md"
              >
                Retry
              </button>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center">
            <div className="text-[#A0AEC0] text-center">
              <div className="text-sm mb-1">No historical data available for this period</div>
              <div className="text-xs mt-1 text-gray-500">
                <FaCalendarAlt className="inline mr-1" />
                Complete swaps to see your points history
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-2">
            <div className="mb-2 grid grid-cols-2 gap-2">
              <div className="bg-[#1A2234] p-3 rounded-lg border border-indigo-900/30">
                <div className="text-xs text-indigo-300 mb-1">Total Points</div>
                <div className="text-2xl font-bold text-white">{historicalData?.totalPoints.toFixed(1)}</div>
                <div className="text-xs text-gray-500 mt-1">From {historicalData?.swapData.reduce((sum, swaps) => sum + swaps, 0) || 0} swaps</div>
              </div>
              <div className="bg-[#1A2234] p-3 rounded-lg border border-indigo-900/30">
                <div className="text-xs text-blue-300 mb-1">Daily Average</div>
                <div className="text-2xl font-bold text-white">
                  {chartData.length > 0 && historicalData?.totalPoints !== undefined
                    ? (historicalData.totalPoints / chartData.length).toFixed(1) 
                    : "0.0"}
                </div>
                <div className="text-xs text-gray-500 mt-1">Points per active day</div>
              </div>
            </div>
            
            <div className="h-64 mt-1 border border-indigo-900/20 rounded-lg">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart
                    data={chartData}
                    margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSwaps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#94A3B8', fontSize: 10 }}
                      axisLine={{ stroke: '#1E293B' }}
                      tickLine={{ stroke: '#1E293B' }}
                    />
                    <YAxis 
                      tick={{ fill: '#94A3B8', fontSize: 10 }}
                      axisLine={{ stroke: '#1E293B' }}
                      tickLine={{ stroke: '#1E293B' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1E293B', 
                        border: '1px solid #818cf8',
                        borderRadius: '4px',
                        color: '#F8FAFC'
                      }}
                      itemStyle={{ color: '#F8FAFC' }}
                      labelStyle={{ color: '#94A3B8', fontWeight: 'bold', marginBottom: '5px' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      wrapperStyle={{ paddingBottom: '10px' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="points" 
                      stroke="#818cf8" 
                      fillOpacity={1} 
                      fill="url(#colorPoints)" 
                      name="Points"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="swaps" 
                      stroke="#a78bfa" 
                      fillOpacity={1} 
                      fill="url(#colorSwaps)" 
                      name="Swaps"
                    />
                  </AreaChart>
                ) : (
                  <BarChart
                    data={chartData}
                    margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#94A3B8', fontSize: 10 }}
                      axisLine={{ stroke: '#1E293B' }}
                      tickLine={{ stroke: '#1E293B' }}
                    />
                    <YAxis 
                      tick={{ fill: '#94A3B8', fontSize: 10 }}
                      axisLine={{ stroke: '#1E293B' }}
                      tickLine={{ stroke: '#1E293B' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1E293B', 
                        border: '1px solid #818cf8',
                        borderRadius: '4px',
                        color: '#F8FAFC'
                      }}
                      itemStyle={{ color: '#F8FAFC' }}
                      labelStyle={{ color: '#94A3B8', fontWeight: 'bold', marginBottom: '5px' }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      wrapperStyle={{ paddingBottom: '10px' }}
                    />
                    <Bar dataKey="points" fill="#818cf8" name="Points" />
                    <Bar dataKey="swaps" fill="#a78bfa" name="Swaps" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
            
            <div className="mt-3 text-xs text-gray-500 text-center">
              Points earning formula: 0.5 points per swap, maximum 5 swaps (2.5 points) per day
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PointsHistoryDisplay;