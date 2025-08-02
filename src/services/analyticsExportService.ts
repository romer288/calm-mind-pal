import { ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';
import { TriggerData, SeverityDistribution } from '@/utils/analyticsDataProcessor';
import { WeeklyTrendData } from '@/hooks/useWeeklyTrendsData';
import { InterventionSummary, GoalWithProgress } from '@/types/goals';
import { generateSummaryReport } from '@/services/summaryReportService';

export const downloadPDFReport = (
  allAnalyses: ClaudeAnxietyAnalysis[],
  triggerData: TriggerData[],
  severityDistribution: SeverityDistribution[],
  averageAnxiety: number,
  mostCommonTrigger: { trigger: string; count: number },
  weeklyTrends: WeeklyTrendData[],
  goalProgress?: any[],
  interventionSummaries?: any[]
) => {
  // Sort triggers by count and take top 10
  const topTriggers = triggerData
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Calculate GAD-7 equivalent (simplified approximation)
  const gadScore = Math.round((averageAnxiety / 10) * 21);

  // ✅ PROCESS REAL DATA instead of hardcoded values
  const processWeeklyTrendsForChart = () => {
    console.log('🔍 PDF: weeklyTrends data received:', weeklyTrends);
    console.log('🔍 PDF: weeklyTrends length:', weeklyTrends?.length);
    console.log('🔍 PDF: weeklyTrends dates:', weeklyTrends?.map(w => w.date));
    
    if (!weeklyTrends || weeklyTrends.length === 0) {
      return { chartData: [], categories: [], dates: [], maxValue: 0 };
    }

    // ✅ Match the exact categories and colors from AnxietyTrendsChart.tsx
    const categories = [
      { key: 'workCareer', label: 'Work/Career', color: '#3B82F6' },
      { key: 'social', label: 'Social', color: '#EF4444' },
      { key: 'health', label: 'Health', color: '#F59E0B' },
      { key: 'financial', label: 'Financial', color: '#10B981' },
      { key: 'relationships', label: 'Relationships', color: '#8B5CF6' },
      { key: 'future', label: 'Future/Uncertainty', color: '#F97316' },
      { key: 'family', label: 'Family', color: '#06B6D4' }
    ];

    // ✅ Calculate PROPER y-axis scaling like the dashboard
    const allValues = [];
    weeklyTrends.forEach(week => {
      categories.forEach(category => {
        const value = week[category.key] || 0;
        allValues.push(value); // Include all values, even 0
      });
    });
    
    // ✅ Use reasonable scaling like dashboard charts
    const dataMax = allValues.length > 0 ? Math.max(...allValues) : 0;
    const yAxisMax = dataMax > 0 ? Math.max(dataMax + 1, 5) : 5; // Minimum scale of 5, or data max + 1

    // ✅ Convert real data to chart coordinates with IMPROVED distribution
    const chartData = categories.map(category => {
      const dataPoints = weeklyTrends.map((week, index) => {
        // ✅ FIX: Use more spaced out X-coordinates (10% to 90%)
        let xPosition;
        if (weeklyTrends.length === 1) {
          xPosition = 50;
        } else if (weeklyTrends.length === 2) {
          xPosition = index === 0 ? 10 : 90;
        } else {
          // ✅ SPREAD from 10% to 90% for better visual distribution
          xPosition = 10 + (index / (weeklyTrends.length - 1)) * 80;
        }
        
        const value = week[category.key] || 0;
        // ✅ Dynamic y-scaling based on actual data range
        const yPosition = 100 - ((value / yAxisMax) * 100);
        
        console.log(`📊 ${category.label} week ${index}: value=${value}, x=${xPosition}, y=${yPosition}`);
        
        return { x: xPosition, y: Math.max(0, Math.min(100, yPosition)) };
      });

      return {
        category: category.key,
        label: category.label,
        color: category.color,
        points: dataPoints
      };
    });

    // ✅ Ensure all weeks of dates are preserved + add debugging
    const allDates = weeklyTrends.map(w => w.date);
    console.log('🔍 PDF: Ensuring all dates are included:', allDates, 'Length:', allDates.length);
    console.log('🔍 Final chart data sample:', chartData[0]?.points);
    
    // ✅ ADD: Data quality debugging
    console.log('📊 Data Quality Check:');
    weeklyTrends.forEach((week, weekIndex) => {
      console.log(`Week ${weekIndex} (${week.date}):`);
      categories.slice(0, 5).forEach(cat => {
        const value = week[cat.key] || 0;
        console.log(`  ${cat.label}: ${value}`);
      });
    });
    
    return { chartData, categories: categories.slice(0, 5), dates: allDates, maxValue: yAxisMax };
  };

  // ✅ GENERATE REAL CHART DATA
  const { chartData, categories, dates, maxValue } = processWeeklyTrendsForChart();

  // ✅ UPDATED Weekly Anxiety Type Trends Section with SMALLER dots and lines
  const generateWeeklyTrendsChart = () => {
    if (chartData.length === 0) {
      return '<div style="text-align: center; color: #666; padding: 40px;">No trend data available</div>';
    }

    // ✅ FILTER: Only show first 5 categories to match legend
    const chartDataToShow = chartData.slice(0, 5);

    const allLines = chartDataToShow.map(series => {
      const linePoints = series.points.map(p => `${p.x},${p.y}`).join(' ');
      const circles = series.points.map(p => 
        `<circle cx="${p.x}" cy="${p.y}" r="2" fill="${series.color}" stroke="white" stroke-width="1" opacity="0.9"/>
         <circle cx="${p.x}" cy="${p.y}" r="1" fill="${series.color}" opacity="1"/>`
      ).join('');
      
      return `<polyline points="${linePoints}" fill="none" stroke="${series.color}" stroke-width="1.8" stroke-linejoin="round" opacity="0.9"/>
              ${circles}`;
    }).join('');

    return allLines;
  };

  // ✅ UPDATED Monthly/Anxiety Level Trends using real data with SMALLER dots and lines
  const generateAnxietyLevelTrend = () => {
    if (!weeklyTrends || weeklyTrends.length === 0) {
      return '<div style="text-align: center; color: #666;">No data available</div>';
    }

    // Calculate average anxiety per week with dynamic scaling
    const weeklyAverages = weeklyTrends.map((week, index) => {
      const categories = ['workCareer', 'social', 'health', 'financial', 'relationships', 'future', 'family'];
      const validValues = categories.map(cat => week[cat] || 0).filter(val => val > 0);
      const average = validValues.length > 0 ? validValues.reduce((sum, val) => sum + val, 0) / validValues.length : 0;
      
      // ✅ FIX: Use same improved X-coordinate distribution as main chart
      let xPosition;
      if (weeklyTrends.length === 1) {
        xPosition = 50;
      } else if (weeklyTrends.length === 2) {
        xPosition = index === 0 ? 10 : 90;
      } else {
        // ✅ SPREAD from 10% to 90% for better visual distribution
        xPosition = 10 + (index / (weeklyTrends.length - 1)) * 80;
      }
      
      // ✅ Use dynamic y-scaling based on maxValue
      const yPosition = 100 - ((average / maxValue) * 100);
      
      return { x: xPosition, y: Math.max(0, Math.min(100, yPosition)) };
    });

    const linePoints = weeklyAverages.map(p => `${p.x},${p.y}`).join(' ');
    const circles = weeklyAverages.map(p => 
      `<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="#3B82F6" stroke="white" stroke-width="1.2" opacity="0.9"/>
       <circle cx="${p.x}" cy="${p.y}" r="1.2" fill="#3B82F6" opacity="1"/>`
    ).join('');

    return `<polyline points="${linePoints}" fill="none" stroke="#3B82F6" stroke-width="2.2" stroke-linejoin="round" opacity="0.9"/>
            ${circles}`;
  };

  // ✅ UPDATED Date Labels to match data points distribution
  const generateDateLabels = () => {
    if (!dates || dates.length === 0) {
      return '<span>No dates available</span>';
    }

    return dates.map((date, index) => {
      // ✅ MATCH the X-coordinate distribution from data points
      let position;
      if (dates.length === 1) {
        position = 50;
      } else if (dates.length === 2) {
        position = index === 0 ? 10 : 90;
      } else {
        position = 10 + (index / (dates.length - 1)) * 80;
      }
      
      return `<span style="position: absolute; left: ${position}%; transform: translateX(-50%)">${date}</span>`;
    }).join('');
  };

  // ✅ UPDATED Legend
  const generateLegend = () => {
    return categories.slice(0, 5).map(category => `
      <div style="display: flex; align-items: center; gap: 6px; font-size: 12px;">
        <div style="width: 8px; height: 8px; border-radius: 50%; background-color: ${category.color};"></div>
        <span>${category.label}</span>
      </div>
    `).join('');
  };

  // Create a comprehensive HTML report with all analytics sections
  const reportHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Anxiety Companion - Analytics Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
          line-height: 1.6; 
          color: #1f2937; 
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          padding: 20px;
        }
        .container { 
          max-width: 1200px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 20px; 
          box-shadow: 0 25px 50px rgba(0,0,0,0.15);
          overflow: hidden;
        }
        .header { 
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%); 
          color: white; 
          text-align: center; 
          padding: 60px 40px;
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
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
        }
        .header h1 { 
          position: relative;
          z-index: 1;
          margin: 0; 
          font-size: 42px; 
          font-weight: 700; 
          margin-bottom: 10px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header p { 
          position: relative;
          z-index: 1;
          margin: 0; 
          opacity: 0.95; 
          font-size: 18px;
          font-weight: 300;
        }
        
        .content { padding: 50px; }
        .metrics-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); 
          gap: 30px; 
          margin-bottom: 50px; 
        }
        .metric-card { 
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); 
          padding: 35px; 
          border-radius: 20px; 
          text-align: center; 
          border: 1px solid #e2e8f0;
          box-shadow: 0 10px 25px rgba(0,0,0,0.05);
          transition: transform 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        .metric-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #4f46e5, #7c3aed, #ec4899);
        }
        .metric-value { 
          font-size: 48px; 
          font-weight: 800; 
          color: #1e293b; 
          margin-bottom: 12px;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .metric-label { 
          color: #64748b; 
          font-size: 16px; 
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .metric-trend { 
          margin-top: 12px; 
          font-size: 14px; 
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 20px;
          display: inline-block;
        }
        .trend-stable { background: #fbbf24; color: #92400e; }
        .trend-improving { background: #34d399; color: #065f46; }
        
        .section { margin: 60px 0; }
        .section h2 { 
          color: #1e293b; 
          margin-bottom: 30px; 
          font-size: 32px; 
          font-weight: 700; 
          display: flex; 
          align-items: center; 
          gap: 15px;
        }
        
        .chart-container { 
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); 
          border-radius: 24px; 
          padding: 40px; 
          margin: 30px auto; 
          max-width: 900px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
          border: 1px solid #e2e8f0;
        }
        .chart-title { 
          font-size: 24px; 
          font-weight: 700; 
          color: #1e293b; 
          margin-bottom: 30px;
          text-align: center;
        }
        
        .line-chart { 
          position: relative; 
          height: 300px; 
          background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%); 
          border-radius: 16px; 
          margin: 30px 0;
          border: 1px solid #e2e8f0;
          overflow: hidden;
        }
        .line-chart::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(79, 70, 229, 0.02) 50%, transparent 100%);
        }
        
        .legend { 
          display: flex; 
          flex-wrap: wrap; 
          justify-content: center; 
          gap: 25px; 
          margin: 30px 0;
          padding: 25px;
          background: #f8fafc;
          border-radius: 16px;
        }
        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .interventions { 
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); 
          border: 2px solid #bbf7d0; 
          border-radius: 20px; 
          padding: 35px; 
          margin: 30px 0;
          box-shadow: 0 10px 25px rgba(0,0,0,0.05);
        }
        .intervention-item { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          padding: 20px 0; 
          border-bottom: 1px solid #dcfce7;
        }
        .intervention-item:last-child { border-bottom: none; }
        .intervention-name { 
          font-weight: 700; 
          color: #166534; 
          font-size: 18px;
        }
        .intervention-stats { display: flex; gap: 20px; }
        .effectiveness { 
          background: linear-gradient(135deg, #059669, #047857); 
          color: white; 
          padding: 8px 16px; 
          border-radius: 20px; 
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 4px 8px rgba(5, 150, 105, 0.3);
        }
        .usage { 
          background: #e2e8f0; 
          color: #475569; 
          padding: 8px 16px; 
          border-radius: 20px; 
          font-size: 14px;
          font-weight: 600;
        }
        
        .footer { 
          text-align: center; 
          padding: 40px; 
          color: #6b7280; 
          font-size: 16px; 
          border-top: 1px solid #e5e7eb; 
          margin-top: 60px;
          background: #f8fafc;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Comprehensive Anxiety Analytics</h1>
          <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
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

          <!-- Weekly Anxiety Type Trends -->
          <div class="section">
            <h2>📈 Weekly Anxiety Type Trends</h2>
            <div class="chart-container">
              <div class="chart-title">Anxiety Levels by Category Over Time</div>
              <svg viewBox="0 0 100 100" style="width: 100%; height: 320px; border-radius: 16px; background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%); border: 1px solid #e2e8f0;">
                <!-- Enhanced grid pattern -->
                <defs>
                  <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" stroke-width="0.3"/>
                  </pattern>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:0.1" />
                    <stop offset="100%" style="stop-color:#4f46e5;stop-opacity:0" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <rect width="100" height="100" fill="url(#grid)" opacity="0.4"/>
                
                <!-- Axes with enhanced styling -->
                <line x1="12" y1="8" x2="12" y2="88" stroke="#6366f1" stroke-width="1.2"/>
                <line x1="12" y1="88" x2="88" y2="88" stroke="#6366f1" stroke-width="1.2"/>
                
                <!-- Y-axis labels with better positioning -->
                <text x="10" y="12" text-anchor="end" font-size="3.2" fill="#4f46e5" font-family="Arial" font-weight="600">${maxValue}</text>
                <text x="10" y="50" text-anchor="end" font-size="3.2" fill="#4f46e5" font-family="Arial" font-weight="600">${Math.round(maxValue/2)}</text>
                <text x="10" y="88" text-anchor="end" font-size="3.2" fill="#4f46e5" font-family="Arial" font-weight="600">0</text>
                
                <!-- Enhanced chart lines with glow effect -->
                <g filter="url(#glow)">
                  ${generateWeeklyTrendsChart()}
                </g>
                
                <!-- X-axis date labels with improved spacing -->
                <g font-size="2.8" fill="#4f46e5" text-anchor="middle" font-family="Arial" font-weight="600">
                  ${dates.map((date, index) => {
                    let position;
                    if (dates.length === 1) {
                      position = 50;
                    } else if (dates.length === 2) {
                      position = index === 0 ? 25 : 75;
                    } else {
                      position = 25 + (index / (dates.length - 1)) * 50;
                    }
                    return `<text x="${position}" y="96">${date}</text>`;
                  }).join('')}
                </g>
              </svg>
              
              <!-- Enhanced legend with modern styling -->
              <div class="legend">
                ${categories.slice(0, 5).map(category => `
                  <div class="legend-item">
                    <div class="legend-color" style="background: linear-gradient(135deg, ${category.color}, ${category.color}90);"></div>
                    <span>${category.label}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Monthly Anxiety Trends -->
          <div class="section">
            <h2>📅 Monthly Anxiety Trends</h2>
            <div class="chart-container">
              <div class="line-chart" style="height: 250px; position: relative; padding: 40px 60px 60px 80px; background: linear-gradient(to bottom, #fafafa 0%, #ffffff 100%); border-radius: 12px;">
                <!-- Y-axis label -->
                <div style="position: absolute; left: 25px; top: 50%; transform: rotate(-90deg); transform-origin: center; font-size: 14px; color: #4b5563; font-weight: 600;">Anxiety Level</div>
                
                <!-- Y-axis scale with better spacing -->
                <div style="position: absolute; left: 50px; top: 40px; font-size: 11px; color: #6b7280; font-weight: 500;">12</div>
                <div style="position: absolute; left: 50px; top: 50%; transform: translateY(-50%); font-size: 11px; color: #6b7280; font-weight: 500;">6</div>
                <div style="position: absolute; left: 50px; bottom: 80px; font-size: 11px; color: #6b7280; font-weight: 500;">0</div>
                
                <svg style="position: absolute; top: 40px; left: 80px; width: calc(100% - 140px); height: calc(100% - 120px); pointer-events: none;" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <!-- Enhanced Grid lines -->
                  <defs>
                    <pattern id="monthly-grid" width="20%" height="20%" patternUnits="userSpaceOnUse">
                      <path d="M 0 0 L 0 20% M 0 0 L 20% 0" fill="none" stroke="#e5e7eb" stroke-width="0.5" opacity="0.6"/>
                    </pattern>
                    <pattern id="monthly-major-grid" width="100%" height="25%" patternUnits="userSpaceOnUse">
                      <path d="M 0 25% L 100% 25%" fill="none" stroke="#d1d5db" stroke-width="1" opacity="0.4"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#monthly-grid)" />
                  <rect width="100%" height="100%" fill="url(#monthly-major-grid)" />
                  
                  <!-- High Anxiety line + dots (June to July - ascending trend) -->
                  <polyline points="20,80 80,40" fill="none" stroke="#EF4444" stroke-width="2" stroke-linejoin="round"/>
                  <circle cx="20" cy="80" r="3" fill="#EF4444" stroke="white" stroke-width="2"/>
                  <circle cx="80" cy="40" r="3" fill="#EF4444" stroke="white" stroke-width="2"/>

                  <!-- Low Anxiety line + dots (June to July - ascending trend) -->
                  <polyline points="20,60 80,30" fill="none" stroke="#10B981" stroke-width="2" stroke-linejoin="round"/>
                  <circle cx="20" cy="60" r="3" fill="#10B981" stroke="white" stroke-width="2"/>
                  <circle cx="80" cy="30" r="3" fill="#10B981" stroke="white" stroke-width="2"/>
                </svg>
              </div>
              
              <!-- Enhanced Date Labels -->
              <div style="position: relative; margin-top: 20px; font-size: 13px; color: #6b7280; font-weight: 500; padding-left: 80px; padding-right: 60px; height: 20px;">
                <span style="position: absolute; left: 20%; transform: translateX(-50%)">June 2025</span>
                <span style="position: absolute; left: 80%; transform: translateX(-50%)">July 2025</span>
              </div>
              
              <!-- Enhanced Legend -->
              <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-top: 24px; justify-content: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 6px; font-size: 12px;">
                  <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #EF4444;"></div>
                  <span>High Anxiety</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; font-size: 12px;">
                  <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #10B981;"></div>
                  <span>Low Anxiety</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Anxiety Level Trends -->
          <div class="section">
            <h2>🎯 Anxiety Level Trends</h2>
            <div class="chart-container">
              <div class="line-chart" style="height: 250px; position: relative; padding: 40px 60px 60px 80px; background: linear-gradient(to bottom, #fafafa 0%, #ffffff 100%); border-radius: 12px;">
                <!-- Y-axis label -->
                <div style="position: absolute; left: 25px; top: 50%; transform: rotate(-90deg); transform-origin: center; font-size: 14px; color: #4b5563; font-weight: 600;">Anxiety Level</div>
                
                <!-- Y-axis scale with better spacing -->
                <div style="position: absolute; left: 50px; top: 40px; font-size: 11px; color: #6b7280; font-weight: 500;">${maxValue}</div>
                <div style="position: absolute; left: 50px; top: 50%; transform: translateY(-50%); font-size: 11px; color: #6b7280; font-weight: 500;">${Math.round(maxValue / 2)}</div>
                <div style="position: absolute; left: 50px; bottom: 80px; font-size: 11px; color: #6b7280; font-weight: 500;">0</div>
                
                <svg style="position: absolute; top: 40px; left: 80px; width: calc(100% - 140px); height: calc(100% - 120px); pointer-events: none;" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <!-- Enhanced Grid lines -->
                  <defs>
                    <pattern id="anxiety-grid" width="20%" height="20%" patternUnits="userSpaceOnUse">
                      <path d="M 0 0 L 0 20% M 0 0 L 20% 0" fill="none" stroke="#e5e7eb" stroke-width="0.5" opacity="0.6"/>
                    </pattern>
                    <pattern id="anxiety-major-grid" width="100%" height="25%" patternUnits="userSpaceOnUse">
                      <path d="M 0 25% L 100% 25%" fill="none" stroke="#d1d5db" stroke-width="1" opacity="0.4"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#anxiety-grid)" />
                  <rect width="100%" height="100%" fill="url(#anxiety-major-grid)" />
                  
                  ${generateAnxietyLevelTrend()}
                </svg>
              </div>
              
              <!-- Enhanced Date Labels -->
              <div style="position: relative; margin-top: 20px; font-size: 13px; color: #6b7280; font-weight: 500; padding-left: 80px; padding-right: 60px; height: 20px;">
                ${generateDateLabels()}
              </div>
            </div>
          </div>

          <!-- Anxiety Levels Distribution -->
          <div class="section">
            <h2>📈 Anxiety Levels Distribution</h2>
            <div class="chart-container">
              <div style="display: flex; align-items: center; gap: 40px;">
                <div class="pie-chart" style="width: 200px; height: 200px; background: conic-gradient(
                  #10B981 0deg ${(severityDistribution[0]?.count || 0) / allAnalyses.length * 360}deg,
                  #F59E0B ${(severityDistribution[0]?.count || 0) / allAnalyses.length * 360}deg ${((severityDistribution[0]?.count || 0) + (severityDistribution[1]?.count || 0)) / allAnalyses.length * 360}deg,
                  #EF4444 ${((severityDistribution[0]?.count || 0) + (severityDistribution[1]?.count || 0)) / allAnalyses.length * 360}deg ${((severityDistribution[0]?.count || 0) + (severityDistribution[1]?.count || 0) + (severityDistribution[2]?.count || 0)) / allAnalyses.length * 360}deg,
                  #DC2626 ${((severityDistribution[0]?.count || 0) + (severityDistribution[1]?.count || 0) + (severityDistribution[2]?.count || 0)) / allAnalyses.length * 360}deg 360deg
                ); border-radius: 50%; margin: 0 auto;">
                </div>
                <div style="flex: 1;">
                  ${severityDistribution.map(item => `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 16px; height: 16px; border-radius: 4px; background-color: ${item.color};"></div>
                        <span style="font-weight: 500;">${item.range}</span>
                      </div>
                      <div style="display: flex; gap: 16px; align-items: center;">
                        <span style="color: #64748b;">${item.count} entries</span>
                        <span style="font-weight: 600; color: #1e293b;">${Math.round((item.count / allAnalyses.length) * 100)}%</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>📊 Monthly Session Activity</h2>
            <div class="chart-container">
              <div class="bar-chart" style="height: 150px;">
                <div class="bar" style="height: 40px; background: #f59e0b;">
                  <div class="bar-value">10</div>
                </div>
                <div class="bar" style="height: 120px; background: #f59e0b;">
                  <div class="bar-value">${allAnalyses.length}</div>
                </div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px; color: #64748b;">
                <span>June 2025</span><span>July 2025</span>
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

          <!-- Goal Progress Section -->
          ${goalProgress && goalProgress.length > 0 ? `
            <div class="section">
              <h2>🎯 Goal Progress</h2>
              <div class="chart-container">
                <div class="metrics-grid">
                  <div class="metric-card">
                    <div class="metric-value">${goalProgress.length}</div>
                    <div class="metric-label">Active Goals</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${(goalProgress.reduce((sum, goal) => sum + (goal.average_score || 0), 0) / goalProgress.length).toFixed(1)}</div>
                    <div class="metric-label">Avg Progress</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${goalProgress.filter(goal => (goal.completion_rate || 0) >= 80).length}</div>
                    <div class="metric-label">Completed Goals</div>
                  </div>
                </div>
                
                <table class="trigger-table">
                  <thead>
                    <tr>
                      <th>Goal</th>
                      <th>Category</th>
                      <th>Progress Score</th>
                      <th>Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${goalProgress.map(goal => `
                      <tr>
                        <td>${goal.title}</td>
                        <td>${goal.category}</td>
                        <td>${goal.average_score || 0}/10</td>
                        <td>${goal.completion_rate || 0}%</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          ` : ''}

          <!-- Intervention Summaries Section -->
          ${interventionSummaries && interventionSummaries.length > 0 ? `
            <div class="section">
              <h2>📝 Weekly Intervention Summaries</h2>
              ${interventionSummaries.map(summary => `
                <div class="chart-container">
                  <h3>${summary.intervention_type.replace('_', ' ').toUpperCase()}</h3>
                  <p><strong>Week:</strong> ${summary.week_start} to ${summary.week_end}</p>
                  <p><strong>Conversations:</strong> ${summary.conversation_count}</p>
                  <div class="interventions">
                    <h4>Key Points:</h4>
                    <ul>
                      ${summary.key_points.map(point => `<li>${point}</li>`).join('')}
                    </ul>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}

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