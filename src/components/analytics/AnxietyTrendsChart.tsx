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
  const chartConfig = {
    workCareer: { label: 'Work/Career', color: '#3B82F6' },
    social: { label: 'Social', color: '#EF4444' },
    health: { label: 'Health', color: '#F59E0B' },
    financial: { label: 'Financial', color: '#10B981' },
    relationships: { label: 'Relationships', color: '#8B5CF6' },
    future: { label: 'Future/Uncertainty', color: '#F97316' },
    family: { label: 'Family', color: '#06B6D4' }
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
            <LineChart data={weeklyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
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