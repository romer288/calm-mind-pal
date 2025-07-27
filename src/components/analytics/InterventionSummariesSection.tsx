import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Calendar, TrendingUp } from 'lucide-react';
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(interventionSummaries as InterventionSummary[]).map((summary) => (
                <Card key={summary.id} className="p-4 border-l-4 border-l-blue-500">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(summary.week_start).toLocaleDateString()} - {new Date(summary.week_end).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <TrendingUp className="w-4 h-4" />
                      <span>{summary.conversation_count} conversations</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Key Points:</h4>
                    <ul className="space-y-1">
                      {summary.key_points.slice(0, 5).map((point, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                      {summary.key_points.length > 5 && (
                        <li className="text-sm text-gray-500 italic">
                          +{summary.key_points.length - 5} more points...
                        </li>
                      )}
                    </ul>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default InterventionSummariesSection;