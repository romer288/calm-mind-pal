
import React from 'react';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ClaudeAnxietyAnalysisWithDate } from '@/services/analyticsService';
import ChartDownloader from './ChartDownloader';
import { Calendar, TrendingUp } from 'lucide-react';

interface MonthlyChartsSectionProps {
  analyses: ClaudeAnxietyAnalysisWithDate[];
  showOnly?: 'trends' | 'activity' | 'all';
}

const MonthlyChartsSection: React.FC<MonthlyChartsSectionProps> = ({ analyses, showOnly = 'all' }) => {
  const processMonthlyData = () => {
    console.log('📅 MonthlyChartsSection - Processing monthly data with analyses:', analyses.length);
    if (analyses.length === 0) return [];
    
    const monthlyData: Record<string, {
      date: string;
      workCareer: number;
      social: number;
      health: number;
      financial: number;
      relationships: number;
      future: number;
      family: number;
      sessionCount: number;
    }> = {};

    analyses.forEach(analysis => {
      const date = new Date(analysis.created_at || new Date());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          date: monthName,
          workCareer: 0,
          social: 0,
          health: 0,
          financial: 0,
          relationships: 0,
          future: 0,
          family: 0,
          sessionCount: 0
        };
      }

      monthlyData[monthKey].sessionCount++;
      
      // Map triggers to anxiety types like in weekly chart
      const triggers = analysis.triggers || [];
      triggers.forEach((trigger: string) => {
        const anxietyLevel = analysis.anxietyLevel || 0;
        
        if (trigger.toLowerCase().includes('work') || trigger.toLowerCase().includes('career') || trigger.toLowerCase().includes('job')) {
          monthlyData[monthKey].workCareer += anxietyLevel;
        } else if (trigger.toLowerCase().includes('social') || trigger.toLowerCase().includes('friend')) {
          monthlyData[monthKey].social += anxietyLevel;
        } else if (trigger.toLowerCase().includes('health') || trigger.toLowerCase().includes('medical')) {
          monthlyData[monthKey].health += anxietyLevel;
        } else if (trigger.toLowerCase().includes('financial') || trigger.toLowerCase().includes('money') || trigger.toLowerCase().includes('economic')) {
          monthlyData[monthKey].financial += anxietyLevel;
        } else if (trigger.toLowerCase().includes('relationship') || trigger.toLowerCase().includes('romantic') || trigger.toLowerCase().includes('partner')) {
          monthlyData[monthKey].relationships += anxietyLevel;
        } else if (trigger.toLowerCase().includes('future') || trigger.toLowerCase().includes('uncertainty') || trigger.toLowerCase().includes('unknown')) {
          monthlyData[monthKey].future += anxietyLevel;
        } else if (trigger.toLowerCase().includes('family') || trigger.toLowerCase().includes('parent') || trigger.toLowerCase().includes('child')) {
          monthlyData[monthKey].family += anxietyLevel;
        } else {
          // Default to social if trigger doesn't match any category
          monthlyData[monthKey].social += anxietyLevel;
        }
      });
    });

    // Sort by month key to ensure chronological order
    return Object.keys(monthlyData)
      .sort()
      .map(key => monthlyData[key]);
  };

  const monthlyData = processMonthlyData();

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
    const item = monthlyData[dataIndex];
    
    if (!item) return null;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={16} 
          textAnchor="middle" 
          fontSize={10} 
          fill="currentColor"
          transform="rotate(-15)"
        >
          {item.date}
        </text>
      </g>
    );
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
      {(showOnly === 'trends' || showOnly === 'all') && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Monthly Anxiety Type Trends</h3>
            </div>
            <ChartDownloader 
               chartData={monthlyData}
               chartType="monthly-anxiety-type-trends"
               fileName="Monthly-Anxiety-Type-Trends"
            />
          </div>
          
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 5, bottom: 25 }}>
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
        </Card>
      )}

      {/* Monthly Session Activity */}
      {(showOnly === 'activity' || showOnly === 'all') && (
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
          
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sessionCount" fill="#F59E0B" name="Sessions" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>
      )}
    </div>
  );
};

export default MonthlyChartsSection;
