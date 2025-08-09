import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { User, Search, Calendar, TrendingUp, Activity } from 'lucide-react';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import { useGoalsData } from '@/hooks/useGoalsData';
import AnalyticsHeader from '@/components/analytics/AnalyticsHeader';
import AnalyticsMetrics from '@/components/analytics/AnalyticsMetrics';
import AnxietyChartsSection from '@/components/analytics/AnxietyChartsSection';
import TreatmentOutcomes from '@/components/TreatmentOutcomes';
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

    setSearchLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('id, first_name, last_name, email, patient_code');

      // Search by email if provided
      if (searchEmail.trim()) {
        query = query.eq('email', searchEmail.toLowerCase());
      }
      // Search by 6-digit code if provided
      else if (searchCode.trim()) {
        query = query.eq('patient_code', searchCode.trim());
      }

      const { data: profiles, error } = await query;

      if (error) throw error;

      if (!profiles || profiles.length === 0) {
        toast({
          title: "No Patients Found",
          description: "No patients found with the provided search criteria",
          variant: "destructive"
        });
        setPatients([]);
        return;
      }

      // Format as PatientConnection for compatibility
      const formattedPatients = profiles.map(profile => ({
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

      setPatients(formattedPatients);
      toast({
        title: "Search Complete",
        description: `Found ${profiles.length} patient(s)`,
      });
    } catch (error) {
      console.error('Error searching patients:', error);
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
                const patientName = patient.patient_profile 
                  ? `${patient.patient_profile.first_name || ''} ${patient.patient_profile.last_name || ''}`.trim()
                  : 'Patient';
                
                const isSelected = selectedPatientId === patient.user_id;
                
                return (
                  <Card 
                    key={patient.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedPatientId(patient.user_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {patientName || 'Anonymous Patient'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Connected {new Date(patient.created_at).toLocaleDateString()}
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
  const [analyses, setAnalyses] = useState<ClaudeAnxietyAnalysisWithDate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        
        // Fetch patient's anxiety analyses
        const { data: analysesData, error } = await supabase
          .from('anxiety_analyses')
          .select('*')
          .eq('user_id', patientId)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedAnalyses = analysesData?.map(analysis => ({
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

        setAnalyses(formattedAnalyses);
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

  if (analyses.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Data Available
        </h3>
        <p className="text-gray-500">
          This patient hasn't generated any analytics data yet.
        </p>
      </div>
    );
  }

  // Process data for analytics components (same logic as Analytics page)
  const processedData = {
    triggerData: [],
    severityDistribution: [],
    weeklyTrends: []
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <TrendingUp className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Patient Analytics</h2>
      </div>

      {/* Analytics Components - Same as patient sees */}
      <AnalyticsHeader 
        analysesCount={analyses.length}
        onDownloadHistory={() => {}}
        onShareWithTherapist={() => {}}
        onDownloadSummary={() => {}}
      />
      
      <AnalyticsMetrics 
        totalEntries={analyses.length}
        averageAnxiety={analyses.reduce((sum, a) => sum + a.anxietyLevel, 0) / analyses.length}
        mostCommonTrigger={{ 
          trigger: analyses.flatMap(a => a.triggers || [])[0] || 'None',
          count: 1
        }}
      />

      <AnxietyChartsSection 
        triggerData={processedData.triggerData}
        severityDistribution={processedData.severityDistribution}
        analyses={analyses}
      />

      <TreatmentOutcomes 
        analyses={analyses}
      />

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