
import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Heart } from 'lucide-react';
import { useRegistrationFlow } from '@/hooks/useRegistrationFlow';
import RegistrationHeader from '@/components/registration/RegistrationHeader';
import WelcomeContent from '@/components/registration/WelcomeContent';
import RegistrationForm from '@/components/registration/RegistrationForm';
import CompletionStep from '@/components/registration/CompletionStep';
import TherapistLinking from '@/components/TherapistLinking';
import ClinicalAssessment from '@/components/ClinicalAssessment';
import { useNavigate } from 'react-router-dom';

const Registration = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const {
    step,
    formData,
    isLoading,
    handleInputChange,
    handleGoogleSignUp,
    handleSubmit,
    handleContinueToTherapistLinking,
    handleTherapistLinking,
    handleAssessmentComplete,
    handleAssessmentSkip,
    handleComplete
  } = useRegistrationFlow();

  console.log('Registration component - User:', user, 'Loading:', loading, 'Current step:', step);

  // Only redirect authenticated users to dashboard if they've completed the entire registration flow
  useEffect(() => {
    if (!loading && user && step === 'complete') {
      console.log('User has completed registration, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [user, loading, navigate, step]);

  // Don't render if still loading auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Heart className="w-4 h-4 text-blue-600 animate-pulse" />
          </div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (step === 'registration-complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <RegistrationHeader />
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Anxiety Companion!</h2>
              <p className="text-lg text-gray-600 mb-8">Your account has been successfully created. Let's help you get the most out of your experience.</p>
            </div>
            <button
              onClick={handleContinueToTherapistLinking}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors cursor-pointer border-none"
            >
              Continue Setup
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'therapist-linking') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <RegistrationHeader />
        <div className="max-w-6xl mx-auto px-8 py-12">
          <TherapistLinking onComplete={handleTherapistLinking} />
        </div>
      </div>
    );
  }

  if (step === 'assessment') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <RegistrationHeader />
        <div className="max-w-6xl mx-auto px-8 py-12">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Clinical Assessment</h2>
              <p className="text-gray-600">This assessment helps us understand your mental health better, but it's optional.</p>
            </div>
            <ClinicalAssessment onComplete={handleAssessmentComplete} />
            <div className="text-center">
              <button
                onClick={handleAssessmentSkip}
                className="text-gray-600 hover:text-gray-800 underline"
              >
                Skip assessment for now
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <RegistrationHeader />
        <div className="max-w-6xl mx-auto px-8 py-12">
          <CompletionStep onComplete={handleComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <RegistrationHeader />

      <div className="max-w-6xl mx-auto px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <WelcomeContent />
          <RegistrationForm
            formData={formData}
            isLoading={isLoading}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onGoogleSignUp={handleGoogleSignUp}
          />
        </div>
      </div>
    </div>
  );
};

export default Registration;
