
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, User, CheckCircle } from 'lucide-react';
import { TherapistInfo } from '@/types/registration';

interface TherapistLinkingProps {
  onComplete: (hasTherapist: boolean, therapistInfo?: TherapistInfo) => void;
}

const TherapistLinking: React.FC<TherapistLinkingProps> = ({ onComplete }) => {
  const [hasTherapist, setHasTherapist] = useState<string>('');
  const [therapistInfo, setTherapistInfo] = useState<TherapistInfo>({
    name: '',
    email: '',
    phone: '',
    notes: '',
    contactMethod: 'email'
  });
  const [step, setStep] = useState<'question' | 'details' | 'confirmation'>('question');
  const { toast } = useToast();

  const handleTherapistResponse = (value: string) => {
    setHasTherapist(value);
    if (value === 'yes') {
      setStep('details');
    } else {
      onComplete(false);
    }
  };

  const handleSubmitTherapistInfo = () => {
    if (!therapistInfo.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter your therapist's name.",
        variant: "destructive"
      });
      return;
    }

    if (therapistInfo.contactMethod === 'email' && !therapistInfo.email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your therapist's email address.",
        variant: "destructive"
      });
      return;
    }

    if (therapistInfo.contactMethod === 'phone' && !therapistInfo.phone.trim()) {
      toast({
        title: "Phone Required",
        description: "Please enter your therapist's phone number.",
        variant: "destructive"
      });
      return;
    }

    setStep('confirmation');
  };

  const handleConfirm = () => {
    toast({
      title: "Therapist Information Saved",
      description: "We'll send an invitation to your therapist to access your progress data.",
    });
    onComplete(true, therapistInfo);
  };

  if (step === 'question') {
    return (
      <Card className="max-w-2xl mx-auto p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Do you currently have a therapist?
          </h2>
          <p className="text-gray-600">
            If you have a therapist, we can connect your account so they can track your progress
            and provide better support.
          </p>
        </div>

        <RadioGroup value={hasTherapist} onValueChange={handleTherapistResponse} className="space-y-4">
          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
            <RadioGroupItem value="yes" id="yes" />
            <Label htmlFor="yes" className="text-gray-900 cursor-pointer font-medium">
              Yes, I have a therapist I'd like to connect
            </Label>
          </div>
          <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
            <RadioGroupItem value="no" id="no" />
            <Label htmlFor="no" className="text-gray-900 cursor-pointer font-medium">
              No, I don't have a therapist
            </Label>
          </div>
        </RadioGroup>
      </Card>
    );
  }

  if (step === 'details') {
    return (
      <Card className="max-w-2xl mx-auto p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connect Your Therapist
          </h2>
          <p className="text-gray-600">
            Please provide your therapist's information so we can send them an invitation
            to access your progress data.
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <Label htmlFor="therapist-name">Therapist's Name *</Label>
            <Input
              id="therapist-name"
              value={therapistInfo.name}
              onChange={(e) => setTherapistInfo({ ...therapistInfo, name: e.target.value })}
              placeholder="Dr. Sarah Johnson"
            />
          </div>

          <div>
            <Label>Preferred Contact Method *</Label>
            <RadioGroup 
              value={therapistInfo.contactMethod} 
              onValueChange={(value: 'email' | 'phone') => 
                setTherapistInfo({ ...therapistInfo, contactMethod: value })
              }
              className="flex space-x-6 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email" className="flex items-center cursor-pointer">
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="phone" id="phone" />
                <Label htmlFor="phone" className="flex items-center cursor-pointer">
                  <Phone className="w-4 h-4 mr-2" />
                  Phone
                </Label>
              </div>
            </RadioGroup>
          </div>

          {therapistInfo.contactMethod === 'email' && (
            <div>
              <Label htmlFor="therapist-email">Email Address *</Label>
              <Input
                id="therapist-email"
                type="email"
                value={therapistInfo.email}
                onChange={(e) => setTherapistInfo({ ...therapistInfo, email: e.target.value })}
                placeholder="sarah.johnson@example.com"
              />
            </div>
          )}

          {therapistInfo.contactMethod === 'phone' && (
            <div>
              <Label htmlFor="therapist-phone">Phone Number *</Label>
              <Input
                id="therapist-phone"
                type="tel"
                value={therapistInfo.phone}
                onChange={(e) => setTherapistInfo({ ...therapistInfo, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          )}

          <div>
            <Label htmlFor="therapist-notes">Additional Notes (Optional)</Label>
            <Textarea
              id="therapist-notes"
              value={therapistInfo.notes}
              onChange={(e) => setTherapistInfo({ ...therapistInfo, notes: e.target.value })}
              placeholder="Any additional information about your therapist or treatment..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={() => setStep('question')}>
            Back
          </Button>
          <Button onClick={handleSubmitTherapistInfo} className="bg-blue-600 hover:bg-blue-700">
            Continue
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto p-8 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Therapist Information Saved
      </h2>
      <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
        <h3 className="font-semibold text-gray-900 mb-2">Review Information:</h3>
        <p><strong>Name:</strong> {therapistInfo.name}</p>
        <p><strong>Contact:</strong> {therapistInfo.contactMethod === 'email' ? therapistInfo.email : therapistInfo.phone}</p>
        {therapistInfo.notes && <p><strong>Notes:</strong> {therapistInfo.notes}</p>}
      </div>
      <p className="text-gray-600 mb-6">
        We'll send an invitation to your therapist within 24 hours. They'll be able to access
        your progress data and provide better support for your mental health journey.
      </p>
      <Button onClick={handleConfirm} className="bg-blue-600 hover:bg-blue-700">
        Complete Setup
      </Button>
    </Card>
  );
};

export default TherapistLinking;
