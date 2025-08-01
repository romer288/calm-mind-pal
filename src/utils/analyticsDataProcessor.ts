import { ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';

export interface TriggerData {
  trigger: string;
  count: number;
  avgSeverity: number;
  color: string;
  category: string;
  description: string;
  whyExplanation: string;
  relatedTriggers?: string[];
}

export interface SeverityDistribution {
  range: string;
  count: number;
  color: string;
}

// Trigger categorization and descriptions
const getTriggerMetadata = (trigger: string, analyses: ClaudeAnxietyAnalysis[], categoryData: any) => {
  const lowerTrigger = trigger.toLowerCase();
  const { count, avgSeverity, relatedTriggers } = categoryData;
  
  if (lowerTrigger.includes('social') || lowerTrigger.includes('people') || lowerTrigger.includes('attractive') || lowerTrigger.includes('judgment') || lowerTrigger.includes('interaction')) {
    return {
      category: 'Social Anxiety',
      description: 'Anxiety related to social situations, interactions with others, or fear of judgment',
      whyExplanation: `You experience this trigger because ${
        avgSeverity >= 7 ? 'you have high anxiety levels (avg ' + avgSeverity.toFixed(1) + '/10) when' : 
        avgSeverity >= 5 ? 'you feel moderate anxiety (avg ' + avgSeverity.toFixed(1) + '/10) when' : 
        'you feel some anxiety (avg ' + avgSeverity.toFixed(1) + '/10) when'
      } in social situations. This occurred ${count} times in your conversations, particularly around ${relatedTriggers.slice(0, 2).join(' and ')}.`
    };
  }
  
  if (lowerTrigger.includes('work') || lowerTrigger.includes('job') || lowerTrigger.includes('career') || lowerTrigger.includes('academic') || lowerTrigger.includes('employment')) {
    return {
      category: 'Work/Academic Stress',
      description: 'Anxiety related to work performance, job security, or academic pressures',
      whyExplanation: `This trigger appears because you experience ${
        avgSeverity >= 7 ? 'significant stress' : avgSeverity >= 5 ? 'moderate stress' : 'some stress'
      } (avg ${avgSeverity.toFixed(1)}/10) around professional or academic situations. You've discussed this ${count} times, focusing on ${relatedTriggers.slice(0, 2).join(' and ')}.`
    };
  }
  
  if (lowerTrigger.includes('health') || lowerTrigger.includes('medical') || lowerTrigger.includes('sick') || lowerTrigger.includes('physical')) {
    return {
      category: 'Health Concerns',
      description: 'Anxiety related to physical health, medical issues, or bodily sensations',
      whyExplanation: `You have this trigger because health-related concerns cause you ${
        avgSeverity >= 7 ? 'high anxiety' : avgSeverity >= 5 ? 'moderate anxiety' : 'some anxiety'
      } (avg ${avgSeverity.toFixed(1)}/10). This came up ${count} times in conversations about ${relatedTriggers.slice(0, 2).join(' and ')}.`
    };
  }
  
  if (lowerTrigger.includes('financial') || lowerTrigger.includes('money') || lowerTrigger.includes('bills') || lowerTrigger.includes('unemployment')) {
    return {
      category: 'Financial Stress',
      description: 'Anxiety related to money, financial security, or economic pressures',
      whyExplanation: `Financial concerns trigger anxiety for you because money-related stress reaches ${
        avgSeverity >= 7 ? 'severe levels' : avgSeverity >= 5 ? 'moderate levels' : 'noticeable levels'
      } (avg ${avgSeverity.toFixed(1)}/10). You've brought this up ${count} times, specifically around ${relatedTriggers.slice(0, 2).join(' and ')}.`
    };
  }
  
  if (lowerTrigger.includes('family') || lowerTrigger.includes('relationship') || lowerTrigger.includes('parent') || lowerTrigger.includes('partner')) {
    return {
      category: 'Relationships',
      description: 'Anxiety related to family dynamics, romantic relationships, or interpersonal conflicts',
      whyExplanation: `Relationship issues trigger anxiety because interpersonal dynamics cause you ${
        avgSeverity >= 7 ? 'significant distress' : avgSeverity >= 5 ? 'moderate distress' : 'some distress'
      } (avg ${avgSeverity.toFixed(1)}/10). This pattern appeared ${count} times, particularly with ${relatedTriggers.slice(0, 2).join(' and ')}.`
    };
  }
  
  if (lowerTrigger.includes('future') || lowerTrigger.includes('uncertainty') || lowerTrigger.includes('unknown') || lowerTrigger.includes('fear of')) {
    return {
      category: 'Future/Uncertainty',
      description: 'Anxiety related to future events, uncertainty, or fear of the unknown',
      whyExplanation: `Uncertainty triggers anxiety because unknown situations cause you ${
        avgSeverity >= 7 ? 'high levels of worry' : avgSeverity >= 5 ? 'moderate worry' : 'some worry'
      } (avg ${avgSeverity.toFixed(1)}/10). This uncertainty appeared ${count} times in discussions about ${relatedTriggers.slice(0, 2).join(' and ')}.`
    };
  }
  
  return {
    category: 'General Anxiety',
    description: 'General anxiety triggers that don\'t fit into specific categories',
    whyExplanation: `These general triggers cause you anxiety at an average level of ${avgSeverity.toFixed(1)}/10. This came up ${count} times in your conversations, related to ${relatedTriggers.slice(0, 2).join(' and ')}.`
  };
};

export const processTriggerData = (analyses: ClaudeAnxietyAnalysis[]): TriggerData[] => {
  if (analyses.length === 0) return [];
  
  const triggerCounts: Record<string, { count: number; severitySum: number; relatedTriggers: Set<string> }> = {};
  const colors = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#F97316', '#06B6D4'];

  // First pass: collect all triggers and group by category
  analyses.forEach(analysis => {
    analysis.triggers.forEach(trigger => {
      // Get basic metadata for categorization
      const basicMetadata = getTriggerMetadata(trigger, [], { count: 0, avgSeverity: 0, relatedTriggers: [] });
      const category = basicMetadata.category;
      
      if (!triggerCounts[category]) {
        triggerCounts[category] = { 
          count: 0, 
          severitySum: 0, 
          relatedTriggers: new Set()
        };
      }
      triggerCounts[category].count++;
      triggerCounts[category].severitySum += analysis.anxietyLevel;
      triggerCounts[category].relatedTriggers.add(trigger);
    });
  });

  return Object.entries(triggerCounts).map(([category, data], index) => {
    const categoryData = { count: data.count, avgSeverity: data.count > 0 ? data.severitySum / data.count : 0, relatedTriggers: Array.from(data.relatedTriggers) };
    const metadata = getTriggerMetadata(category, analyses, categoryData);
    return {
      trigger: category,
      count: data.count,
      avgSeverity: categoryData.avgSeverity,
      color: colors[index % colors.length],
      category: metadata.category,
      description: metadata.description,
      whyExplanation: metadata.whyExplanation,
      relatedTriggers: categoryData.relatedTriggers
    };
  });
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

export const getAnalyticsMetrics = (analyses: ClaudeAnxietyAnalysis[], triggerData: TriggerData[], goalProgress?: any[]) => {
  const totalEntries = analyses.length;
  const averageAnxiety = analyses.length > 0 
    ? analyses.reduce((sum, analysis) => sum + analysis.anxietyLevel, 0) / analyses.length
    : 0;
  const mostCommonTrigger = triggerData.length > 0 
    ? triggerData.reduce((prev, current) => (prev.count > current.count) ? prev : current)
    : { trigger: 'No data yet', count: 0 };

  // Calculate goal progress metrics
  const goalMetrics = goalProgress && goalProgress.length > 0 ? {
    totalGoals: goalProgress.length,
    averageProgress: goalProgress.reduce((sum, goal) => sum + (goal.average_score || 0), 0) / goalProgress.length,
    completedGoals: goalProgress.filter(goal => (goal.completion_rate || 0) >= 80).length
  } : {
    totalGoals: 0,
    averageProgress: 0,
    completedGoals: 0
  };

  return {
    totalEntries,
    averageAnxiety,
    mostCommonTrigger,
    goalMetrics
  };
};