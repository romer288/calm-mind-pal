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
          console.log('User authenticated and email confirmed, advancing to registration-complete');
          setStep('registration-complete');
        }
      }
    };
    
    checkAuthAndAdvance();
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

  const createDefaultGoals = async (assessmentData?: any) => {
    try {
      const recommendedGoals = await goalsService.generateRecommendedGoals(assessmentData);
      
      // Create the first few recommended goals automatically
      for (const goalData of recommendedGoals.slice(0, 3)) {
        await goalsService.createGoal(goalData);
      }
      
      console.log('Default goals created successfully');
    } catch (error) {
      console.error('Error creating default goals:', error);
    }
  };

  const handleAssessmentComplete = async (results: any) => {
    console.log('Clinical assessment results:', results);
    
    // Create goals based on assessment results
    await createDefaultGoals(results);
    
    toast({
      title: "Assessment Complete",
      description: "Your clinical assessment has been completed and goals created. Welcome to Anxiety Companion!",
    });
    setStep('complete');
  };

  const handleAssessmentSkip = async () => {
    console.log('Assessment skipped');
    
    // Create default goals even when assessment is skipped
    await createDefaultGoals();
    
    toast({
      title: "Assessment Skipped",
      description: "Default goals created for you. You can take the assessment later from your dashboard. Welcome to Anxiety Companion!",
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