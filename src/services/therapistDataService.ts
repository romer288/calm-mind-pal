import { supabase } from '@/integrations/supabase/client';

export interface TherapistData {
  id: string;
  name: string;
  specialty: string[];
  rating?: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email?: string;
  bio?: string;
  insurance: string[];
  acceptingPatients: boolean;
  acceptsUninsured: boolean;
  licensure: string;
  website?: string;
  practiceType: string; // individual, group, clinic
  yearsOfExperience?: number;
}

export interface TherapistSearchParams {
  zipCode: string;
  radius?: number; // miles
  specialty?: string;
  insuranceType?: string;
  acceptsUninsured?: boolean;
}

export class TherapistDataService {
  
  static async scrapeTherapistData(searchParams: TherapistSearchParams): Promise<{ success: boolean; data?: TherapistData[]; error?: string }> {
    try {
      console.log('Initiating therapist data scraping with params:', searchParams);
      
      const { data, error } = await supabase.functions.invoke('scrape-therapist-data', {
        body: {
          searchParams
        }
      });

      if (error) {
        console.error('Error scraping therapist data:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: data.therapists };
    } catch (error) {
      console.error('Error in therapist data service:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to scrape therapist data' 
      };
    }
  }

  static async searchCachedTherapists(searchParams: TherapistSearchParams): Promise<{ success: boolean; data?: TherapistData[]; error?: string }> {
    try {
      // For now, always use web scraping until Supabase types are updated
      return this.scrapeTherapistData(searchParams);
    } catch (error) {
      console.error('Error searching therapists:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to search therapists' 
      };
    }
  }

  private static getStateFromZip(zipCode: string): string {
    // This is a simplified mapping - in production, you'd use a proper ZIP to state service
    const zipToState: { [key: string]: string } = {
      '01': 'MA', '02': 'MA', '03': 'NH', '04': 'ME', '05': 'VT',
      '06': 'CT', '07': 'NJ', '08': 'NJ', '09': 'NJ', '10': 'NY',
      '11': 'NY', '12': 'NY', '13': 'NY', '14': 'NY', '15': 'PA',
      '16': 'PA', '17': 'PA', '18': 'PA', '19': 'PA', '20': 'DC',
      '21': 'MD', '22': 'VA', '23': 'VA', '24': 'VA', '25': 'MA',
      '26': 'MI', '27': 'MI', '28': 'NC', '29': 'SC', '30': 'GA',
      // Add more mappings as needed
    };
    
    const prefix = zipCode.substring(0, 2);
    return zipToState[prefix] || 'Unknown';
  }

  static getAnxietySpecialties(): string[] {
    return [
      'Anxiety Disorders',
      'Generalized Anxiety Disorder',
      'Panic Disorder',
      'Social Anxiety',
      'Phobias',
      'OCD',
      'PTSD',
      'Cognitive Behavioral Therapy',
      'Acceptance and Commitment Therapy',
      'Mindfulness-Based Therapy',
      'Exposure Therapy',
      'EMDR'
    ];
  }

  static getCommonInsuranceTypes(): string[] {
    return [
      'Aetna',
      'Anthem',
      'Blue Cross Blue Shield',
      'Cigna',
      'UnitedHealthcare',
      'Medicare',
      'Medicaid',
      'Harvard Pilgrim',
      'Tufts Health Plan',
      'Kaiser Permanente',
      'Humana',
      'Tricare'
    ];
  }
}