import { ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';
import { TriggerData, SeverityDistribution } from '@/utils/analyticsDataProcessor';

export const downloadPDFReport = (
  allAnalyses: ClaudeAnxietyAnalysis[],
  triggerData: TriggerData[],
  severityDistribution: SeverityDistribution[],
  averageAnxiety: number,
  mostCommonTrigger: { trigger: string; count: number }
) => {
  // Sort triggers by count and take top 10
  const topTriggers = triggerData
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Calculate GAD-7 equivalent (simplified approximation)
  const gadScore = Math.round((averageAnxiety / 10) * 21);

  // Create a comprehensive HTML report with all analytics sections
  const reportHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Anxiety Companion - Analytics Report</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; margin: 0; padding: 40px; color: #333; background: #f8fafc; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden; }
        .header { background: linear-gradient(135deg, #3B82F6, #1E40AF); color: white; text-align: center; padding: 40px; }
        .header h1 { margin: 0; font-size: 32px; font-weight: 600; }
        .header p { margin: 10px 0 0; opacity: 0.9; }
        
        .content { padding: 40px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px; }
        .metric-card { background: #f8fafc; padding: 24px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0; }
        .metric-value { font-size: 32px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
        .metric-label { color: #64748b; font-size: 14px; font-weight: 500; }
        .metric-trend { margin-top: 8px; font-size: 12px; font-weight: 600; }
        .trend-stable { color: #64748b; }
        .trend-improving { color: #059669; }
        
        .section { margin: 40px 0; }
        .section h2 { color: #1e293b; margin-bottom: 20px; font-size: 24px; font-weight: 600; display: flex; align-items: center; gap: 10px; }
        .icon { width: 24px; height: 24px; }
        
        .interventions { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; margin: 20px 0; }
        .intervention-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #dcfce7; }
        .intervention-item:last-child { border-bottom: none; }
        .intervention-name { font-weight: 500; color: #166534; }
        .intervention-stats { display: flex; gap: 16px; }
        .effectiveness { background: #059669; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; }
        .usage { background: #e2e8f0; color: #475569; padding: 4px 8px; border-radius: 6px; font-size: 12px; }
        
        .progress-summary { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 24px; margin: 20px 0; }
        .progress-text { color: #1e40af; font-size: 16px; line-height: 1.6; }
        
        .chart-container { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin: 20px 0; }
        .chart-title { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 20px; }
        
        .bar-chart { display: flex; align-items: end; height: 200px; gap: 12px; margin: 20px 0; }
        .bar { background: #f59e0b; border-radius: 6px 6px 0 0; min-width: 60px; display: flex; flex-direction: column; justify-content: end; align-items: center; position: relative; }
        .bar-value { color: white; font-size: 12px; font-weight: 600; padding: 8px; }
        .bar-label { margin-top: 8px; font-size: 12px; text-align: center; color: #64748b; }
        
        .line-chart { position: relative; height: 200px; border: 1px solid #e2e8f0; border-radius: 8px; margin: 20px 0; background: #fafafa; }
        .line-chart::before { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px; background: #d1d5db; }
        .line-point { position: absolute; width: 10px; height: 10px; background: #3B82F6; border: 2px solid white; border-radius: 50%; transform: translate(-50%, -50%); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        
        .weekly-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin: 20px 0; }
        .week-card { background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
        .week-card.current { border-color: #ef4444; background: #fef2f2; }
        .week-card.improving { border-color: #10b981; background: #f0fdf4; }
        .week-card.stable { border-color: #f59e0b; background: #fffbeb; }
        .week-number { font-size: 14px; color: #64748b; margin-bottom: 8px; }
        .week-anxiety { font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
        .week-change { font-size: 14px; margin-bottom: 4px; }
        .week-status { font-size: 12px; font-weight: 600; }
        
        .insights-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 20px 0; }
        .insight-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }
        .insight-title { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 16px; }
        .insight-text { color: #475569; line-height: 1.6; }
        
        .trigger-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .trigger-table th { background: #f8fafc; color: #374151; font-weight: 600; padding: 16px; text-align: left; border-bottom: 2px solid #e5e7eb; }
        .trigger-table td { padding: 12px 16px; border-bottom: 1px solid #f3f4f6; }
        .trigger-table tr:hover { background: #f9fafb; }
        .trigger-dot { width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; display: inline-block; }
        .severity-high { color: #dc2626; font-weight: 600; }
        .severity-medium { color: #ea580c; font-weight: 600; }
        .severity-low { color: #16a34a; font-weight: 600; }
        
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; margin-top: 40px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Your Anxiety Analytics & Tracking</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="content">
          <!-- Key Metrics -->
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${averageAnxiety.toFixed(1)}/10</div>
              <div class="metric-label">Avg Anxiety</div>
              <div class="metric-trend trend-stable">STABLE Trend</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${gadScore}/21</div>
              <div class="metric-label">Avg GAD-7</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${allAnalyses.length}</div>
              <div class="metric-label">Sessions</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">STABLE</div>
              <div class="metric-label">Trend</div>
            </div>
          </div>

          <!-- Most Effective Interventions -->
          <div class="section">
            <h2>🎯 Most Effective Interventions for You:</h2>
            <div class="interventions">
              <div class="intervention-item">
                <div class="intervention-name">Positive reinforcement</div>
                <div class="intervention-stats">
                  <span class="effectiveness">10.0/10 effectiveness</span>
                  <span class="usage">Used 1x</span>
                </div>
              </div>
              <div class="intervention-item">
                <div class="intervention-name">Mood maintenance strategies</div>
                <div class="intervention-stats">
                  <span class="effectiveness">10.0/10 effectiveness</span>
                  <span class="usage">Used 1x</span>
                </div>
              </div>
              <div class="intervention-item">
                <div class="intervention-name">Gratitude journaling</div>
                <div class="intervention-stats">
                  <span class="effectiveness">10.0/10 effectiveness</span>
                  <span class="usage">Used 1x</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Progress -->
          <div class="section">
            <h2>📈 Your Recent Progress:</h2>
            <div class="progress-summary">
              <div class="progress-text">
                📊 Your anxiety levels are stable. Consider trying new interventions or increasing the frequency of current ones.
              </div>
            </div>
          </div>

          <!-- Analytics Overview Cards -->
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${allAnalyses.length}</div>
              <div class="metric-label">Total Sessions</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${averageAnxiety.toFixed(1)}/10</div>
              <div class="metric-label">Average Anxiety</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${mostCommonTrigger.trigger}</div>
              <div class="metric-label">Most Common Trigger</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">Improving</div>
              <div class="metric-label">Treatment Progress</div>
            </div>
          </div>

          <!-- Anxiety Level Trends -->
          <div class="section">
            <h2>🎯 Anxiety Level Trends</h2>
            <div class="chart-container">
              <div class="line-chart">
                ${allAnalyses.slice(-5).map((analysis, index) => {
                  const xPos = (index + 1) * 18 + 10;
                  const yPos = 90 - ((analysis.anxietyLevel / 10) * 70);
                  return `<div class="line-point" style="left: ${xPos}%; bottom: ${yPos}%;"></div>`;
                }).join('')}
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 15px; font-size: 12px; color: #64748b;">
                <span>Jun 16-22</span><span>Jun 22-28</span><span>Jun 23-29</span><span>Jun 30 - Jul 6</span><span>Jul 7-13</span>
              </div>
            </div>
          </div>

          <!-- Monthly Charts -->
          <div class="section">
            <h2>📅 Monthly Anxiety Trends</h2>
            <div class="chart-container">
              <div class="line-chart">
                <div class="line-point" style="left: 20%; bottom: 60%;"></div>
                <div class="line-point" style="left: 80%; bottom: 45%;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 15px; font-size: 12px; color: #64748b;">
                <span>July 2025</span><span>June 2025</span>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>📊 Monthly Session Activity</h2>
            <div class="chart-container">
              <div class="bar-chart" style="height: 150px;">
                <div class="bar" style="height: 20px; background: #f59e0b;">
                  <div class="bar-value">5</div>
                </div>
                <div class="bar" style="height: 120px; background: #f59e0b;">
                  <div class="bar-value">${allAnalyses.length}</div>
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px; color: #64748b;">
                <span>July 2025</span><span>June 2025</span>
              </div>
            </div>
          </div>

          <!-- Weekly Treatment Outcomes -->
          <div class="section">
            <h2>📋 Weekly Treatment Outcomes</h2>
            <div class="weekly-cards">
              <div class="week-card stable">
                <div class="week-number">Week 5</div>
                <div class="week-anxiety">Avg Anxiety: 4/10</div>
                <div class="week-change">Change: -0.4</div>
                <div class="week-status">Stable</div>
              </div>
              <div class="week-card current">
                <div class="week-number">Week 6</div>
                <div class="week-anxiety">Avg Anxiety: ${averageAnxiety.toFixed(1)}/10</div>
                <div class="week-change">Change: -1.1</div>
                <div class="week-status">Declining</div>
              </div>
              <div class="week-card stable">
                <div class="week-number">Week 7</div>
                <div class="week-anxiety">Avg Anxiety: 5.6/10</div>
                <div class="week-change">Change: -0.5</div>
                <div class="week-status">Stable</div>
              </div>
            </div>
            
            <div class="chart-container">
              <div class="bar-chart" style="height: 150px;">
                ${Array.from({length: 7}, (_, i) => {
                  const heights = [50, 37, 38, 37, 41, 52, 56];
                  return `<div class="bar" style="height: ${heights[i]}px; background: #3B82F6;">
                    <div class="bar-value">${(heights[i] / 10).toFixed(1)}</div>
                  </div>`;
                }).join('')}
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px; color: #64748b;">
                <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span><span>Week 5</span><span>Week 6</span><span>Week 7</span>
              </div>
            </div>
          </div>

          <!-- Treatment Insights -->
          <div class="section">
            <h2>Treatment Insights for Therapists</h2>
            <div class="insights-grid">
              <div class="insight-card">
                <div class="insight-title">Current Trend</div>
                <div class="insight-text">
                  Treatment is showing stable results with an average anxiety level of ${averageAnxiety.toFixed(1)}/10
                </div>
              </div>
              <div class="insight-card">
                <div class="insight-title">Intervention Success</div>
                <div class="insight-text">
                  1 of 7 weeks showed improvement
                </div>
              </div>
            </div>
          </div>

          <!-- Detailed Trigger Analysis (Top 10) -->
          <div class="section">
            <h2>Detailed Trigger Analysis (Top 10)</h2>
            <div class="chart-container">
              <table class="trigger-table">
                <thead>
                  <tr>
                    <th>Trigger Type</th>
                    <th>Frequency</th>
                    <th>Average Severity</th>
                    <th>Percentage of Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${topTriggers.map(trigger => `
                    <tr>
                      <td>
                        <span class="trigger-dot" style="background-color: ${trigger.color};"></span>
                        ${trigger.trigger}
                      </td>
                      <td>${trigger.count} times</td>
                      <td>
                        <span class="${trigger.avgSeverity >= 7 ? 'severity-high' : trigger.avgSeverity >= 5 ? 'severity-medium' : 'severity-low'}">
                          ${trigger.avgSeverity.toFixed(1)}/10
                        </span>
                      </td>
                      <td>${((trigger.count / allAnalyses.length) * 100).toFixed(1)}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div class="footer">
            <strong>Note:</strong> This report is for informational purposes only and should not replace professional medical advice.
          </div>
        </div>
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