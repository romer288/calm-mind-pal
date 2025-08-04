import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WeeklyReportData {
  patientName: string;
  weekStart: string;
  weekEnd: string;
  averageAnxiety: number;
  sessionCount: number;
  commonTriggers: string[];
  treatmentProgress: 'improving' | 'stable' | 'declining';
  crisisAlerts: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('📅 Starting weekly therapist report generation...');

    // Get all active therapist-patient relationships
    const { data: therapistConnections, error: connectionsError } = await supabase
      .from('user_therapists')
      .select(`
        *,
        profiles!inner(first_name, last_name, email)
      `)
      .eq('is_active', true)
      .eq('contact_method', 'email');

    if (connectionsError) {
      console.error('Error fetching therapist connections:', connectionsError);
      throw connectionsError;
    }

    if (!therapistConnections || therapistConnections.length === 0) {
      return new Response(JSON.stringify({ 
        message: "No active therapist connections found" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log(`📧 Found ${therapistConnections.length} therapist connections`);

    // Calculate week range
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weekEnd = now;

    const emailPromises = therapistConnections.map(async (connection) => {
      try {
        // Get patient's anxiety analyses for the past week
        const { data: weeklyAnalyses, error: analysesError } = await supabase
          .from('anxiety_analyses')
          .select('*')
          .eq('user_id', connection.user_id)
          .gte('created_at', weekStart.toISOString())
          .lte('created_at', weekEnd.toISOString())
          .order('created_at', { ascending: false });

        if (analysesError) {
          console.error(`Error fetching analyses for patient ${connection.user_id}:`, analysesError);
          return null;
        }

        const analyses = weeklyAnalyses || [];
        
        if (analyses.length === 0) {
          console.log(`No activity for patient ${connection.user_id} this week, skipping email`);
          return null;
        }

        // Calculate metrics
        const averageAnxiety = analyses.reduce((sum, a) => sum + a.anxiety_level, 0) / analyses.length;
        const commonTriggers = analyses
          .flatMap(a => a.anxiety_triggers || [])
          .filter((trigger, index, arr) => arr.indexOf(trigger) === index)
          .slice(0, 3);

        const crisisAlerts = analyses.filter(a => a.anxiety_level >= 8).length;
        
        // Simple trend calculation
        const firstHalf = analyses.slice(Math.floor(analyses.length / 2));
        const secondHalf = analyses.slice(0, Math.floor(analyses.length / 2));
        const firstAvg = firstHalf.reduce((sum, a) => sum + a.anxiety_level, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, a) => sum + a.anxiety_level, 0) / secondHalf.length;
        
        let treatmentProgress: 'improving' | 'stable' | 'declining' = 'stable';
        if (secondAvg - firstAvg > 0.5) {
          treatmentProgress = 'declining';
        } else if (firstAvg - secondAvg > 0.5) {
          treatmentProgress = 'improving';
        }

        const patientName = connection.profiles 
          ? `${connection.profiles.first_name || ''} ${connection.profiles.last_name || ''}`.trim()
          : 'Patient';

        const reportData: WeeklyReportData = {
          patientName: patientName || 'Anonymous Patient',
          weekStart: weekStart.toLocaleDateString(),
          weekEnd: weekEnd.toLocaleDateString(),
          averageAnxiety: Number(averageAnxiety.toFixed(1)),
          sessionCount: analyses.length,
          commonTriggers,
          treatmentProgress,
          crisisAlerts
        };

        // Generate HTML email content
        const emailHTML = generateWeeklyReportHTML(reportData);

        // Send email
        const emailResponse = await resend.emails.send({
          from: "Tranquiloo App <reports@tranquiloo-app.com>",
          to: [connection.contact_value],
          subject: `Weekly Progress Report: ${patientName} (${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()})`,
          html: emailHTML,
        });

        console.log(`✅ Email sent to ${connection.contact_value} for patient ${patientName}`);
        return emailResponse;

      } catch (error) {
        console.error(`Error processing connection ${connection.id}:`, error);
        return null;
      }
    });

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value !== null).length;
    const failed = results.length - successful;

    console.log(`📊 Weekly report summary: ${successful} successful, ${failed} failed`);

    return new Response(JSON.stringify({
      success: true,
      message: `Weekly reports sent: ${successful} successful, ${failed} failed`,
      processed: therapistConnections.length
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("Error in weekly therapist reports:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

function generateWeeklyReportHTML(data: WeeklyReportData): string {
  const progressColor = data.treatmentProgress === 'improving' ? '#16a34a' : 
                       data.treatmentProgress === 'declining' ? '#dc2626' : '#eab308';
  
  const progressIcon = data.treatmentProgress === 'improving' ? '📈' : 
                      data.treatmentProgress === 'declining' ? '📉' : '➡️';

  const anxietyColor = data.averageAnxiety >= 7 ? '#dc2626' : 
                      data.averageAnxiety >= 5 ? '#eab308' : '#16a34a';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Weekly Patient Report</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 32px 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 700;">📊 Weekly Progress Report</h1>
          <p style="margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">Patient Analytics Summary</p>
        </div>

        <!-- Patient Info -->
        <div style="padding: 24px; border-bottom: 1px solid #e2e8f0;">
          <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 20px;">Patient: ${data.patientName}</h2>
          <p style="margin: 0; color: #64748b; font-size: 14px;">
            Report Period: ${data.weekStart} - ${data.weekEnd}
          </p>
        </div>

        <!-- Key Metrics -->
        <div style="padding: 24px;">
          <h3 style="margin: 0 0 20px 0; color: #1e293b; font-size: 18px;">📈 Key Metrics</h3>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid ${anxietyColor};">
              <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Average Anxiety Level</div>
              <div style="font-size: 28px; font-weight: bold; color: ${anxietyColor};">${data.averageAnxiety}/10</div>
            </div>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Total Sessions</div>
              <div style="font-size: 28px; font-weight: bold; color: #1e293b;">${data.sessionCount}</div>
            </div>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid ${progressColor}; margin-bottom: 24px;">
            <div style="font-size: 14px; color: #64748b; margin-bottom: 4px;">Treatment Progress</div>
            <div style="font-size: 20px; font-weight: bold; color: ${progressColor};">
              ${progressIcon} ${data.treatmentProgress.charAt(0).toUpperCase() + data.treatmentProgress.slice(1)}
            </div>
          </div>

          ${data.crisisAlerts > 0 ? `
          <div style="background: #fef2f2; border: 1px solid #fecaca; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <div style="display: flex; align-items: center; color: #dc2626;">
              <span style="font-size: 18px; margin-right: 8px;">⚠️</span>
              <strong>Crisis Alert: ${data.crisisAlerts} high-anxiety session${data.crisisAlerts > 1 ? 's' : ''} (8+ anxiety level)</strong>
            </div>
          </div>
          ` : ''}

          <!-- Common Triggers -->
          ${data.commonTriggers.length > 0 ? `
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
            <h4 style="margin: 0 0 12px 0; color: #1e293b; font-size: 16px;">🎯 Common Triggers This Week</h4>
            <ul style="margin: 0; padding-left: 20px; color: #64748b;">
              ${data.commonTriggers.map(trigger => `<li style="margin-bottom: 4px;">${trigger}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>

        <!-- CTA -->
        <div style="padding: 24px; background: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px;">
            Access the full patient analytics dashboard for detailed insights and real-time data.
          </p>
          <a href="${Deno.env.get('SUPABASE_URL')}/therapist-portal" 
             style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
            View Full Dashboard
          </a>
        </div>

        <!-- Footer -->
        <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
          <p style="margin: 0;">This report was automatically generated by Tranquiloo App</p>
          <p style="margin: 4px 0 0 0;">
            Questions? Contact us at 
            <a href="mailto:support@tranquiloo-app.com" style="color: #3b82f6;">support@tranquiloo-app.com</a>
            or call +1-385-867-8804
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(handler);