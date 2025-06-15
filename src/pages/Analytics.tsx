
import React from 'react';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, Calendar, Target } from 'lucide-react';

const Analytics = () => {
  // Mock data for demonstration - in a real app, this would come from your database
  const triggerData = [
    { trigger: 'Work/Career', count: 12, avgSeverity: 7.2, color: '#3B82F6' },
    { trigger: 'Social Situations', count: 8, avgSeverity: 6.8, color: '#EF4444' },
    { trigger: 'Health Concerns', count: 6, avgSeverity: 8.1, color: '#F59E0B' },
    { trigger: 'Financial Stress', count: 10, avgSeverity: 7.5, color: '#10B981' },
    { trigger: 'Relationships', count: 4, avgSeverity: 6.2, color: '#8B5CF6' },
    { trigger: 'Future/Uncertainty', count: 15, avgSeverity: 7.8, color: '#F97316' },
    { trigger: 'Family Issues', count: 3, avgSeverity: 5.9, color: '#06B6D4' }
  ];

  const weeklyTrends = [
    { week: 'Week 1', workCareer: 3, social: 2, health: 1, financial: 2, relationships: 1, future: 4, family: 0 },
    { week: 'Week 2', workCareer: 2, social: 1, health: 2, financial: 3, relationships: 0, future: 3, family: 1 },
    { week: 'Week 3', workCareer: 4, social: 3, health: 1, financial: 2, relationships: 2, future: 4, family: 1 },
    { week: 'Week 4', workCareer: 3, social: 2, health: 2, financial: 3, relationships: 1, future: 4, family: 1 }
  ];

  const severityDistribution = [
    { range: '1-3 (Low)', count: 8, color: '#10B981' },
    { range: '4-6 (Moderate)', count: 25, color: '#F59E0B' },
    { range: '7-8 (High)', count: 18, color: '#EF4444' },
    { range: '9-10 (Severe)', count: 7, color: '#DC2626' }
  ];

  const totalEntries = triggerData.reduce((sum, item) => sum + item.count, 0);
  const averageAnxiety = triggerData.reduce((sum, item) => sum + (item.avgSeverity * item.count), 0) / totalEntries;
  const mostCommonTrigger = triggerData.reduce((prev, current) => (prev.count > current.count) ? prev : current);

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm text-gray-600">Track your anxiety triggers and patterns over time</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4" />
            <span>Last 30 days</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900">{totalEntries}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Anxiety</p>
                <p className="text-2xl font-bold text-gray-900">{averageAnxiety.toFixed(1)}/10</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Most Common Trigger</p>
                <p className="text-lg font-bold text-gray-900">{mostCommonTrigger.trigger}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Target className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unique Triggers</p>
                <p className="text-2xl font-bold text-gray-900">{triggerData.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <TrendingDown className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Trigger Frequency Chart */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Trigger Frequency</h3>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={triggerData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="trigger" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>

          {/* Severity Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Anxiety Severity Distribution</h3>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={severityDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {severityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </Card>
        </div>

        {/* Weekly Trends */}
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Trigger Trends</h3>
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
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

        {/* Detailed Trigger Analysis Table */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Trigger Analysis</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trigger Type</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Average Severity</TableHead>
                <TableHead>Percentage of Total</TableHead>
                <TableHead>Trend</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {triggerData
                .sort((a, b) => b.count - a.count)
                .map((trigger, index) => (
                  <TableRow key={trigger.trigger}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: trigger.color }}
                        />
                        {trigger.trigger}
                      </div>
                    </TableCell>
                    <TableCell>{trigger.count} times</TableCell>
                    <TableCell>
                      <span className={`font-medium ${
                        trigger.avgSeverity >= 7 ? 'text-red-600' : 
                        trigger.avgSeverity >= 5 ? 'text-orange-600' : 'text-green-600'
                      }`}>
                        {trigger.avgSeverity.toFixed(1)}/10
                      </span>
                    </TableCell>
                    <TableCell>{((trigger.count / totalEntries) * 100).toFixed(1)}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {index % 2 === 0 ? (
                          <TrendingUp className="w-4 h-4 text-red-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-green-500" />
                        )}
                        <span className={`text-sm ${index % 2 === 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {index % 2 === 0 ? '+12%' : '-8%'}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;
