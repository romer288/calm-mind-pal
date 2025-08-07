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
      const localStorageRole = localStorage.getItem('pending_user_role') as 'patient' | 'therapist';
      const urlParams = new URLSearchParams(window.location.search);
      const urlRole = urlParams.get('role') as 'patient' | 'therapist';
      const pendingRole = localStorageRole || urlRole || 'patient';
      
      console.log('📱 DETAILED: Role sources:', {
        localStorage: localStorageRole,
        urlParam: urlRole,
        finalRole: pendingRole,
        allLocalStorageKeys: Object.keys(localStorage),
        currentUrl: window.location.href
      });
      
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

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
        
        // If profile exists but role is different, update it
        if (existingProfile.role !== pendingRole) {
          console.log(`🔄 DETAILED: Updating role from ${existingProfile.role} to ${pendingRole}`);
          
          const { error: updateError, data: updateData } = await supabase
            .from('profiles')
            .update({ role: pendingRole })
            .eq('id', user.id)
            .select();

          console.log('🔄 DETAILED: Update result:', { updateError, updateData });

          if (updateError) {
            console.error('❌ DETAILED: Error updating profile role:', updateError);
            return false;
          }
          
          console.log('✅ DETAILED: Profile role updated successfully to:', pendingRole);
        } else {
          console.log('✅ DETAILED: Profile role is already correct:', existingProfile.role);
        }
      }

      // Clean up localStorage
      console.log('🧹 DETAILED: Cleaning up localStorage');
      localStorage.removeItem('pending_user_role');
      
      return true;
    } catch (error) {
      console.error('💥 DETAILED: Error in ensureProfileRow:', error);
      return false;
    }
  };

  // Auto-advance to registration-complete when user becomes authenticated during registration
  useEffect(() => {
    console.log('🎯 Setting up auth listener for step:', step);
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change event:', event, 'Session exists:', !!session, 'User ID:', session?.user?.id);
      console.log('📍 Current step:', step, 'Initial check done:', initialCheckDone.current);
      
      // For debugging: show what's in localStorage
      const pendingRole = localStorage.getItem('pending_user_role');
      console.log('💾 Pending role in localStorage:', pendingRole);
      
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
        console.log('✅ User signed in successfully via OAuth');
        console.log('📧 User email:', session.user.email);
        console.log('🏷️ User metadata:', session.user.user_metadata);
        
        // Ensure profile exists for OAuth users
        const profileCreated = await ensureProfileRow(session.user);
        
        if (profileCreated) {
          console.log('🎯 Profile confirmed, advancing to registration-complete');
          setStep('registration-complete');
        } else {
          console.error('❌ Failed to create profile, staying on registration');
          toast({
            title: "Setup Error",
            description: "There was an issue setting up your account. Please try again.",
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