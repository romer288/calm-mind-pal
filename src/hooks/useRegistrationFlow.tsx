
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormData } from '@/types/registration';
import { useRegistrationAuth } from '@/hooks/registration/useRegistrationAuth';
import { useRegistrationSteps } from '@/hooks/registration/useRegistrationSteps';
import { supabase } from '@/integrations/supabase/client';

export const useRegistrationFlow = () => {
  const navigate = useNavigate();
  const [isSignInMode, setIsSignInMode] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    role: 'patient'
  });

  const { isLoading, handleGoogleSignUp, handleEmailSignUp, handleEmailSignIn } = useRegistrationAuth();
  const { 
    step, 
    setStep,
    handleTherapistLinking, 
    handleAssessmentComplete, 
    handleAssessmentSkip, 
    handleComplete,
    moveToTherapistLinking
  } = useRegistrationSteps();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGoogleSignUpClick = async () => {
    const result = await handleGoogleSignUp(formData.role);
    
    // For Google sign-in, check if user role is therapist and redirect accordingly
    if (result.success && isSignInMode) {
      console.log('Google sign in successful, checking user role...');
      
      // Check for pending role from OAuth
      const pendingRole = localStorage.getItem('pending_user_role');
      if (pendingRole === 'therapist') {
        localStorage.removeItem('pending_user_role');
        console.log('Therapist detected, redirecting to therapist portal');
        navigate('/therapist-portal');
      } else {
        console.log('Patient user, redirecting to dashboard');
        navigate('/dashboard');
      }
    }
    // For Google sign-up, step will be automatically advanced by useRegistrationSteps when auth completes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignInMode) {
      console.log('Sign in submission started with email:', formData.email);
      const result = await handleEmailSignIn(formData.email, formData.password);
      
      // For email sign-in, check user session to determine redirect
      if (result.success) {
        console.log('Sign in successful, checking user role...');
        
        // Get the current session to check user metadata
        const { data: { session } } = await supabase.auth.getSession();
        
        // Check if user has therapist role in their metadata (from registration)
        if (session?.user?.user_metadata?.role === 'therapist') {
          console.log('Therapist detected from user metadata, redirecting to therapist portal');
          navigate('/therapist-portal');
        } else {
          console.log('Patient user, redirecting to dashboard');
          navigate('/dashboard');
        }
      }
    } else {
      console.log('Form submission started with data:', { 
        email: formData.email, 
        firstName: formData.firstName,
        agreeToTerms: formData.agreeToTerms 
      });
      const result = await handleEmailSignUp(formData);
      // Step will be automatically advanced by useRegistrationSteps when auth completes
    }
  };

  const handleContinueToTherapistLinking = () => {
    setStep('therapist-linking');
  };

  return {
    step,
    formData,
    isLoading,
    isSignInMode,
    setIsSignInMode,
    handleInputChange,
    handleGoogleSignUp: handleGoogleSignUpClick,
    handleSubmit,
    handleContinueToTherapistLinking,
    handleTherapistLinking,
    handleAssessmentComplete,
    handleAssessmentSkip,
    handleComplete
  };
};
