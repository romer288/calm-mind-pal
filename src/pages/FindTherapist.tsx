import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Star, MapPin, Phone, Mail, Map, User, Shield } from 'lucide-react';
import TherapistLinking from '@/components/TherapistLinking';

interface Therapist {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  address: string;
  distance: string;
  phone: string;
  email: string;
  bio: string;
  insurance: string[];
  acceptingPatients: boolean;
  image: string;
  acceptsUninsured: boolean;
}

const FindTherapist = () => {
  const [step, setStep] = useState<'therapist-check' | 'insurance-check' | 'search' | 'results'>('therapist-check');
  const [hasInsurance, setHasInsurance] = useState<string>('');
  const [zipCode, setZipCode] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [insuranceType, setInsuranceType] = useState('');

  const therapists: Therapist[] = [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      specialty: 'Cognitive Behavioral Therapy',
      rating: 4.9,
      address: '123 Therapy Lane, Boston, MA',
      distance: '2.3 miles away',
      phone: '(555) 123-4567',
      email: 'sarah.johnson@example.com',
      bio: 'Specializing in anxiety disorders with over 15 years of experience helping patients develop coping mechanisms through CBT techniques.',
      insurance: ['Blue Cross', 'Aetna', 'Cigna'],
      acceptingPatients: true,
      acceptsUninsured: false,
      image: '👩‍⚕️'
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      specialty: 'Mindfulness-Based Therapy',
      rating: 4.7,
      address: '456 Wellness Blvd, Boston, MA',
      distance: '3.8 miles away',
      phone: '(555) 987-6543',
      email: 'michael.chen@example.com',
      bio: 'Integrating mindfulness techniques with traditional therapy approaches to help clients manage anxiety in the moment and build long-term resilience.',
      insurance: ['Medicare', 'Cigna', 'Harvard Pilgrim'],
      acceptingPatients: true,
      acceptsUninsured: true,
      image: '👨‍⚕️'
    },
    {
      id: '3',
      name: 'Dr. Lisa Rodriguez',
      specialty: 'Acceptance and Commitment Therapy',
      rating: 4.8,
      address: '789 Healing Way, Cambridge, MA',
      distance: '5.1 miles away',
      phone: '(555) 456-7890',
      email: 'lisa.rodriguez@example.com',
      bio: 'Helping clients develop psychological flexibility through acceptance and commitment therapy, with special focus on anxiety and stress management.',
      insurance: ['Blue Cross', 'UnitedHealthcare', 'Tufts'],
      acceptingPatients: false,
      acceptsUninsured: false,
      image: '👩‍⚕️'
    }
  ];

  const handleTherapistLinking = (hasTherapist: boolean, therapistInfo?: any) => {
    if (hasTherapist) {
      // Redirect to dashboard since they already have a therapist
      window.location.href = '/dashboard';
    } else {
      setStep('insurance-check');
    }
  };

  const handleInsuranceResponse = (value: string) => {
    setHasInsurance(value);
    setStep('search');
  };

  const handleSearch = () => {
    console.log('Searching for therapists:', { zipCode, specialty, hasInsurance, insuranceType });
    setStep('results');
  };

  const filteredTherapists = therapists.filter(therapist => {
    if (hasInsurance === 'no') {
      return therapist.acceptsUninsured;
    }
    if (insuranceType) {
      return therapist.insurance.some(ins => 
        ins.toLowerCase().includes(insuranceType.toLowerCase())
      );
    }
    return true;
  });

  if (step === 'therapist-check') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Connect with Mental Health Support</h1>
        </div>
        <div className="max-w-4xl mx-auto px-8 py-12">
          <TherapistLinking onComplete={handleTherapistLinking} />
        </div>
      </div>
    );
  }

  if (step === 'insurance-check') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Find a Therapist</h1>
        </div>
        <div className="max-w-4xl mx-auto px-8 py-12">
          <Card className="max-w-2xl mx-auto p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Do you have health insurance?
              </h2>
              <p className="text-gray-600">
                This helps us find therapists that match your coverage and budget.
              </p>
            </div>

            <RadioGroup value={hasInsurance} onValueChange={handleInsuranceResponse} className="space-y-4">
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="yes" id="yes-insurance" />
                <Label htmlFor="yes-insurance" className="text-gray-900 cursor-pointer font-medium">
                  Yes, I have health insurance
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="no" id="no-insurance" />
                <Label htmlFor="no-insurance" className="text-gray-900 cursor-pointer font-medium">
                  No, I don't have insurance (show self-pay options)
                </Label>
              </div>
            </RadioGroup>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'search') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <h1 className="text-xl font-semibold text-gray-900">Find a Therapist</h1>
        </div>
        <div className="max-w-4xl mx-auto px-8 py-8">
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Find a Therapist</h2>
            <p className="text-gray-600 mb-6">
              {hasInsurance === 'yes' 
                ? 'Connect with licensed therapists that accept your insurance.'
                : 'Find therapists offering affordable self-pay options for anxiety management.'
              }
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <Label htmlFor="zipcode">Your ZIP Code</Label>
                <Input
                  id="zipcode"
                  placeholder="Enter ZIP code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                />
              </div>
              
              {hasInsurance === 'yes' && (
                <div>
                  <Label htmlFor="insurance">Insurance Provider</Label>
                  <Select value={insuranceType} onValueChange={setInsuranceType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your insurance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blue-cross">Blue Cross Blue Shield</SelectItem>
                      <SelectItem value="aetna">Aetna</SelectItem>
                      <SelectItem value="cigna">Cigna</SelectItem>
                      <SelectItem value="medicare">Medicare</SelectItem>
                      <SelectItem value="harvard-pilgrim">Harvard Pilgrim</SelectItem>
                      <SelectItem value="unitedhealth">UnitedHealthcare</SelectItem>
                      <SelectItem value="tufts">Tufts Health Plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <Label htmlFor="specialty">Specialty</Label>
                <Select value={specialty} onValueChange={setSpecialty}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cbt">Cognitive Behavioral Therapy</SelectItem>
                    <SelectItem value="mindfulness">Mindfulness-Based Therapy</SelectItem>
                    <SelectItem value="act">Acceptance and Commitment Therapy</SelectItem>
                    <SelectItem value="psychodynamic">Psychodynamic Therapy</SelectItem>
                    <SelectItem value="emdr">EMDR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={handleSearch} className="w-full bg-blue-600 hover:bg-blue-700">
              Search Therapists
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Find a Therapist</h1>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {hasInsurance === 'yes' ? 'Therapists accepting your insurance' : 'Therapists with self-pay options'}
            </h3>
            <p className="text-gray-600">
              {filteredTherapists.length} therapist{filteredTherapists.length !== 1 ? 's' : ''} found
            </p>
          </div>
          <Button variant="outline" onClick={() => setStep('search')}>
            Modify Search
          </Button>
        </div>

        {filteredTherapists.length === 0 ? (
          <Card className="p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No therapists found</h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search criteria or expanding your location radius.
            </p>
            <Button onClick={() => setStep('search')} variant="outline">
              Modify Search
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredTherapists.map((therapist) => (
              <Card key={therapist.id} className="p-6">
                
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                    {therapist.image}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900">{therapist.name}</h4>
                        <p className="text-gray-600">{therapist.specialty}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-sm font-medium text-gray-900">{therapist.rating}</span>
                      </div>
                    </div>

                    <div className="space-y-1 mb-4">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{therapist.address} ({therapist.distance})</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{therapist.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{therapist.email}</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-4">{therapist.bio}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {hasInsurance === 'yes' ? (
                        therapist.insurance.map((plan) => (
                          <span key={plan} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {plan}
                          </span>
                        ))
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                          Self-pay accepted
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className={`text-sm ${therapist.acceptingPatients ? 'text-green-600' : 'text-red-600'}`}>
                          {therapist.acceptingPatients ? 'Accepting new patients' : 'Not accepting new patients'}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Map className="w-4 h-4 mr-1" />
                          Map
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={!therapist.acceptingPatients}
                        >
                          Request Appointment
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FindTherapist;
