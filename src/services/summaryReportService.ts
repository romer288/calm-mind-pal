import { InterventionSummary } from '@/types/goals';
import { GoalWithProgress } from '@/types/goals';

export const generateSummaryReport = (
  summaries: InterventionSummary[],
  goals: GoalWithProgress[]
): string => {
  const today = new Date().toLocaleDateString();
  
  let report = `CONVERSATION INTERVENTION SUMMARIES
Generated on: ${today}

==================================================

`;

  if (summaries.length === 0) {
    report += `No intervention summaries available yet.
Start conversations to generate weekly summaries.

==================================================
`;
    return report;
  }

  // Sort all summaries by week_start date (newest first)
  const sortedSummaries = [...summaries].sort((a, b) => 
    new Date(b.week_start).getTime() - new Date(a.week_start).getTime()
  );

  // Add summary overview
  report += `OVERVIEW
- Total Weekly Summaries: ${summaries.length}
- Date Range: ${sortedSummaries.length > 0 ? 
    `${sortedSummaries[sortedSummaries.length - 1].week_start} to ${sortedSummaries[0].week_end}` : 'N/A'}

==================================================

INTERVENTION SUMMARIES (Newest to Oldest)
==========================================

`;

  // Group by week and show all interventions for each week
  const weekGroups = sortedSummaries.reduce((acc, summary) => {
    const weekKey = `${summary.week_start}_${summary.week_end}`;
    if (!acc[weekKey]) {
      acc[weekKey] = [];
    }
    acc[weekKey].push(summary);
    return acc;
  }, {} as Record<string, InterventionSummary[]>);

  // Add each week section with all interventions
  for (const [weekKey, weekSummaries] of Object.entries(weekGroups)) {
    const [weekStart, weekEnd] = weekKey.split('_');
    report += `Week: ${weekStart} to ${weekEnd}
${'='.repeat(40)}

`;

    weekSummaries.forEach(summary => {
      const formattedType = summary.intervention_type.replace('_', ' ').toUpperCase();
      report += `${formattedType} (${summary.conversation_count} conversations)
${'-'.repeat(formattedType.length + 20)}

`;
      
      // Show up to 10 key points per intervention
      const keyPoints = summary.key_points.slice(0, 10);
      keyPoints.forEach((point, pointIndex) => {
        report += `  ${pointIndex + 1}. ${point}
`;
      });
      report += `
`;
    });

    report += `
`;
  }

  // Add goals section if available
  if (goals && goals.length > 0) {
    report += `==================================================

GOAL PROGRESS
=============

`;
    goals.forEach((goal, index) => {
      const completionRate = goal.completion_rate || 0;
      const averageScore = goal.average_score || 0;
      const status = completionRate >= 90 ? 'EXCELLENT' : 
                   completionRate >= 70 ? 'GOOD' :
                   completionRate >= 50 ? 'FAIR' : 'NEEDS ATTENTION';
      
      report += `Goal ${index + 1}: ${goal.title}
Category: ${goal.category}
End Date: ${goal.end_date || 'Ongoing'}
Completion Rate: ${Math.round(completionRate)}% (${status})
Average Score: ${averageScore.toFixed(1)}/10
Description: ${goal.description || 'No description'}

`;
    });
  }

  report += `==================================================

This report was generated automatically based on your conversation
patterns and therapeutic interventions. 

For more detailed analytics, visit the full Analytics Dashboard.

==================================================
`;

  return report;
};

export const downloadSummaryReport = (summaries: InterventionSummary[], goals: GoalWithProgress[]) => {
  const report = generateSummaryReport(summaries, goals);
  
  const blob = new Blob([report], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conversation-summaries-${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};