import { InterventionSummary } from '@/types/goals';
import { GoalWithProgress } from '@/types/goals';

export const generateSummaryReport = (
  summaries: InterventionSummary[],
  goals: GoalWithProgress[]
): string => {
  const today = new Date().toLocaleDateString();
  
  let report = `WEEKLY INTERVENTION SUMMARIES REPORT
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

  // Group summaries by intervention type
  const groupedSummaries = summaries.reduce((acc, summary) => {
    if (!acc[summary.intervention_type]) {
      acc[summary.intervention_type] = [];
    }
    acc[summary.intervention_type].push(summary);
    return acc;
  }, {} as Record<string, InterventionSummary[]>);

  // Add summary overview
  report += `OVERVIEW
- Total Intervention Types: ${Object.keys(groupedSummaries).length}
- Total Weekly Reports: ${summaries.length}
- Date Range: ${summaries.length > 0 ? 
    `${summaries[summaries.length - 1].week_start} to ${summaries[0].week_end}` : 'N/A'}

==================================================

`;

  // Add each intervention type section
  for (const [interventionType, interventionSummaries] of Object.entries(groupedSummaries)) {
    const formattedType = interventionType.replace('_', ' ').toUpperCase();
    report += `${formattedType}
${'='.repeat(formattedType.length)}

`;

    (interventionSummaries as InterventionSummary[]).forEach((summary, index) => {
      report += `Week ${index + 1}: ${summary.week_start} to ${summary.week_end}
Conversations: ${summary.conversation_count}

Key Points:
`;
      summary.key_points.forEach((point, pointIndex) => {
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