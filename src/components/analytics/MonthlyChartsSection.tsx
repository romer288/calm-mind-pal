
import React from 'react';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';
import ChartDownloader from './ChartDownloader';
import { Calendar, TrendingUp } from 'lucide-react';

interface MonthlyChartsSectionProps {
  analyses: ClaudeAnxietyAnalysis[];
}

const MonthlyChartsSection: React.FC<MonthlyChartsSectionProps> = ({ analyses }) => {
  const processMonthlyData = () => {
    if (analyses.length === 0) return [];
    
    const monthlyData: Record<string, {
      month: string;
      avgAnxiety: number;
      avgGAD7: number;
      sessionCount: number;
      totalAnxiety: number;
      totalGAD7: number;
    }> = {};

    analyses.forEach(analysis => {
      // Use current date for demo - in real app, you'd use analysis.createdAt
      const date = new Date();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthName,
          avgAnxiety: 0,
          avgGAD7: 0,
          sessionCount: 0,
          totalAnxiety: 0,
          totalGAD7: 0
        };
      }

      monthlyData[monthKey].sessionCount++;
      monthlyData[monthKey].totalAnxiety += analysis.anxietyLevel;
      monthlyData[monthKey].totalGAD7 += analysis.gad7Score;
    });

    return Object.values(monthlyData).map(data => ({
      ...data,
      avgAnxiety: Math.round((data.totalAnxiety / data.sessionCount) * 10) / 10,
      avgGAD7: Math.round((data.totalGAD7 / data.sessionCount) * 10) / 10
    }));
  };

  const monthlyData = processMonthlyData();

  const chartConfig = {
    avgAnxiety: { label: 'Average Anxiety', color: '#3B82F6' },
    avgGAD7: { label: 'Average GAD-7', color: '#10B981' },
    sessionCount: { label: 'Sessions', color: '#F59E0B' }
  };

  if (analyses.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Monthly Progress Overview</h3>
        </div>
        <p className="text-gray-600">Start tracking your anxiety to see monthly progress trends.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Monthly Anxiety Trends */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Monthly Anxiety Trends</h3>
          </div>
          <ChartDownloader 
            chartData={monthlyData}
            chartType="monthly-anxiety-trends"
            fileName="Monthly-Anxiety-Trends"
          />
        </div>
        
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line 
                type="monotone" 
                dataKey="avgAnxiety" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Avg Anxiety Level"
              />
              <Line 
                type="monotone" 
                dataKey="avgGAD7" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Avg GAD-7 Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Card>

      {/* Monthly Session Activity */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Monthly Session Activity</h3>
          </div>
          <ChartDownloader 
            chartData={monthlyData}
            chartType="monthly-session-activity"
            fileName="Monthly-Session-Activity"
          />
        </div>
        
        <ChartContainer config={chartConfig} className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="sessionCount" fill="#F59E0B" name="Sessions" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </Card>
    </div>
  );
};

export default MonthlyChartsSection;
