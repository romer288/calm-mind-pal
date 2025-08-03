import { InterventionSummary } from '@/types/goals';
import { GoalWithProgress } from '@/types/goals';
import { ClaudeAnxietyAnalysisWithDate } from '@/services/analyticsService';
import { processTriggerData, TriggerData } from '@/utils/analyticsDataProcessor';

export const generateSummaryReport = (
  summaries: InterventionSummary[],
  goals: GoalWithProgress[],
  analyses?: ClaudeAnxietyAnalysisWithDate[]
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

  // Add each week section with clinical insights instead of generic summaries
  for (const [weekKey, weekSummaries] of Object.entries(weekGroups)) {
    const [weekStart, weekEnd] = weekKey.split('_');
    report += `Week: ${weekStart} to ${weekEnd}
${'='.repeat(40)}

`;

    // Get analyses for this week to provide clinical insights
    if (analyses && analyses.length > 0) {
      const weekStartDate = new Date(weekStart);
      const weekEndDate = new Date(weekEnd);
      const weekAnalyses = analyses.filter(analysis => {
        const analysisDate = new Date(analysis.created_at);
        return analysisDate >= weekStartDate && analysisDate <= weekEndDate;
      });

      if (weekAnalyses.length > 0) {
        const triggerData = processTriggerData(weekAnalyses);
        const avgAnxiety = weekAnalyses.reduce((sum, a) => sum + a.anxietyLevel, 0) / weekAnalyses.length;
        
        report += `CLINICAL SUMMARY FOR THIS WEEK
${'-'.repeat(35)}

• Total anxiety assessments: ${weekAnalyses.length}
• Average anxiety level: ${avgAnxiety.toFixed(1)}/10
• Conversations with escalation: ${weekAnalyses.filter(a => a.escalationDetected).length}
• High crisis risk sessions: ${weekAnalyses.filter(a => a.crisisRiskLevel === 'high').length}

DETAILED TRIGGER ANALYSIS:
${'-'.repeat(30)}

`;
        
        triggerData.forEach((trigger, index) => {
          report += `${index + 1}. ${trigger.trigger.toUpperCase()}
   Frequency: ${trigger.count} occurrences (${Math.round((trigger.count / weekAnalyses.length) * 100)}% of sessions)
   Severity: ${trigger.avgSeverity.toFixed(1)}/10 average

   CLINICAL INSIGHT:
   ${trigger.whyExplanation}

   Related patterns: ${trigger.relatedTriggers?.slice(0, 3).join(', ') || 'None identified'}

`;
        });
      }
    } else {
      // Fallback to original summaries if no analyses available
      weekSummaries.forEach(summary => {
        const formattedType = summary.intervention_type.replace('_', ' ').toUpperCase();
        report += `${formattedType} (${summary.conversation_count} conversations)
${'-'.repeat(formattedType.length + 20)}

`;
        
        const keyPoints = summary.key_points.slice(0, 10);
        keyPoints.forEach((point, pointIndex) => {
          report += `  ${pointIndex + 1}. ${point}
`;
        });
        report += `
`;
      });
    }

    report += `
`;
  }

  // Add clinical trigger analysis if available
  if (analyses && analyses.length > 0) {
    const triggerData = processTriggerData(analyses);
    
    if (triggerData.length > 0) {
      report += `==================================================

CLINICAL ANXIETY TRIGGER ANALYSIS
=================================

`;
      
      triggerData.forEach((trigger, index) => {
        report += `${index + 1}. ${trigger.trigger} (${trigger.count} occurrences, avg severity: ${trigger.avgSeverity.toFixed(1)}/10)
${'='.repeat(60)}

CATEGORY: ${trigger.category}

DESCRIPTION: ${trigger.description}

CLINICAL EXPLANATION:
${trigger.whyExplanation}

RELATED TRIGGERS: ${trigger.relatedTriggers?.join(', ') || 'None identified'}

`;
      });
    }
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

export const downloadSummaryReport = (summaries: InterventionSummary[], goals: GoalWithProgress[], analyses?: ClaudeAnxietyAnalysisWithDate[]) => {
  const report = generateSummaryReport(summaries, goals, analyses);
  
  // Convert to HTML for better formatting (PDF-like)
  const htmlContent = convertToPDFFormat(report);
  
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `conversation-summaries-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

const convertToPDFFormat = (textContent: string): string => {
  // Enhanced text processing for better HTML structure
  let htmlContent = textContent
    .replace(/\n/g, '<br>')
    .replace(/=+/g, '<div class="divider"></div>')
    .replace(/^([A-Z][A-Z\s]+)$/gm, '<h2 class="section-title">$1</h2>')
    .replace(/^(Week: .+)$/gm, '<h3 class="week-title">$1</h3>')
    .replace(/^([A-Z\s]+) \((\d+) conversations\)$/gm, '<h4 class="intervention-title">$1 <span class="conversation-count">($2 conversations)</span></h4>')
    .replace(/^CLINICAL SUMMARY FOR THIS WEEK$/gm, '<h4 class="clinical-summary-title">Clinical Summary for This Week</h4>')
    .replace(/^DETAILED TRIGGER ANALYSIS:$/gm, '<h4 class="trigger-analysis-title">Detailed Trigger Analysis</h4>')
    .replace(/^(\d+\. [A-Z\s]+)$/gm, '<h5 class="trigger-item-title">$1</h5>')
    .replace(/^\s+(\d+\. .+)$/gm, '<li class="key-point">$1</li>')
    .replace(/^•\s(.+)$/gm, '<div class="stat-item">• $1</div>')
    .replace(/^CLINICAL INSIGHT:$/gm, '<div class="insight-label">Clinical Insight:</div>')
    .replace(/^Related patterns:(.+)$/gm, '<div class="related-patterns">Related patterns:$1</div>');

  // Group list items into proper ul tags
  htmlContent = htmlContent.replace(/(<li class="key-point">.*?<\/li>)+/gs, '<ul class="key-points-list">$&</ul>');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <title>Conversation Intervention Summaries</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 40px;
          line-height: 1.7;
          color: #1f2937;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          min-height: 100vh;
        }
        
        .container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }
        
        .header {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          padding: 40px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
          pointer-events: none;
        }
        
        .header h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 12px;
          position: relative;
          z-index: 1;
        }
        
        .header p {
          font-size: 1.1rem;
          opacity: 0.9;
          position: relative;
          z-index: 1;
        }
        
        .content {
          padding: 40px;
        }
        
        .section-title {
          color: #1e40af;
          font-size: 1.8rem;
          font-weight: 700;
          margin: 40px 0 24px;
          padding: 16px 0;
          border-bottom: 3px solid #3b82f6;
          background: linear-gradient(90deg, #eff6ff 0%, transparent 100%);
          padding-left: 20px;
          margin-left: -20px;
          padding-right: 20px;
          margin-right: -20px;
          border-radius: 8px 0 0 8px;
        }
        
        .week-title {
          color: #1f2937;
          font-size: 1.4rem;
          font-weight: 600;
          margin: 32px 0 20px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-radius: 12px;
          border-left: 4px solid #0ea5e9;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .clinical-summary-title {
          color: #059669;
          font-size: 1.2rem;
          font-weight: 600;
          margin: 24px 0 16px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border-radius: 8px;
          border-left: 4px solid #10b981;
        }
        
        .trigger-analysis-title {
          color: #dc2626;
          font-size: 1.2rem;
          font-weight: 600;
          margin: 24px 0 16px;
          padding: 12px 16px;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border-radius: 8px;
          border-left: 4px solid #ef4444;
        }
        
        .trigger-item-title {
          color: #7c2d12;
          font-size: 1.1rem;
          font-weight: 600;
          margin: 20px 0 12px;
          padding: 10px 14px;
          background: linear-gradient(135deg, #fef7ed 0%, #fed7aa 100%);
          border-radius: 6px;
          border-left: 3px solid #ea580c;
        }
        
        .intervention-title {
          color: #374151;
          font-size: 1.3rem;
          font-weight: 600;
          margin: 24px 0 16px;
          padding: 14px 18px;
          background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
          border-radius: 10px;
          border: 1px solid #e5e7eb;
        }
        
        .conversation-count {
          color: #6b7280;
          font-size: 0.9rem;
          font-weight: 400;
        }
        
        .stat-item {
          margin: 8px 0;
          padding: 8px 16px;
          background: #f8fafc;
          border-radius: 6px;
          border-left: 3px solid #3b82f6;
          font-weight: 500;
        }
        
        .key-points-list {
          margin: 16px 0;
          padding: 0;
          background: #fafafa;
          border-radius: 8px;
          padding: 16px 20px;
        }
        
        .key-point {
          margin: 10px 0;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 500;
          color: #374151;
        }
        
        .key-point:last-child {
          border-bottom: none;
        }
        
        .insight-label {
          color: #7c3aed;
          font-weight: 600;
          margin: 16px 0 8px;
          padding: 8px 12px;
          background: linear-gradient(135deg, #faf5ff 0%, #e9d5ff 100%);
          border-radius: 6px;
          border-left: 3px solid #8b5cf6;
        }
        
        .related-patterns {
          color: #6b7280;
          font-style: italic;
          margin: 12px 0;
          padding: 10px 14px;
          background: #f8fafc;
          border-radius: 6px;
          border: 1px dashed #d1d5db;
        }
        
        .divider {
          height: 2px;
          background: linear-gradient(90deg, transparent 0%, #e5e7eb 50%, transparent 100%);
          margin: 32px 0;
          border-radius: 1px;
        }
        
        .overview {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          padding: 20px;
          border-radius: 12px;
          margin: 24px 0;
          border-left: 4px solid #f59e0b;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        /* Print styles */
        @media print {
          body {
            background: white;
            padding: 20px;
          }
          
          .container {
            box-shadow: none;
            border: 1px solid #e5e7eb;
          }
          
          .header {
            background: #3b82f6 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
        }
        
        /* Responsive design */
        @media (max-width: 768px) {
          body {
            padding: 20px;
          }
          
          .header h1 {
            font-size: 2rem;
          }
          
          .content {
            padding: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Conversation Intervention Summaries</h1>
          <p>Generated on ${new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
        <div class="content">
          ${htmlContent}
        </div>
      </div>
    </body>
    </html>
  `;
};