
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import AnxietyLevelSlider from './AnxietyLevelSlider';
import TriggerSelector from './TriggerSelector';
import DescriptionInput from './DescriptionInput';
import NotesInput from './NotesInput';

const TrackAnxietyForm: React.FC = () => {
  const [anxietyLevel, setAnxietyLevel] = useState([5]);
  const [trigger, setTrigger] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcript += event.results[i][0].transcript;
          }
        }
        if (transcript) {
          setDescription(prev => prev + transcript + ' ');
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSubmit = () => {
    console.log('Recording anxiety level:', {
      level: anxietyLevel[0],
      trigger,
      description,
      notes
    });
    // Here you would typically save to your backend or local storage
  };

  return (
    <Card className="p-8 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Track Your Anxiety</h2>
      <p className="text-gray-600 mb-8">Record your current anxiety level and what might be triggering it</p>

      <div className="space-y-8">
        <AnxietyLevelSlider
          anxietyLevel={anxietyLevel}
          onAnxietyLevelChange={setAnxietyLevel}
        />

        <TriggerSelector
          trigger={trigger}
          onTriggerChange={setTrigger}
        />

        <DescriptionInput
          description={description}
          onDescriptionChange={setDescription}
          isListening={isListening}
          onToggleListening={toggleListening}
        />

        <NotesInput
          notes={notes}
          onNotesChange={setNotes}
        />

        <Button 
          onClick={handleSubmit}
          className="w-full bg-blue-600 hover:bg-blue-700 py-3 text-lg"
        >
          Record Anxiety Level
        </Button>
      </div>
    </Card>
  );
};

export default TrackAnxietyForm;
