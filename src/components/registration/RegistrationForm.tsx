
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Mail, ArrowRight, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RegistrationFormProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    agreeToTerms: boolean;
    role: 'patient' | 'therapist';
  };
  isLoading: boolean;
  isSignInMode: boolean;
  onInputChange: (field: string, value: string | boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleSignUp: () => void;
  onToggleMode: () => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({
  formData,
  isLoading,
  isSignInMode,
  onInputChange,
  onSubmit,
  onGoogleSignUp,
  onToggleMode
}) => {
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const { toast } = useToast();

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast({
        title: "Email required",
        description: "Please enter your email address first.",
        variant: "destructive"
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Reset link sent",
          description: "Check your email for a password reset link.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsResettingPassword(false);
    }
  };
  return (
    <Card className="p-8 shadow-lg">
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isSignInMode ? 'Welcome Back' : 'Create Your Account'}
        </h2>
        <p className="text-gray-600">
          {isSignInMode 
            ? 'Sign in to continue your mental health journey' 
            : 'Start your personalized mental health journey today'
          }
        </p>
      </div>

      {!isSignInMode && (
        <div className="mb-4">
          <Label>I am a:</Label>
          <RadioGroup 
            value={formData.role} 
            onValueChange={(value) => onInputChange('role', value)}
            className="flex space-x-6 mt-2"
            disabled={isLoading}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="patient" id="patient-google" />
              <Label htmlFor="patient-google">Patient seeking support</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="therapist" id="therapist-google" />
              <Label htmlFor="therapist-google">Mental health professional</Label>
            </div>
          </RadioGroup>
        </div>
      )}

      <div className="mb-6">
        <Button
          onClick={onGoogleSignUp}
          disabled={isLoading}
          variant="outline"
          className="w-full flex items-center justify-center space-x-2 py-3"
        >
          <Mail className="w-5 h-5 text-red-500" />
          <span>{isLoading ? (isSignInMode ? 'Signing in...' : 'Signing up...') : 'Continue with Google'}</span>
        </Button>
      </div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {!isSignInMode && (
          <>
            <div>
              <Label>I am a:</Label>
              <RadioGroup 
                value={formData.role} 
                onValueChange={(value) => onInputChange('role', value)}
                className="flex space-x-6 mt-2"
                disabled={isLoading}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="patient" id="patient" />
                  <Label htmlFor="patient">Patient seeking support</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="therapist" id="therapist" />
                  <Label htmlFor="therapist">Mental health professional</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => onInputChange('firstName', e.target.value)}
                  placeholder="Enter your first name"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => onInputChange('lastName', e.target.value)}
                  placeholder="Enter your last name"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
          </>
        )}

        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => onInputChange('email', e.target.value)}
            placeholder="Enter your email"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {isSignInMode && (
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isResettingPassword}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {isResettingPassword ? 'Sending...' : 'Forgot Password?'}
              </button>
            )}
          </div>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => onInputChange('password', e.target.value)}
            placeholder={isSignInMode ? "Enter your password" : "Create a secure password"}
            required
            disabled={isLoading}
          />
        </div>

        {!isSignInMode && (
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => onInputChange('confirmPassword', e.target.value)}
              placeholder="Confirm your password"
              required
              disabled={isLoading}
            />
          </div>
        )}

        {!isSignInMode && (
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={(e) => onInputChange('agreeToTerms', e.target.checked)}
              className="mt-1"
              required
              disabled={isLoading}
            />
            <Label htmlFor="agreeToTerms" className="text-sm text-gray-600">
              I agree to the{' '}
              <Link to="/privacy" className="text-blue-600 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
            </Label>
          </div>
        )}

        <Button 
          type="submit" 
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading 
            ? (isSignInMode ? 'Signing In...' : 'Creating Account...')
            : (isSignInMode ? 'Sign In' : 'Create Account')
          }
          {!isLoading && <ArrowRight className="w-4 h-4 ml-2" />}
        </Button>
      </form>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-600">
          {isSignInMode ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={onToggleMode}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            {isSignInMode ? 'Create one here' : 'Sign in here'}
          </button>
        </p>
      </div>
    </Card>
  );
};

export default RegistrationForm;
