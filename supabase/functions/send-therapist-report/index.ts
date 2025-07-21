import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TherapistReportRequest {
  reportData: string; // HTML content of the report
  therapistEmail: string;
  patientName: string;
  reportType: 'analytics' | 'treatment';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { authorization: authHeader },
        },
      }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { reportData, therapistEmail, patientName, reportType }: TherapistReportRequest = await req.json();

    // Get user profile for sender name
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const senderName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Patient';
    const reportTitle = reportType === 'analytics' ? 'Analytics Report' : 'Treatment Resources Report';

    const emailResponse = await resend.emails.send({
      from: "Anxiety Companion <noreply@resend.dev>",
      to: [therapistEmail],
      subject: `${reportTitle} from ${senderName}`,
      html: `
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
      `,
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