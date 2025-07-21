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

    const { reportData, therapistEmail, patientName, therapistName, reportType, isConnectionRequest }: TherapistReportRequest = await req.json();

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