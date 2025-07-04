import { ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';
import { TriggerData, SeverityDistribution } from '@/utils/analyticsDataProcessor';

export const downloadPDFReport = (
  allAnalyses: ClaudeAnxietyAnalysis[],
  triggerData: TriggerData[],
  severityDistribution: SeverityDistribution[],
  averageAnxiety: number,
  mostCommonTrigger: { trigger: string; count: number }
) => {
  // Create a comprehensive HTML report with metrics and graphs
  const reportHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Anxiety Companion - Analytics Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #3B82F6; padding-bottom: 20px; }
        .metric-card { background: #f8f9fa; padding: 20px; margin: 10px 0; border-radius: 8px; }
        .metric-title { font-weight: bold; color: #3B82F6; margin-bottom: 10px; }
        .metric-value { font-size: 24px; font-weight: bold; }
        .section { margin: 30px 0; }
        .trigger-item { margin: 8px 0; padding: 8px; background: #e3f2fd; border-radius: 4px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #3B82F6; color: white; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Anxiety Companion Analytics Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
        <p>Patient: Anonymous User</p>
      </div>

      <div class="section">
        <h2>Key Metrics Summary</h2>
        <div class="metric-card">
          <div class="metric-title">Total Sessions</div>
          <div class="metric-value">${allAnalyses.length}</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Average Anxiety Level</div>
          <div class="metric-value">${averageAnxiety.toFixed(1)}/10</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Most Common Trigger</div>
          <div class="metric-value">${mostCommonTrigger.trigger} (${mostCommonTrigger.count} times)</div>
        </div>
      </div>

      <div class="section">
        <h2>Trigger Analysis</h2>
        <table>
          <tr><th>Trigger</th><th>Frequency</th><th>Average Severity</th></tr>
          ${triggerData.map(trigger => 
            `<tr><td>${trigger.trigger}</td><td>${trigger.count}</td><td>${trigger.avgSeverity.toFixed(1)}/10</td></tr>`
          ).join('')}
        </table>
      </div>

      <div class="section">
        <h2>Severity Distribution</h2>
        ${severityDistribution.map(item => 
          `<div class="trigger-item">${item.range}: ${item.count} sessions</div>`
        ).join('')}
      </div>

      <div class="section">
        <h2>Session History</h2>
        <table>
          <tr><th>Date</th><th>Anxiety Level</th><th>GAD-7 Score</th><th>Key Triggers</th></tr>
          ${allAnalyses.map(analysis => 
            `<tr><td>${new Date().toLocaleDateString()}</td><td>${analysis.anxietyLevel}/10</td><td>${analysis.gad7Score}/21</td><td>${analysis.triggers.join(', ')}</td></tr>`
          ).join('')}
        </table>
      </div>

      <div class="section">
        <p><strong>Note:</strong> This report is for informational purposes only and should not replace professional medical advice.</p>
      </div>
    </body>
    </html>
  `;

  // Convert HTML to PDF-like format and download
  const blob = new Blob([reportHTML], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `anxiety-companion-analytics-report-${new Date().toISOString().split('T')[0]}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const shareWithTherapist = () => {
  // Navigate to find therapist page
  window.location.href = '/find-therapist';
};