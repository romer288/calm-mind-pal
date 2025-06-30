
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
    handleTherapistLinking,
    handleAssessmentComplete,
    handleComplete
  } = useRegistrationFlow();

  console.log('Registration component - User:', user, 'Loading:', loading, 'Current step:', step);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      console.log('User is authenticated, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // Don't render if still loading or user is authenticated
  if (loading || user) {
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
          <ClinicalAssessment onComplete={handleAssessmentComplete} />
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
