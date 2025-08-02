import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  Brain, 
  Heart, 
  Shield, 
  Users, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle, 
  Target, 
  BookOpen, 
  CheckCircle,
  ClipboardList,
  ArrowRight,
  BarChart,
  Lightbulb
} from 'lucide-react';
import { InterventionSummary } from '@/types/goals';

interface InterventionSummariesSectionProps {
  summaries: InterventionSummary[];
}

const InterventionSummariesSection: React.FC<InterventionSummariesSectionProps> = ({ summaries }) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  
  if (summaries.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Conversation Summaries</h3>
          <p className="text-gray-600">
            Start conversations to generate weekly intervention summaries.
          </p>
        </div>
      </Card>
    );
  }

  const getInterventionColor = (type: string) => {
    const colors = {
      anxiety_management: 'bg-red-100 text-red-800',
      mindfulness: 'bg-green-100 text-green-800',
      coping_strategies: 'bg-blue-100 text-blue-800',
      therapy_support: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatInterventionType = (type: string) => {
    return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getInterventionIcon = (type: string) => {
    const icons = {
      anxiety_management: Brain,
      mindfulness: Heart,
      coping_strategies: Shield,
      therapy_support: Users
    };
    return icons[type as keyof typeof icons] || MessageSquare;
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const getInterventionExplanation = (type: string) => {
    const explanations = {
      anxiety_management: {
        clinical: "Anxiety management interventions focus on reducing acute anxiety symptoms through evidence-based techniques including breathing exercises, progressive muscle relaxation, and cognitive restructuring.",
        therapeuticRationale: "These interventions target the physiological and cognitive components of anxiety, helping clients develop immediate coping skills and long-term resilience.",
        assessmentMethods: "Monitor effectiveness through anxiety level reduction, frequency of panic episodes, and client's perceived sense of control.",
        triggerAnalysis: "Common triggers that necessitate anxiety management include: acute stress situations, anticipatory anxiety before events, panic attack episodes, somatic symptoms (rapid heartbeat, sweating), catastrophic thinking patterns, and overwhelming feelings of dread or impending doom.",
        followUpInstructions: [
          "Continue having regular conversations in the app to practice anxiety management techniques",
          "Use the Track Anxiety feature to monitor your anxiety levels and identify patterns",
          "Practice the breathing exercises available in the app when you feel overwhelmed",
          "Set daily goals in the app related to anxiety management and track your progress",
          "Review your Analytics page weekly to see your anxiety trends and improvement areas",
          "Use the chat to discuss specific situations where you felt anxious and get personalized coping strategies"
        ],
        recommendations: [
          "Track anxiety levels before and after each intervention",
          "Identify which specific techniques work best for this client",
          "Consider graduated exposure therapy for specific phobias",
          "Evaluate need for medication consultation if anxiety persists"
        ]
      },
      mindfulness: {
        clinical: "Mindfulness-based interventions utilize present-moment awareness and acceptance techniques to reduce rumination, improve emotional regulation, and enhance psychological flexibility.",
        therapeuticRationale: "These practices help clients develop meta-cognitive awareness, reducing the tendency to get caught in anxiety-provoking thought patterns while building distress tolerance.",
        assessmentMethods: "Evaluate progress through improved emotional regulation, reduced mind-wandering, increased present-moment awareness, and decreased reactivity to stressors.",
        triggerAnalysis: "Mindfulness interventions are triggered by: rumination cycles, emotional dysregulation, racing thoughts, difficulty concentrating, feeling overwhelmed by multiple stressors, disconnection from the present moment, and reactive responses to emotional stimuli.",
        followUpInstructions: [
          "Practice mindfulness techniques discussed in our conversations during daily activities",
          "Use the Track Anxiety feature to record mindfulness practice and its effects on your anxiety",
          "Set mindfulness-related goals in the app and track your consistency",
          "Chat with the app when you're feeling overwhelmed to get guided mindfulness exercises",
          "Review your anxiety patterns in Analytics to see how mindfulness practice correlates with lower anxiety",
          "Continue conversations about mindfulness to explore different techniques that work for you"
        ],
        recommendations: [
          "Establish consistent daily mindfulness practice",
          "Use mindfulness apps or guided meditations for structure",
          "Practice mindful breathing during high-anxiety moments",
          "Consider mindfulness-based stress reduction (MBSR) program"
        ]
      },
      coping_strategies: {
        clinical: "Coping strategy interventions involve teaching adaptive behavioral and cognitive responses to stressors, emphasizing problem-focused and emotion-focused coping mechanisms.",
        therapeuticRationale: "These interventions build the client's toolkit of healthy responses to stress, replacing maladaptive coping patterns with evidence-based strategies that promote resilience.",
        assessmentMethods: "Monitor through frequency of strategy use, effectiveness in real-world situations, and client's confidence in managing future stressors.",
        triggerAnalysis: "Coping strategy interventions are needed when clients exhibit: maladaptive coping behaviors (substance use, avoidance, aggression), feeling helpless in stressful situations, lack of problem-solving skills, emotional overwhelm without healthy outlets, and repeated use of ineffective strategies.",
        followUpInstructions: [
          "Practice the coping strategies we've discussed in real-life situations and report back on their effectiveness",
          "Use the Track Anxiety feature to note which coping strategies you used and how they helped",
          "Set weekly goals in the app focused on implementing specific coping techniques",
          "Continue conversations to develop and refine your personal coping toolkit",
          "Review your Analytics to identify patterns in what coping strategies work best for different situations",
          "Chat with the app when you encounter new stressful situations to develop appropriate coping responses"
        ],
        recommendations: [
          "Create personalized coping strategy cards for quick reference",
          "Practice strategies in low-stress situations before applying to high-stress events",
          "Develop both immediate (crisis) and long-term coping plans",
          "Regular review and refinement of strategy effectiveness"
        ]
      },
      therapy_support: {
        clinical: "Therapy support interventions provide psychoeducation, normalize experiences, and reinforce therapeutic concepts between sessions to enhance treatment engagement and outcomes.",
        therapeuticRationale: "These interventions bridge the gap between formal therapy sessions, providing continuous support and reinforcing therapeutic gains in daily life.",
        assessmentMethods: "Measure through therapy attendance, homework completion, application of therapeutic concepts, and overall treatment engagement.",
        triggerAnalysis: "Therapy support is indicated when clients show: poor therapy engagement, difficulty applying therapeutic concepts between sessions, feeling isolated or misunderstood, lack of progress in formal therapy, need for additional psychoeducation, or crisis situations requiring extra support.",
        followUpInstructions: [
          "Continue using the app for regular therapeutic conversations and support",
          "Use the Track Anxiety feature to monitor your progress and identify improvement patterns",
          "Set therapeutic goals in the app and track your commitment to mental health practices",
          "Review your Analytics regularly to see how consistent app use correlates with better outcomes",
          "Chat with the app when you need additional support or have questions about your therapy progress",
          "Use the insights from these conversations to enhance your formal therapy sessions if you're seeing a therapist"
        ],
        recommendations: [
          "Encourage regular therapy attendance and homework completion",
          "Provide psychoeducational resources about anxiety disorders",
          "Support implementation of therapist recommendations",
          "Monitor for signs requiring intensive therapeutic intervention"
        ]
      }
    };
    return explanations[type as keyof typeof explanations] || {
      clinical: "This intervention type requires further clinical assessment to determine specific therapeutic approaches and effectiveness measures.",
      therapeuticRationale: "General therapeutic support focusing on client stabilization and symptom management.",
      assessmentMethods: "Monitor client progress through standardized measures and clinical observation.",
      triggerAnalysis: "Triggers require individual assessment based on client presentation and specific needs.",
      followUpInstructions: ["Conduct thorough clinical assessment", "Develop individualized treatment plan", "Regular progress monitoring"],
      recommendations: ["Conduct thorough clinical assessment", "Develop individualized treatment plan", "Regular progress monitoring", "Adjust interventions based on client response"]
    };
  };

  // Group summaries by year and month
  const groupedByDate = summaries.reduce((acc, summary) => {
    const date = new Date(summary.week_start);
    const year = date.getFullYear();
    const month = date.toLocaleString('default', { month: 'long' });
    
    if (!acc[year]) {
      acc[year] = {};
    }
    if (!acc[year][month]) {
      acc[year][month] = {};
    }
    if (!acc[year][month][summary.intervention_type]) {
      acc[year][month][summary.intervention_type] = [];
    }
    
    acc[year][month][summary.intervention_type].push(summary);
    return acc;
  }, {} as Record<number, Record<string, Record<string, InterventionSummary[]>>>);

  return (
    <Card className="p-6 w-full">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Weekly Intervention Summaries</h3>
      </div>

      {/* Group by years (newest first) */}
      {Object.entries(groupedByDate)
        .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
        .map(([year, monthsData]) => (
          <div key={year} className="mb-8 last:mb-0">
            <h4 className="text-xl font-semibold text-gray-800 mb-4 border-b border-gray-200 pb-2">
              {year}
            </h4>

            {/* Group by months within the year (newest first) */}
            {Object.entries(monthsData)
              .sort(([monthA], [monthB]) => {
                const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                                  'July', 'August', 'September', 'October', 'November', 'December'];
                return monthOrder.indexOf(monthB) - monthOrder.indexOf(monthA);
              })
              .map(([month, interventionTypes]) => (
                <div key={month} className="mb-6 last:mb-0">
                  <h5 className="text-lg font-medium text-gray-700 mb-3">
                    {month}
                  </h5>

                  {/* Group by intervention types within the month */}
                  {Object.entries(interventionTypes).map(([interventionType, interventionSummaries]) => {
                    const Icon = getInterventionIcon(interventionType);
                    const color = getInterventionColor(interventionType);
                    
                    return (
                      <div key={interventionType} className="mb-6 last:mb-0 ml-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Icon className={`w-5 h-5 ${color.includes('red') ? 'text-red-600' : color.includes('green') ? 'text-green-600' : color.includes('blue') ? 'text-blue-600' : 'text-purple-600'}`} />
                          <h6 className="text-md font-medium text-gray-800">
                            {formatInterventionType(interventionType)}
                          </h6>
                          <Badge variant="outline" className="ml-2">
                            {interventionSummaries.length} week{interventionSummaries.length > 1 ? 's' : ''}
                          </Badge>
                        </div>

                        <div className="space-y-3 ml-6">
                          {interventionSummaries
                            .sort((a, b) => new Date(b.week_start).getTime() - new Date(a.week_start).getTime())
                            .map((summary) => {
                              const explanation = getInterventionExplanation(summary.intervention_type);
                              const sectionId = `${summary.id}-details`;
                              const isExpanded = expandedSections[sectionId];
                              
                              return (
                                <Card key={summary.id} className="p-4 border border-gray-200">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <Calendar className="w-4 h-4 text-gray-500" />
                                      <span className="text-sm font-medium text-gray-700">
                                        {new Date(summary.week_start).toLocaleDateString()} - {new Date(summary.week_end).toLocaleDateString()}
                                      </span>
                                      <Badge variant="secondary" className="text-xs">
                                        {summary.conversation_count} conversation{summary.conversation_count > 1 ? 's' : ''}
                                      </Badge>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => toggleSection(sectionId)}
                                      className="text-gray-500 hover:text-gray-700"
                                    >
                                      {isExpanded ? (
                                        <ChevronUp className="w-4 h-4" />
                                      ) : (
                                        <ChevronDown className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </div>

                                  <div className="mb-3">
                                    <h5 className="text-sm font-medium text-gray-800 mb-2">Key Points This Week:</h5>
                                    <ul className="space-y-1">
                                      {summary.key_points.map((point, index) => (
                                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                          <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                                          {point}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {isExpanded && (
                                    <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                          <div>
                                            <h6 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                              <Target className="w-4 h-4 text-orange-500" />
                                              Your Specific Triggers This Week
                                            </h6>
                                            <p className="text-sm text-gray-600">{explanation.triggerAnalysis}</p>
                                          </div>
                                          
                                          <div>
                                            <h6 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                              <Brain className="w-4 h-4 text-purple-500" />
                                              Therapy Selection & Your Progress
                                            </h6>
                                            <p className="text-sm text-gray-600">{explanation.therapeuticRationale}</p>
                                          </div>
                                        </div>

                                        <div className="space-y-3">
                                          <div>
                                            <h6 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                              <ClipboardList className="w-4 h-4 text-blue-500" />
                                              Detailed Follow-up Instructions
                                            </h6>
                                            <ul className="text-sm text-gray-600 space-y-1">
                                              {explanation.followUpInstructions.map((instruction, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                  <ArrowRight className="w-3 h-3 mt-0.5 text-blue-400 flex-shrink-0" />
                                                  {instruction}
                                                </li>
                                              ))}
                                            </ul>
                                          </div>

                                          <div>
                                            <h6 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                              <BarChart className="w-4 h-4 text-green-500" />
                                              Assessment & Progress Monitoring
                                            </h6>
                                            <p className="text-sm text-gray-600">{explanation.assessmentMethods}</p>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="border-t border-gray-100 pt-3">
                                        <h6 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                          <Lightbulb className="w-4 h-4 text-yellow-500" />
                                          Clinical Recommendations
                                        </h6>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                          {explanation.recommendations.map((rec, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                              <CheckCircle className="w-3 h-3 mt-0.5 text-green-400 flex-shrink-0" />
                                              {rec}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>
                                  )}
                                </Card>
                              );
                            })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
          </div>
        ))}
    </Card>
  );
};

export default InterventionSummariesSection;