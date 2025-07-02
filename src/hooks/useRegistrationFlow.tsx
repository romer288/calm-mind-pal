
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export const useRegistrationFlow = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<'registration' | 'therapist-linking' | 'assessment' | 'complete'>('registration');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false
  });

  // Check URL params for step
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stepParam = urlParams.get('step');
    if (stepParam && ['therapist-linking', 'assessment', 'complete'].includes(stepParam)) {
      setStep(stepParam as any);
    }
  }, []);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      toast({
        title: "First Name Required",
        description: "Please enter your first name.",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.lastName.trim()) {
      toast({
        title: "Last Name Required", 
        description: "Please enter your last name.",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return false;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive"
      });
      return false;
    }

    if (!formData.agreeToTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the Terms of Service and Privacy Policy.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleGoogleSignUp = async () => {
    try {
      console.log('Starting Google sign up');
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/registration?step=therapist-linking'
        }
      });

      console.log('Google OAuth response:', { data, error });

      if (error) {
        console.error('Google sign up error:', error);
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive"
        });
        setIsLoading(false);
      } else {
        setStep('therapist-linking');
      }
    } catch (error) {
      console.error('Unexpected error during Google sign up:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Form submission started with data:', { 
      email: formData.email, 
      firstName: formData.firstName,
      agreeToTerms: formData.agreeToTerms 
    });

    if (!validateForm()) return;

    try {
      setIsLoading(true);
      console.log('Attempting email signup...');
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin + '/registration?step=therapist-linking',
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName
          }
        }
      });

      console.log('Email signup response:', { data, error });

      if (error) {
        console.error('Email registration error:', error);
        toast({
          title: "Registration Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('Registration successful, moving to therapist linking');
        toast({
          title: "Registration Successful",
          description: "Account created! Let's connect you with care.",
        });
        setStep('therapist-linking');
      }
    } catch (error) {
      console.error('Unexpected error during email registration:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTherapistLinking = (hasTherapist: boolean, therapistInfo?: any) => {
    console.log('Therapist linking completed:', { hasTherapist, therapistInfo });
    
    if (hasTherapist && therapistInfo) {
      toast({
        title: "Therapist Connected",
        description: `Successfully connected with ${therapistInfo.name}. Welcome to Anxiety Companion!`,
      });
      navigate('/dashboard');
    } else {
      console.log('No therapist linked, proceeding to assessment');
      setStep('assessment');
    }
  };

  const handleAssessmentComplete = (results: any) => {
    console.log('Clinical assessment results:', results);
    toast({
      title: "Assessment Complete",
      description: "Your clinical assessment has been completed. Welcome to Anxiety Companion!",
    });
    setStep('complete');
  };

  const handleAssessmentSkip = () => {
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

  return {
    step,
    formData,
    isLoading,
    handleInputChange,
    handleGoogleSignUp,
    handleSubmit,
    handleTherapistLinking,
    handleAssessmentComplete,
    handleAssessmentSkip,
    handleComplete
  };
};
