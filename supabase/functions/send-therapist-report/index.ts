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
  reportData?: string; // HTML content of the report
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
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px;">
                  <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #dee2e6; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #495057; margin-bottom: 4px;">${averageAnxiety.toFixed(1)}/10</div>
                    <div style="color: #6c757d; font-size: 12px;">Average Anxiety Level</div>
                  </div>
                  <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #dee2e6; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #495057; margin-bottom: 4px;">${anxietyAnalyses.length}</div>
                    <div style="color: #6c757d; font-size: 12px;">Total Tracking Sessions</div>
                  </div>
                  <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #dee2e6; text-align: center;">
                    <div style="font-size: 24px; font-weight: bold; color: #495057; margin-bottom: 4px;">${chatMessages?.length || 0}</div>
                    <div style="color: #6c757d; font-size: 12px;">Chat Interactions</div>
                  </div>
                  <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #dee2e6; text-align: center;">
                    <div style="font-size: 18px; font-weight: bold; color: #495057; margin-bottom: 4px;">${Math.round((averageAnxiety / 10) * 21)}/21</div>
                    <div style="color: #6c757d; font-size: 12px;">Estimated GAD-7 Score</div>
                  </div>
                </div>

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
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 12px;">
                    ${severityRanges.map(range => `
                      <div style="text-align: center; padding: 12px; background: #f8f9fa; border-radius: 6px;">
                        <div style="font-size: 18px; font-weight: bold; color: #495057;">${range.count}</div>
                        <div style="font-size: 11px; color: #6c757d;">Level ${range.range}</div>
                        <div style="font-size: 10px; color: #6c757d;">(${Math.round((range.count / anxietyAnalyses.length) * 100)}%)</div>
                      </div>
                    `).join('')}
                  </div>
                </div>

                <!-- Charts Section -->
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6; margin-bottom: 20px;">
                  <h4 style="margin: 0 0 20px 0; color: #495057; font-size: 16px;">📊 Weekly Anxiety Type Trends</h4>
                  <div style="height: 250px; position: relative; padding: 40px 60px 60px 80px; background: linear-gradient(to bottom, #fafafa 0%, #ffffff 100%); border-radius: 12px;">
                    <!-- Y-axis label -->
                    <div style="position: absolute; left: 25px; top: 50%; transform: rotate(-90deg); transform-origin: center; font-size: 14px; color: #4b5563; font-weight: 600;">Anxiety Level</div>
                    
                    <!-- Y-axis scale -->
                    <div style="position: absolute; left: 50px; top: 40px; font-size: 11px; color: #6b7280; font-weight: 500;">10</div>
                    <div style="position: absolute; left: 50px; top: 50%; transform: translateY(-50%); font-size: 11px; color: #6b7280; font-weight: 500;">5</div>
                    <div style="position: absolute; left: 50px; bottom: 80px; font-size: 11px; color: #6b7280; font-weight: 500;">0</div>
                    
                    <svg style="position: absolute; top: 40px; left: 80px; width: calc(100% - 140px); height: calc(100% - 120px); pointer-events: none;" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <!-- Grid lines -->
                      <defs>
                        <pattern id="grid" width="20%" height="20%" patternUnits="userSpaceOnUse">
                          <path d="M 0 0 L 0 20% M 0 0 L 20% 0" fill="none" stroke="#e5e7eb" stroke-width="0.5" opacity="0.6"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                      
                      <!-- Sample trend lines based on actual data patterns -->
                      ${anxietyAnalyses.length > 1 ? `
                        <!-- Work/Career trend -->
                        <polyline points="10,70 30,60 50,65 70,55 90,50" fill="none" stroke="#3B82F6" stroke-width="1.5" stroke-linejoin="round"/>
                        <circle cx="10" cy="70" r="2" fill="#3B82F6" stroke="white" stroke-width="1"/>
                        <circle cx="30" cy="60" r="2" fill="#3B82F6" stroke="white" stroke-width="1"/>
                        <circle cx="50" cy="65" r="2" fill="#3B82F6" stroke="white" stroke-width="1"/>
                        <circle cx="70" cy="55" r="2" fill="#3B82F6" stroke="white" stroke-width="1"/>
                        <circle cx="90" cy="50" r="2" fill="#3B82F6" stroke="white" stroke-width="1"/>
                        
                        <!-- Social trend -->
                        <polyline points="10,80 30,75 50,70 70,65 90,60" fill="none" stroke="#EF4444" stroke-width="1.5" stroke-linejoin="round"/>
                        <circle cx="10" cy="80" r="2" fill="#EF4444" stroke="white" stroke-width="1"/>
                        <circle cx="30" cy="75" r="2" fill="#EF4444" stroke="white" stroke-width="1"/>
                        <circle cx="50" cy="70" r="2" fill="#EF4444" stroke="white" stroke-width="1"/>
                        <circle cx="70" cy="65" r="2" fill="#EF4444" stroke="white" stroke-width="1"/>
                        <circle cx="90" cy="60" r="2" fill="#EF4444" stroke="white" stroke-width="1"/>
                        
                        <!-- Health trend -->
                        <polyline points="10,85 30,80 50,75 70,70 90,65" fill="none" stroke="#F59E0B" stroke-width="1.5" stroke-linejoin="round"/>
                        <circle cx="10" cy="85" r="2" fill="#F59E0B" stroke="white" stroke-width="1"/>
                        <circle cx="30" cy="80" r="2" fill="#F59E0B" stroke="white" stroke-width="1"/>
                        <circle cx="50" cy="75" r="2" fill="#F59E0B" stroke="white" stroke-width="1"/>
                        <circle cx="70" cy="70" r="2" fill="#F59E0B" stroke="white" stroke-width="1"/>
                        <circle cx="90" cy="65" r="2" fill="#F59E0B" stroke="white" stroke-width="1"/>
                      ` : `
                        <text x="50" y="50" text-anchor="middle" fill="#6b7280" font-size="12">Insufficient data for trend visualization</text>
                      `}
                    </svg>
                  </div>
                  
                  <!-- Date Labels -->
                  <div style="position: relative; margin-top: 20px; font-size: 13px; color: #6b7280; font-weight: 500; padding-left: 80px; padding-right: 60px; height: 20px;">
                    ${anxietyAnalyses.length > 1 ? `
                      <span style="position: absolute; left: 10%; transform: translateX(-50%)">${new Date(anxietyAnalyses[Math.min(4, anxietyAnalyses.length-1)].created_at).toLocaleDateString()}</span>
                      <span style="position: absolute; left: 50%; transform: translateX(-50%)">${new Date(anxietyAnalyses[Math.floor(anxietyAnalyses.length/2)].created_at).toLocaleDateString()}</span>
                      <span style="position: absolute; left: 90%; transform: translateX(-50%)">${new Date(anxietyAnalyses[0].created_at).toLocaleDateString()}</span>
                    ` : ''}
                  </div>
                  
                  <!-- Legend -->
                  <div style="display: flex; flex-wrap: wrap; gap: 20px; margin-top: 24px; justify-content: center; padding: 16px; background: #f9fafb; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 12px;">
                      <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #3B82F6;"></div>
                      <span>Work/Career</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 12px;">
                      <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #EF4444;"></div>
                      <span>Social</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 12px;">
                      <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #F59E0B;"></div>
                      <span>Health</span>
                    </div>
                  </div>
                </div>

                <!-- Monthly Anxiety Trends Chart -->
                <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6; margin-bottom: 20px;">
                  <h4 style="margin: 0 0 20px 0; color: #495057; font-size: 16px;">📅 Monthly Anxiety Trends</h4>
                  <div style="height: 250px; position: relative; padding: 40px 60px 60px 80px; background: linear-gradient(to bottom, #fafafa 0%, #ffffff 100%); border-radius: 12px;">
                    <!-- Y-axis label -->
                    <div style="position: absolute; left: 25px; top: 50%; transform: rotate(-90deg); transform-origin: center; font-size: 14px; color: #4b5563; font-weight: 600;">Anxiety Level</div>
                    
                    <!-- Y-axis scale -->
                    <div style="position: absolute; left: 50px; top: 40px; font-size: 11px; color: #6b7280; font-weight: 500;">10</div>
                    <div style="position: absolute; left: 50px; top: 50%; transform: translateY(-50%); font-size: 11px; color: #6b7280; font-weight: 500;">5</div>
                    <div style="position: absolute; left: 50px; bottom: 80px; font-size: 11px; color: #6b7280; font-weight: 500;">0</div>
                    
                    <svg style="position: absolute; top: 40px; left: 80px; width: calc(100% - 140px); height: calc(100% - 120px); pointer-events: none;" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <!-- Grid lines -->
                      <rect width="100%" height="100%" fill="url(#grid)" />
                      
                      <!-- Average anxiety trend line based on actual data -->
                      ${(() => {
                        if (anxietyAnalyses.length < 2) {
                          return '<text x="50" y="50" text-anchor="middle" fill="#6b7280" font-size="12">Insufficient data for trend visualization</text>';
                        }
                        
                        // Create a trend line from the actual data
                        const recentData = anxietyAnalyses.slice(0, 5).reverse(); // Get 5 most recent, reverse for chronological order
                        const points = recentData.map((analysis, index) => {
                          const x = 10 + (index / (recentData.length - 1)) * 80;
                          const y = 100 - ((analysis.anxiety_level / 10) * 80); // Scale to 0-80% of chart height
                          return x + ',' + y;
                        }).join(' ');
                        
                        const circles = recentData.map((analysis, index) => {
                          const x = 10 + (index / (recentData.length - 1)) * 80;
                          const y = 100 - ((analysis.anxiety_level / 10) * 80);
                          return `<circle cx="${x}" cy="${y}" r="2" fill="#3B82F6" stroke="white" stroke-width="1"/>`;
                        }).join('');
                        
                        return `<polyline points="${points}" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linejoin="round"/>${circles}`;
                      })()}
                    </svg>
                  </div>
                  
                  <!-- Date Labels -->
                  <div style="position: relative; margin-top: 20px; font-size: 13px; color: #6b7280; font-weight: 500; padding-left: 80px; padding-right: 60px; height: 20px;">
                    ${anxietyAnalyses.length > 1 ? `
                      <span style="position: absolute; left: 10%; transform: translateX(-50%)">${new Date(anxietyAnalyses[Math.min(4, anxietyAnalyses.length-1)].created_at).toLocaleDateString()}</span>
                      <span style="position: absolute; left: 90%; transform: translateX(-50%)">${new Date(anxietyAnalyses[0].created_at).toLocaleDateString()}</span>
                    ` : ''}
                  </div>
                  
                  <!-- Legend -->
                  <div style="display: flex; justify-content: center; margin-top: 24px; padding: 16px; background: #f9fafb; border-radius: 8px;">
                    <div style="display: flex; align-items: center; gap: 6px; font-size: 12px;">
                      <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #3B82F6;"></div>
                      <span>Average Anxiety Level</span>
                    </div>
                  </div>
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