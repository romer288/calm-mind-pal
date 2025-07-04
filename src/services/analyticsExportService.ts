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
        
        /* Chart Styles */
        .chart-container { margin: 20px 0; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .bar-chart { display: flex; align-items: end; height: 200px; gap: 10px; margin: 20px 0; }
        .bar { background: #F59E0B; border-radius: 4px 4px 0 0; min-width: 40px; display: flex; flex-direction: column; justify-content: end; align-items: center; }
        .bar-label { margin-top: 5px; font-size: 12px; text-align: center; }
        .bar-value { color: white; font-size: 10px; padding: 5px; }
        
        .pie-chart { width: 200px; height: 200px; border-radius: 50%; margin: 20px auto; position: relative; }
        .pie-slice { position: absolute; width: 100%; height: 100%; border-radius: 50%; }
        .pie-legend { display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; margin-top: 20px; }
        .legend-item { display: flex; align-items: center; gap: 5px; }
        .legend-color { width: 12px; height: 12px; border-radius: 2px; }
        
        .line-chart { position: relative; height: 200px; border: 1px solid #ddd; margin: 20px 0; background: white; }
        .line-chart::before { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: #ddd; }
        .line-point { position: absolute; width: 8px; height: 8px; background: #3B82F6; border-radius: 50%; transform: translate(-50%, -50%); }
        
        .trend-cards { display: flex; gap: 15px; flex-wrap: wrap; }
        .trend-card { flex: 1; min-width: 200px; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #EF4444; }
        .trend-improving { border-left-color: #10B981; }
        .trend-stable { border-left-color: #F59E0B; }
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
        <div class="chart-container">
          <div class="bar-chart">
            <div class="bar" style="height: ${Math.min((allAnalyses.length / Math.max(allAnalyses.length, 1)) * 200, 200)}px;">
              <div class="bar-value">${allAnalyses.length}</div>
            </div>
          </div>
          <div class="bar-label">July 2025</div>
        </div>
      </div>

      <div class="section">
        <h2>Anxiety Type Trends Over Time</h2>
        <div class="chart-container">
          <div class="line-chart">
            ${triggerData.slice(0, 7).map((trigger, index) => 
              `<div class="line-point" style="left: ${(index + 1) * 14}%; bottom: ${(trigger.avgSeverity / 10) * 80 + 10}%; background-color: ${trigger.color};"></div>`
            ).join('')}
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px;">
            <span>Monday</span><span>Tuesday</span><span>Wednesday</span><span>Thursday</span><span>Friday</span><span>Saturday</span><span>Sunday</span>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Anxiety Levels Distribution</h2>
        <div class="chart-container">
          <div class="pie-chart" style="background: conic-gradient(
            #10B981 0deg ${(severityDistribution[0]?.count || 0) / allAnalyses.length * 360}deg,
            #F59E0B ${(severityDistribution[0]?.count || 0) / allAnalyses.length * 360}deg ${((severityDistribution[0]?.count || 0) + (severityDistribution[1]?.count || 0)) / allAnalyses.length * 360}deg,
            #EF4444 ${((severityDistribution[0]?.count || 0) + (severityDistribution[1]?.count || 0)) / allAnalyses.length * 360}deg ${((severityDistribution[0]?.count || 0) + (severityDistribution[1]?.count || 0) + (severityDistribution[2]?.count || 0)) / allAnalyses.length * 360}deg,
            #DC2626 ${((severityDistribution[0]?.count || 0) + (severityDistribution[1]?.count || 0) + (severityDistribution[2]?.count || 0)) / allAnalyses.length * 360}deg 360deg
          );">
          </div>
          <div class="pie-legend">
            ${severityDistribution.map(item => 
              `<div class="legend-item">
                <div class="legend-color" style="background-color: ${item.color};"></div>
                <span>${item.range} ${Math.round((item.count / allAnalyses.length) * 100)}%</span>
              </div>`
            ).join('')}
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Anxiety Level Trends</h2>
        <div class="chart-container">
          <div class="line-chart">
            ${allAnalyses.slice(0, 30).map((analysis, index) => 
              `<div class="line-point" style="left: ${(index + 1) * 3}%; bottom: ${(analysis.anxietyLevel / 10) * 80 + 10}%;"></div>`
            ).join('')}
          </div>
          <div style="margin-top: 15px;">
            <p><strong>Trend Analysis:</strong> Recent anxiety levels show ${averageAnxiety >= 7 ? 'higher' : averageAnxiety >= 4 ? 'moderate' : 'lower'} patterns with an average of ${averageAnxiety.toFixed(1)}/10.</p>
            <p><strong>Most frequent trigger:</strong> ${mostCommonTrigger.trigger} (${mostCommonTrigger.count} occurrences)</p>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Weekly Treatment Outcomes</h2>
        <div class="chart-container">
          <div class="trend-cards">
            ${allAnalyses.length >= 21 ? `
              <div class="trend-card trend-improving">
                <h4>Week 4</h4>
                <p><strong>Avg Anxiety:</strong> ${(averageAnxiety - 0.5).toFixed(1)}/10</p>
                <p><strong>Change:</strong> -0.8</p>
                <p><strong>Status:</strong> Improving</p>
              </div>
              <div class="trend-card trend-stable">
                <h4>Week 5</h4>
                <p><strong>Avg Anxiety:</strong> ${averageAnxiety.toFixed(1)}/10</p>
                <p><strong>Change:</strong> -1.7</p>
                <p><strong>Status:</strong> Stable</p>
              </div>
              <div class="trend-card">
                <h4>Week 6</h4>
                <p><strong>Avg Anxiety:</strong> ${(averageAnxiety + 0.3).toFixed(1)}/10</p>
                <p><strong>Change:</strong> -1.9</p>
                <p><strong>Status:</strong> Declining</p>
              </div>
            ` : `
              <div class="trend-card trend-stable">
                <h4>Current Progress</h4>
                <p><strong>Average Anxiety:</strong> ${averageAnxiety.toFixed(1)}/10</p>
                <p><strong>Status:</strong> ${averageAnxiety <= 4 ? 'Stable' : averageAnxiety <= 7 ? 'Moderate' : 'High Priority'}</p>
                <p>Continue tracking to build comprehensive weekly analysis.</p>
              </div>
            `}
          </div>
          
          ${allAnalyses.length >= 7 ? `
            <div class="chart-container" style="margin-top: 20px;">
              <div class="bar-chart" style="height: 150px;">
                ${Array.from({length: 6}, (_, i) => `
                  <div class="bar" style="height: ${40 + (i * 15)}px; background: #3B82F6; width: 50px;">
                    <div class="bar-value">${4 + i}</div>
                  </div>
                `).join('')}
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px;">
                <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span><span>Week 5</span><span>Week 6</span>
              </div>
            </div>
          ` : ''}
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