import { supabase } from '@/integrations/supabase/client';
import { downloadPDFReport } from './analyticsExportService';

export const therapistReportService = {
  async shareAnalyticsWithTherapist(): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get therapist information
      const { data: therapistData, error: therapistError } = await supabase
        .from('user_therapists')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (therapistError || !therapistData) {
        return {
          success: false,
          message: 'No active therapist found. Please add therapist information first.'
        };
      }

      if (therapistData.contact_method !== 'email') {
        return {
          success: false,
          message: 'Therapist contact method must be email to send reports.'
        };
      }

      // Generate analytics report
      const reportData = await this.generateAnalyticsHTML();
      
      // Get user profile for patient name
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      const patientName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Patient';

      // Send email via edge function
      const { data, error } = await supabase.functions.invoke('send-therapist-report', {
        body: {
          reportData,
          therapistEmail: therapistData.contact_value,
          patientName,
          therapistName: therapistData.therapist_name,
          reportType: 'analytics'
        },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;

      return {
        success: true,
        message: `Analytics report sent successfully to ${therapistData.therapist_name}`
      };
    } catch (error) {
      console.error('Error sharing analytics with therapist:', error);
      return {
        success: false,
        message: 'Failed to send report to therapist. Please try again.'
      };
    }
  },

  async shareTreatmentResourcesWithTherapist(): Promise<{ success: boolean; message: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get therapist information
      const { data: therapistData, error: therapistError } = await supabase
        .from('user_therapists')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (therapistError || !therapistData) {
        return {
          success: false,
          message: 'No active therapist found. Please add therapist information first.'
        };
      }

      if (therapistData.contact_method !== 'email') {
        return {
          success: false,
          message: 'Therapist contact method must be email to send reports.'
        };
      }

      // Generate treatment resources report
      const treatmentReportData = await this.generateTreatmentResourcesHTML();
      
      // Get user profile for patient name
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      const patientName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Patient';

      // Send email via edge function
      const { data, error } = await supabase.functions.invoke('send-therapist-report', {
        body: {
          reportData: treatmentReportData,
          therapistEmail: therapistData.contact_value,
          patientName,
          therapistName: therapistData.therapist_name,
          reportType: 'treatment'
        },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      if (error) throw error;

      return {
        success: true,
        message: `Treatment resources report sent successfully to ${therapistData.therapist_name}`
      };
    } catch (error) {
      console.error('Error sharing treatment resources with therapist:', error);
      return {
        success: false,
        message: 'Failed to send treatment report to therapist. Please try again.'
      };
    }
  },

  async generateAnalyticsHTML(): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get anxiety analyses
      const { data: analyses } = await supabase
        .from('anxiety_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (!analyses || analyses.length === 0) {
        return '<div style="padding: 24px; text-align: center; color: #64748b;">No anxiety data available for this patient.</div>';
      }

      const avgAnxiety = analyses.reduce((sum, a) => sum + a.anxiety_level, 0) / analyses.length;
      const recentTrends = analyses.slice(0, 7).map(a => a.anxiety_level);
      
      return `
        <div style="padding: 24px;">
          <h2 style="color: #1e293b; margin-bottom: 16px;">Patient Analytics Summary</h2>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
              <h3 style="color: #475569; font-size: 14px; margin: 0 0 8px 0;">Average Anxiety Level</h3>
              <div style="font-size: 24px; font-weight: bold; color: #1e293b;">${avgAnxiety.toFixed(1)}/10</div>
            </div>
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
              <h3 style="color: #475569; font-size: 14px; margin: 0 0 8px 0;">Total Sessions</h3>
              <div style="font-size: 24px; font-weight: bold; color: #1e293b;">${analyses.length}</div>
            </div>
            <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
              <h3 style="color: #475569; font-size: 14px; margin: 0 0 8px 0;">Recent Trend</h3>
              <div style="font-size: 24px; font-weight: bold; color: ${recentTrends[0] > recentTrends[recentTrends.length - 1] ? '#dc2626' : '#16a34a'};">
                ${recentTrends[0] > recentTrends[recentTrends.length - 1] ? '↑' : '↓'}
              </div>
            </div>
          </div>

          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: #475569; margin: 0 0 12px 0;">Recent Anxiety Levels (Last 7 Sessions)</h3>
            <div style="display: flex; gap: 8px; align-items: end; height: 100px;">
              ${recentTrends.map(level => `
                <div style="flex: 1; background: #3b82f6; height: ${level * 10}%; min-height: 4px; border-radius: 2px;"></div>
              `).join('')}
            </div>
          </div>

          <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
            <h3 style="color: #475569; margin: 0 0 12px 0;">Common Triggers</h3>
            <ul style="color: #64748b; margin: 0; padding-left: 20px;">
              ${analyses
                .flatMap(a => a.anxiety_triggers || [])
                .filter((trigger, index, array) => array.indexOf(trigger) === index)
                .slice(0, 5)
                .map(trigger => `<li>${trigger}</li>`)
                .join('')}
            </ul>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error generating analytics HTML:', error);
      return '<div style="padding: 24px; text-align: center; color: #dc2626;">Error generating analytics report.</div>';
    }
  },

  async generateTreatmentResourcesHTML(): Promise<string> {
    // Generate a basic treatment resources report
    return `
      <div style="padding: 24px;">
        <h2 style="color: #1e293b; margin-bottom: 16px;">Treatment Resources & Progress</h2>
        
        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #475569; margin: 0 0 12px 0;">Recommended Treatment Approaches</h3>
          <ul style="color: #64748b; margin: 0; padding-left: 20px;">
            <li>Cognitive Behavioral Therapy (CBT)</li>
            <li>Mindfulness-based interventions</li>
            <li>Exposure therapy for specific phobias</li>
            <li>Progressive muscle relaxation</li>
          </ul>
        </div>

        <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #475569; margin: 0 0 12px 0;">Current Coping Strategies</h3>
          <ul style="color: #64748b; margin: 0; padding-left: 20px;">
            <li>Deep breathing exercises</li>
            <li>Grounding techniques (5-4-3-2-1 method)</li>
            <li>Journaling and thought challenging</li>
            <li>Regular exercise and sleep hygiene</li>
          </ul>
        </div>

        <div style="background: #f8fafc; padding: 16px; border-radius: 8px;">
          <h3 style="color: #475569; margin: 0 0 12px 0;">Areas for Focus</h3>
          <ul style="color: #64748b; margin: 0; padding-left: 20px;">
            <li>Identifying and challenging catastrophic thinking patterns</li>
            <li>Building tolerance for uncertainty</li>
            <li>Developing healthy stress management techniques</li>
            <li>Improving sleep quality and routine</li>
          </ul>
        </div>
      </div>
    `;
  }
};