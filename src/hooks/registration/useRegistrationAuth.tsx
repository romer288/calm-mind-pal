import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FormData } from '@/types/registration';
import { validateRegistrationForm } from '@/utils/registrationValidation';

export const useRegistrationAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignUp = async (): Promise<{ success: boolean }> => {
    try {
      console.log('Starting Google sign up');
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/'
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
        return { success: false };
      } else {
        return { success: true };
      }
    } catch (error) {
      console.error('Unexpected error during Google sign up:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
      return { success: false };
    }
  };

  const handleEmailSignUp = async (formData: FormData): Promise<{ success: boolean }> => {
    const validation = validateRegistrationForm(formData);
    
    if (!validation.isValid && validation.error) {
      toast({
        title: validation.error.title,
        description: validation.error.description,
        variant: "destructive"
      });
      return { success: false };
    }

    try {
      setIsLoading(true);
      console.log('Attempting email signup...');
      
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: window.location.origin + '/',
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
        return { success: false };
      } else {
        console.log('Registration successful, moving to therapist linking');
        toast({
          title: "Registration Successful",
          description: "Account created! Let's connect you with care.",
        });
        return { success: true };
      }
    } catch (error) {
      console.error('Unexpected error during email registration:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailSignIn = async (email: string, password: string): Promise<{ success: boolean }> => {
    try {
      setIsLoading(true);
      console.log('Attempting email signin...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      console.log('Email signin response:', { data, error });

      if (error) {
        console.error('Email signin error:', error);
        toast({
          title: "Sign In Error",
          description: error.message,
          variant: "destructive"
        });
        return { success: false };
      } else {
        console.log('Sign in successful');
        toast({
          title: "Welcome back!",
          description: "You have successfully signed in.",
        });
        return { success: true };
      }
    } catch (error) {
      console.error('Unexpected error during email signin:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    handleGoogleSignUp,
    handleEmailSignUp,
    handleEmailSignIn
  };
};