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
        <h2>Monthly Session Activity</h2>
        <div class="metric-card">
          <div class="metric-title">Current Month Activity</div>
          <div class="metric-value">${allAnalyses.length} Sessions</div>
          <p>Total sessions recorded this month showing consistent engagement with anxiety tracking.</p>
        </div>
      </div>

      <div class="section">
        <h2>Anxiety Type Trends Over Time</h2>
        <table>
          <tr><th>Trigger Type</th><th>Frequency</th><th>Average Severity</th><th>Trend</th></tr>
          ${triggerData.map(trigger => 
            `<tr><td>${trigger.trigger}</td><td>${trigger.count} times</td><td>${trigger.avgSeverity.toFixed(1)}/10</td><td>Monitoring</td></tr>`
          ).join('')}
        </table>
      </div>

      <div class="section">
        <h2>Anxiety Levels Distribution</h2>
        <div class="distribution-summary">
          ${severityDistribution.map(item => 
            `<div class="trigger-item">
              <strong>${item.range}</strong>: ${item.count} sessions 
              (${((item.count / allAnalyses.length) * 100).toFixed(0)}%)
            </div>`
          ).join('')}
        </div>
      </div>

      <div class="section">
        <h2>Anxiety Level Trends</h2>
        <div class="metric-card">
          <div class="metric-title">Trend Analysis</div>
          <p>Recent anxiety levels show ${averageAnxiety >= 7 ? 'higher' : averageAnxiety >= 4 ? 'moderate' : 'lower'} patterns with an average of ${averageAnxiety.toFixed(1)}/10.</p>
          <p>Most frequent trigger: <strong>${mostCommonTrigger.trigger}</strong> (${mostCommonTrigger.count} occurrences)</p>
        </div>
      </div>

      <div class="section">
        <h2>Weekly Treatment Outcomes</h2>
        <div class="treatment-outcomes">
          ${allAnalyses.length >= 7 ? `
            <div class="metric-card">
              <div class="metric-title">Recent Progress</div>
              <div class="metric-value">Week Analysis</div>
              <p><strong>Average Anxiety:</strong> ${averageAnxiety.toFixed(1)}/10</p>
              <p><strong>Change:</strong> ${averageAnxiety <= 5 ? 'Improving' : 'Needs Attention'}</p>
              <p><strong>Status:</strong> ${averageAnxiety <= 4 ? 'Stable' : averageAnxiety <= 7 ? 'Moderate' : 'High Priority'}</p>
            </div>
          ` : `
            <div class="metric-card">
              <div class="metric-title">Treatment Progress</div>
              <p>Continue tracking to build comprehensive treatment outcome data. Weekly analysis will be available after 7+ sessions.</p>
            </div>
          `}
        </div>
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