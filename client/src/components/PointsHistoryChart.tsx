import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, BarChart, Bar
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import useHistoricalPoints from '@/hooks/useHistoricalPoints';
import { FaChartArea, FaChartBar } from 'react-icons/fa';

interface PointsHistoryChartProps {
  address: string;
  className?: string;
}

// Function to create the data format required by Recharts
const formatChartData = (periods: string[], pointsData: number[], swapData: number[]) => {
  return periods.map((period, index) => ({
    name: period,
    points: pointsData[index] || 0,
    swaps: swapData[index] || 0,
  }));
};

export const PointsHistoryChart: React.FC<PointsHistoryChartProps> = ({ address, className = '' }) => {
  const [period, setPeriod] = useState<string>('week');
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');
  
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
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-violet-600 to-purple-600"></div>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 bg-opacity-20 flex items-center justify-center">
              <FaChartArea className="text-blue-400" size={12} />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
              Points History
            </span>
          </CardTitle>
          
          <div className="flex gap-2">
            <Tabs value={chartType} onValueChange={(v) => setChartType(v as 'area' | 'bar')} className="h-8">
              <TabsList className="bg-[#1A2234] border border-blue-900/30 p-0.5">
                <TabsTrigger 
                  value="area" 
                  className="h-6 px-2 data-[state=active]:bg-blue-900/30"
                >
                  <FaChartArea size={10} />
                </TabsTrigger>
                <TabsTrigger 
                  value="bar" 
                  className="h-6 px-2 data-[state=active]:bg-blue-900/30"
                >
                  <FaChartBar size={10} />
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Tabs value={period} onValueChange={setPeriod} className="h-8">
              <TabsList className="bg-[#1A2234] border border-blue-900/30">
                <TabsTrigger 
                  value="day" 
                  className="h-6 px-2 text-xs data-[state=active]:bg-blue-900/30"
                >
                  24H
                </TabsTrigger>
                <TabsTrigger 
                  value="week" 
                  className="h-6 px-2 text-xs data-[state=active]:bg-blue-900/30"
                >
                  7D
                </TabsTrigger>
                <TabsTrigger 
                  value="month" 
                  className="h-6 px-2 text-xs data-[state=active]:bg-blue-900/30"
                >
                  30D
                </TabsTrigger>
                <TabsTrigger 
                  value="all" 
                  className="h-6 px-2 text-xs data-[state=active]:bg-blue-900/30"
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
            <div className="w-6 h-6 border-t-2 border-b-2 border-blue-500 rounded-full animate-spin"></div>
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
                  // Force a hard refresh of the data
                  console.log("Manual retry for historical data");
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
              <div>No historical data available for this period</div>
              <div className="text-xs mt-1">Make some swaps to earn points!</div>
            </div>
          </div>
        ) : (
          <div className="pt-2">
            <div className="mb-2 grid grid-cols-2 gap-2">
              <div className="bg-[#1A2234] p-3 rounded-lg border border-blue-900/30">
                <div className="text-xs text-blue-300 mb-1">Total Points</div>
                <div className="text-2xl font-bold text-white">{historicalData?.totalPoints.toFixed(1)}</div>
                <div className="text-xs text-gray-500 mt-1">Lifetime points earned</div>
              </div>
              <div className="bg-[#1A2234] p-3 rounded-lg border border-blue-900/30">
                <div className="text-xs text-indigo-300 mb-1">Total Swaps</div>
                <div className="text-2xl font-bold text-white">{historicalData?.swapData.reduce((sum, swaps) => sum + swaps, 0)}</div>
                <div className="text-xs text-gray-500 mt-1">For selected period</div>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart
                    data={chartData}
                    margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSwaps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
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
                        border: '1px solid #3B82F6',
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
                      stroke="#3B82F6" 
                      fillOpacity={1} 
                      fill="url(#colorPoints)" 
                      name="Points"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="swaps" 
                      stroke="#8B5CF6" 
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
                        border: '1px solid #3B82F6',
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
                    <Bar dataKey="points" fill="#3B82F6" name="Points" />
                    <Bar dataKey="swaps" fill="#8B5CF6" name="Swaps" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PointsHistoryChart;