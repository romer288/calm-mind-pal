
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const TrackAnxiety = () => {
  const [anxietyLevel, setAnxietyLevel] = useState([5]);
  const [trigger, setTrigger] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    console.log('Recording anxiety level:', {
      level: anxietyLevel[0],
      trigger,
      description,
      notes
    });
    // Here you would typically save to your backend or local storage
  };

  const getAnxietyLabel = (level: number) => {
    if (level <= 2) return 'Calm';
    if (level <= 4) return 'Mild';
    if (level <= 6) return 'Moderate';
    if (level <= 8) return 'High';
    return 'Severe';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Track Anxiety</h1>
            <p className="text-sm text-gray-600">Record your current anxiety level and identify triggers</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Track Your Anxiety</h2>
          <p className="text-gray-600 mb-8">Record your current anxiety level and what might be triggering it</p>

          <div className="space-y-8">
            {/* Anxiety Level Slider */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <label className="text-lg font-semibold text-gray-900">
                  Current Anxiety Level: {anxietyLevel[0]}/10
                </label>
              </div>
              
              <div className="px-4">
                <Slider
                  value={anxietyLevel}
                  onValueChange={setAnxietyLevel}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-2">
                  <span>1 - Calm</span>
                  <span>5 - Moderate</span>
                  <span>10 - Severe</span>
                </div>
              </div>
            </div>

            {/* Trigger Selection */}
            <div>
              <label className="text-lg font-semibold text-gray-900 mb-3 block">
                What's causing your anxiety? (Optional)
              </label>
              <Select value={trigger} onValueChange={setTrigger}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a trigger category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="work">Work/Career</SelectItem>
                  <SelectItem value="social">Social Situations</SelectItem>
                  <SelectItem value="health">Health Concerns</SelectItem>
                  <SelectItem value="financial">Financial Stress</SelectItem>
                  <SelectItem value="relationships">Relationships</SelectItem>
                  <SelectItem value="future">Future/Uncertainty</SelectItem>
                  <SelectItem value="family">Family Issues</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <label className="text-lg font-semibold text-gray-900 mb-3 block">
                Describe the situation (Optional)
              </label>
              <Textarea
                placeholder="What specifically is making you feel anxious right now?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {/* Additional Notes */}
            <div>
              <label className="text-lg font-semibold text-gray-900 mb-3 block">
                Additional Notes (Optional)
              </label>
              <Textarea
                placeholder="Any other thoughts or observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            {/* Submit Button */}
            <Button 
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-lg"
            >
              Record Anxiety Level
            </Button>
          </div>
        </Card>

        {/* Recent Entries */}
        <Card className="p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Recent Entries</h3>
          <p className="text-gray-600 mb-6">Your last 5 anxiety tracking sessions</p>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Level: Not recorded</p>
                <p className="text-sm text-gray-500">No trigger specified</p>
              </div>
              <p className="text-sm text-gray-500">6/15/2025</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TrackAnxiety;
