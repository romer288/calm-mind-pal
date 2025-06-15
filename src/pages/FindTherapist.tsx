
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Star, MapPin, Phone, Mail, Map } from 'lucide-react';

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
}

const FindTherapist = () => {
  const [zipCode, setZipCode] = useState('');
  const [specialty, setSpecialty] = useState('');

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
      image: '👩‍⚕️'
    }
  ];

  const handleSearch = () => {
    console.log('Searching for therapists:', { zipCode, specialty });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Find a Therapist</h1>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Search Section */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Find a Therapist</h2>
          <p className="text-gray-600 mb-6">Connect with licensed therapists specializing in anxiety management.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="zipcode" className="block text-sm font-medium text-gray-700 mb-2">
                Your ZIP Code
              </label>
              <Input
                id="zipcode"
                placeholder="Enter ZIP code"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-2">
                Specialty
              </label>
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger className="w-full">
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

        {/* Results Section */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recommended Therapists</h3>
        </div>

        {/* Therapist Cards */}
        <div className="space-y-6">
          {therapists.map((therapist) => (
            <Card key={therapist.id} className="p-6">
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
                  {therapist.image}
                </div>

                {/* Main Content */}
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

                  {/* Contact Info */}
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

                  {/* Bio */}
                  <p className="text-sm text-gray-700 mb-4">{therapist.bio}</p>

                  {/* Insurance */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {therapist.insurance.map((plan) => (
                      <span key={plan} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {plan}
                      </span>
                    ))}
                  </div>

                  {/* Status and Actions */}
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
      </div>
    </div>
  );
};

export default FindTherapist;
