import { supabase } from '@/integrations/supabase/client';
import { InterventionSummary } from '@/types/goals';
import { startOfWeek, endOfWeek, format } from 'date-fns';

export const interventionSummaryService = {
  async generateWeeklySummaries(): Promise<void> {
    // Database tables not ready yet
    console.log('Weekly summaries generation not yet implemented');
  },

  async getUserSummaries(weeks: number = 4): Promise<InterventionSummary[]> {
    return [];
  },

  async saveSummary(summaryData: Omit<InterventionSummary, 'id' | 'created_at' | 'updated_at'>): Promise<InterventionSummary> {
    throw new Error('Database tables not yet created');
  },

  filterMessagesByIntervention(messages: any[], interventionType: string): any[] {
    const keywords: { [key: string]: string[] } = {
      anxiety_management: ['anxiety', 'panic', 'worry', 'stress', 'nervous', 'anxious', 'calm', 'relax'],
      coping_strategies: ['coping', 'strategy', 'technique', 'breathing', 'grounding', 'strategy'],
      mindfulness: ['mindfulness', 'meditation', 'present', 'awareness', 'breathing', 'focus'],
      therapy_discussion: ['therapy', 'therapist', 'counseling', 'treatment', 'session', 'professional']
    };

    const relevantKeywords = keywords[interventionType] || [];
    
    return messages.filter(message => 
      relevantKeywords.some(keyword => 
        message.content.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  },

  generateKeyPoints(messages: any[], interventionType: string): string[] {
    // Simple keyword-based key point extraction
    const keyPoints: string[] = [];
    const userMessages = messages.filter(m => m.sender === 'user');
    const aiMessages = messages.filter(m => m.sender !== 'user');

    // Analyze patterns and generate key points
    if (userMessages.length > 0) {
      keyPoints.push(`User reported anxiety-related concerns ${userMessages.length} times this week`);
    }

    // Look for common themes
    const commonWords = this.extractCommonThemes(userMessages);
    if (commonWords.length > 0) {
      keyPoints.push(`Main topics discussed: ${commonWords.slice(0, 3).join(', ')}`);
    }

    // Check for coping strategies mentioned
    const copingMentioned = aiMessages.some(m => 
      m.content.toLowerCase().includes('breathing') || 
      m.content.toLowerCase().includes('technique') ||
      m.content.toLowerCase().includes('strategy')
    );
    
    if (copingMentioned) {
      keyPoints.push('Coping strategies and techniques were discussed');
    }

    // Check for progress indicators
    const progressWords = ['better', 'improved', 'helping', 'good', 'positive'];
    const hasProgress = userMessages.some(m => 
      progressWords.some(word => m.content.toLowerCase().includes(word))
    );
    
    if (hasProgress) {
      keyPoints.push('User reported some positive progress or improvements');
    }

    // Ensure we have at least some key points
    if (keyPoints.length === 0) {
      keyPoints.push(`${interventionType.replace('_', ' ')} discussions occurred`);
      keyPoints.push(`${messages.length} total messages exchanged`);
    }

    return keyPoints.slice(0, 10); // Max 10 key points
  },

  extractCommonThemes(messages: any[]): string[] {
    const text = messages.map(m => m.content.toLowerCase()).join(' ');
    const words = text.split(/\s+/).filter(word => word.length > 3);
    
    const wordCount: { [key: string]: number } = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // Filter out common words and return most frequent
    const commonWords = ['that', 'this', 'with', 'have', 'will', 'from', 'they', 'been', 'said', 'each', 'which', 'their', 'time', 'about'];
    const themes = Object.entries(wordCount)
      .filter(([word, count]) => count > 1 && !commonWords.includes(word))
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([word]) => word);

    return themes;
  },

  async exportSummariesReport(): Promise<string> {
    return '# Intervention Summaries Report\n\nNo data available yet. Database tables are being set up.';
  }
};