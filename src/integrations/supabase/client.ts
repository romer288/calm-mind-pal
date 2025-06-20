
// Simple mock client for build compatibility
export const supabase = {
  functions: {
    invoke: async (functionName: string, options: any) => {
      throw new Error('Supabase not configured');
    }
  },
  auth: {
    getSession: async () => ({ data: { session: null }, error: null })
  }
};
