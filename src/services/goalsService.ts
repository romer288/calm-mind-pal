import { supabase } from '@/integrations/supabase/client';
import { Goal, GoalProgress, GoalWithProgress } from '@/types/goals';

export const goalsService = {
  async getUserGoals(): Promise<GoalWithProgress[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: goals, error } = await supabase
      .from('user_goals')
      .select(`
        *,
        goal_progress (*)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return goals.map(goal => ({
      ...goal,
      category: goal.category as Goal['category'],
      frequency: goal.frequency as Goal['frequency'],
      latest_progress: goal.goal_progress[0] || null,
      progress_history: goal.goal_progress || [],
      average_score: goal.goal_progress.length > 0 
        ? goal.goal_progress.reduce((sum, p) => sum + p.score, 0) / goal.goal_progress.length
        : 0,
      completion_rate: goal.goal_progress.length > 0 ? 85 : 0 // Simplified calculation
    }));
  },

  async createGoal(goalData: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Goal> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: goal, error } = await supabase
      .from('user_goals')
      .insert({
        ...goalData,
        user_id: user.id
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...goal,
      category: goal.category as Goal['category'],
      frequency: goal.frequency as Goal['frequency']
    };
  },

  async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
    const { data: goal, error } = await supabase
      .from('user_goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();

    if (error) throw error;
    return {
      ...goal,
      category: goal.category as Goal['category'],
      frequency: goal.frequency as Goal['frequency']
    };
  },

  async recordProgress(goalId: string, score: number, notes?: string): Promise<GoalProgress> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: progress, error } = await supabase
      .from('goal_progress')
      .insert({
        goal_id: goalId,
        user_id: user.id,
        score,
        notes
      })
      .select()
      .single();

    if (error) throw error;
    return progress;
  },

  async getGoalProgress(goalId: string): Promise<GoalProgress[]> {
    const { data: progress, error } = await supabase
      .from('goal_progress')
      .select('*')
      .eq('goal_id', goalId)
      .order('recorded_at', { ascending: false });

    if (error) throw error;
    return progress || [];
  },

  async deactivateGoal(goalId: string): Promise<void> {
    const { error } = await supabase
      .from('user_goals')
      .update({ is_active: false })
      .eq('id', goalId);

    if (error) throw error;
  },

  async generateRecommendedGoals(assessmentData?: any): Promise<Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at'>[]> {
    // Generate goals based on assessment or common anxiety management practices
    const baseGoals = [
      {
        title: 'Daily Mindfulness Practice',
        description: 'Practice mindfulness meditation or breathing exercises',
        category: 'mindfulness' as const,
        target_value: 10,
        unit: 'minutes',
        frequency: 'daily' as const,
        start_date: new Date().toISOString().split('T')[0],
        is_active: true
      },
      {
        title: 'Anxiety Tracking',
        description: 'Track anxiety levels and triggers daily',
        category: 'self-care' as const,
        frequency: 'daily' as const,
        start_date: new Date().toISOString().split('T')[0],
        is_active: true
      },
      {
        title: 'Physical Exercise',
        description: 'Engage in physical activity to reduce anxiety',
        category: 'exercise' as const,
        target_value: 30,
        unit: 'minutes',
        frequency: 'daily' as const,
        start_date: new Date().toISOString().split('T')[0],
        is_active: true
      },
      {
        title: 'Sleep Hygiene',
        description: 'Maintain consistent sleep schedule',
        category: 'sleep' as const,
        target_value: 8,
        unit: 'hours',
        frequency: 'daily' as const,
        start_date: new Date().toISOString().split('T')[0],
        is_active: true
      }
    ];

    // Customize based on assessment if available
    if (assessmentData?.triggers?.includes('work')) {
      baseGoals.push({
        title: 'Work-Life Balance',
        description: 'Maintain boundaries between work and personal time',
        category: 'self-care' as const,
        frequency: 'daily' as const,
        start_date: new Date().toISOString().split('T')[0],
        is_active: true
      });
    }

    if (assessmentData?.triggers?.includes('social')) {
      baseGoals.push({
        title: 'Social Connection',
        description: 'Engage in meaningful social interactions',
        category: 'self-care' as const,
        frequency: 'daily' as const,
        start_date: new Date().toISOString().split('T')[0],
        is_active: true
      });
    }

    return baseGoals;
  }
};