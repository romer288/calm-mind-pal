import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { RegistrationStep, TherapistInfo } from '@/types/registration';
import { supabase } from '@/integrations/supabase/client';
import { goalsService } from '@/services/goalsService';

export const useRegistrationSteps = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState<RegistrationStep>('registration');

  // Check URL params for step
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stepParam = urlParams.get('step');
    if (stepParam && ['registration-complete', 'therapist-linking', 'assessment', 'complete'].includes(stepParam)) {
      setStep(stepParam as RegistrationStep);
    }
  }, []);

  // Auto-advance to registration-complete when user becomes authenticated during registration
  useEffect(() => {
    let mounted = true;
    
    const checkAuthAndAdvance = async () => {
      if (step === 'registration' && mounted) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session:', error);
            return;
          }
          
          // For Google OAuth, email is automatically confirmed, so check for user existence
          if (session?.user && mounted) {
            console.log('User authenticated, advancing to registration-complete');
            setStep('registration-complete');
          }
        } catch (error) {
          console.error('Error in checkAuthAndAdvance:', error);
        }
      }
    };
    
    // Use a small delay to avoid race conditions with auth state changes
    const timeoutId = setTimeout(checkAuthAndAdvance, 100);
    
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, [step]);

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