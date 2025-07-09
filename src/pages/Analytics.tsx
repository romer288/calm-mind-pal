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
import { processTriggerData, processSeverityDistribution, getAnalyticsMetrics } from '@/utils/analyticsDataProcessor';
import { downloadPDFReport, shareWithTherapist } from '@/services/analyticsExportService';


const Analytics = () => {
  const { data, isLoading, error, getAllAnalyses } = useAnalyticsData();
  const allAnalyses = getAllAnalyses();
  
  // Don't process data until we actually have analyses
  const hasData = allAnalyses.length > 0;

  const triggerData = processTriggerData(allAnalyses);
  const severityDistribution = processSeverityDistribution(allAnalyses);
  const { totalEntries, averageAnxiety, mostCommonTrigger } = getAnalyticsMetrics(allAnalyses, triggerData);

  const handleDownloadReport = () => {
    downloadPDFReport(allAnalyses, triggerData, severityDistribution, averageAnxiety, mostCommonTrigger);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AnalyticsHeader 
          analysesCount={0}
          onDownloadHistory={handleDownloadReport}
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
          onDownloadHistory={handleDownloadReport}
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
        onDownloadHistory={handleDownloadReport}
        onShareWithTherapist={shareWithTherapist}
      />

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Anxiety Analytics Tracker */}
        <AnxietyAnalyticsTracker analyses={allAnalyses} />

        {!hasData ? (
          <EmptyAnalyticsState />
        ) : (
          <>
            {/* 
              CHART ORDER (LOCKED):
              1️⃣ Anxiety Type Trends Over Time
              2️⃣ Anxiety Levels Distribution  
              3️⃣ Anxiety Level Trends
              4️⃣ Monthly Anxiety Trends
              5️⃣ Monthly Session Activity
              6️⃣ Weekly Treatment Outcomes
            */}
            
            {/* Key Metrics */}
            <AnalyticsMetrics 
              totalEntries={totalEntries}
              averageAnxiety={averageAnxiety}
              mostCommonTrigger={mostCommonTrigger}
            />

            {/* 1️⃣ Anxiety Type Trends Over Time */}
            <div className="mb-8">
              <AnxietyChartsSection 
                triggerData={triggerData}
                severityDistribution={[]}
                analyses={allAnalyses}
                showOnly="trends"
              />
            </div>

            {/* 2️⃣ Anxiety Levels Distribution */}
            <div className="mb-8">
              <AnxietyChartsSection 
                triggerData={[]}
                severityDistribution={severityDistribution}
                analyses={allAnalyses}
                showOnly="distribution"
              />
            </div>

            {/* 3️⃣ Anxiety Level Trends */}
            <div className="mb-8">
              <TreatmentOutcomes analyses={allAnalyses} showOnly="trends" />
            </div>

            {/* 4️⃣ Monthly Anxiety Trends */}
            <div className="mb-8">
              <MonthlyChartsSection analyses={allAnalyses} showOnly="trends" />
            </div>

            {/* 5️⃣ Monthly Session Activity */}
            <div className="mb-8">
              <MonthlyChartsSection analyses={allAnalyses} showOnly="activity" />
            </div>

            {/* 6️⃣ Weekly Treatment Outcomes */}
            <div className="mb-8">
              <TreatmentOutcomes analyses={allAnalyses} showOnly="outcomes" />
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