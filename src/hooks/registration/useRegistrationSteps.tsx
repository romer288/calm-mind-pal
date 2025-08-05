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
    const checkAuthAndAdvance = async () => {
      if (step === 'registration') {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Only advance if user is authenticated AND email is confirmed
        if (session?.user && session.user.email_confirmed_at) {
          console.log('User authenticated and email confirmed, checking role...');
          
          // Check if this is a therapist from OAuth
          const pendingRole = localStorage.getItem('pending_user_role');
          if (pendingRole) {
            localStorage.removeItem('pending_user_role');
            
            // Update the user's profile with the role (temporarily commented until migration is applied)
            // try {
            //   const { error } = await supabase
            //     .from('profiles')
            //     .update({ role: pendingRole })
            //     .eq('id', session.user.id);
            //   
            //   if (error) {
            //     console.error('Error updating user role:', error);
            //   } else {
            //     console.log('Successfully updated user role to:', pendingRole);
            //   }
            // } catch (error) {
            //   console.error('Error updating profile:', error);
            // }
            
            // Store role in user metadata and let Registration component handle redirect
            if (pendingRole === 'therapist') {
              console.log('Therapist detected via localStorage, will redirect after registration complete');
            }
          }
          
          // Check if user is a therapist and redirect accordingly (temporarily commented until migration is applied)
          // const { data: profile } = await supabase
          //   .from('profiles')
          //   .select('role')
          //   .eq('id', session.user.id)
          //   .single();
          //   
          // if (profile?.role === 'therapist') {
          //   console.log('Therapist detected, redirecting to therapist portal');
          //   navigate('/therapist-portal');
          //   return;
          // }
          
          console.log('Patient user, advancing to registration-complete');
          setStep('registration-complete');
        }
      }
    };
    
    checkAuthAndAdvance();
  }, [step, navigate]);

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