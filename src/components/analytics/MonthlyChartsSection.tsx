
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
            <ChartContainer config={chartConfig} className="h-[400px]">
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
                <CardTitle className="text-xl bg-gradient-to-r from-secondary to-secondary/80 bg-clip-text text-transparent">
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
                <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                  <defs>
                    <linearGradient id="colorfulBarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(220 100% 60%)" stopOpacity={1}/>
                      <stop offset="25%" stopColor="hsl(280 100% 60%)" stopOpacity={0.9}/>
                      <stop offset="50%" stopColor="hsl(320 100% 60%)" stopOpacity={0.8}/>
                      <stop offset="75%" stopColor="hsl(360 100% 60%)" stopOpacity={0.7}/>
                      <stop offset="100%" stopColor="hsl(25 100% 60%)" stopOpacity={0.6}/>
                    </linearGradient>
                    <filter id="barGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
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
                    fill="url(#colorfulBarGradient)"
                    name="Sessions" 
                    radius={[8, 8, 0, 0]}
                    className="hover:opacity-80 transition-all duration-300"
                    filter="url(#barGlow)"
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
