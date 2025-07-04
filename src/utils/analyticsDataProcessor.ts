import { ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';

export interface TriggerData {
  trigger: string;
  count: number;
  avgSeverity: number;
  color: string;
}

export interface SeverityDistribution {
  range: string;
  count: number;
  color: string;
}

export const processTriggerData = (analyses: ClaudeAnxietyAnalysis[]): TriggerData[] => {
  if (analyses.length === 0) return [];
  
  const triggerCounts: Record<string, { count: number; severitySum: number; color: string }> = {};
  const colors = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#F97316', '#06B6D4'];
  let colorIndex = 0;

  analyses.forEach(analysis => {
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

export const processSeverityDistribution = (analyses: ClaudeAnxietyAnalysis[]): SeverityDistribution[] => {
  if (analyses.length === 0) return [];
  
  const distribution = { low: 0, moderate: 0, high: 0, severe: 0 };
  
  analyses.forEach(analysis => {
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

export const getAnalyticsMetrics = (analyses: ClaudeAnxietyAnalysis[], triggerData: TriggerData[]) => {
  const totalEntries = analyses.length;
  const averageAnxiety = analyses.length > 0 
    ? analyses.reduce((sum, analysis) => sum + analysis.anxietyLevel, 0) / analyses.length
    : 0;
  const mostCommonTrigger = triggerData.length > 0 
    ? triggerData.reduce((prev, current) => (prev.count > current.count) ? prev : current)
    : { trigger: 'No data yet', count: 0 };

  return {
    totalEntries,
    averageAnxiety,
    mostCommonTrigger
  };
};