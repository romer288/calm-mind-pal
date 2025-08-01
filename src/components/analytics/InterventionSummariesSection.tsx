import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Calendar, TrendingUp, Brain, Heart, Shield, Users } from 'lucide-react';
import { InterventionSummary } from '@/types/goals';

interface InterventionSummariesSectionProps {
  summaries: InterventionSummary[];
}

const InterventionSummariesSection: React.FC<InterventionSummariesSectionProps> = ({ summaries }) => {
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

  const getInterventionExplanation = (type: string) => {
    const explanations = {
      anxiety_management: {
        clinical: "Anxiety management interventions focus on reducing acute anxiety symptoms through evidence-based techniques including breathing exercises, progressive muscle relaxation, and cognitive restructuring.",
        therapeutic: "These interventions target the physiological and cognitive components of anxiety, helping clients develop immediate coping skills and long-term resilience.",
        assessment: "Monitor effectiveness through anxiety level reduction, frequency of panic episodes, and client's perceived sense of control.",
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
                
                return (
                  <Card key={summary.id} className="p-6 border-l-4 border-l-blue-500">
                    <div className="space-y-6">
                      {/* Header with week info */}
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
                      </div>

                      {/* Clinical Analysis */}
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-blue-900 mb-2">Clinical Analysis</h4>
                        <p className="text-sm text-blue-800">{explanation.clinical}</p>
                      </div>

                      {/* Therapeutic Insights */}
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-green-900 mb-2">Therapeutic Insights</h4>
                        <p className="text-sm text-green-800">{explanation.therapeutic}</p>
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

                      {/* Assessment & Progress */}
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-purple-900 mb-2">Assessment & Progress Monitoring</h4>
                        <p className="text-sm text-purple-800">{explanation.assessment}</p>
                      </div>

                      {/* Clinical Recommendations */}
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h4 className="text-sm font-semibold text-orange-900 mb-3">Clinical Recommendations</h4>
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