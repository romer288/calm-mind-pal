import React from 'react';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import ChartDownloader from './ChartDownloader';
import { WeeklyTrendData } from '@/hooks/useWeeklyTrendsData';

interface AnxietyTrendsChartProps {
  weeklyTrends: WeeklyTrendData[];
}

const AnxietyTrendsChart: React.FC<AnxietyTrendsChartProps> = ({ weeklyTrends }) => {
  console.log('📈 AnxietyTrendsChart render - weeklyTrends:', weeklyTrends);
  console.log('📈 weeklyTrends length:', weeklyTrends.length);
  console.log('📈 First item:', weeklyTrends[0]);
  console.log('📈 Last item:', weeklyTrends[weeklyTrends.length - 1]);
  
  const chartConfig = {
    workCareer: { label: 'Work/Career', color: '#3B82F6' },
    social: { label: 'Social', color: '#EF4444' },
    health: { label: 'Health', color: '#F59E0B' },
    financial: { label: 'Financial', color: '#10B981' },
    relationships: { label: 'Relationships', color: '#8B5CF6' },
    future: { label: 'Future/Uncertainty', color: '#F97316' },
    family: { label: 'Family', color: '#06B6D4' }
  };

  const CustomizedAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const dataIndex = payload.index;
    const item = weeklyTrends[dataIndex];
    
    if (!item) return null;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fontSize={10} fill="currentColor">
          {item.date}
        </text>
      </g>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Anxiety Type Trends Over Time</h3>
        <ChartDownloader 
          chartData={weeklyTrends}
          chartType="weekly-anxiety-trends"
          fileName="Weekly-Anxiety-Trends"
        />
      </div>
      {weeklyTrends.length > 0 ? (
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyTrends} margin={{ top: 5, right: 30, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                height={60}
                interval="preserveStartEnd"
                tick={<CustomizedAxisTick />}
              />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="workCareer" stroke="#3B82F6" strokeWidth={2} />
              <Line type="monotone" dataKey="social" stroke="#EF4444" strokeWidth={2} />
              <Line type="monotone" dataKey="health" stroke="#F59E0B" strokeWidth={2} />
              <Line type="monotone" dataKey="financial" stroke="#10B981" strokeWidth={2} />
              <Line type="monotone" dataKey="relationships" stroke="#8B5CF6" strokeWidth={2} />
              <Line type="monotone" dataKey="future" stroke="#F97316" strokeWidth={2} />
              <Line type="monotone" dataKey="family" stroke="#06B6D4" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      ) : (
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          No trend data available yet
        </div>
      )}
    </Card>
  );
};

export default AnxietyTrendsChart;