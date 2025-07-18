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
          redirectTo: window.location.origin + '/',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
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
      } 
      
      // If we have a URL and we're in an iframe, break out of it
      if (data?.url && window !== window.top) {
        window.top!.location.href = data.url;
      }
      
      return { success: true };
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
        
        // Handle user already registered case
        if (error.message.includes('User already registered')) {
          toast({
            title: "Account Already Exists",
            description: "This email is already registered. Try signing in instead, or check your email for a confirmation link if you just registered.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Registration Error", 
            description: error.message,
            variant: "destructive"
          });
        }
        return { success: false };
      } else {
        console.log('Registration successful');
        
        // Show appropriate message based on email confirmation requirements
        if (data.user && !data.session) {
          toast({
            title: "Check your email!",
            description: "We've sent you a confirmation link. Please check your email and click the link to activate your account.",
            duration: 10000
          });
        } else if (data.session) {
          toast({
            title: "Registration Successful",
            description: "Account created! Let's connect you with care.",
          });
        }
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
        
        // Handle different error cases
        if (error.message.includes('Email not confirmed')) {
          toast({
            title: "Email Not Confirmed",
            description: "Please check your email and click the confirmation link to activate your account. If you didn't receive an email, email delivery may not be configured.",
            variant: "destructive"
          });
        } else if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Sign In Failed", 
            description: "Invalid email or password. Make sure your account is confirmed and try again.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Sign In Error",
            description: error.message,
            variant: "destructive"
          });
        }
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