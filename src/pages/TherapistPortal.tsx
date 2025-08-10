import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User, Search, Calendar, TrendingUp, Activity, Target, MessageSquare } from 'lucide-react';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { useGoalsData } from '@/hooks/useGoalsData';
import AnalyticsHeader from '@/components/analytics/AnalyticsHeader';
import AnalyticsMetrics from '@/components/analytics/AnalyticsMetrics';
import AnxietyChartsSection from '@/components/analytics/AnxietyChartsSection';
import MonthlyChartsSection from '@/components/analytics/MonthlyChartsSection';
import GoalProgressSection from '@/components/analytics/GoalProgressSection';
import TriggerAnalysisTable from '@/components/analytics/TriggerAnalysisTable';
import TreatmentOutcomes from '@/components/TreatmentOutcomes';
import InterventionSummariesSection from '@/components/analytics/InterventionSummariesSection';
import { ClaudeAnxietyAnalysisWithDate } from '@/services/analyticsService';

interface PatientConnection {
  id: string;
  user_id: string;
  therapist_name: string;
  contact_value: string;
  notes?: string;
  created_at: string;
  patient_profile?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

const TherapistPortal: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [therapistEmail, setTherapistEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [patients, setPatients] = useState<PatientConnection[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchCode, setSearchCode] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  const handleTherapistLogin = async () => {
    if (!therapistEmail.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // For now, allow any email - role verification will be added after migration
      setIsAuthenticated(true);
      toast({
        title: "Access Granted",
        description: "Welcome to the therapist portal",
      });
    } catch (error) {
      console.error('Error checking therapist access:', error);
      toast({
        title: "Error",
        description: "Failed to verify therapist access",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const searchPatients = async () => {
    if (!searchEmail.trim() && !searchCode.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a patient's email or 6-digit code",
        variant: "destructive"
      });
      return;
    }

    console.log('🔍 THERAPIST SEARCH: Starting patient search with:', {
      searchEmail: searchEmail.trim(),
      searchCode: searchCode.trim(),
      therapistEmail,
      timestamp: new Date().toISOString()
    });

    setSearchLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, email, patient_code, role');

      // Search by email if provided
      if (searchEmail.trim()) {
        console.log('🔍 THERAPIST SEARCH: Searching by email:', searchEmail.toLowerCase());
        query = query.eq('email', searchEmail.toLowerCase());
      }
      // Search by 6-digit code if provided
      else if (searchCode.trim()) {
        console.log('🔍 THERAPIST SEARCH: Searching by patient code:', searchCode.trim());
        query = query.eq('patient_code', searchCode.trim());
      }

      const { data: profiles, error } = await query;

      console.log('🔍 THERAPIST SEARCH: Query result:', {
        profiles,
        error,
        profilesCount: profiles?.length || 0
      });

      if (error) throw error;

      if (!profiles || profiles.length === 0) {
        console.log('🔍 THERAPIST SEARCH: No patients found');
        toast({
          title: "No Patients Found",
          description: "No patients found with the provided search criteria",
          variant: "destructive"
        });
        setPatients([]);
        return;
      }

      // Only show patient role users
      const patientProfiles = profiles.filter(profile => profile.role === 'patient');
      
      console.log('🔍 THERAPIST SEARCH: Filtered patient profiles:', {
        originalCount: profiles.length,
        patientCount: patientProfiles.length,
        filteredProfiles: patientProfiles
      });

      if (patientProfiles.length === 0) {
        console.log('🔍 THERAPIST SEARCH: No patient role users found');
        toast({
          title: "No Patients Found",
          description: "No patients found with the provided search criteria",
          variant: "destructive"
        });
        setPatients([]);
        return;
      }

      // Format as PatientConnection for compatibility
      const formattedPatients = patientProfiles.map(profile => ({
        id: profile.id,
        user_id: profile.id,
        therapist_name: therapistEmail,
        contact_value: therapistEmail,
        created_at: new Date().toISOString(),
        patient_profile: {
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email
        }
      }));

      console.log('🔍 THERAPIST SEARCH: Formatted patients:', formattedPatients);

      setPatients(formattedPatients);
      toast({
        title: "Search Complete",
        description: `Found ${patientProfiles.length} patient(s)`,
      });
    } catch (error) {
      console.error('🔍 THERAPIST SEARCH ERROR:', error);
      toast({
        title: "Error",
        description: "Failed to search for patients",
        variant: "destructive"
      });
    } finally {
      setSearchLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Therapist Portal
            </h1>
            <p className="text-gray-600">
              Enter your email to access your patients' progress data
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="therapist-email">Email Address</Label>
              <Input
                id="therapist-email"
                type="email"
                value={therapistEmail}
                onChange={(e) => setTherapistEmail(e.target.value)}
                placeholder="dr.smith@example.com"
                onKeyPress={(e) => e.key === 'Enter' && handleTherapistLogin()}
              />
            </div>
            <Button 
              onClick={handleTherapistLogin} 
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Access Portal'}
            </Button>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Demo Note:</strong> Enter any email address that patients have used to connect with you.
              This portal shows the same analytics and outcomes that patients see in their app.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Therapist Portal</h1>
            <p className="text-gray-600">Logged in as: {therapistEmail}</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              setIsAuthenticated(false);
              setSelectedPatientId(null);
              setTherapistEmail('');
            }}
          >
            Sign Out
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Patient List Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Search className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                Search Patients
              </h2>
            </div>
            
            <div className="space-y-3 mb-6">
              <div>
                <Label htmlFor="search-email">Patient Email</Label>
                <Input
                  id="search-email"
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  placeholder="patient@example.com"
                />
              </div>
              <div>
                <Label htmlFor="search-code">Patient Code</Label>
                <Input
                  id="search-code"
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  placeholder="6-digit code from email"
                  maxLength={6}
                />
              </div>
              <Button 
                onClick={searchPatients} 
                className="w-full"
                disabled={searchLoading}
              >
                {searchLoading ? 'Searching...' : 'Search Patients'}
              </Button>
            </div>

            <div className="flex items-center space-x-2 mb-4">
              <User className="w-5 h-5 text-gray-500" />
              <h3 className="text-lg font-semibold text-gray-900">
                Results ({patients.length})
              </h3>
            </div>
            
            <div className="space-y-3">
              {patients.map((patient) => {
                console.log('🔍 PATIENT DISPLAY DATA:', {
                  patient,
                  patient_profile: patient.patient_profile,
                  first_name: patient.patient_profile?.first_name,
                  last_name: patient.patient_profile?.last_name,
                  email: patient.patient_profile?.email
                });
                
                // Build name from first and last name
                let patientName = '';
                if (patient.patient_profile?.first_name || patient.patient_profile?.last_name) {
                  patientName = `${patient.patient_profile.first_name || ''} ${patient.patient_profile.last_name || ''}`.trim();
                }
                
                // If no name, use email
                if (!patientName && patient.patient_profile?.email) {
                  patientName = patient.patient_profile.email;
                }
                
                // Final fallback
                if (!patientName) {
                  patientName = 'Patient (No Name Available)';
                }
                
                const isSelected = selectedPatientId === patient.user_id;
                
                return (
                  <Card 
                    key={patient.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      console.log('🔍 SELECTING PATIENT:', patient.user_id, patientName);
                      setSelectedPatientId(patient.user_id);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {patientName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Connected {new Date(patient.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400">
                          ID: {patient.user_id}
                        </p>
                        {patient.notes && (
                          <p className="text-xs text-gray-400 mt-1 truncate">
                            {patient.notes}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {selectedPatientId ? (
            <PatientAnalytics patientId={selectedPatientId} />
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a Patient
              </h3>
              <p className="text-gray-500">
                Choose a patient from the sidebar to view their analytics and progress
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Component to show patient analytics (reusing existing components)
const PatientAnalytics: React.FC<{ patientId: string }> = ({ patientId }) => {
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const [analyses, setAnalyses] = useState<ClaudeAnxietyAnalysisWithDate[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        
        console.log('🔍 FETCHING PATIENT DATA FOR:', patientId);
        
        // Fetch patient profile, analyses, messages, and goals ONLY for this specific patient
        const [profileResult, analysesResult, messagesResult, goalsResult] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', patientId).maybeSingle(),
          supabase.from('anxiety_analyses').select('*').eq('user_id', patientId).order('created_at', { ascending: false }),
          supabase.from('chat_messages').select('*').eq('user_id', patientId).order('created_at', { ascending: false }),
          supabase.from('user_goals').select(`
            *,
            goal_progress(*)
          `).eq('user_id', patientId).order('created_at', { ascending: false })
        ]);
        
        console.log('🔍 FETCH RESULTS FOR PATIENT', patientId, {
          profile: profileResult.data,
          analysesCount: analysesResult.data?.length || 0,
          messagesCount: messagesResult.data?.length || 0,
          goalsCount: goalsResult.data?.length || 0
        });

        if (profileResult.error) {
          console.error('🔍 PROFILE ERROR:', profileResult.error);
          throw profileResult.error;
        }
        
        if (!profileResult.data) {
          console.warn('🔍 NO PROFILE FOUND FOR PATIENT:', patientId);
        }
        
        setPatientProfile(profileResult.data);

        // Format analyses data - ONLY for this specific patient
        const formattedAnalyses = analysesResult.data?.filter(analysis => analysis.user_id === patientId).map(analysis => ({
          anxietyLevel: analysis.anxiety_level,
          gad7Score: Math.round(analysis.anxiety_level * 2.1),
          beckAnxietyCategories: ['General Anxiety'],
          dsm5Indicators: analysis.anxiety_triggers || [],
          triggers: analysis.anxiety_triggers || [],
          cognitiveDistortions: [],
          recommendedInterventions: analysis.coping_strategies || [],
          therapyApproach: 'CBT' as const,
          crisisRiskLevel: (analysis.anxiety_level >= 9 ? 'critical' : 
                           analysis.anxiety_level >= 7 ? 'high' : 
                           analysis.anxiety_level >= 5 ? 'moderate' : 'low') as 'low' | 'moderate' | 'high' | 'critical',
          sentiment: (analysis.anxiety_level >= 8 ? 'crisis' :
                     analysis.anxiety_level >= 6 ? 'negative' : 
                     analysis.anxiety_level <= 3 ? 'positive' : 'neutral') as 'positive' | 'neutral' | 'negative' | 'crisis',
          escalationDetected: analysis.anxiety_level >= 8,
          personalizedResponse: analysis.personalized_response || '',
          created_at: analysis.created_at
        })) || [];

        // Filter goals for this specific patient ONLY
        const patientGoals = goalsResult.data?.filter(goal => goal.user_id === patientId).map(goal => ({
          ...goal,
          progress: goal.goal_progress || [],
          currentProgress: goal.goal_progress?.length || 0
        })) || [];
        
        // Fetch intervention summaries for this specific patient ONLY
        const { data: summariesResult } = await supabase
          .from('intervention_summaries')
          .select('*')
          .eq('user_id', patientId)
          .order('week_start', { ascending: false });

        console.log('🔍 FINAL PATIENT DATA:', {
          patientId,
          analysesCount: formattedAnalyses.length,
          goalsCount: patientGoals.length,
          summariesCount: summariesResult?.length || 0,
          actualGoals: patientGoals,
          actualAnalyses: formattedAnalyses,
          actualSummaries: summariesResult
        });

        setAnalyses(formattedAnalyses);
        setMessages(messagesResult.data?.filter(msg => msg.user_id === patientId) || []);
        setGoals(patientGoals);
        setSummaries(summariesResult?.filter(summary => summary.user_id === patientId) || []);

      } catch (error) {
        console.error('Error fetching patient data:', error);
        toast({
          title: "Error",
          description: "Failed to load patient data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId]);

  // Helper functions for downloading reports
  const handleDownloadHistory = async () => {
    try {
      // Create a simple text-based report for now
      let reportText = `Patient Analytics Report for ${patientName}\n\n`;
      reportText += `Generated: ${new Date().toLocaleDateString()}\n\n`;
      reportText += `Total Sessions: ${totalEntries}\n`;
      reportText += `Average Anxiety Level: ${averageAnxiety.toFixed(1)}/10\n`;
      reportText += `Most Common Trigger: ${mostCommonTrigger[0]} (${mostCommonTrigger[1]} times)\n\n`;
      
      if (hasAnalysesData) {
        reportText += "Recent Anxiety Data:\n";
        analyses.slice(0, 20).forEach((analysis, index) => {
          reportText += `${index + 1}. ${new Date(analysis.created_at).toLocaleDateString()}: Level ${analysis.anxietyLevel}/10\n`;
          if (analysis.triggers && analysis.triggers.length > 0) {
            reportText += `   Triggers: ${analysis.triggers.join(', ')}\n`;
          }
        });
      }

      // Create blob and download
      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${patientName.replace(/\s+/g, '_')}_analytics_report.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started",
        description: "Patient analytics report download initiated",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download patient history",
        variant: "destructive"
      });
    }
  };

  const handleDownloadSummary = async () => {
    try {
      // Generate conversation summary from messages
      let summaryText = `Patient Conversation Summary for ${patientName}\n\n`;
      summaryText += `Total Messages: ${messages.length}\n`;
      summaryText += `Anxiety Sessions: ${analyses.length}\n`;
      summaryText += `Average Anxiety Level: ${averageAnxiety.toFixed(1)}/10\n\n`;
      
      if (messages.length > 0) {
        summaryText += "Recent Conversations:\n";
        const recentMessages = messages.slice(0, 10);
        recentMessages.forEach((msg, index) => {
          summaryText += `${index + 1}. ${new Date(msg.created_at).toLocaleDateString()}: ${msg.content.substring(0, 100)}...\n`;
        });
      }

      // Create blob and download
      const blob = new Blob([summaryText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${patientName.replace(/\s+/g, '_')}_conversation_summary.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Download Started", 
        description: "Conversation summary download initiated",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download conversation summary",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading patient data...</p>
        </div>
      </div>
    );
  }

  // Don't return early for no analyses - still show patient info
  const hasAnalysesData = analyses.length > 0;

  // Calculate analytics metrics only if we have data
  const totalEntries = hasAnalysesData ? analyses.length : 0;
  const averageAnxiety = hasAnalysesData ? 
    analyses.reduce((sum, a) => sum + a.anxietyLevel, 0) / analyses.length : 0;
  const allTriggers = hasAnalysesData ? analyses.flatMap(a => a.triggers || []) : [];
  const triggerCounts = allTriggers.reduce((acc, trigger) => {
    acc[trigger] = (acc[trigger] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const mostCommonTrigger = Object.entries(triggerCounts)
    .sort(([,a], [,b]) => b - a)[0] || ['No data yet', 0];

  // Process data for charts - empty if no data
  const triggerData = hasAnalysesData ? Object.entries(triggerCounts).map(([trigger, count], index) => ({
    trigger,
    count,
    avgSeverity: analyses.filter(a => a.triggers?.includes(trigger))
      .reduce((sum, a) => sum + a.anxietyLevel, 0) / count,
    color: `hsl(${index * 45}, 70%, 50%)`,
    category: 'General',
    description: `Trigger: ${trigger}`,
    whyExplanation: `This trigger appeared ${count} times in the patient's sessions.`
  })) : [];

  const severityRanges = ['1-2', '3-4', '5-6', '7-8', '9-10'];
  const severityDistribution = hasAnalysesData ? severityRanges.map((range, index) => {
    const [min, max] = range.split('-').map(Number);
    const count = analyses.filter(a => a.anxietyLevel >= min && a.anxietyLevel <= max).length;
    return {
      range,
      count,
      color: `hsl(${index * 72}, 60%, 50%)`
    };
  }) : [];

  const patientName = patientProfile ? 
    `${patientProfile.first_name || ''} ${patientProfile.last_name || ''}`.trim() || 'Patient' : 
    'Patient';

  return (
    <div className="space-y-8">
      {/* Patient Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{patientName} - Analytics</h2>
            <p className="text-gray-600">{patientProfile?.email}</p>
          </div>
        </div>
        <Badge variant="secondary">
          Patient ID: {patientId.substring(0, 8)}
        </Badge>
      </div>

      {/* Analytics Header with Download Options */}
      <AnalyticsHeader 
        analysesCount={analyses.length}
        onDownloadHistory={handleDownloadHistory}
        onShareWithTherapist={() => {}} // Not applicable for therapist view
        onDownloadSummary={handleDownloadSummary}
      />
      
      {hasAnalysesData ? (
        <>
          {/* Analytics Metrics */}
          <AnalyticsMetrics 
            totalEntries={totalEntries}
            averageAnxiety={averageAnxiety}
            mostCommonTrigger={{ 
              trigger: mostCommonTrigger[0],
              count: mostCommonTrigger[1]
            }}
          />

          {/* Charts Section - Only patient's data */}
          <AnxietyChartsSection 
            triggerData={triggerData}
            severityDistribution={severityDistribution}
            analyses={analyses}
          />

          {/* Monthly Charts Section - Only patient's data */}
          <MonthlyChartsSection 
            analyses={analyses}
          />

          {/* Treatment Outcomes - Only patient's data */}
          <TreatmentOutcomes 
            analyses={analyses}
          />

          {/* Trigger Analysis Table - Only patient's data */}
          <TriggerAnalysisTable 
            triggerData={triggerData}
            totalEntries={totalEntries}
          />
        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Anxiety Data Yet
          </h3>
          <p className="text-gray-500">
            This patient hasn't started tracking their anxiety yet. Data will appear here once they begin using the anxiety companion.
          </p>
        </div>
      )}

      {/* Goal Progress Section - Show even if no anxiety data */}
      <div className="space-y-6">
        <div className="flex items-center space-x-2 mb-4">
          <Target className="w-5 h-5 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-900">Goal Progress Overview</h3>
        </div>
        
        {goals.length > 0 ? (
          <GoalProgressSection 
            goals={goals}
          />
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-gray-500">No goals set yet</p>
          </div>
        )}

        {/* Weekly Intervention Summaries - Show even if no anxiety data */}
        <div className="flex items-center space-x-2 mb-4">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-900">Weekly Intervention Summaries</h3>
        </div>
        
        {summaries.length > 0 ? (
          <InterventionSummariesSection 
            summaries={summaries}
          />
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-gray-500">No intervention summaries available yet</p>
          </div>
        )}
      </div>

      {/* Therapist Note */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Therapist Note:</strong> This view shows the same analytics and treatment outcomes 
          that your patient sees in their mobile app. Data is updated in real-time as the patient 
          interacts with the anxiety companion.
        </p>
      </div>
    </div>
  );
};

export default TherapistPortal;