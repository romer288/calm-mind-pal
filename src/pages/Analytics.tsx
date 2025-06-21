import React from 'react';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, Calendar, Target, Download, Share } from 'lucide-react';
import AnxietyAnalyticsTracker from '@/components/AnxietyAnalyticsTracker';
import { useAnxietyAnalysis } from '@/hooks/useAnxietyAnalysis';
import { useChat } from '@/hooks/useChat';
import { ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';

const Analytics = () => {
  const { anxietyAnalyses } = useAnxietyAnalysis();
  const { messages } = useChat();

  // Get all anxiety analyses from messages and hook
  const getAllAnalyses = () => {
    const messageAnalyses = messages
      .filter(msg => msg.sender === 'user' && msg.anxietyAnalysis)
      .map(msg => msg.anxietyAnalysis as ClaudeAnxietyAnalysis);
    
    // Combine and deduplicate
    const allAnalyses = [...messageAnalyses, ...anxietyAnalyses]
      .filter((analysis, index, arr) => 
        arr.findIndex(a => JSON.stringify(a) === JSON.stringify(analysis)) === index
      ) as ClaudeAnxietyAnalysis[];

    return allAnalyses;
  };

  const allAnalyses = getAllAnalyses();

  const downloadMedicalHistory = () => {
    const medicalData = {
      patientName: "Anonymous User",
      generatedDate: new Date().toISOString(),
      totalSessions: allAnalyses.length,
      anxietyAnalyses: allAnalyses,
      conversationHistory: messages.map(msg => ({
        timestamp: msg.timestamp,
        sender: msg.sender,
        text: msg.text,
        anxietyAnalysis: msg.anxietyAnalysis
      }))
    };

    const blob = new Blob([JSON.stringify(medicalData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anxiety-companion-medical-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const shareWithTherapist = () => {
    const shareableData = {
      summary: `Anxiety Companion Medical History - ${allAnalyses.length} sessions`,
      averageAnxietyLevel: allAnalyses.length > 0 
        ? (allAnalyses.reduce((sum, analysis) => sum + analysis.anxietyLevel, 0) / allAnalyses.length).toFixed(1)
        : 'N/A',
      averageGAD7Score: allAnalyses.length > 0 
        ? (allAnalyses.reduce((sum, analysis) => sum + analysis.gad7Score, 0) / allAnalyses.length).toFixed(1)
        : 'N/A',
      mostCommonTriggers: [...new Set(allAnalyses.flatMap(a => a.triggers))].slice(0, 5),
      recommendedInterventions: [...new Set(allAnalyses.flatMap(a => a.recommendedInterventions))].slice(0, 5)
    };

    const shareText = `Anxiety Companion Report:\n\nSessions: ${shareableData.summary}\nAvg Anxiety Level: ${shareableData.averageAnxietyLevel}/10\nAvg GAD-7 Score: ${shareableData.averageGAD7Score}/21\n\nMain Triggers: ${shareableData.mostCommonTriggers.join(', ')}\n\nEffective Interventions: ${shareableData.recommendedInterventions.join(', ')}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Anxiety Companion Medical History',
        text: shareText
      });
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Medical history summary copied to clipboard!');
    }
  };

  // Process real data for charts
  const processTriggerData = () => {
    const triggerCounts: Record<string, { count: number; severitySum: number; color: string }> = {};
    const colors = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#F97316', '#06B6D4'];
    let colorIndex = 0;

    allAnalyses.forEach(analysis => {
      analysis.triggers.forEach(trigger => {
        if (!triggerCounts[trigger]) {
          triggerCounts[trigger] = { 
            count: 0, 
            severitySum: 0, 
            color: colors[colorIndex % colors.length] 
          };
          colorIndex++;
        }
        triggerCounts[trigger].count++;
        triggerCounts[trigger].severitySum += analysis.anxietyLevel;
      });
    });

    return Object.entries(triggerCounts).map(([trigger, data]) => ({
      trigger,
      count: data.count,
      avgSeverity: data.count > 0 ? data.severitySum / data.count : 0,
      color: data.color
    }));
  };

  const processSeverityDistribution = () => {
    const distribution = { low: 0, moderate: 0, high: 0, severe: 0 };
    
    allAnalyses.forEach(analysis => {
      if (analysis.anxietyLevel <= 3) distribution.low++;
      else if (analysis.anxietyLevel <= 6) distribution.moderate++;
      else if (analysis.anxietyLevel <= 8) distribution.high++;
      else distribution.severe++;
    });

    return [
      { range: '1-3 (Low)', count: distribution.low, color: '#10B981' },
      { range: '4-6 (Moderate)', count: distribution.moderate, color: '#F59E0B' },
      { range: '7-8 (High)', count: distribution.high, color: '#EF4444' },
      { range: '9-10 (Severe)', count: distribution.severe, color: '#DC2626' }
    ];
  };

  // Use real data or fallback to mock data for demonstration
  const triggerData = allAnalyses.length > 0 ? processTriggerData() : [
    { trigger: 'Work/Career', count: 12, avgSeverity: 7.2, color: '#3B82F6' },
    { trigger: 'Social Situations', count: 8, avgSeverity: 6.8, color: '#EF4444' },
    { trigger: 'Health Concerns', count: 6, avgSeverity: 8.1, color: '#F59E0B' },
    { trigger: 'Financial Stress', count: 10, avgSeverity: 7.5, color: '#10B981' },
    { trigger: 'Relationships', count: 4, avgSeverity: 6.2, color: '#8B5CF6' },
    { trigger: 'Future/Uncertainty', count: 15, avgSeverity: 7.8, color: '#F97316' },
    { trigger: 'Family Issues', count: 3, avgSeverity: 5.9, color: '#06B6D4' }
  ];

  const severityDistribution = allAnalyses.length > 0 ? processSeverityDistribution() : [
    { range: '1-3 (Low)', count: 8, color: '#10B981' },
    { range: '4-6 (Moderate)', count: 25, color: '#F59E0B' },
    { range: '7-8 (High)', count: 18, color: '#EF4444' },
    { range: '9-10 (Severe)', count: 7, color: '#DC2626' }
  ];

  // Mock weekly trends for now - would need date tracking for real data
  const weeklyTrends = [
    { day: 'Monday', workCareer: 2, social: 1, health: 0, financial: 1, relationships: 0, future: 3, family: 1 },
    { day: 'Tuesday', workCareer: 3, social: 2, health: 1, financial: 2, relationships: 1, future: 2, family: 0 },
    { day: 'Wednesday', workCareer: 4, social: 1, health: 2, financial: 1, relationships: 0, future: 4, family: 1 },
    { day: 'Thursday', workCareer: 2, social: 3, health: 1, financial: 3, relationships: 2, future: 3, family: 0 },
    { day: 'Friday', workCareer: 1, social: 1, health: 2, financial: 2, relationships: 1, future: 2, family: 1 },
    { day: 'Saturday', workCareer: 0, social: 0, health: 0, financial: 1, relationships: 0, future: 1, family: 0 },
    { day: 'Sunday', workCareer: 0, social: 0, health: 0, financial: 0, relationships: 0, future: 0, family: 0 }
  ];

  const totalEntries = triggerData.reduce((sum, item) => sum + item.count, 0);
  const averageAnxiety = allAnalyses.length > 0 
    ? allAnalyses.reduce((sum, analysis) => sum + analysis.anxietyLevel, 0) / allAnalyses.length
    : triggerData.reduce((sum, item) => sum + (item.avgSeverity * item.count), 0) / totalEntries;
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
          <div className="flex items-center gap-4">
            <Button onClick={downloadMedicalHistory} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Download History
            </Button>
            <Button onClick={shareWithTherapist} variant="outline" size="sm">
              <Share className="w-4 h-4 mr-2" />
              Share with Therapist
            </Button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Current week</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Anxiety Analytics Tracker - now at the top */}
        <AnxietyAnalyticsTracker analyses={allAnalyses} />

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900">{allAnalyses.length || totalEntries}</p>
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Trigger Patterns (This Week)</h3>
          <p className="text-sm text-gray-600 mb-4">Track how different triggers affect you throughout the week</p>
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis label={{ value: 'Number of Episodes', angle: -90, position: 'insideLeft' }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="workCareer" stroke="#3B82F6" strokeWidth={2} name="Work/Career" />
                <Line type="monotone" dataKey="social" stroke="#EF4444" strokeWidth={2} name="Social Situations" />
                <Line type="monotone" dataKey="health" stroke="#F59E0B" strokeWidth={2} name="Health Concerns" />
                <Line type="monotone" dataKey="financial" stroke="#10B981" strokeWidth={2} name="Financial Stress" />
                <Line type="monotone" dataKey="relationships" stroke="#8B5CF6" strokeWidth={2} name="Relationships" />
                <Line type="monotone" dataKey="future" stroke="#F97316" strokeWidth={2} name="Future/Uncertainty" />
                <Line type="monotone" dataKey="family" stroke="#06B6D4" strokeWidth={2} name="Family Issues" />
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
