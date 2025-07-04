
import { useState } from 'react';
import { FormData } from '@/types/registration';
import { useRegistrationAuth } from '@/hooks/registration/useRegistrationAuth';
import { useRegistrationSteps } from '@/hooks/registration/useRegistrationSteps';

export const useRegistrationFlow = () => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  const { isLoading, handleGoogleSignUp, handleEmailSignUp } = useRegistrationAuth();
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
    if (result.success) {
      setStep('registration-complete');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started with data:', { 
      email: formData.email, 
      firstName: formData.firstName,
      agreeToTerms: formData.agreeToTerms 
    });

    const result = await handleEmailSignUp(formData);
    if (result.success) {
      setStep('registration-complete');
    }
  };

  const handleContinueToTherapistLinking = () => {
    setStep('therapist-linking');
  };

  return {
    step,
    formData,
    isLoading,
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
