import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Calendar, TrendingUp, Brain, Heart, Shield, Users, ChevronDown, ChevronRight, AlertTriangle, Target, BookOpen, CheckCircle } from 'lucide-react';
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
        therapeutic: "These interventions target the physiological and cognitive components of anxiety, helping clients develop immediate coping skills and long-term resilience.",
        assessment: "Monitor effectiveness through anxiety level reduction, frequency of panic episodes, and client's perceived sense of control.",
        triggerAnalysis: "Common triggers that necessitate anxiety management include: acute stress situations, anticipatory anxiety before events, panic attack episodes, somatic symptoms (rapid heartbeat, sweating), catastrophic thinking patterns, and overwhelming feelings of dread or impending doom.",
        therapyRationale: "Anxiety management therapy was selected because the client demonstrated high physiological arousal, cognitive distortions related to threat perception, and avoidance behaviors that maintain the anxiety cycle. This approach directly addresses the fight-or-flight response while building coping resilience.",
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
        therapeutic: "These practices help clients develop meta-cognitive awareness, reducing the tendency to get caught in anxiety-provoking thought patterns while building distress tolerance.",
        assessment: "Evaluate progress through improved emotional regulation, reduced mind-wandering, increased present-moment awareness, and decreased reactivity to stressors.",
        triggerAnalysis: "Mindfulness interventions are triggered by: rumination cycles, emotional dysregulation, racing thoughts, difficulty concentrating, feeling overwhelmed by multiple stressors, disconnection from the present moment, and reactive responses to emotional stimuli.",
        therapyRationale: "Mindfulness therapy was chosen because the client exhibited patterns of rumination, difficulty staying present, emotional reactivity, and tendency to get caught in worry cycles. This approach helps break the cycle of automatic negative thoughts and builds emotional resilience.",
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
        therapeutic: "These interventions build the client's toolkit of healthy responses to stress, replacing maladaptive coping patterns with evidence-based strategies that promote resilience.",
        assessment: "Monitor through frequency of strategy use, effectiveness in real-world situations, and client's confidence in managing future stressors.",
        triggerAnalysis: "Coping strategy interventions are needed when clients exhibit: maladaptive coping behaviors (substance use, avoidance, aggression), feeling helpless in stressful situations, lack of problem-solving skills, emotional overwhelm without healthy outlets, and repeated use of ineffective strategies.",
        therapyRationale: "Coping strategies therapy was implemented because the client demonstrated poor stress management skills, reliance on avoidance behaviors, and lack of effective problem-solving techniques. This approach builds a comprehensive toolkit for managing various stressors adaptively.",
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
        therapeutic: "These interventions bridge the gap between formal therapy sessions, providing continuous support and reinforcing therapeutic gains in daily life.",
        assessment: "Measure through therapy attendance, homework completion, application of therapeutic concepts, and overall treatment engagement.",
        triggerAnalysis: "Therapy support is indicated when clients show: poor therapy engagement, difficulty applying therapeutic concepts between sessions, feeling isolated or misunderstood, lack of progress in formal therapy, need for additional psychoeducation, or crisis situations requiring extra support.",
        therapyRationale: "Therapy support was provided because the client needed reinforcement of therapeutic concepts, additional psychoeducation about their condition, and support in applying therapeutic techniques in daily life. This approach enhances the effectiveness of formal therapy sessions.",
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
      therapeutic: "General therapeutic support focusing on client stabilization and symptom management.",
      assessment: "Monitor client progress through standardized measures and clinical observation.",
      triggerAnalysis: "Triggers require individual assessment based on client presentation and specific needs.",
      therapyRationale: "Therapy approach selected based on individual client assessment and evidence-based practice guidelines.",
      followUpInstructions: ["Conduct thorough clinical assessment", "Develop individualized treatment plan", "Regular progress monitoring"],
      recommendations: ["Conduct thorough clinical assessment", "Develop individualized treatment plan", "Regular progress monitoring", "Adjust interventions based on client response"]
    };
  };

  // Group summaries by intervention type
  const groupedSummaries = summaries.reduce((acc, summary) => {
    if (!acc[summary.intervention_type]) {
      acc[summary.intervention_type] = [];
    }
    acc[summary.intervention_type].push(summary);
    return acc;
  }, {} as Record<string, InterventionSummary[]>);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Weekly Intervention Summaries</h2>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedSummaries).map(([interventionType, interventionSummaries]) => (
          <div key={interventionType} className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={getInterventionColor(interventionType)}>
                {formatInterventionType(interventionType)}
              </Badge>
              <span className="text-sm text-gray-500">
                {interventionSummaries.length} week{interventionSummaries.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-6">
              {(interventionSummaries as InterventionSummary[]).map((summary) => {
                const Icon = getInterventionIcon(interventionType);
                const explanation = getInterventionExplanation(interventionType);
                const summaryId = `${interventionType}-${summary.id}`;
                const isExpanded = expandedSections[summaryId];
                
                return (
                  <Card key={summary.id} className="p-6 border-l-4 border-l-blue-500">
                    <div className="space-y-6">
                      {/* Header with week info and expand button */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-blue-600" />
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {formatInterventionType(interventionType)} - Week Analysis
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(summary.week_start).toLocaleDateString()} - {new Date(summary.week_end).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                <span>{summary.conversation_count} conversations</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleSection(summaryId)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronRight className="w-4 h-4" />
                              Show Details
                            </>
                          )}
                        </button>
                      </div>

                      {/* Week Summary */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Weekly Summary & Key Points</h4>
                        <ul className="space-y-2">
                          {summary.key_points.map((point, index) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Expandable Detailed Analysis */}
                      {isExpanded && (
                        <div className="space-y-6 border-t pt-6">
                          {/* Personalized Trigger Analysis */}
                          <div className="bg-red-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                              <h4 className="text-sm font-semibold text-red-900">Your Specific Triggers This Week</h4>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <p className="text-sm font-medium text-red-900 mb-2">Identified triggers from your conversations:</p>
                                <ul className="space-y-1">
                                  {summary.key_points.slice(0, 3).map((point, index) => (
                                    <li key={index} className="text-sm text-red-800 flex items-start gap-2">
                                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                                      <span className="font-medium">"{point}"</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-red-900 mb-1">Why these specific situations trigger you:</p>
                                <p className="text-sm text-red-800">
                                  These triggers activate your anxiety because they represent situations where you feel {interventionType === 'anxiety_management' ? 'out of control or overwhelmed by immediate stressors' : interventionType === 'mindfulness' ? 'disconnected from the present moment and caught in worry cycles' : interventionType === 'coping_strategies' ? 'unprepared or lacking effective tools to handle the situation' : 'in need of additional support beyond your current coping resources'}. Your mind perceives these as threats requiring immediate attention and protection.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Combined Therapy Analysis & Effectiveness */}
                          <div className="bg-blue-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <Target className="w-5 h-5 text-blue-600" />
                              <h4 className="text-sm font-semibold text-blue-900">Therapy Selection & Your Progress</h4>
                            </div>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm font-medium text-blue-900 mb-2">Why we selected this approach based on your triggers:</p>
                                <p className="text-sm text-blue-800">
                                  {(() => {
                                    const keyPointsText = summary.key_points.join(' ').toLowerCase();
                                    const hasExposure = keyPointsText.includes('exposure') || keyPointsText.includes('gradual');
                                    const hasCognitive = keyPointsText.includes('cognitive') || keyPointsText.includes('thought');
                                    const hasSocial = keyPointsText.includes('social') || keyPointsText.includes('judgment') || keyPointsText.includes('interaction');
                                    const hasMindfulness = keyPointsText.includes('mindfulness') || keyPointsText.includes('present');
                                    
                                    if (hasSocial && (hasExposure || hasCognitive)) {
                                      return "Your triggers around social situations and fear of judgment require a combination of cognitive restructuring and gradual exposure. This approach helps you challenge negative thoughts about social interactions while building confidence through controlled practice.";
                                    } else if (hasCognitive && hasExposure) {
                                      return "We're using cognitive restructuring to challenge negative thought patterns while gradual exposure helps you face feared situations. This combination addresses both the thinking patterns and behavioral avoidance maintaining your anxiety.";
                                    } else if (hasMindfulness || interventionType === 'mindfulness') {
                                      return "Mindfulness-based interventions help you stay present rather than getting caught in anxiety-provoking thoughts. This approach builds awareness of your triggers and creates space between you and your anxious thoughts.";
                                    } else if (hasSocial) {
                                      return "Your social anxiety triggers require an approach that builds confidence in interpersonal situations while reducing fear of judgment from others.";
                                    } else {
                                      return `Your specific triggers require a ${formatInterventionType(interventionType)} approach that directly addresses the situations causing you distress while building practical coping skills.`;
                                    }
                                  })()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-blue-900 mb-2">How you're progressing this week:</p>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
                                      <span>Engagement Level</span>
                                      <span>{Math.min(100, (summary.conversation_count / 7) * 100).toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-blue-200 rounded-full h-2">
                                      <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                                        style={{ width: `${Math.min(100, (summary.conversation_count / 7) * 100)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">
                                    {summary.conversation_count >= 5 ? 'Excellent' : summary.conversation_count >= 3 ? 'Good' : 'Needs Improvement'}
                                  </Badge>
                                </div>
                                <p className="text-sm text-blue-800 mt-2">
                                  {summary.conversation_count >= 5 ? 'You\'re actively engaging with therapy and showing strong commitment to your mental health journey.' : 
                                   summary.conversation_count >= 3 ? 'You\'re making good progress with regular therapy engagement. Consider increasing frequency for better results.' :
                                   'Limited engagement this week. More frequent sessions would help accelerate your progress and build stronger coping skills.'}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm text-blue-800">
                                  <span className="font-medium">Clinical insight:</span> {explanation.clinical} {explanation.therapeutic}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Follow-up Instructions */}
                          <div className="bg-indigo-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <BookOpen className="w-5 h-5 text-indigo-600" />
                              <h4 className="text-sm font-semibold text-indigo-900">Detailed Follow-up Instructions</h4>
                            </div>
                            <ul className="space-y-3">
                              {explanation.followUpInstructions.map((instruction, index) => (
                                <li key={index} className="text-sm text-indigo-800 flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                                  <span>{instruction}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Assessment & Progress */}
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <TrendingUp className="w-5 h-5 text-purple-600" />
                              <h4 className="text-sm font-semibold text-purple-900">Assessment & Progress Monitoring</h4>
                            </div>
                            <p className="text-sm text-purple-800">{explanation.assessment}</p>
                          </div>

                          {/* Clinical Recommendations */}
                          <div className="bg-orange-50 p-4 rounded-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <Shield className="w-5 h-5 text-orange-600" />
                              <h4 className="text-sm font-semibold text-orange-900">Clinical Recommendations</h4>
                            </div>
                            <ul className="space-y-2">
                              {explanation.recommendations.map((rec, index) => (
                                <li key={index} className="text-sm text-orange-800 flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                                  <span>{rec}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default InterventionSummariesSection;