
import React from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp, TrendingDown, Minus, Target, Calendar } from 'lucide-react';
import { ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';
import { analyticsService, AnxietyTrend, TreatmentOutcome, ClaudeAnxietyAnalysisWithDate } from '@/services/analyticsService';

interface TreatmentOutcomesProps {
  analyses: ClaudeAnxietyAnalysisWithDate[];
  showOnly?: 'trends' | 'outcomes' | 'all';
}

const TreatmentOutcomes: React.FC<TreatmentOutcomesProps> = ({ analyses, showOnly = 'all' }) => {
  const trends = analyticsService.generateAnxietyTrends(analyses);
  const outcomes = analyticsService.calculateTreatmentOutcomes(trends);

  const getTrendIcon = (effectiveness: string) => {
    switch (effectiveness) {
      case 'improving': return <TrendingDown className="w-4 h-4 text-green-600" />;
      case 'declining': return <TrendingUp className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (effectiveness: string) => {
    switch (effectiveness) {
      case 'improving': return 'text-green-600 bg-green-50';
      case 'declining': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const chartConfig = {
    anxietyLevel: { label: 'Anxiety Level', color: '#3B82F6' },
    treatmentResponse: { label: 'Treatment Response', color: '#10B981' }
  };

  if (analyses.length === 0) {
    return (
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Treatment Outcomes</h3>
          <p className="text-gray-600">Start tracking your anxiety to see treatment outcomes and trends.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Anxiety Trend Chart */}
      {(showOnly === 'trends' || showOnly === 'all') && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Anxiety Level Trends</h3>
          </div>
          
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis domain={[0, 10]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="anxietyLevel" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>
      )}

      {/* Treatment Effectiveness by Week */}
      {(showOnly === 'outcomes' || showOnly === 'all') && outcomes.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Weekly Treatment Outcomes</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            {outcomes.slice(-3).map((outcome, index) => (
              <div 
                key={outcome.period}
                className={`p-4 rounded-lg border ${getTrendColor(outcome.treatmentEffectiveness)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{outcome.period}</span>
                  {getTrendIcon(outcome.treatmentEffectiveness)}
                </div>
                <div className="space-y-1">
                  <div className="text-sm">
                    <span className="text-gray-600">Avg Anxiety: </span>
                    <span className="font-medium">{outcome.averageAnxiety}/10</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-600">Change: </span>
                    <span className={`font-medium ${outcome.improvement > 0 ? 'text-green-600' : outcome.improvement < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {outcome.improvement > 0 ? '+' : ''}{outcome.improvement}
                    </span>
                  </div>
                  <div className="text-xs capitalize font-medium">
                    {outcome.treatmentEffectiveness}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <ChartContainer config={chartConfig} className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={outcomes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="averageAnxiety" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>
      )}

      {/* Treatment Recommendations */}
      {(showOnly === 'outcomes' || showOnly === 'all') && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Treatment Insights for Therapists</h3>
          
          <div className="space-y-4">
            {outcomes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Current Trend</h4>
                  <p className="text-sm text-blue-800">
                    Treatment is showing {outcomes[outcomes.length - 1]?.treatmentEffectiveness} results
                    with an average anxiety level of {outcomes[outcomes.length - 1]?.averageAnxiety}/10
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Intervention Success</h4>
                  <p className="text-sm text-purple-800">
                    {outcomes.filter(o => o.treatmentEffectiveness === 'improving').length} of {outcomes.length} weeks 
                    showed improvement
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600">Collect more data over time to see treatment effectiveness patterns.</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default TreatmentOutcomes;
