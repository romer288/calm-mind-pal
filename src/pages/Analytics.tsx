import React from 'react';
import { Loader2 } from 'lucide-react';
import AnxietyAnalyticsTracker from '@/components/AnxietyAnalyticsTracker';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import TreatmentOutcomes from '@/components/TreatmentOutcomes';
import AnalyticsHeader from '@/components/analytics/AnalyticsHeader';
import AnalyticsMetrics from '@/components/analytics/AnalyticsMetrics';
import AnxietyChartsSection from '@/components/analytics/AnxietyChartsSection';
import MonthlyChartsSection from '@/components/analytics/MonthlyChartsSection';
import TriggerAnalysisTable from '@/components/analytics/TriggerAnalysisTable';
import EmptyAnalyticsState from '@/components/analytics/EmptyAnalyticsState';

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

  const triggerData = processTriggerData();
  const severityDistribution = processSeverityDistribution();

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AnalyticsHeader 
          analysesCount={0}
          onDownloadHistory={downloadMedicalHistory}
          onShareWithTherapist={shareWithTherapist}
        />
        
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
        <AnalyticsHeader 
          analysesCount={0}
          onDownloadHistory={downloadMedicalHistory}
          onShareWithTherapist={shareWithTherapist}
        />
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="text-center py-12">
            <p className="text-red-600">Error loading data: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AnalyticsHeader 
        analysesCount={allAnalyses.length}
        onDownloadHistory={downloadMedicalHistory}
        onShareWithTherapist={shareWithTherapist}
      />

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Anxiety Analytics Tracker */}
        <AnxietyAnalyticsTracker analyses={allAnalyses} />

        {allAnalyses.length === 0 ? (
          <EmptyAnalyticsState />
        ) : (
          <>
            {/* Key Metrics */}
            <AnalyticsMetrics 
              totalEntries={totalEntries}
              averageAnxiety={averageAnxiety}
              mostCommonTrigger={mostCommonTrigger}
            />

            {/* Monthly Charts Section */}
            <MonthlyChartsSection analyses={allAnalyses} />

            {/* Weekly Charts Section */}
            <AnxietyChartsSection 
              triggerData={triggerData}
              severityDistribution={severityDistribution}
              weeklyTrends={weeklyTrends}
            />

            {/* Treatment Outcomes Integration */}
            <div className="mb-8">
              <TreatmentOutcomes analyses={allAnalyses} />
            </div>

            {/* Detailed Trigger Analysis Table */}
            <TriggerAnalysisTable 
              triggerData={triggerData}
              totalEntries={totalEntries}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Analytics;
