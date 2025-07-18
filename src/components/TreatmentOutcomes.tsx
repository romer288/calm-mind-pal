
import React from 'react';
import { Card } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { TrendingUp, TrendingDown, Minus, Target, Calendar } from 'lucide-react';
import { ClaudeAnxietyAnalysis } from '@/utils/claudeAnxietyAnalysis';
import { analyticsService, AnxietyTrend, TreatmentOutcome, ClaudeAnxietyAnalysisWithDate } from '@/services/analyticsService';
import { useWeeklyTrendsData } from '@/hooks/useWeeklyTrendsData';

interface TreatmentOutcomesProps {
  analyses: ClaudeAnxietyAnalysisWithDate[];
  showOnly?: 'trends' | 'outcomes' | 'all';
}

const TreatmentOutcomes: React.FC<TreatmentOutcomesProps> = ({ analyses, showOnly = 'all' }) => {
  // Create weekly aggregated anxiety level data
  const weeklyAnxietyData = React.useMemo(() => {
    if (analyses.length === 0) return [];
    
    const weeklyData: Record<string, { total: number; count: number }> = {};
    
    const getWeekStart = (date: Date): Date => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff));
    };

    const formatWeekRange = (weekStart: Date): string => {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const startMonth = weekStart.toLocaleDateString('en-US', { month: 'short' });
      const startDay = weekStart.getDate();
      const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
      const endDay = weekEnd.getDate();
      
      if (startMonth === endMonth) {
        return `${startMonth} ${startDay}-${endDay}`;
      } else {
        return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
      }
    };
    
    analyses.forEach(analysis => {
      const date = new Date(analysis.created_at || new Date());
      const weekStart = getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0];
      const anxietyLevel = analysis.anxietyLevel || 0;
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { total: 0, count: 0 };
      }
      
      weeklyData[weekKey].total += anxietyLevel;
      weeklyData[weekKey].count += 1;
    });
    
    return Object.keys(weeklyData)
      .sort((a, b) => a.localeCompare(b))
      .map(weekKey => {
        const weekStart = new Date(weekKey);
        const weekRange = formatWeekRange(weekStart);
        const avgAnxiety = Math.round((weeklyData[weekKey].total / weeklyData[weekKey].count) * 10) / 10;
        
        return {
          date: weekRange,
          anxietyLevel: avgAnxiety
        };
      })
      .slice(-5); // Last 5 weeks
  }, [analyses]);

  const dailyTrends = analyticsService.generateAnxietyTrends(analyses);
  const outcomes = analyticsService.calculateTreatmentOutcomes(dailyTrends);

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

  const CustomAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const dataIndex = payload.index;
    const item = weeklyAnxietyData[dataIndex];
    
    if (!item) return null;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text 
          x={0} 
          y={0} 
          dy={16} 
          textAnchor="middle" 
          fontSize={10} 
          fill="currentColor"
          transform="rotate(-15)"
        >
          {item.date}
        </text>
      </g>
    );
  };

  const chartConfig = {
    anxietyLevel: { label: 'Anxiety Level', color: '#3B82F6' }
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
          {weeklyAnxietyData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyAnxietyData} margin={{ top: 5, right: 30, left: 5, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    height={60}
                    interval="preserveStartEnd"
                    tick={<CustomAxisTick />}
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
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No trend data available yet
            </div>
          )}
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
