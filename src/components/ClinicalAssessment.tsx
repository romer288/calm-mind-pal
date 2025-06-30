
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Brain, CheckCircle, AlertTriangle } from 'lucide-react';

interface ClinicalAssessmentProps {
  onComplete: (results: ClinicalAssessmentResult) => void;
}

interface Question {
  id: string;
  category: string;
  question: string;
  options: { value: number; label: string }[];
}

interface ClinicalAssessmentResult {
  scores: Record<string, number>;
  totalScore: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'severe';
  recommendations: string[];
  potentialConditions: string[];
}

const ClinicalAssessment: React.FC<ClinicalAssessmentProps> = ({ onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const questions: Question[] = [
    {
      id: 'anxiety_frequency',
      category: 'anxiety',
      question: 'How often do you feel nervous, anxious, or on edge?',
      options: [
        { value: 0, label: 'Not at all' },
        { value: 1, label: 'Several days' },
        { value: 2, label: 'More than half the days' },
        { value: 3, label: 'Nearly every day' }
      ]
    },
    {
      id: 'worry_control',
      category: 'anxiety',
      question: 'How often do you have trouble controlling worrying?',
      options: [
        { value: 0, label: 'Not at all' },
        { value: 1, label: 'Several days' },
        { value: 2, label: 'More than half the days' },
        { value: 3, label: 'Nearly every day' }
      ]
    },
    {
      id: 'restlessness',
      category: 'anxiety',
      question: 'How often do you feel restless or keyed up?',
      options: [
        { value: 0, label: 'Not at all' },
        { value: 1, label: 'Several days' },
        { value: 2, label: 'More than half the days' },
        { value: 3, label: 'Nearly every day' }
      ]
    },
    {
      id: 'concentration',
      category: 'cognitive',
      question: 'How often do you have trouble concentrating?',
      options: [
        { value: 0, label: 'Not at all' },
        { value: 1, label: 'Several days' },
        { value: 2, label: 'More than half the days' },
        { value: 3, label: 'Nearly every day' }
      ]
    },
    {
      id: 'irritability',
      category: 'mood',
      question: 'How often do you feel irritable?',
      options: [
        { value: 0, label: 'Not at all' },
        { value: 1, label: 'Several days' },
        { value: 2, label: 'More than half the days' },
        { value: 3, label: 'Nearly every day' }
      ]
    },
    {
      id: 'sleep_difficulty',
      category: 'physical',
      question: 'How often do you have trouble falling or staying asleep?',
      options: [
        { value: 0, label: 'Not at all' },
        { value: 1, label: 'Several days' },
        { value: 2, label: 'More than half the days' },
        { value: 3, label: 'Nearly every day' }
      ]
    },
    {
      id: 'physical_symptoms',
      category: 'physical',
      question: 'How often do you experience physical symptoms like rapid heartbeat, sweating, or shortness of breath?',
      options: [
        { value: 0, label: 'Not at all' },
        { value: 1, label: 'Several days' },
        { value: 2, label: 'More than half the days' },
        { value: 3, label: 'Nearly every day' }
      ]
    }
  ];

  const handleAnswer = (value: number) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: value });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateResults = () => {
    const totalScore = Object.values(answers).reduce((sum, score) => sum + score, 0);
    const maxScore = questions.length * 3;
    const percentage = (totalScore / maxScore) * 100;

    let riskLevel: 'low' | 'moderate' | 'high' | 'severe';
    let recommendations: string[] = [];
    let potentialConditions: string[] = [];

    if (percentage < 25) {
      riskLevel = 'low';
      recommendations = [
        'Continue practicing stress management techniques',
        'Maintain healthy lifestyle habits',
        'Consider mindfulness or relaxation exercises'
      ];
      potentialConditions = ['Mild stress response'];
    } else if (percentage < 50) {
      riskLevel = 'moderate';
      recommendations = [
        'Consider cognitive behavioral therapy techniques',
        'Practice regular exercise and stress reduction',
        'Monitor symptoms and seek support if needed'
      ];
      potentialConditions = ['Mild to moderate anxiety', 'Adjustment disorder'];
    } else if (percentage < 75) {
      riskLevel = 'high';
      recommendations = [
        'Strongly consider professional therapy',
        'Explore anxiety management strategies',
        'Consider discussing medication options with a healthcare provider'
      ];
      potentialConditions = ['Generalized Anxiety Disorder', 'Panic Disorder', 'Social Anxiety Disorder'];
    } else {
      riskLevel = 'severe';
      recommendations = [
        'Seek immediate professional help',
        'Consider intensive therapy or treatment program',
        'Discuss comprehensive treatment plan with healthcare provider'
      ];
      potentialConditions = ['Severe Anxiety Disorder', 'Major Depressive Disorder', 'Panic Disorder with Agoraphobia'];
    }

    const results: ClinicalAssessmentResult = {
      scores: answers,
      totalScore,
      riskLevel,
      recommendations,
      potentialConditions
    };

    onComplete(results);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];

  return (
    <Card className="max-w-2xl mx-auto p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Brain className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Clinical Assessment</h2>
            <p className="text-gray-600">Question {currentQuestion + 1} of {questions.length}</p>
          </div>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {currentQ.question}
        </h3>
        
        <RadioGroup 
          value={answers[currentQ.id]?.toString() || ''} 
          onValueChange={(value) => handleAnswer(parseInt(value))}
          className="space-y-3"
        >
          {currentQ.options.map((option) => (
            <div key={option.value} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value={option.value.toString()} id={option.value.toString()} />
              <Label htmlFor={option.value.toString()} className="text-gray-900 cursor-pointer flex-1">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="flex justify-between">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          Previous
        </Button>
        
        <Button 
          onClick={handleNext}
          disabled={answers[currentQ.id] === undefined}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {currentQuestion === questions.length - 1 ? 'Complete Assessment' : 'Next'}
        </Button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Important Disclaimer</p>
            <p>This assessment is for informational purposes only and does not constitute medical advice. Please consult with a qualified healthcare professional for proper diagnosis and treatment.</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ClinicalAssessment;
