
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormData } from '@/types/registration';
import { useRegistrationAuth } from '@/hooks/registration/useRegistrationAuth';
import { useRegistrationSteps } from '@/hooks/registration/useRegistrationSteps';

export const useRegistrationFlow = () => {
  const navigate = useNavigate();
  const [isSignInMode, setIsSignInMode] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
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
    const result = await handleGoogleSignUp();
    
    // For Google sign-in, redirect to dashboard on success
    if (result.success && isSignInMode) {
      console.log('Google sign in successful, redirecting to dashboard');
      navigate('/dashboard');
    }
    // For Google sign-up, step will be automatically advanced by useRegistrationSteps when auth completes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignInMode) {
      console.log('Sign in submission started with email:', formData.email);
      const result = await handleEmailSignIn(formData.email, formData.password);
      
      // Navigate to dashboard on successful sign-in
      if (result.success) {
        console.log('Sign in successful, redirecting to dashboard');
        navigate('/dashboard');
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
