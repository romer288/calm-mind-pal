import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { RegistrationStep, TherapistInfo } from '@/types/registration';
import { supabase } from '@/integrations/supabase/client';
import { goalsService } from '@/services/goalsService';

export const useRegistrationSteps = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<RegistrationStep>('registration');
  const initialCheckDone = useRef(false);

  // Check URL params for step
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stepParam = urlParams.get('step');
    if (stepParam && ['registration-complete', 'therapist-linking', 'assessment', 'complete'].includes(stepParam)) {
      setStep(stepParam as RegistrationStep);
    }
  }, []);

  // Ensure new OAuth users have profiles and roles
  const ensureProfileRow = async (user: any) => {
    try {
      console.log('🔍 DETAILED: Checking/creating profile for user:', user.id);
      
      // Get role from multiple sources with detailed logging
      const urlParams = new URLSearchParams(window.location.search);
      const urlRole = urlParams.get('role') as 'patient' | 'therapist';
      console.log('🔍 URL ROLE CHECK:', urlRole, 'from URL:', window.location.href);
      
      const localStorageRole = localStorage.getItem('pending_user_role') as 'patient' | 'therapist';
      const sessionStorageRole = sessionStorage.getItem('pending_user_role') as 'patient' | 'therapist';
      
      // Check OAuth role data with timestamp
      let oauthRole: 'patient' | 'therapist' | null = null;
      try {
        const oauthData = localStorage.getItem('oauth_role_data') || sessionStorage.getItem('oauth_role_data');
        if (oauthData) {
          const parsed = JSON.parse(oauthData);
          // Only use if it's less than 5 minutes old
          if (Date.now() - parsed.timestamp < 5 * 60 * 1000) {
            oauthRole = parsed.role;
          }
        }
      } catch (e) {
        console.log('Error parsing OAuth role data');
      }
      
      // Parse OAuth state for role
      let stateRole: 'patient' | 'therapist' | null = null;
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const state = hashParams.get('state');
        if (state) {
          const stateData = JSON.parse(state);
          stateRole = stateData.role;
        }
      } catch (e) {
        console.log('No OAuth state found or invalid JSON');
      }
      
      // CRITICAL: URL role parameter takes ABSOLUTE priority for OAuth redirects
      const pendingRole = urlRole || oauthRole || localStorageRole || sessionStorageRole || stateRole || 'patient';
      
      console.log('📱 DETAILED: Role sources:', {
        urlParam: urlRole,
        oauthRole: oauthRole,
        localStorage: localStorageRole,
        sessionStorage: sessionStorageRole,
        stateRole: stateRole,
        finalRole: pendingRole,
        currentUrl: window.location.href,
        PRIORITY_CHECK: `URL param '${urlRole}' should override everything else`
      });
      
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      console.log('🔍 DETAILED: Profile fetch result:', { existingProfile, fetchError });

      if (!existingProfile) {
        console.log('✨ DETAILED: No profile found, creating one with role:', pendingRole);
        
        // Create profile with role
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '',
            last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            role: pendingRole
          });

        if (profileError) {
          console.error('❌ DETAILED: Error creating profile:', profileError);
          return false;
        }

        console.log('✅ DETAILED: Profile created successfully with role:', pendingRole);
      } else {
        console.log('👤 DETAILED: Profile exists with current role:', existingProfile.role);
        console.log('🔄 DETAILED: Comparing roles - current:', existingProfile.role, 'pending:', pendingRole);
        
        // Only update role if there's an explicit new role being set (not just the default)
        const hasExplicitRole = urlRole || oauthRole || localStorageRole || sessionStorageRole || stateRole;
        
        if (hasExplicitRole && existingProfile.role !== pendingRole) {
          console.log(`🔄 DETAILED: Updating role from ${existingProfile.role} to ${pendingRole} (explicit role set)`);
          
          const { error: updateError, data: updateData } = await supabase
            .from('profiles')
            .update({ role: pendingRole })
            .eq('id', user.id)
            .select()
            .single();

          console.log('🔄 DETAILED: Update result:', { updateError, updateData });

          if (updateError) {
            console.error('❌ DETAILED: Error updating role:', updateError);
            return false;
          }

          console.log('✅ DETAILED: Profile role updated successfully to:', pendingRole);
        } else {
          console.log('🔒 DETAILED: No explicit role set or role unchanged, keeping existing role:', existingProfile.role);
        }
      }

      // Only clean up localStorage/sessionStorage if everything succeeded
      console.log('🧹 DETAILED: Cleaning up localStorage and sessionStorage');
      localStorage.removeItem('pending_user_role');
      sessionStorage.removeItem('pending_user_role');
      localStorage.removeItem('oauth_role_data');
      sessionStorage.removeItem('oauth_role_data');
      
      return true;
    } catch (error) {
      console.error('💥 DETAILED: Error in ensureProfileRow:', error);
      // Don't clean up localStorage on error - keep role for retry
      return false;
    }
  };

  // Auto-advance to registration-complete when user becomes authenticated during registration
  useEffect(() => {
    console.log('🎯 Setting up auth listener for step:', step);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change event:', event, 'Session exists:', !!session, 'User ID:', session?.user?.id);
      console.log('📍 Current step:', step, 'Initial check done:', initialCheckDone.current);
      
      // For debugging: show what's in localStorage and sessionStorage
      const pendingRole = localStorage.getItem('pending_user_role');
      const debugLog = sessionStorage.getItem('oauth_debug_log');
      console.log('💾 Pending role in localStorage:', pendingRole);
      console.log('🔍 OAuth debug log from sessionStorage:', debugLog);
      
      // Mark that we've seen the initial session check
      if (event === 'INITIAL_SESSION') {
        console.log('🎬 Initial session check completed');
        initialCheckDone.current = true;
        
        // If we have a session on initial load, this could be a returning OAuth user
        if (session?.user) {
          console.log('👤 Found existing session on initial load');
        } else {
          console.log('🚫 No session found on initial load');
        }
      }
      
      // Handle SIGNED_IN event (from OAuth redirect)
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ DETAILED: User signed in successfully via OAuth');
        console.log('📧 DETAILED: User email:', session.user.email);
        console.log('🏷️ DETAILED: User metadata:', session.user.user_metadata);
        console.log('🆔 DETAILED: User ID:', session.user.id);
        console.log('📱 DETAILED: Current localStorage role:', localStorage.getItem('pending_user_role'));
        console.log('📱 DETAILED: Current sessionStorage role:', sessionStorage.getItem('pending_user_role'));
        
        console.log('🔄 DETAILED: About to call ensureProfileRow...');
        try {
          const profileCreated = await ensureProfileRow(session.user);
          console.log('✅ DETAILED: ensureProfileRow returned:', profileCreated);
          
          if (profileCreated) {
            console.log('🎯 DETAILED: Profile confirmed, advancing to registration-complete');
            setStep('registration-complete');
          } else {
            console.error('❌ DETAILED: Failed to create profile, staying on registration');
            toast({
              title: "Setup Error",
              description: "There was an issue setting up your account. Please try again.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('💥 DETAILED: Error calling ensureProfileRow:', error);
          toast({
            title: "Profile Creation Error",
            description: "Failed to create your profile. Please try again.",
            variant: "destructive"
          });
        }
      }
      
      // Handle SIGNED_OUT event
      if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        if (initialCheckDone.current) {
          console.log('🔄 Resetting to registration step');
          setStep('registration');
        } else {
          console.log('🎬 Ignoring initial SIGNED_OUT event');
        }
      }
    });

    return () => {
      console.log('🧹 Cleaning up auth state subscription');
      subscription.unsubscribe();
    };
  }, [step, toast]);

  const handleTherapistLinking = (hasTherapist: boolean, therapistInfo?: TherapistInfo) => {
    console.log('Therapist linking completed:', { hasTherapist, therapistInfo });
    
    if (hasTherapist && therapistInfo) {
      toast({
        title: "Therapist Connected",
        description: `Successfully connected with ${therapistInfo.name}. Now let's complete your assessment.`,
      });
    }
    
    console.log('Proceeding to assessment');
    setStep('assessment');
  };

  // Removed automatic goal creation - goals should only be created by user choice

  const handleAssessmentComplete = async (results: any) => {
    console.log('Clinical assessment results:', results);
    
    toast({
      title: "Assessment Complete",
      description: "Your clinical assessment has been completed. Welcome to Anxiety Companion!",
    });
    setStep('complete');
  };

  const handleAssessmentSkip = async () => {
    console.log('Assessment skipped');
    
    toast({
      title: "Assessment Skipped",
      description: "You can take the assessment later from your dashboard. Welcome to Anxiety Companion!",
    });
    setStep('complete');
  };

  const handleComplete = () => {
    navigate('/dashboard');
  };

  const moveToTherapistLinking = () => {
    setStep('therapist-linking');
  };

  return {
    step,
    setStep,
    handleTherapistLinking,
    handleAssessmentComplete,
    handleAssessmentSkip,
    handleComplete,
    moveToTherapistLinking
  };
};