
import { supabase } from '@/integrations/supabase/client';
import { validatePhoneNumber, validateOTP } from '@/utils/validation';

export interface AuthError {
  code: string;
  message: string;
}

export class AuthService {
  private static readonly MAX_OTP_ATTEMPTS = 3;
  private static readonly OTP_COOLDOWN_MS = 60000; // 1 minute
  private static otpAttempts = new Map<string, { count: number; lastAttempt: number }>();

  static async sendOTP(phoneNumber: string): Promise<{ success: boolean; error?: AuthError }> {
    try {
      // Validate and sanitize phone number
      const validation = validatePhoneNumber(phoneNumber);
      if (!validation.isValid) {
        return {
          success: false,
          error: { code: 'INVALID_PHONE', message: validation.error || 'Invalid phone number' }
        };
      }

      // Check rate limiting
      const attempts = this.otpAttempts.get(validation.formatted);
      if (attempts && attempts.count >= this.MAX_OTP_ATTEMPTS) {
        const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
        if (timeSinceLastAttempt < this.OTP_COOLDOWN_MS) {
          return {
            success: false,
            error: { 
              code: 'RATE_LIMITED', 
              message: 'Too many attempts. Please wait before trying again.' 
            }
          };
        } else {
          // Reset attempts after cooldown
          this.otpAttempts.delete(validation.formatted);
        }
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: validation.formatted,
        options: {
          shouldCreateUser: true
        }
      });

      if (error) {
        // Track failed attempts
        const currentAttempts = this.otpAttempts.get(validation.formatted) || { count: 0, lastAttempt: 0 };
        this.otpAttempts.set(validation.formatted, {
          count: currentAttempts.count + 1,
          lastAttempt: Date.now()
        });

        return {
          success: false,
          error: { code: error.message, message: this.getUserFriendlyError(error.message) }
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error in sendOTP:', error);
      return {
        success: false,
        error: { code: 'UNEXPECTED_ERROR', message: 'An unexpected error occurred. Please try again.' }
      };
    }
  }

  static async verifyOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; error?: AuthError }> {
    try {
      // Validate inputs
      const phoneValidation = validatePhoneNumber(phoneNumber);
      const otpValidation = validateOTP(otp);

      if (!phoneValidation.isValid) {
        return {
          success: false,
          error: { code: 'INVALID_PHONE', message: phoneValidation.error || 'Invalid phone number' }
        };
      }

      if (!otpValidation.isValid) {
        return {
          success: false,
          error: { code: 'INVALID_OTP', message: otpValidation.error || 'Invalid OTP' }
        };
      }

      const { error } = await supabase.auth.verifyOtp({
        phone: phoneValidation.formatted,
        token: otp,
        type: 'sms'
      });

      if (error) {
        return {
          success: false,
          error: { code: error.message, message: this.getUserFriendlyError(error.message) }
        };
      }

      // Clear attempts on successful verification
      this.otpAttempts.delete(phoneValidation.formatted);
      return { success: true };
    } catch (error) {
      console.error('Unexpected error in verifyOTP:', error);
      return {
        success: false,
        error: { code: 'UNEXPECTED_ERROR', message: 'An unexpected error occurred. Please try again.' }
      };
    }
  }

  static async signOut(): Promise<{ success: boolean; error?: AuthError }> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return {
          success: false,
          error: { code: error.message, message: this.getUserFriendlyError(error.message) }
        };
      }
      return { success: true };
    } catch (error) {
      console.error('Unexpected error in signOut:', error);
      return {
        success: false,
        error: { code: 'UNEXPECTED_ERROR', message: 'An unexpected error occurred. Please try again.' }
      };
    }
  }

  private static getUserFriendlyError(errorMessage: string): string {
    const errorMap: Record<string, string> = {
      'Invalid phone number': 'Please enter a valid phone number with country code',
      'Phone rate limit exceeded': 'Too many SMS requests. Please wait before trying again',
      'Invalid token': 'Invalid verification code. Please check and try again',
      'Token has expired': 'Verification code has expired. Please request a new one',
      'Signup not allowed': 'Account creation is currently disabled',
      'Phone not confirmed': 'Please verify your phone number first'
    };

    return errorMap[errorMessage] || 'Authentication failed. Please try again.';
  }
}
