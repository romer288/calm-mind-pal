
import React from 'react';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import ChartDownloader from './ChartDownloader';

interface TriggerData {
  trigger: string;
  count: number;
  avgSeverity: number;
  color: string;
}

interface SeverityData {
  range: string;
  count: number;
  color: string;
}

interface WeeklyTrendData {
  day: string;
  workCareer: number;
  social: number;
  health: number;
  financial: number;
  relationships: number;
  future: number;
  family: number;
}

interface AnxietyChartsSectionProps {
  triggerData: TriggerData[];
  severityDistribution: SeverityData[];
  analyses: any[];
}

const AnxietyChartsSection: React.FC<AnxietyChartsSectionProps> = ({
  triggerData,
  severityDistribution,
  analyses
}) => {
  // Process real data for weekly trends
  const processWeeklyTrends = () => {
    console.log('🔍 AnxietyChartsSection - Processing weekly trends with analyses:', analyses.length);
    if (analyses.length === 0) return [];
    
    const weeklyData: Record<string, Record<string, number>> = {};
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Initialize all days
    daysOfWeek.forEach(day => {
      weeklyData[day] = {
        workCareer: 0,
        social: 0,
        health: 0,
        financial: 0,
        relationships: 0,
        future: 0,
        family: 0
      };
    });
    
    analyses.forEach(analysis => {
      const date = new Date(analysis.created_at || new Date());
      const dayName = daysOfWeek[date.getDay()];
      
      // Map triggers to categories and count anxiety levels
      analysis.triggers.forEach((trigger: string) => {
        const lowerTrigger = trigger.toLowerCase();
        if (lowerTrigger.includes('work') || lowerTrigger.includes('career') || lowerTrigger.includes('job')) {
          weeklyData[dayName].workCareer += analysis.anxietyLevel;
        } else if (lowerTrigger.includes('social') || lowerTrigger.includes('people')) {
          weeklyData[dayName].social += analysis.anxietyLevel;
        } else if (lowerTrigger.includes('health') || lowerTrigger.includes('medical')) {
          weeklyData[dayName].health += analysis.anxietyLevel;
        } else if (lowerTrigger.includes('financial') || lowerTrigger.includes('money')) {
          weeklyData[dayName].financial += analysis.anxietyLevel;
        } else if (lowerTrigger.includes('relationship') || lowerTrigger.includes('family')) {
          if (lowerTrigger.includes('family')) {
            weeklyData[dayName].family += analysis.anxietyLevel;
          } else {
            weeklyData[dayName].relationships += analysis.anxietyLevel;
          }
        } else if (lowerTrigger.includes('future') || lowerTrigger.includes('uncertainty')) {
          weeklyData[dayName].future += analysis.anxietyLevel;
        }
      });
    });
    
    return daysOfWeek.map(day => ({
      day,
      ...weeklyData[day]
    }));
  };

  const weeklyTrends = processWeeklyTrends();
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Anxiety Type Trends Chart */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Anxiety Type Trends Over Time</h3>
          <ChartDownloader 
            chartData={weeklyTrends}
            chartType="weekly-anxiety-trends"
            fileName="Weekly-Anxiety-Trends"
          />
        </div>
        {triggerData.length > 0 ? (
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
                <Line type="monotone" dataKey="future" stroke="#F97316" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No trend data available yet
          </div>
        )}
      </Card>

      {/* Severity Distribution */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Anxiety Levels Distribution</h3>
          <ChartDownloader 
            chartData={severityDistribution}
            chartType="severity-distribution"
            fileName="Severity-Distribution"
          />
        </div>
        {severityDistribution.length > 0 && severityDistribution.some(d => d.count > 0) ? (
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityDistribution.filter(d => d.count > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ range, percent }) => `${range} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {severityDistribution.filter(d => d.count > 0).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No severity data available yet
          </div>
        )}
      </Card>
    </div>
  );
};

export default AnxietyChartsSection;
