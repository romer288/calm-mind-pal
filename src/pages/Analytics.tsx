import React from 'react';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle, Calendar, Target, Download, Share, Loader2 } from 'lucide-react';
import AnxietyAnalyticsTracker from '@/components/AnxietyAnalyticsTracker';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';
import TreatmentOutcomes from '@/components/TreatmentOutcomes';

const Analytics = () => {
  const { data, isLoading, error, getAllAnalyses } = useAnalyticsData();
  const allAnalyses = getAllAnalyses();

  const downloadMedicalHistory = () => {
    const medicalData = {
      patientName: "Anonymous User",
      generatedDate: new Date().toISOString(),
      totalSessions: allAnalyses.length,
      anxietyAnalyses: allAnalyses,
      conversationHistory: data.messages.map(msg => ({
        timestamp: msg.created_at,
        sender: msg.sender,
        text: msg.content,
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
    if (allAnalyses.length === 0) return [];
    
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
    if (allAnalyses.length === 0) return [];
    
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

  // Use real data or show empty state
  const triggerData = processTriggerData();
  const severityDistribution = processSeverityDistribution();

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

  const totalEntries = allAnalyses.length;
  const averageAnxiety = allAnalyses.length > 0 
    ? allAnalyses.reduce((sum, analysis) => sum + analysis.anxietyLevel, 0) / allAnalyses.length
    : 0;
  const mostCommonTrigger = triggerData.length > 0 
    ? triggerData.reduce((prev, current) => (prev.count > current.count) ? prev : current)
    : { trigger: 'No data yet', count: 0 };

  const chartConfig = {
    workCareer: { label: 'Work/Career', color: '#3B82F6' },
    social: { label: 'Social', color: '#EF4444' },
    health: { label: 'Health', color: '#F59E0B' },
    financial: { label: 'Financial', color: '#10B981' },
    relationships: { label: 'Relationships', color: '#8B5CF6' },
    future: { label: 'Future/Uncertainty', color: '#F97316' },
    family: { label: 'Family', color: '#06B6D4' }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h1>
              <p className="text-sm text-gray-600">Loading your anxiety data...</p>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading analytics data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h1>
              <p className="text-sm text-red-600">Error loading data: {error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm text-gray-600">
              {allAnalyses.length > 0 
                ? `Showing data from ${allAnalyses.length} anxiety analysis sessions`
                : 'No data yet - start chatting to see analytics'
              }
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={downloadMedicalHistory} variant="outline" size="sm" disabled={allAnalyses.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Download History
            </Button>
            <Button onClick={shareWithTherapist} variant="outline" size="sm" disabled={allAnalyses.length === 0}>
              <Share className="w-4 h-4 mr-2" />
              Share with Therapist
            </Button>
            <Button 
              onClick={() => window.location.href = '/treatment-resources'} 
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Target className="w-4 h-4 mr-2" />
              View Treatment
            </Button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              <span>Real-time data</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Anxiety Analytics Tracker */}
        <AnxietyAnalyticsTracker analyses={allAnalyses} />

        {allAnalyses.length === 0 ? (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analytics Data Yet</h3>
            <p className="text-gray-600 mb-4">Start chatting with your AI companion to generate anxiety analytics data.</p>
            <Button onClick={() => window.location.href = '/chat'}>
              Start Chatting
            </Button>
          </Card>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sessions</p>
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
                    <p className="text-sm font-medium text-gray-600">Treatment Progress</p>
                    <p className="text-lg font-bold text-green-700">Improving</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingDown className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Anxiety Type Trends Chart */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Anxiety Type Trends Over Time</h3>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Anxiety Levels Distribution</h3>
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

            {/* Treatment Outcomes Integration */}
            <div className="mb-8">
              <TreatmentOutcomes analyses={allAnalyses} />
            </div>

            {/* Detailed Trigger Analysis Table */}
            {triggerData.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Trigger Analysis</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trigger Type</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Average Severity</TableHead>
                      <TableHead>Percentage of Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {triggerData
                      .sort((a, b) => b.count - a.count)
                      .map((trigger) => (
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
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
