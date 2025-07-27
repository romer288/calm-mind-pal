import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { GoalWithProgress } from '@/types/goals';

interface GoalProgressSectionProps {
  goals: GoalWithProgress[];
}

const GoalProgressSection: React.FC<GoalProgressSectionProps> = ({ goals }) => {
  if (goals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Goal Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No goals set yet. Start by creating some goals to track your progress.</p>
        </CardContent>
      </Card>
    );
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      treatment: 'bg-blue-500',
      'self-care': 'bg-green-500',
      therapy: 'bg-purple-500',
      mindfulness: 'bg-indigo-500',
      exercise: 'bg-orange-500',
      social: 'bg-pink-500',
      work: 'bg-yellow-500',
      sleep: 'bg-cyan-500',
      nutrition: 'bg-emerald-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const totalGoals = goals.length;
  const completedGoals = goals.filter(goal => goal.completion_rate >= 80).length;
  const averageProgress = goals.reduce((sum, goal) => sum + goal.average_score, 0) / goals.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎯 Goal Progress Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalGoals}</div>
            <div className="text-sm text-blue-600">Active Goals</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{completedGoals}</div>
            <div className="text-sm text-green-600">Completed</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{averageProgress.toFixed(1)}/10</div>
            <div className="text-sm text-purple-600">Avg Progress</div>
          </div>
        </div>

        <div className="space-y-4">
          {goals.map(goal => (
            <div key={goal.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getCategoryColor(goal.category)}`}></div>
                  <h4 className="font-medium">{goal.title}</h4>
                </div>
                <div className="text-sm text-muted-foreground">
                  {goal.average_score.toFixed(1)}/10
                </div>
              </div>
              <Progress value={goal.completion_rate} className="mb-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{goal.category}</span>
                <span>{goal.completion_rate}% complete</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default GoalProgressSection;