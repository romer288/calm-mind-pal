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
      console.log('Checking/creating profile for user:', user.id);
      
      // Check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        console.log('No profile found, creating one...');
        
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email,
            first_name: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '',
            last_name: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || ''
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          return false;
        }

        // Clean up localStorage
        localStorage.removeItem('pending_user_role');
        
        console.log('Profile created successfully');
        return true;
      }
      
      console.log('Profile already exists');
      return true;
    } catch (error) {
      console.error('Error ensuring profile row:', error);
      return false;
    }
  };

  // Auto-advance to registration-complete when user becomes authenticated during registration
  useEffect(() => {
    if (step !== 'registration') return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change in useRegistrationSteps:', event, !!session, 'initialCheckDone:', initialCheckDone.current);
      
      // Ignore the first SIGNED_OUT event that fires before Supabase finishes checking localStorage
      if (event === 'SIGNED_OUT' && !initialCheckDone.current) {
        console.log('Ignoring initial SIGNED_OUT event');
        return;
      }
      
      // Mark that we've seen the initial session check
      if (event === 'INITIAL_SESSION') {
        initialCheckDone.current = true;
      }
      
      // Advance on both SIGNED_IN and INITIAL_SESSION (for OAuth returns)
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user && step === 'registration') {
        console.log('User authenticated via auth state change, ensuring profile exists...');
        
        // Ensure profile exists for OAuth users
        const profileCreated = await ensureProfileRow(session.user);
        
        if (profileCreated) {
          console.log('Profile confirmed, advancing to registration-complete');
          setStep('registration-complete');
        } else {
          console.error('Failed to create profile, staying on registration');
          toast({
            title: "Setup Error",
            description: "There was an issue setting up your account. Please try again.",
            variant: "destructive"
          });
        }
      }
      
      // Reset on legitimate sign out (after initial check is done)
      if (event === 'SIGNED_OUT' && initialCheckDone.current) {
        console.log('User signed out after initial check, resetting to registration');
        setStep('registration');
      }
    });

    return () => subscription.unsubscribe();
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