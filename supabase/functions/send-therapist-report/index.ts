import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const resendApiKey = Deno.env.get("RESEND_API_KEY");
console.log("RESEND_API_KEY available:", !!resendApiKey);
console.log("RESEND_API_KEY length:", resendApiKey?.length || 0);
const resend = new Resend(resendApiKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TherapistReportRequest {
  reportData?: string | any[]; // HTML content of the report OR raw data array for connection requests
  therapistEmail: string;
  patientName: string;
  therapistName: string;
  reportType?: 'analytics' | 'treatment';
  isConnectionRequest?: boolean;
  includeHistoryReport?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header and extract JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No valid authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase client with service role for edge function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify user authentication using JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    const { reportData, therapistEmail, patientName, therapistName, reportType, isConnectionRequest, includeHistoryReport }: TherapistReportRequest = await req.json();
    
    console.log("Email generation request:", { therapistEmail, patientName, therapistName, isConnectionRequest, includeHistoryReport });
    console.log("Report data received:", reportData);

    // Get user profile for sender name
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const senderName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Patient';

    let emailContent: string;
    let subject: string;

    if (isConnectionRequest) {
      // Connection request email
      subject = `Connection Request from ${senderName} - Anxiety Companion`;
      
      let historyReportSection = '';
      
      if (includeHistoryReport) {
        // Generate download history report using the same comprehensive logic as the downloadPDFReport
        try {
          // Get comprehensive analytics data for the user (same as download functionality)
          const { data: anxietyAnalyses } = await supabaseClient
            .from('anxiety_analyses')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          const { data: chatMessages } = await supabaseClient
            .from('chat_messages')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (!anxietyAnalyses || anxietyAnalyses.length === 0) {
            historyReportSection = `
              <div style="background: #fff3cd; padding: 16px; border-radius: 6px; border: 1px solid #ffeaa7; margin: 16px 0;">
                <p style="margin: 0; color: #856404;">
                  📊 ${senderName} requested to include their Current History Report, but no anxiety tracking data is available yet.
                </p>
              </div>
            `;
          } else {
            // Calculate comprehensive analytics (matching downloadPDFReport logic)
            const averageAnxiety = anxietyAnalyses.reduce((sum, a) => sum + a.anxiety_level, 0) / anxietyAnalyses.length;
            
            // Process triggers data
            const allTriggers = anxietyAnalyses.flatMap(a => a.anxiety_triggers || []);
            const triggerCounts = allTriggers.reduce((acc, trigger) => {
              acc[trigger] = (acc[trigger] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            
            const topTriggers = Object.entries(triggerCounts)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 10);
            
            const mostCommonTrigger = topTriggers[0] || ['None', 0];
            
            // Calculate severity distribution
            const severityRanges = [
              { range: '1-2', min: 1, max: 2, count: 0 },
              { range: '3-4', min: 3, max: 4, count: 0 },
              { range: '5-6', min: 5, max: 6, count: 0 },
              { range: '7-8', min: 7, max: 8, count: 0 },
              { range: '9-10', min: 9, max: 10, count: 0 }
            ];
            
            anxietyAnalyses.forEach(analysis => {
              const level = analysis.anxiety_level;
              const range = severityRanges.find(r => level >= r.min && level <= r.max);
              if (range) range.count++;
            });

            // Generate comprehensive HTML report (similar to the downloadPDFReport output)
            historyReportSection = `
              <div style="background: #f8f9fa; padding: 24px; border-radius: 8px; margin: 24px 0; border: 1px solid #e9ecef;">
                <h3 style="color: #495057; margin: 0 0 24px 0;">📊 Current History Report - Comprehensive Analytics</h3>
                
                <!-- Key Metrics Grid -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                  <tr>
                    <td style="width: 25%; padding: 8px;">
                      <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #dee2e6; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #495057; margin-bottom: 4px;">${averageAnxiety.toFixed(1)}/10</div>
                        <div style="color: #6c757d; font-size: 12px;">Average Anxiety Level</div>
                      </div>
                    </td>
                    <td style="width: 25%; padding: 8px;">
                      <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #dee2e6; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #495057; margin-bottom: 4px;">${anxietyAnalyses.length}</div>
                        <div style="color: #6c757d; font-size: 12px;">Total Tracking Sessions</div>
                      </div>
                    </td>
                    <td style="width: 25%; padding: 8px;">
                      <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #dee2e6; text-align: center;">
                        <div style="font-size: 24px; font-weight: bold; color: #495057; margin-bottom: 4px;">${chatMessages?.length || 0}</div>
                        <div style="color: #6c757d; font-size: 12px;">Chat Interactions</div>
                      </div>
                    </td>
                    <td style="width: 25%; padding: 8px;">
                      <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #dee2e6; text-align: center;">
                        <div style="font-size: 18px; font-weight: bold; color: #495057; margin-bottom: 4px;">${Math.round((averageAnxiety / 10) * 21)}/21</div>
                        <div style="color: #6c757d; font-size: 12px;">Estimated GAD-7 Score</div>
                      </div>
                    </td>
                  </tr>
                </table>

                <!-- Recent Anxiety Entries -->
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6; margin-bottom: 20px;">
                  <h4 style="margin: 0 0 16px 0; color: #495057; font-size: 16px;">Recent Anxiety Tracking (Last 10 Sessions)</h4>
                  ${anxietyAnalyses.slice(0, 10).map(analysis => `
                    <div style="padding: 12px 0; border-bottom: 1px solid #f1f3f4; display: flex; justify-content: space-between; align-items: flex-start;">
                      <div style="flex: 1;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                          <span style="font-weight: 600; color: #495057;">Level: ${analysis.anxiety_level}/10</span>
                          <span style="color: #6c757d; font-size: 12px;">${new Date(analysis.created_at).toLocaleDateString()}</span>
                        </div>
                        ${analysis.anxiety_triggers?.length > 0 ? `
                          <div style="margin-top: 6px;">
                            <div style="color: #6c757d; font-size: 12px; margin-bottom: 4px;">Triggers:</div>
                            <div style="display: flex; flex-wrap: gap: 4px;">
                              ${analysis.anxiety_triggers.slice(0, 4).map(trigger => `
                                <span style="background: #e3f2fd; color: #1976d2; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${trigger}</span>
                              `).join('')}
                            </div>
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>

                <!-- Top Triggers Analysis -->
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6; margin-bottom: 20px;">
                  <h4 style="margin: 0 0 16px 0; color: #495057; font-size: 16px;">Most Common Anxiety Triggers</h4>
                  ${topTriggers.length > 0 ? `
                    <div style="overflow-x: auto;">
                      <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                          <tr style="background: #f8f9fa;">
                            <th style="padding: 8px 12px; text-align: left; color: #495057; font-size: 13px; border-bottom: 1px solid #dee2e6;">Trigger</th>
                            <th style="padding: 8px 12px; text-align: center; color: #495057; font-size: 13px; border-bottom: 1px solid #dee2e6;">Frequency</th>
                            <th style="padding: 8px 12px; text-align: center; color: #495057; font-size: 13px; border-bottom: 1px solid #dee2e6;">% of Sessions</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${topTriggers.map(([trigger, count]) => `
                            <tr>
                              <td style="padding: 8px 12px; color: #495057; border-bottom: 1px solid #f1f3f4;">${trigger}</td>
                              <td style="padding: 8px 12px; text-align: center; color: #6c757d; border-bottom: 1px solid #f1f3f4;">${count}</td>
                              <td style="padding: 8px 12px; text-align: center; color: #6c757d; border-bottom: 1px solid #f1f3f4;">${Math.round((count / anxietyAnalyses.length) * 100)}%</td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </div>
                  ` : `
                    <p style="color: #6c757d; text-align: center; margin: 0;">No trigger data available.</p>
                  `}
                </div>

                <!-- Anxiety Level Distribution -->
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6;">
                  <h4 style="margin: 0 0 16px 0; color: #495057; font-size: 16px;">Anxiety Level Distribution</h4>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      ${severityRanges.map(range => `
                        <td style="width: 20%; padding: 8px;">
                          <div style="text-align: center; padding: 12px; background: #f8f9fa; border-radius: 6px; border: 1px solid #e9ecef;">
                            <div style="font-size: 18px; font-weight: bold; color: #495057;">${range.count}</div>
                            <div style="font-size: 11px; color: #6c757d;">Level ${range.range}</div>
                            <div style="font-size: 10px; color: #6c757d;">(${Math.round((range.count / anxietyAnalyses.length) * 100)}%)</div>
                          </div>
                        </td>
                      `).join('')}
                    </tr>
                  </table>
                </div>

                <!-- Weekly Anxiety Trends Chart -->
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6; margin-bottom: 20px;">
                  <h4 style="margin: 0 0 20px 0; color: #495057; font-size: 16px;">📊 Weekly Anxiety Type Trends</h4>
                  
                  ${anxietyAnalyses.length > 5 ? (() => {
                    // Process data for weekly trends with simplified table layout
                    const last5Entries = anxietyAnalyses.slice(0, 5).reverse();
                    
                    return `
                      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                        <thead>
                          <tr style="background: #f8f9fa;">
                            <th style="padding: 12px; text-align: left; color: #495057; border-bottom: 2px solid #dee2e6; font-size: 14px;">Date</th>
                            <th style="padding: 12px; text-align: center; color: #495057; border-bottom: 2px solid #dee2e6; font-size: 14px;">Anxiety Level</th>
                            <th style="padding: 12px; text-align: left; color: #495057; border-bottom: 2px solid #dee2e6; font-size: 14px;">Main Triggers</th>
                          </tr>
                        </thead>
                        <tbody>
                          ${last5Entries.map(analysis => {
                            const date = new Date(analysis.created_at).toLocaleDateString();
                            const level = analysis.anxiety_level;
                            const barWidth = (level / 10) * 100;
                            const triggers = analysis.anxiety_triggers?.slice(0, 3) || [];
                            
                            return `
                              <tr>
                                <td style="padding: 12px; color: #495057; border-bottom: 1px solid #f1f3f4; font-weight: 500;">${date}</td>
                                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #f1f3f4;">
                                  <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                                    <div style="width: 60px; height: 8px; background: #e9ecef; border-radius: 4px; overflow: hidden;">
                                      <div style="width: ${barWidth}%; height: 100%; background: ${level <= 3 ? '#10B981' : level <= 6 ? '#F59E0B' : '#EF4444'}; border-radius: 4px;"></div>
                                    </div>
                                    <span style="font-size: 14px; color: #495057; font-weight: 600;">${level}/10</span>
                                  </div>
                                </td>
                                <td style="padding: 12px; color: #6c757d; border-bottom: 1px solid #f1f3f4; font-size: 13px;">
                                  ${triggers.length > 0 ? triggers.map(trigger => `
                                    <span style="display: inline-block; background: #e3f2fd; color: #1976d2; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-right: 4px; margin-bottom: 2px;">${trigger}</span>
                                  `).join('') : '<span style="color: #adb5bd; font-style: italic;">No triggers identified</span>'}
                                </td>
                              </tr>
                            `;
                          }).join('')}
                        </tbody>
                      </table>
                      <div style="padding: 12px; background: #f8f9fa; border-radius: 6px; font-size: 12px; color: #6c757d;">
                        <strong>Legend:</strong> Green (1-3) = Low anxiety, Orange (4-6) = Moderate anxiety, Red (7-10) = High anxiety
                      </div>
                    `;
                  })() : `
                    <div style="padding: 40px; text-align: center; background: #f8f9fa; border-radius: 8px;">
                      <p style="margin: 0; color: #6c757d; font-size: 14px;">
                        Need at least 5 anxiety tracking sessions to generate trends chart.<br>
                        Current sessions: ${anxietyAnalyses.length}
                      </p>
                    </div>
                  `}
                </div>

                <!-- Anxiety Level Trends -->
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6; margin-bottom: 20px;">
                  <h4 style="margin: 0 0 20px 0; color: #495057; font-size: 16px;">📈 Anxiety Level Trends (Last 14 Days)</h4>
                  
                  ${anxietyAnalyses.length > 0 ? (() => {
                    const last14Days = anxietyAnalyses.slice(0, Math.min(14, anxietyAnalyses.length)).reverse();
                    
                    return `
                      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 16px;">
                        <!-- Trend Line Visualization -->
                        <div style="margin-bottom: 20px;">
                          <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                              <tr style="background: #fff;">
                                <th style="padding: 8px; text-align: left; color: #495057; font-size: 12px; border-bottom: 2px solid #dee2e6;">Date</th>
                                <th style="padding: 8px; text-align: center; color: #495057; font-size: 12px; border-bottom: 2px solid #dee2e6;">Level</th>
                                <th style="padding: 8px; text-align: left; color: #495057; font-size: 12px; border-bottom: 2px solid #dee2e6;">Trend</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${last14Days.map((analysis, index) => {
                                const date = new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                const level = analysis.anxiety_level;
                                const barWidth = (level / 10) * 100;
                                const color = level <= 3 ? '#10B981' : level <= 6 ? '#F59E0B' : '#EF4444';
                                
                                // Calculate trend arrow
                                let trendIcon = '→';
                                if (index > 0) {
                                  const prevLevel = last14Days[index - 1].anxiety_level;
                                  if (level > prevLevel) trendIcon = '↗️';
                                  else if (level < prevLevel) trendIcon = '↘️';
                                }
                                
                                return `
                                  <tr>
                                    <td style="padding: 8px; color: #495057; font-size: 12px; border-bottom: 1px solid #f1f3f4;">${date}</td>
                                    <td style="padding: 8px; text-align: center; border-bottom: 1px solid #f1f3f4;">
                                      <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                                        <div style="width: 40px; height: 6px; background: #e9ecef; border-radius: 3px; overflow: hidden;">
                                          <div style="width: ${barWidth}%; height: 100%; background: ${color}; border-radius: 3px;"></div>
                                        </div>
                                        <span style="font-size: 12px; color: #495057; font-weight: 600; min-width: 30px;">${level}/10</span>
                                      </div>
                                    </td>
                                    <td style="padding: 8px; color: #6c757d; font-size: 14px; border-bottom: 1px solid #f1f3f4; text-align: center;">${trendIcon}</td>
                                  </tr>
                                `;
                              }).join('')}
                            </tbody>
                          </table>
                        </div>
                        
                        <!-- Trend Summary -->
                        ${(() => {
                          if (last14Days.length >= 2) {
                            const firstLevel = last14Days[0].anxiety_level;
                            const lastLevel = last14Days[last14Days.length - 1].anxiety_level;
                            const change = lastLevel - firstLevel;
                            const changePercent = ((change / firstLevel) * 100).toFixed(1);
                            
                            return `
                              <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #e9ecef;">
                                <div style="font-size: 12px; color: #6c757d; margin-bottom: 4px;">14-Day Trend Summary:</div>
                                <div style="color: ${change > 0 ? '#dc2626' : change < 0 ? '#059669' : '#6b7280'}; font-weight: 600; font-size: 14px;">
                                  ${change > 0 ? '↗️ Increased' : change < 0 ? '↘️ Decreased' : '→ Stable'} by ${Math.abs(parseFloat(changePercent))}% 
                                  (${firstLevel}/10 → ${lastLevel}/10)
                                </div>
                              </div>
                            `;
                          }
                          return '';
                        })()}
                      </div>
                    `;
                  })() : `
                    <div style="padding: 40px; text-align: center; background: #f8f9fa; border-radius: 8px;">
                      <p style="margin: 0; color: #6c757d;">No anxiety tracking data available yet.</p>
                    </div>
                  `}
                </div>

                <!-- Monthly Anxiety Type Trends -->
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6; margin-bottom: 20px;">
                  <h4 style="margin: 0 0 20px 0; color: #495057; font-size: 16px;">🔍 Monthly Anxiety Type Trends</h4>
                  
                  ${anxietyAnalyses.length > 0 ? (() => {
                    // Group by anxiety types/triggers over the last 30 days
                    const last30Days = anxietyAnalyses.slice(0, Math.min(30, anxietyAnalyses.length));
                    const triggerTrends = {};
                    
                    // Categorize triggers into types
                    const triggerCategories = {
                      'Work/Career': ['work', 'job', 'career', 'professional', 'employment', 'workplace', 'boss', 'colleague'],
                      'Social': ['social', 'relationship', 'family', 'friends', 'dating', 'conversation', 'public'],
                      'Health': ['health', 'medical', 'physical', 'illness', 'pain', 'doctor', 'symptoms'],
                      'Financial': ['money', 'financial', 'bills', 'debt', 'budget', 'expenses', 'cost'],
                      'Academic': ['school', 'exam', 'study', 'test', 'grade', 'academic', 'homework', 'university'],
                      'Future/Uncertainty': ['future', 'uncertainty', 'unknown', 'change', 'decision', 'planning']
                    };
                    
                    // Initialize categories
                    Object.keys(triggerCategories).forEach(category => {
                      triggerTrends[category] = { count: 0, totalLevel: 0, avgLevel: 0 };
                    });
                    triggerTrends['Other'] = { count: 0, totalLevel: 0, avgLevel: 0 };
                    
                    // Categorize triggers
                    last30Days.forEach(analysis => {
                      const triggers = analysis.anxiety_triggers || [];
                      let categorized = false;
                      
                      triggers.forEach(trigger => {
                        const lowerTrigger = trigger.toLowerCase();
                        
                        for (const [category, keywords] of Object.entries(triggerCategories)) {
                          if (keywords.some(keyword => lowerTrigger.includes(keyword))) {
                            triggerTrends[category].count++;
                            triggerTrends[category].totalLevel += analysis.anxiety_level;
                            categorized = true;
                            break;
                          }
                        }
                        
                        if (!categorized) {
                          triggerTrends['Other'].count++;
                          triggerTrends['Other'].totalLevel += analysis.anxiety_level;
                        }
                      });
                    });
                    
                    // Calculate averages
                    Object.keys(triggerTrends).forEach(category => {
                      const trend = triggerTrends[category];
                      trend.avgLevel = trend.count > 0 ? (trend.totalLevel / trend.count).toFixed(1) : 0;
                    });
                    
                    // Sort by frequency
                    const sortedTrends = Object.entries(triggerTrends)
                      .filter(([_, data]) => data.count > 0)
                      .sort(([,a], [,b]) => b.count - a.count);
                    
                    return `
                      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                        ${sortedTrends.length > 0 ? `
                          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 6px; overflow: hidden;">
                            <thead>
                              <tr style="background: #e9ecef;">
                                <th style="padding: 12px; text-align: left; color: #495057; font-size: 13px;">Anxiety Category</th>
                                <th style="padding: 12px; text-align: center; color: #495057; font-size: 13px;">Frequency</th>
                                <th style="padding: 12px; text-align: center; color: #495057; font-size: 13px;">Avg Level</th>
                                <th style="padding: 12px; text-align: left; color: #495057; font-size: 13px;">Impact</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${sortedTrends.map(([category, data]) => {
                                const percentage = ((data.count / last30Days.length) * 100).toFixed(0);
                                const level = parseFloat(data.avgLevel);
                                const impactColor = level <= 3 ? '#10B981' : level <= 6 ? '#F59E0B' : '#EF4444';
                                const impactText = level <= 3 ? 'Low' : level <= 6 ? 'Moderate' : 'High';
                                
                                return `
                                  <tr>
                                    <td style="padding: 12px; color: #495057; font-weight: 500; border-bottom: 1px solid #f1f3f4;">${category}</td>
                                    <td style="padding: 12px; text-align: center; border-bottom: 1px solid #f1f3f4;">
                                      <div style="display: flex; align-items: center; justify-content: center; gap: 6px;">
                                        <span style="font-weight: 600; color: #495057;">${data.count}</span>
                                        <span style="font-size: 11px; color: #6c757d;">(${percentage}%)</span>
                                      </div>
                                    </td>
                                    <td style="padding: 12px; text-align: center; color: #495057; font-weight: 600; border-bottom: 1px solid #f1f3f4;">${data.avgLevel}/10</td>
                                    <td style="padding: 12px; border-bottom: 1px solid #f1f3f4;">
                                      <span style="background: ${impactColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 500;">
                                        ${impactText}
                                      </span>
                                    </td>
                                  </tr>
                                `;
                              }).join('')}
                            </tbody>
                          </table>
                        ` : `
                          <div style="text-align: center; padding: 20px; color: #6c757d;">
                            No categorized anxiety triggers found in the last 30 sessions.
                          </div>
                        `}
                      </div>
                    `;
                  })() : `
                    <div style="padding: 40px; text-align: center; background: #f8f9fa; border-radius: 8px;">
                      <p style="margin: 0; color: #6c757d;">No anxiety tracking data available yet.</p>
                    </div>
                  `}
                </div>

                <!-- Monthly Session Activity -->
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6; margin-bottom: 20px;">
                  <h4 style="margin: 0 0 20px 0; color: #495057; font-size: 16px;">📅 Monthly Session Activity</h4>
                  
                  ${anxietyAnalyses.length > 0 && chatMessages?.length > 0 ? (() => {
                    // Calculate session activity for the last 30 days
                    const now = new Date();
                    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                    
                    const recentAnalyses = anxietyAnalyses.filter(a => new Date(a.created_at) >= thirtyDaysAgo);
                    const recentMessages = chatMessages.filter(m => new Date(m.created_at) >= thirtyDaysAgo);
                    
                    // Group by week
                    const weeklyActivity = {};
                    for (let i = 0; i < 4; i++) {
                      const weekStart = new Date(now.getTime() - ((i + 1) * 7 * 24 * 60 * 60 * 1000));
                      const weekEnd = new Date(now.getTime() - (i * 7 * 24 * 60 * 60 * 1000));
                      const weekKey = 'Week ' + (4 - i);
                      
                      weeklyActivity[weekKey] = {
                        anxietyTracks: recentAnalyses.filter(a => {
                          const date = new Date(a.created_at);
                          return date >= weekStart && date < weekEnd;
                        }).length,
                        chatSessions: recentMessages.filter(m => {
                          const date = new Date(m.created_at);
                          return date >= weekStart && date < weekEnd;
                        }).length
                      };
                    }
                    
                    const totalAnxietyTracks = recentAnalyses.length;
                    const totalChatSessions = recentMessages.length;
                    const avgWeeklyActivity = ((totalAnxietyTracks + totalChatSessions) / 4).toFixed(1);
                    
                    return `
                      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                        <!-- Activity Summary -->
                        <div style="margin-bottom: 20px;">
                          <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                              <td style="width: 33.33%; padding: 8px;">
                                <div style="background: white; padding: 16px; border-radius: 6px; text-align: center; border: 1px solid #e9ecef;">
                                  <div style="font-size: 20px; font-weight: bold; color: #1976d2; margin-bottom: 4px;">${totalAnxietyTracks}</div>
                                  <div style="color: #6c757d; font-size: 11px;">Anxiety Tracking Sessions</div>
                                </div>
                              </td>
                              <td style="width: 33.33%; padding: 8px;">
                                <div style="background: white; padding: 16px; border-radius: 6px; text-align: center; border: 1px solid #e9ecef;">
                                  <div style="font-size: 20px; font-weight: bold; color: #7c3aed; margin-bottom: 4px;">${totalChatSessions}</div>
                                  <div style="color: #6c757d; font-size: 11px;">Chat Interactions</div>
                                </div>
                              </td>
                              <td style="width: 33.33%; padding: 8px;">
                                <div style="background: white; padding: 16px; border-radius: 6px; text-align: center; border: 1px solid #e9ecef;">
                                  <div style="font-size: 20px; font-weight: bold; color: #059669; margin-bottom: 4px;">${avgWeeklyActivity}</div>
                                  <div style="color: #6c757d; font-size: 11px;">Avg Weekly Activity</div>
                                </div>
                              </td>
                            </tr>
                          </table>
                        </div>
                        
                        <!-- Weekly Breakdown -->
                        <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e9ecef;">
                          <h5 style="margin: 0 0 12px 0; color: #495057; font-size: 14px;">Weekly Activity Breakdown</h5>
                          <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                              <tr style="background: #f8f9fa;">
                                <th style="padding: 8px; text-align: left; color: #495057; font-size: 12px; border-bottom: 1px solid #dee2e6;">Period</th>
                                <th style="padding: 8px; text-align: center; color: #495057; font-size: 12px; border-bottom: 1px solid #dee2e6;">Anxiety Tracking</th>
                                <th style="padding: 8px; text-align: center; color: #495057; font-size: 12px; border-bottom: 1px solid #dee2e6;">Chat Sessions</th>
                                <th style="padding: 8px; text-align: center; color: #495057; font-size: 12px; border-bottom: 1px solid #dee2e6;">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${Object.entries(weeklyActivity).map(([week, data]) => {
                                const total = data.anxietyTracks + data.chatSessions;
                                return `
                                  <tr>
                                    <td style="padding: 8px; color: #495057; font-size: 12px; border-bottom: 1px solid #f1f3f4;">${week}</td>
                                    <td style="padding: 8px; text-align: center; color: #1976d2; font-weight: 600; font-size: 12px; border-bottom: 1px solid #f1f3f4;">${data.anxietyTracks}</td>
                                    <td style="padding: 8px; text-align: center; color: #7c3aed; font-weight: 600; font-size: 12px; border-bottom: 1px solid #f1f3f4;">${data.chatSessions}</td>
                                    <td style="padding: 8px; text-align: center; color: #495057; font-weight: 600; font-size: 12px; border-bottom: 1px solid #f1f3f4;">${total}</td>
                                  </tr>
                                `;
                              }).join('')}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    `;
                  })() : `
                    <div style="padding: 40px; text-align: center; background: #f8f9fa; border-radius: 8px;">
                      <p style="margin: 0; color: #6c757d;">No activity data available for the last 30 days.</p>
                    </div>
                  `}
                </div>
                <div style="background: #e8f5e8; padding: 16px; border-radius: 6px; margin-top: 20px; border-left: 4px solid #4caf50;">
                  <h4 style="margin: 0 0 8px 0; color: #2e7d32;">Clinical Summary</h4>
                  <p style="margin: 0; color: #2e7d32; font-size: 14px; line-height: 1.4;">
                    Patient shows ${averageAnxiety < 4 ? 'mild' : averageAnxiety < 7 ? 'moderate' : 'severe'} anxiety levels on average. 
                    ${mostCommonTrigger[0] !== 'None' ? `Primary trigger identified: ${mostCommonTrigger[0]} (${mostCommonTrigger[1]} occurrences).` : 'No dominant trigger pattern identified.'} 
                    Total of ${anxietyAnalyses.length} tracking sessions completed.
                  </p>
                </div>
              </div>
            `;
          }
        } catch (error) {
          console.error('Error generating comprehensive history report:', error);
          historyReportSection = `
            <div style="background: #fff3cd; padding: 16px; border-radius: 6px; border: 1px solid #ffeaa7; margin: 16px 0;">
              <p style="margin: 0; color: #856404;">
                ⚠️ Note: ${senderName} requested to include their Current History Report, but we encountered an issue generating the comprehensive analytics. 
                The connection request remains valid.
              </p>
            </div>
          `;
        }
      }
      
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
            <h1 style="color: #1e293b; margin: 0 0 8px 0;">Anxiety Companion - Connection Request</h1>
            <p style="color: #64748b; margin: 0;">From: ${senderName} (${user.email})</p>
          </div>
          
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 16px 0;">Dear ${therapistName},</p>
            
            <p style="color: #374151; margin: 0 0 16px 0;">
              I am reaching out to inform you that <strong>${senderName}</strong> would like to connect with you 
              through the Anxiety Companion app and share their mental health progress reports with you.
            </p>
            
            ${historyReportSection}
            
            <p style="color: #374151; margin: 0 0 16px 0;">
              The Anxiety Companion app helps users track their anxiety levels, identify triggers, and monitor 
              their mental health journey. ${senderName} has expressed interest in sharing their progress data 
              with you to enhance their treatment and support.
            </p>
            
            <div style="background: #f0f9ff; padding: 16px; border-radius: 6px; border-left: 4px solid #0ea5e9; margin: 16px 0;">
              <h3 style="color: #0c4a6e; margin: 0 0 8px 0;">What you can expect:</h3>
              <ul style="color: #374151; margin: 0; padding-left: 20px;">
                <li>Detailed anxiety tracking data and trends</li>
                <li>Trigger analysis and coping strategy usage</li>
                <li>Treatment progress reports</li>
                <li>Secure, HIPAA-compliant data sharing</li>
              </ul>
            </div>
            
            <p style="color: #374151; margin: 16px 0;">
              If you would like to receive these reports, please let ${senderName} know during your next session. 
              They can then share detailed analytics and progress reports with you directly from the app.
            </p>
            
            <p style="color: #374151; margin: 16px 0 0 0;">
              Best regards,<br>
              The Anxiety Companion Team
            </p>
          </div>
          
          <div style="margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
              This email was sent automatically by the Anxiety Companion app on behalf of ${senderName}.<br>
              All patient data is protected and handled according to HIPAA guidelines.
            </p>
          </div>
        </div>
      `;
    } else {
      // Regular report email
      const reportTitle = reportType === 'analytics' ? 'Analytics Report' : 'Treatment Resources Report';
      subject = `${reportTitle} from ${senderName}`;
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <h1 style="color: #1e293b; margin: 0 0 8px 0;">Anxiety Companion - ${reportTitle}</h1>
            <p style="color: #64748b; margin: 0;">Shared by: ${senderName} (${user.email})</p>
            <p style="color: #64748b; margin: 4px 0 0 0;">Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
            ${reportData}
          </div>
          
          <div style="margin-top: 24px; padding: 16px; background: #f1f5f9; border-radius: 8px; border-left: 4px solid #3b82f6;">
            <p style="margin: 0; color: #475569; font-size: 14px;">
              <strong>Note:</strong> This report was generated automatically by the Anxiety Companion app and shared with your consent. 
              The data includes anxiety tracking, analysis results, and treatment progress information.
            </p>
          </div>
          
          <div style="margin-top: 24px; text-align: center; color: #94a3b8; font-size: 12px;">
            <p>Powered by Anxiety Companion | Confidential Medical Information</p>
          </div>
        </div>
      `;
    }

    const emailResponse = await resend.emails.send({
      from: "Anxiety Companion <noreply@tranquiloo-app.com>",
      to: [therapistEmail],
      subject,
      html: emailContent,
    });

    console.log("Therapist report email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Report sent successfully to therapist",
      emailId: emailResponse.data?.id 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-therapist-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);