import React, { useEffect, useState } from 'react';
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
import GoalProgressSection from '@/components/analytics/GoalProgressSection';
import InterventionSummariesSection from '@/components/analytics/InterventionSummariesSection';
import { processTriggerData, processSeverityDistribution, getAnalyticsMetrics } from '@/utils/analyticsDataProcessor';
import { downloadPDFReport, shareWithTherapist } from '@/services/analyticsExportService';
import { interventionSummaryService } from '@/services/interventionSummaryService';
import { useWeeklyTrendsData } from '@/hooks/useWeeklyTrendsData';
import { useGoalsData } from '@/hooks/useGoalsData';
import { useToast } from '@/hooks/use-toast';


const Analytics = () => {
  const { data, isLoading, error, getAllAnalyses } = useAnalyticsData();
  const summariesData = useGoalsData();
  const { goals, summaries } = summariesData;
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const { toast } = useToast();
  const allAnalyses = getAllAnalyses();
  
  // Debug logging for chart order
  console.log('🎯 Analytics component rendering - chart order should be 1-6');
  console.log('📊 Analytics Page - allAnalyses count:', allAnalyses.length);
  console.log('📊 First analysis sample:', allAnalyses[0]);
  
  // Don't process data until we actually have analyses
  const hasData = allAnalyses.length > 0;

  const triggerData = processTriggerData(allAnalyses);
  const severityDistribution = processSeverityDistribution(allAnalyses);
  const { totalEntries, averageAnxiety, mostCommonTrigger, goalMetrics } = getAnalyticsMetrics(allAnalyses, triggerData, goals);
  const weeklyTrends = useWeeklyTrendsData(allAnalyses);

  const handleDownloadReport = () => {
    downloadPDFReport(allAnalyses, triggerData, severityDistribution, averageAnxiety, mostCommonTrigger, weeklyTrends, goals, summaries);
  };

  const handleDownloadSummary = async () => {
    try {
      setIsSummaryLoading(true);
      
      // First generate summaries from existing conversations
      await interventionSummaryService.generateAndSaveSummaries();
      
      // Refetch the latest summaries
      await summariesData.refetch();
      
      // Use the summary report service to download as PDF-like format
      const { downloadSummaryReport } = await import('@/services/summaryReportService');
      downloadSummaryReport(summariesData.summaries, summariesData.goals);
      
      toast({
        title: "Success",
        description: "Conversation summary downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading summary:', error);
      toast({
        title: "Error", 
        description: "Failed to download conversation summary",
        variant: "destructive",
      });
    } finally {
      setIsSummaryLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AnalyticsHeader 
          analysesCount={0}
          onDownloadHistory={handleDownloadReport}
          onShareWithTherapist={shareWithTherapist}
          onDownloadSummary={handleDownloadSummary}
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

  // Check if user is authenticated - if not, show message
  if (!hasData && !isLoading && !error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AnalyticsHeader 
          analysesCount={0}
          onDownloadHistory={handleDownloadReport}
          onShareWithTherapist={shareWithTherapist}
          onDownloadSummary={handleDownloadSummary}
        />
        
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-gray-600 text-lg mb-4">Please log in to view your analytics data</p>
              <p className="text-gray-500">Your anxiety tracking data is protected and only visible when you're authenticated.</p>
            </div>
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
          onDownloadHistory={handleDownloadReport}
          onShareWithTherapist={shareWithTherapist}
          onDownloadSummary={handleDownloadSummary}
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
        onDownloadHistory={handleDownloadReport}
        onShareWithTherapist={shareWithTherapist}
        onDownloadSummary={handleDownloadSummary}
      />

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Anxiety Analytics Tracker */}
        <AnxietyAnalyticsTracker analyses={allAnalyses} />

        {!hasData ? (
          <EmptyAnalyticsState />
        ) : (
          <div className="flex flex-col">
            {/* Key Metrics */}
            <AnalyticsMetrics 
              totalEntries={totalEntries}
              averageAnxiety={averageAnxiety}
              mostCommonTrigger={mostCommonTrigger}
            />

            {/* 1️⃣ Anxiety Type Trends Over Time */}
            <div className="mb-8 w-full">
              <AnxietyChartsSection 
                triggerData={triggerData}
                severityDistribution={[]}
                analyses={allAnalyses}
                showOnly="trends"
              />
            </div>

            {/* 2️⃣ Anxiety Levels Distribution */}
            <div className="mb-8 w-full">
              <AnxietyChartsSection 
                triggerData={[]}
                severityDistribution={severityDistribution}
                analyses={allAnalyses}
                showOnly="distribution"
              />
            </div>

            {/* 3️⃣ Anxiety Level Trends */}
            <div className="mb-8 w-full">
              <TreatmentOutcomes analyses={allAnalyses} showOnly="trends" />
            </div>

            {/* 4️⃣ Monthly Anxiety Trends */}
            <div className="mb-8 w-full">
              <MonthlyChartsSection analyses={allAnalyses} showOnly="trends" />
            </div>

            {/* 5️⃣ Monthly Session Activity */}
            <div className="mb-8 w-full">
              <MonthlyChartsSection analyses={allAnalyses} showOnly="activity" />
            </div>

            {/* 6️⃣ Weekly Treatment Outcomes */}
            <div className="mb-8 w-full">
              <TreatmentOutcomes analyses={allAnalyses} showOnly="outcomes" />
            </div>

            {/* 7️⃣ Goal Progress Section */}
            <div className="mb-8 w-full">
              <GoalProgressSection goals={goals} />
            </div>

            {/* 8️⃣ Intervention Summaries Section */}
            <div className="mb-8 w-full">
              <InterventionSummariesSection summaries={summaries} />
            </div>

            {/* Detailed Trigger Analysis Table */}
            <TriggerAnalysisTable 
              triggerData={triggerData}
              totalEntries={totalEntries}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;