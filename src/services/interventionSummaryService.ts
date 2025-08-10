import { supabase } from '@/integrations/supabase/client';
import { InterventionSummary } from '@/types/goals';

export const interventionSummaryService = {
  async generateWeeklySummaries(): Promise<Omit<InterventionSummary, 'id' | 'created_at' | 'updated_at'>[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get anxiety analyses from the last 4 weeks (not chat messages!)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const { data: analyses, error } = await supabase
      .from('anxiety_analyses')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', fourWeeksAgo.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('📊 Found anxiety analyses:', analyses?.length || 0);

    const summaries: Omit<InterventionSummary, 'id' | 'created_at' | 'updated_at'>[] = [];
    const interventionTypes = ['anxiety_management', 'mindfulness', 'coping_strategies', 'therapy_support'];
    
    // Group by weeks
    const weeks = this.groupAnalysesByWeek(analyses || []);
    console.log('📅 Grouped into weeks:', Object.keys(weeks));
    
    for (const [weekKey, weekAnalyses] of Object.entries(weeks)) {
      console.log(`📅 Processing week ${weekKey} with ${(weekAnalyses as any[]).length} analyses`);
      
      for (const interventionType of interventionTypes) {
        const relevantAnalyses = this.filterAnalysesByIntervention(weekAnalyses as any[], interventionType);
        console.log(`🎯 Found ${relevantAnalyses.length} ${interventionType} analyses for week ${weekKey}`);
        
        if (relevantAnalyses.length > 0) {
          const keyPoints = this.generateKeyPointsFromAnalyses(relevantAnalyses, interventionType);
          const [weekStart, weekEnd] = weekKey.split('_').map(date => new Date(date));
          
          const summary: Omit<InterventionSummary, 'id' | 'created_at' | 'updated_at'> = {
            user_id: user.id,
            week_start: weekStart.toISOString().split('T')[0],
            week_end: weekEnd.toISOString().split('T')[0],
            intervention_type: interventionType,
            key_points: keyPoints.slice(0, 10), // Limit to 10 points
            conversation_count: relevantAnalyses.length
          };
          
          console.log('📋 Created summary:', summary);
          summaries.push(summary);
        }
      }
    }

    console.log('📊 Total summaries created:', summaries.length);
    return summaries;
  },

  groupAnalysesByWeek(analyses: any[]): Record<string, any[]> {
    const weeks: Record<string, any[]> = {};
    
    analyses.forEach(analysis => {
      const analysisDate = new Date(analysis.created_at);
      const weekStart = new Date(analysisDate);
      weekStart.setDate(analysisDate.getDate() - analysisDate.getDay()); // Start of week (Sunday)
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
      
      const weekKey = `${weekStart.toISOString().split('T')[0]}_${weekEnd.toISOString().split('T')[0]}`;
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = [];
      }
      weeks[weekKey].push(analysis);
    });
    
    return weeks;
  },

  filterAnalysesByIntervention(analyses: any[], interventionType: string): any[] {
    console.log(`🔍 Filtering ${analyses.length} analyses for intervention type: ${interventionType}`);
    
    const filtered = analyses.filter(analysis => {
      // Check if this analysis has recommended interventions that match the type
      const interventions = analysis.coping_strategies || analysis.recommendedInterventions || [];
      console.log(`🎯 Analysis ID ${analysis.id} has ${interventions.length} strategies:`, interventions);
      console.log(`🔍 Full analysis object:`, {
        id: analysis.id,
        coping_strategies: analysis.coping_strategies,
        recommendedInterventions: analysis.recommendedInterventions,
        anxiety_level: analysis.anxiety_level
      });
      
      switch (interventionType) {
        case 'anxiety_management':
          const isAnxietyManagement = interventions.some((strategy: string) => 
            strategy.toLowerCase().includes('breathing') ||
            strategy.toLowerCase().includes('relax') ||
            strategy.toLowerCase().includes('calm') ||
            strategy.toLowerCase().includes('anxiety') ||
            strategy.toLowerCase().includes('muscle')
          ) || analysis.anxiety_level > 0; // Include any analysis with anxiety data
          
          if (isAnxietyManagement) {
            console.log(`✅ Including for anxiety_management: anxiety_level=${analysis.anxiety_level}, strategies=${interventions}`);
          }
          return isAnxietyManagement;
          
        case 'coping_strategies':
          const isCoping = interventions.some((strategy: string) => 
            strategy.toLowerCase().includes('coping') ||
            strategy.toLowerCase().includes('strategy') ||
            strategy.toLowerCase().includes('technique') ||
            strategy.toLowerCase().includes('grounding') ||
            strategy.toLowerCase().includes('skills') ||
            strategy.toLowerCase().includes('restructuring') ||
            strategy.toLowerCase().includes('training')
          ) || interventions.length > 0; // Include any analysis with strategies
          
          if (isCoping) {
            console.log(`✅ Including for coping_strategies: strategies=${interventions}`);
          }
          return isCoping;
          
        case 'mindfulness':
          const isMindfulness = interventions.some((strategy: string) => 
            strategy.toLowerCase().includes('mindfulness') ||
            strategy.toLowerCase().includes('meditation') ||
            strategy.toLowerCase().includes('present') ||
            strategy.toLowerCase().includes('awareness')
          );
          
          if (isMindfulness) {
            console.log(`✅ Including for mindfulness: strategies=${interventions}`);
          }
          return isMindfulness;
          
        case 'therapy_support':
          const isTherapy = interventions.some((strategy: string) => 
            strategy.toLowerCase().includes('therapy') ||
            strategy.toLowerCase().includes('counseling') ||
            strategy.toLowerCase().includes('professional') ||
            strategy.toLowerCase().includes('exposure') ||
            strategy.toLowerCase().includes('systematic') ||
            strategy.toLowerCase().includes('desensitization')
          ) || (analysis.personalized_response && analysis.personalized_response.length > 100); // Include analyses with detailed professional responses
          
          if (isTherapy) {
            console.log(`✅ Including for therapy_support: strategies=${interventions}, has_response=${!!analysis.personalized_response}`);
          }
          return isTherapy;
          
        default:
          return false;
      }
    });
    
    console.log(`📊 Filtered ${filtered.length} analyses for ${interventionType}`);
    return filtered;
  },

  generateKeyPointsFromAnalyses(analyses: any[], interventionType: string): string[] {
    const keyPoints: string[] = [];
    
    // Analyze anxiety levels
    const anxietyLevels = analyses.map(a => a.anxiety_level).filter(level => level !== null);
    if (anxietyLevels.length > 0) {
      const avgLevel = anxietyLevels.length > 0 && !isNaN(anxietyLevels.reduce((sum, level) => sum + level, 0) / anxietyLevels.length) ? (anxietyLevels.reduce((sum, level) => sum + level, 0) / anxietyLevels.length).toFixed(1) : '0.0';
      keyPoints.push(`Average anxiety level: ${avgLevel}/10 across ${anxietyLevels.length} sessions`);
    }
    
    // Extract common triggers
    const allTriggers = analyses.flatMap(a => a.anxiety_triggers || []).filter(Boolean);
    const triggerCounts: { [key: string]: number } = {};
    allTriggers.forEach(trigger => {
      if (typeof trigger === 'string') {
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
      }
    });
    
    const topTriggers = Object.entries(triggerCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([trigger]) => trigger);
      
    if (topTriggers.length > 0) {
      keyPoints.push(`Main anxiety triggers: ${topTriggers.join(', ')}`);
    }
    
    // Generate specific actionable strategies based on intervention type
    const specificStrategies = this.generateSpecificStrategies(analyses, interventionType);
    keyPoints.push(...specificStrategies);
    
    // Add intervention-specific insights
    keyPoints.push(`${analyses.length} ${interventionType.replace('_', ' ')} sessions completed`);
    
    return keyPoints.slice(0, 10);
  },

  generateSpecificStrategies(analyses: any[], interventionType: string): string[] {
    const strategies: string[] = [];
    
    // Extract all recommended interventions/strategies from analyses
    const allInterventions = analyses.flatMap(a => 
      (a.coping_strategies || []).concat(a.recommendedInterventions || [])
    ).filter(Boolean);
    
    // Generate specific actionable strategies based on intervention type
    switch (interventionType) {
      case 'anxiety_management':
        strategies.push('BREATHING TECHNIQUES:');
        strategies.push('• Practice 4-7-8 breathing: Inhale for 4, hold for 7, exhale for 8');
        strategies.push('• Use box breathing during stress: 4 counts in, 4 hold, 4 out, 4 hold');
        strategies.push('• Try diaphragmatic breathing: Place hand on chest and belly, breathe so only belly rises');
        
        if (allInterventions.some(i => i.toLowerCase().includes('muscle'))) {
          strategies.push('MUSCLE RELAXATION:');
          strategies.push('• Tense and release each muscle group for 5 seconds, starting with toes');
          strategies.push('• Use progressive muscle relaxation: Start with feet, work up to head');
        }
        break;
        
      case 'coping_strategies':
        strategies.push('COGNITIVE STRATEGIES:');
        strategies.push('• Challenge negative thoughts: Ask "Is this thought realistic? What evidence supports/contradicts it?"');
        strategies.push('• Use the 5-4-3-2-1 grounding technique: 5 things you see, 4 hear, 3 feel, 2 smell, 1 taste');
        strategies.push('• Practice thought stopping: Say "STOP" when anxious thoughts arise, then redirect to positive activity');
        
        if (allInterventions.some(i => i.toLowerCase().includes('social'))) {
          strategies.push('SOCIAL SKILLS TRAINING:');
          strategies.push('• Practice small talk with cashiers or service workers daily');
          strategies.push('• Make eye contact for 3-5 seconds during conversations');
          strategies.push('• Use conversation starters: "How has your day been?" or comment on shared environment');
          strategies.push('• Practice active listening: Repeat back what the person said before responding');
        }
        break;
        
      case 'mindfulness':
        strategies.push('MINDFULNESS PRACTICES:');
        strategies.push('• Practice daily 10-minute mindfulness meditation using apps like Headspace or Calm');
        strategies.push('• Do body scan meditation: Focus attention slowly from toes to head');
        strategies.push('• Use mindful walking: Focus on feeling of feet touching ground, pace of breathing');
        strategies.push('• Practice mindful eating: Eat one meal per day slowly, focusing on taste, texture, temperature');
        break;
        
      case 'therapy_support':
        if (allInterventions.some(i => i.toLowerCase().includes('exposure'))) {
          strategies.push('EXPOSURE THERAPY TECHNIQUES:');
          strategies.push('• Create exposure hierarchy: List feared situations from least to most anxiety-provoking');
          strategies.push('• Start with least feared situation, practice until anxiety reduces by 50%');
          strategies.push('• Use systematic desensitization: Combine relaxation with gradual exposure');
        }
        
        strategies.push('PROFESSIONAL SUPPORT:');
        strategies.push('• Schedule weekly therapy sessions with CBT-trained therapist');
        strategies.push('• Keep daily mood and anxiety journal to discuss in therapy');
        strategies.push('• Practice homework assignments between sessions consistently');
        break;
    }
    
    return strategies;
  },

  async getUserSummaries(): Promise<InterventionSummary[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: summaries, error } = await supabase
      .from('intervention_summaries')
      .select('*')
      .eq('user_id', user.id)
      .order('week_start', { ascending: false });

    if (error) throw error;
    return summaries || [];
  },

  async saveSummary(summary: Omit<InterventionSummary, 'id' | 'created_at' | 'updated_at'>): Promise<InterventionSummary> {
    const { data: savedSummary, error } = await supabase
      .from('intervention_summaries')
      .insert(summary)
      .select()
      .single();

    if (error) throw error;
    return savedSummary;
  },

  async generateAndSaveSummaries(): Promise<void> {
    try {
      console.log('🔄 Starting generateAndSaveSummaries...');
      
      // Check user authentication first
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user:', user?.id || 'NO USER');
      
      if (!user) {
        console.error('❌ No authenticated user found');
        throw new Error('User not authenticated');
      }
      
      console.log('📡 About to call generateWeeklySummaries...');
      const summaries = await this.generateWeeklySummaries();
      console.log('📊 Generated summaries:', summaries.length);
      console.log('📋 Summary details:', summaries);
      
      if (summaries.length === 0) {
        console.log('⚠️ No summaries generated');
        return;
      }
      
      // Save each summary to database
      for (const summary of summaries) {
        try {
          console.log('🔄 Processing summary:', {
            type: summary.intervention_type,
            week: `${summary.week_start} to ${summary.week_end}`,
            keyPoints: summary.key_points.length,
            conversationCount: summary.conversation_count
          });
          
          // Check if summary already exists for this week and intervention type
          const { data: existing } = await supabase
            .from('intervention_summaries')
            .select('id')
            .eq('user_id', summary.user_id)
            .eq('week_start', summary.week_start)
            .eq('intervention_type', summary.intervention_type)
            .single();
            
          if (!existing) {
            console.log('💾 Saving new summary:', summary.intervention_type, summary.week_start);
            const savedSummary = await this.saveSummary(summary);
            console.log('✅ Successfully saved summary:', savedSummary.id);
          } else {
            console.log('⏭️ Summary already exists for:', summary.intervention_type, summary.week_start);
          }
        } catch (error) {
          console.error('❌ Error saving summary:', error);
          console.error('❌ Error details:', error);
        }
      }
      console.log('✅ Finished generateAndSaveSummaries');
    } catch (error) {
      console.error('❌ Error in generateAndSaveSummaries:', error);
      console.error('❌ Error stack:', error.stack);
      throw error;
    }
  },

  async exportSummariesReport(): Promise<string> {
    const summaries = await this.getUserSummaries();
    if (summaries.length === 0) {
      return "No intervention summaries available yet. Start conversations to generate weekly summaries.";
    }

    let report = "# Weekly Intervention Summaries Report\n\n";
    report += `Generated on: ${new Date().toLocaleDateString()}\n\n`;

    // Group by intervention type
    const groupedSummaries = summaries.reduce((acc, summary) => {
      if (!acc[summary.intervention_type]) {
        acc[summary.intervention_type] = [];
      }
      acc[summary.intervention_type].push(summary);
      return acc;
    }, {} as Record<string, InterventionSummary[]>);

    for (const [interventionType, interventionSummaries] of Object.entries(groupedSummaries)) {
      report += `## ${interventionType.replace('_', ' ').toUpperCase()}\n\n`;
      
      (interventionSummaries as InterventionSummary[]).forEach(summary => {
        report += `### Week of ${summary.week_start} to ${summary.week_end}\n`;
        report += `**Conversations:** ${summary.conversation_count}\n\n`;
        report += "**Key Points:**\n";
        summary.key_points.forEach((point, index) => {
          report += `${index + 1}. ${point}\n`;
        });
        report += "\n";
      });
    }

    return report;
  }
};