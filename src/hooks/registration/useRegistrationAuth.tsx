import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FormData } from '@/types/registration';
import { validateRegistrationForm } from '@/utils/registrationValidation';

export const useRegistrationAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleSignUp = async (role: 'patient' | 'therapist'): Promise<{ success: boolean }> => {
    console.log('🚀 Starting Google OAuth for role:', role, 'at URL:', window.location.href);
    setIsLoading(true);
    
    try {
      // Store role in localStorage to use after OAuth redirect
      localStorage.setItem('pending_user_role', role);
      console.log('📝 DETAILED: Stored pending role in localStorage:', role);
      console.log('📝 DETAILED: Verifying localStorage storage:', localStorage.getItem('pending_user_role'));
      
      // Also store in sessionStorage as backup
      sessionStorage.setItem('pending_user_role', role);
      
      const redirectUrl = `${window.location.origin}/registration?step=registration-complete&role=${role}`;
      console.log('🔗 DETAILED: Redirect URL will be:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
            // Store role as a state parameter that survives the OAuth flow
            state: JSON.stringify({ role })
          }
        }
      });

      console.log('📊 DETAILED: Google OAuth API response:', { data, error });

      if (error) {
        console.error('❌ DETAILED: Google OAuth API error:', error);
        console.error('❌ DETAILED: Error details:', JSON.stringify(error, null, 2));
        toast({
          title: "Authentication Error",
          description: error.message,
          variant: "destructive"
        });
        setIsLoading(false);
        return { success: false };
      } 
      
      console.log('✅ DETAILED: OAuth API call successful, browser should redirect to Google...');
      console.log('✅ DETAILED: OAuth response data:', JSON.stringify(data, null, 2));
      // OAuth redirect will handle the rest - don't set loading to false here
      return { success: true };
    } catch (error) {
      console.error('💥 Unexpected error during Google OAuth:', error);
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
          emailRedirectTo: window.location.origin + '/registration',
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: formData.role
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