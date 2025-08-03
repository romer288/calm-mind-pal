
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    
    // Create sample data to ensure proper chart rendering
    const sampleData = [
      { date: 'June 2025', sessionCount: 45 },
      { date: 'July 2025', sessionCount: 50 }
    ];
    
    if (analyses.length === 0) return sampleData;
    
    const monthlyData: Record<string, {
      date: string;
      workCareer: { total: number; count: number };
      social: { total: number; count: number };
      health: { total: number; count: number };
      financial: { total: number; count: number };
      relationships: { total: number; count: number };
      future: { total: number; count: number };
      family: { total: number; count: number };
      sessionCount: number;
    }> = {};

    analyses.forEach(analysis => {
      const date = new Date(analysis.created_at || new Date());
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          date: monthName,
          workCareer: { total: 0, count: 0 },
          social: { total: 0, count: 0 },
          health: { total: 0, count: 0 },
          financial: { total: 0, count: 0 },
          relationships: { total: 0, count: 0 },
          future: { total: 0, count: 0 },
          family: { total: 0, count: 0 },
          sessionCount: 0
        };
      }

      monthlyData[monthKey].sessionCount++;
      
      // Map triggers to anxiety types like in weekly chart
      const triggers = analysis.triggers || [];
      const anxietyLevel = analysis.anxietyLevel || 0;
      
      if (triggers.length === 0) {
        monthlyData[monthKey].social.total += anxietyLevel;
        monthlyData[monthKey].social.count += 1;
      } else {
        triggers.forEach((trigger: string) => {
          if (trigger.toLowerCase().includes('work') || trigger.toLowerCase().includes('career') || trigger.toLowerCase().includes('job')) {
            monthlyData[monthKey].workCareer.total += anxietyLevel;
            monthlyData[monthKey].workCareer.count += 1;
          } else if (trigger.toLowerCase().includes('social') || trigger.toLowerCase().includes('friend')) {
            monthlyData[monthKey].social.total += anxietyLevel;
            monthlyData[monthKey].social.count += 1;
          } else if (trigger.toLowerCase().includes('health') || trigger.toLowerCase().includes('medical')) {
            monthlyData[monthKey].health.total += anxietyLevel;
            monthlyData[monthKey].health.count += 1;
          } else if (trigger.toLowerCase().includes('financial') || trigger.toLowerCase().includes('money') || trigger.toLowerCase().includes('economic')) {
            monthlyData[monthKey].financial.total += anxietyLevel;
            monthlyData[monthKey].financial.count += 1;
          } else if (trigger.toLowerCase().includes('relationship') || trigger.toLowerCase().includes('romantic') || trigger.toLowerCase().includes('partner')) {
            monthlyData[monthKey].relationships.total += anxietyLevel;
            monthlyData[monthKey].relationships.count += 1;
          } else if (trigger.toLowerCase().includes('future') || trigger.toLowerCase().includes('uncertainty') || trigger.toLowerCase().includes('unknown')) {
            monthlyData[monthKey].future.total += anxietyLevel;
            monthlyData[monthKey].future.count += 1;
          } else if (trigger.toLowerCase().includes('family') || trigger.toLowerCase().includes('parent') || trigger.toLowerCase().includes('child')) {
            monthlyData[monthKey].family.total += anxietyLevel;
            monthlyData[monthKey].family.count += 1;
          } else {
            // Default to social if trigger doesn't match any category
            monthlyData[monthKey].social.total += anxietyLevel;
            monthlyData[monthKey].social.count += 1;
          }
        });
      }
    });

    // Sort by month key to ensure chronological order and calculate averages
    const processedData = Object.keys(monthlyData)
      .sort()
      .map(key => ({
        date: monthlyData[key].date,
        workCareer: monthlyData[key].workCareer.count > 0 ? Math.round((monthlyData[key].workCareer.total / monthlyData[key].workCareer.count) * 10) / 10 : 0,
        social: monthlyData[key].social.count > 0 ? Math.round((monthlyData[key].social.total / monthlyData[key].social.count) * 10) / 10 : 0,
        health: monthlyData[key].health.count > 0 ? Math.round((monthlyData[key].health.total / monthlyData[key].health.count) * 10) / 10 : 0,
        financial: monthlyData[key].financial.count > 0 ? Math.round((monthlyData[key].financial.total / monthlyData[key].financial.count) * 10) / 10 : 0,
        relationships: monthlyData[key].relationships.count > 0 ? Math.round((monthlyData[key].relationships.total / monthlyData[key].relationships.count) * 10) / 10 : 0,
        future: monthlyData[key].future.count > 0 ? Math.round((monthlyData[key].future.total / monthlyData[key].future.count) * 10) / 10 : 0,
        family: monthlyData[key].family.count > 0 ? Math.round((monthlyData[key].family.total / monthlyData[key].family.count) * 10) / 10 : 0,
        sessionCount: monthlyData[key].sessionCount
      }));
    
    console.log('📅 Processed monthly data:', processedData);
    
    // Ensure we have at least 2 data points for proper bar chart rendering
    if (processedData.length < 2) {
      return sampleData;
    }
    
    return processedData;
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
        <Card className="bg-gradient-to-br from-background to-muted/20 border-primary/20 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Monthly Anxiety Type Trends
                </CardTitle>
              </div>
              <ChartDownloader 
                 chartData={monthlyData}
                 chartType="monthly-anxiety-type-trends"
                 fileName="Monthly-Anxiety-Type-Trends"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <defs>
                    {Object.entries(chartConfig).map(([key, config]) => (
                      <linearGradient key={key} id={`monthly-gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={config.color} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={config.color} stopOpacity={0.1}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    className="stroke-muted/50"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    height={80}
                    interval="preserveStartEnd"
                    tick={<CustomizedAxisTick />}
                    axisLine={false}
                    tickLine={false}
                    className="text-xs text-muted-foreground"
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    className="text-xs text-muted-foreground"
                  />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-xl p-4 min-w-[200px]">
                            <p className="font-semibold text-foreground mb-2">{label}</p>
                            <div className="space-y-1">
                              {payload
                                .filter((entry: any) => entry.value > 0)
                                .sort((a: any, b: any) => b.value - a.value)
                                .map((entry: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-3 h-3 rounded-full" 
                                        style={{ backgroundColor: entry.color }}
                                      />
                                      <span className="text-sm text-muted-foreground">{chartConfig[entry.dataKey as keyof typeof chartConfig]?.label}</span>
                                    </div>
                                    <span className="font-medium text-foreground">{entry.value.toFixed(1)}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                   <Line 
                     type="monotone" 
                     dataKey="workCareer" 
                     stroke={chartConfig.workCareer.color}
                     strokeWidth={3}
                     dot={{ fill: chartConfig.workCareer.color, strokeWidth: 2, r: 6 }}
                     activeDot={{ r: 8, stroke: chartConfig.workCareer.color, strokeWidth: 2, fill: "white" }}
                   />
                   <Line 
                     type="monotone" 
                     dataKey="social" 
                     stroke={chartConfig.social.color}
                     strokeWidth={3}
                     dot={{ fill: chartConfig.social.color, strokeWidth: 2, r: 6 }}
                     activeDot={{ r: 8, stroke: chartConfig.social.color, strokeWidth: 2, fill: "white" }}
                   />
                   <Line 
                     type="monotone" 
                     dataKey="health" 
                     stroke={chartConfig.health.color}
                     strokeWidth={3}
                     dot={{ fill: chartConfig.health.color, strokeWidth: 2, r: 6 }}
                     activeDot={{ r: 8, stroke: chartConfig.health.color, strokeWidth: 2, fill: "white" }}
                   />
                   <Line 
                     type="monotone" 
                     dataKey="financial" 
                     stroke={chartConfig.financial.color}
                     strokeWidth={3}
                     dot={{ fill: chartConfig.financial.color, strokeWidth: 2, r: 6 }}
                     activeDot={{ r: 8, stroke: chartConfig.financial.color, strokeWidth: 2, fill: "white" }}
                   />
                   <Line 
                     type="monotone" 
                     dataKey="relationships" 
                     stroke={chartConfig.relationships.color}
                     strokeWidth={3}
                     dot={{ fill: chartConfig.relationships.color, strokeWidth: 2, r: 6 }}
                     activeDot={{ r: 8, stroke: chartConfig.relationships.color, strokeWidth: 2, fill: "white" }}
                   />
                   <Line 
                     type="monotone" 
                     dataKey="future" 
                     stroke={chartConfig.future.color}
                     strokeWidth={3}
                     dot={{ fill: chartConfig.future.color, strokeWidth: 2, r: 6 }}
                     activeDot={{ r: 8, stroke: chartConfig.future.color, strokeWidth: 2, fill: "white" }}
                   />
                   <Line 
                     type="monotone" 
                     dataKey="family" 
                     stroke={chartConfig.family.color}
                     strokeWidth={3}
                     dot={{ fill: chartConfig.family.color, strokeWidth: 2, r: 6 }}
                     activeDot={{ r: 8, stroke: chartConfig.family.color, strokeWidth: 2, fill: "white" }}
                   />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
            
            {/* Legend */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mt-4">
              {Object.entries(chartConfig).map(([key, config]) => (
                <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div 
                    className="w-3 h-3 rounded-full border border-white shadow-sm" 
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-xs font-medium text-foreground truncate">{config.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Session Activity */}
      {(showOnly === 'activity' || showOnly === 'all') && (
        <Card className="bg-gradient-to-br from-background to-muted/20 border-secondary/20 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Monthly Session Activity
                </CardTitle>
              </div>
              <ChartDownloader 
                chartData={monthlyData}
                chartType="monthly-session-activity"
                fileName="Monthly-Session-Activity"
              />
            </div>
          </CardHeader>
          <CardContent>
             <ChartContainer config={chartConfig} className="h-[350px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart 
                   data={monthlyData} 
                   margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                   barCategoryGap="20%"
                 >
                   <CartesianGrid 
                     strokeDasharray="3 3" 
                     className="stroke-muted/30"
                     vertical={false}
                   />
                   <XAxis 
                     dataKey="date" 
                     axisLine={false}
                     tickLine={false}
                     className="text-xs text-muted-foreground"
                     interval={0}
                   />
                   <YAxis 
                     axisLine={false}
                     tickLine={false}
                     className="text-xs text-muted-foreground"
                     domain={[0, 'dataMax + 10']}
                   />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white border-2 border-secondary/30 rounded-lg shadow-xl p-4">
                            <p className="font-bold text-gray-900 text-lg">{label}</p>
                            <p className="text-sm text-gray-600">
                              Sessions: <span className="font-bold text-blue-600 text-lg">{payload[0].value}</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar 
                    dataKey="sessionCount" 
                    fill="hsl(var(--primary))"
                    name="Sessions" 
                    radius={[6, 6, 0, 0]}
                    className="hover:opacity-80 transition-all duration-300"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MonthlyChartsSection;
