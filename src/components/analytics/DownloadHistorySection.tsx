import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, TrendingUp, Calendar, HardDrive } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import ChartDownloader from './ChartDownloader';

interface DownloadEvent {
  date: string;
  type: string;
  description: string;
  fileSize: string;
  category: 'analytics' | 'reports' | 'summaries' | 'exports';
}

interface DownloadHistorySectionProps {
  downloadEvents: DownloadEvent[];
}

const DownloadHistorySection: React.FC<DownloadHistorySectionProps> = ({ downloadEvents }) => {
  const chartData = useMemo(() => {
    // Group downloads by week for trends
    const weeklyData = downloadEvents.reduce((acc, event) => {
      const date = new Date(event.date);
      const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!acc[weekKey]) {
        acc[weekKey] = { 
          week: weekKey, 
          downloads: 0, 
          totalSize: 0,
          analytics: 0,
          reports: 0,
          summaries: 0,
          exports: 0
        };
      }
      
      acc[weekKey].downloads += 1;
      acc[weekKey].totalSize += parseFloat(event.fileSize);
      acc[weekKey][event.category] += 1;
      
      return acc;
    }, {} as Record<string, any>);

    return Object.values(weeklyData).sort((a: any, b: any) => 
      new Date(a.week).getTime() - new Date(b.week).getTime()
    ).slice(-8); // Last 8 weeks
  }, [downloadEvents]);

  const categoryData = useMemo(() => {
    const categories = downloadEvents.reduce((acc, event) => {
      acc[event.category] = (acc[event.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const colors = {
      analytics: 'hsl(var(--primary))',
      reports: 'hsl(var(--secondary))',
      summaries: 'hsl(var(--accent))',
      exports: 'hsl(var(--muted))'
    };

    return Object.entries(categories).map(([category, count]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: count,
      color: colors[category as keyof typeof colors]
    }));
  }, [downloadEvents]);

  const totalSize = downloadEvents.reduce((sum, event) => sum + parseFloat(event.fileSize), 0);
  const thisWeekDownloads = downloadEvents.filter(event => {
    const eventDate = new Date(event.date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return eventDate > weekAgo;
  }).length;

  const chartConfig = {
    downloads: {
      label: "Downloads",
      color: "hsl(var(--primary))",
    },
    totalSize: {
      label: "Total Size (MB)",
      color: "hsl(var(--secondary))",
    },
    analytics: {
      label: "Analytics",
      color: "hsl(var(--primary))",
    },
    reports: {
      label: "Reports", 
      color: "hsl(var(--secondary))",
    },
    summaries: {
      label: "Summaries",
      color: "hsl(var(--accent))",
    },
    exports: {
      label: "Exports",
      color: "hsl(var(--muted-foreground))",
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'analytics': return <TrendingUp className="w-4 h-4" />;
      case 'reports': return <FileText className="w-4 h-4" />;
      case 'summaries': return <Calendar className="w-4 h-4" />;
      case 'exports': return <HardDrive className="w-4 h-4" />;
      default: return <Download className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'analytics': return 'default';
      case 'reports': return 'secondary';
      case 'summaries': return 'outline';
      case 'exports': return 'destructive';
      default: return 'default';
    }
  };

  if (downloadEvents.length === 0) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
            <Download className="w-8 h-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-lg">No Download History</CardTitle>
          <p className="text-sm text-muted-foreground">
            Download activity will appear here once you start generating reports
          </p>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Downloads</p>
                <p className="text-3xl font-bold text-primary">{downloadEvents.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Download className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Data</p>
                <p className="text-3xl font-bold text-secondary">{totalSize.toFixed(1)} MB</p>
              </div>
              <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-3xl font-bold text-accent">{thisWeekDownloads}</p>
              </div>
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trends Chart */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">Download Trends</CardTitle>
            <ChartDownloader 
              chartData={chartData} 
              chartType="weekly-downloads" 
              fileName="download-trends" 
            />
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="week"
                    tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    className="text-xs"
                  />
                  <YAxis className="text-xs" />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="downloads" 
                    stroke="var(--color-downloads)"
                    strokeWidth={3}
                    dot={{ fill: "var(--color-downloads)", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: "var(--color-downloads)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg">Download Categories</CardTitle>
            <ChartDownloader 
              chartData={categoryData} 
              chartType="category-distribution" 
              fileName="download-categories" 
            />
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Downloads List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Downloads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {downloadEvents.slice(0, 10).map((event, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    {getCategoryIcon(event.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm truncate">{event.type}</p>
                      <Badge variant={getCategoryColor(event.category) as any} className="text-xs">
                        {event.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{event.description}</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium">{event.fileSize}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DownloadHistorySection;