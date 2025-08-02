import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import ChartDownloader from './ChartDownloader';
import { TrendingUp } from 'lucide-react';

interface SeverityData {
  range: string;
  count: number;
  color: string;
}

interface AnxietyDistributionChartProps {
  severityDistribution: SeverityData[];
}

const AnxietyDistributionChart: React.FC<AnxietyDistributionChartProps> = ({ severityDistribution }) => {
  const chartConfig = {
    count: {
      label: "Sessions",
    },
  };

  // Enhanced color palette with gradients
  const enhancedData = severityDistribution.filter(d => d.count > 0).map((item, index) => ({
    ...item,
    color: [
      'hsl(var(--primary))',
      'hsl(var(--secondary))', 
      'hsl(var(--accent))',
      'hsl(220 70% 50%)',
      'hsl(280 70% 50%)',
      'hsl(25 95% 53%)',
      'hsl(173 58% 39%)'
    ][index % 7]
  }));

  const total = enhancedData.reduce((sum, item) => sum + item.count, 0);

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, range }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show labels for slices < 5%

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="600"
        className="drop-shadow-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-foreground">{data.range}</p>
          <p className="text-sm text-muted-foreground">
            Sessions: <span className="font-medium text-foreground">{data.count}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Percentage: <span className="font-medium text-foreground">{((data.count / total) * 100).toFixed(1)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="bg-gradient-to-br from-background to-muted/20 border-primary/20 shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Anxiety Levels Distribution
            </CardTitle>
          </div>
          <ChartDownloader 
            chartData={severityDistribution}
            chartType="severity-distribution"
            fileName="Anxiety-Levels-Distribution"
          />
        </div>
      </CardHeader>
      <CardContent>
        {enhancedData.length > 0 ? (
          <div className="space-y-6">
            <ChartContainer config={chartConfig} className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {enhancedData.map((entry, index) => (
                      <linearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={entry.color} stopOpacity="1"/>
                        <stop offset="100%" stopColor={entry.color} stopOpacity="0.7"/>
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={enhancedData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={CustomLabel}
                    outerRadius={140}
                    innerRadius={60}
                    fill="#8884d8"
                    dataKey="count"
                    animationBegin={0}
                    animationDuration={800}
                    paddingAngle={2}
                  >
                    {enhancedData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={`url(#gradient-${index})`}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
            
            {/* Legend with enhanced styling */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {enhancedData.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white shadow-sm" 
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.range}</p>
                    <p className="text-xs text-muted-foreground">{item.count} sessions</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground">
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <TrendingUp className="w-10 h-10" />
            </div>
            <p className="text-lg font-medium">No severity data available yet</p>
            <p className="text-sm text-center max-w-sm mt-2">
              Start tracking your anxiety levels to see distribution patterns
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AnxietyDistributionChart;