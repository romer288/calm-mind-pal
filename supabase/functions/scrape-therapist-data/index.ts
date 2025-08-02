import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'

interface TherapistSearchParams {
  zipCode: string;
  radius?: number;
  specialty?: string;
  insuranceType?: string;
  acceptsUninsured?: boolean;
}

interface ScrapedTherapist {
  name: string;
  specialty: string[];
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
  practiceType: string;
  yearsOfExperience?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { searchParams } = await req.json()
    console.log('Received search params:', searchParams)

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')
    if (!firecrawlApiKey) {
      throw new Error('Firecrawl API key not configured')
    }

    // URLs to scrape for therapist data
    const therapistDirectoryUrls = [
      `https://www.psychologytoday.com/us/therapists/anxiety/${getStateFromZip(searchParams.zipCode)}`,
      `https://www.betterhelp.com/get-started/?utm_source=AdWords&utm_medium=Search_PPC_c&utm_term=anxiety+therapy_e&utm_content=135238249816&network=g&placement=&target=&matchtype=e&utm_campaign=17262099562`,
      `https://www.therapistlocator.net/anxiety-therapists/${getStateFromZip(searchParams.zipCode)}`,
      `https://www.mentalhealth.com/therapists/anxiety/${getStateFromZip(searchParams.zipCode)}`
    ]

    const allTherapists: ScrapedTherapist[] = []

    for (const url of therapistDirectoryUrls) {
      try {
        console.log(`Scraping: ${url}`)
        
        const crawlResponse = await fetch('https://api.firecrawl.dev/v0/crawl', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${firecrawlApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: url,
            crawlerOptions: {
              includes: ['*therapist*', '*provider*', '*counselor*'],
              excludes: ['*blog*', '*news*', '*article*'],
              limit: 50
            },
            pageOptions: {
              onlyMainContent: true,
              includeHtml: false,
              includeMarkdown: true
            }
          })
        })

        if (!crawlResponse.ok) {
          console.error(`Failed to initiate crawl for ${url}:`, crawlResponse.statusText)
          continue
        }

        const crawlData = await crawlResponse.json()
        console.log(`Crawl initiated for ${url}, job ID:`, crawlData.jobId)

        // Wait for crawl to complete
        let crawlStatus
        do {
          await new Promise(resolve => setTimeout(resolve, 3000)) // Wait 3 seconds
          
          const statusResponse = await fetch(`https://api.firecrawl.dev/v0/crawl/status/${crawlData.jobId}`, {
            headers: {
              'Authorization': `Bearer ${firecrawlApiKey}`,
            }
          })
          
          crawlStatus = await statusResponse.json()
          console.log(`Crawl status for ${url}:`, crawlStatus.status)
        } while (crawlStatus.status === 'active')

        if (crawlStatus.status === 'completed' && crawlStatus.data) {
          const extractedTherapists = extractTherapistData(crawlStatus.data, searchParams)
          allTherapists.push(...extractedTherapists)
          console.log(`Extracted ${extractedTherapists.length} therapists from ${url}`)
        }
      } catch (error) {
        console.error(`Error scraping ${url}:`, error)
        continue // Continue with next URL if one fails
      }
    }

    // Remove duplicates based on name and phone
    const uniqueTherapists = removeDuplicates(allTherapists)

    // Filter by search criteria
    const filteredTherapists = filterTherapists(uniqueTherapists, searchParams)

    console.log(`Total unique therapists found: ${uniqueTherapists.length}`)
    console.log(`Filtered therapists: ${filteredTherapists.length}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        therapists: filteredTherapists,
        totalFound: uniqueTherapists.length,
        searchParams 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in scrape-therapist-data function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})

function extractTherapistData(crawlData: any[], searchParams: TherapistSearchParams): ScrapedTherapist[] {
  const therapists: ScrapedTherapist[] = []
  
  for (const page of crawlData) {
    const content = page.markdown || page.content || ''
    
    // Extract therapist information using regex patterns
    const therapistBlocks = extractTherapistBlocks(content)
    
    for (const block of therapistBlocks) {
      const therapist = parseTherapistBlock(block, searchParams)
      if (therapist) {
        therapists.push(therapist)
      }
    }
  }
  
  return therapists
}

function extractTherapistBlocks(content: string): string[] {
  // Split content into potential therapist blocks
  const blocks = content.split(/(?=Dr\.|(?=Licensed|LCSW|LMFT|PhD|PsyD|MA|MS))/i)
  return blocks.filter(block => 
    block.length > 100 && 
    (block.includes('therapist') || block.includes('counselor') || block.includes('psychologist'))
  )
}

function parseTherapistBlock(block: string, searchParams: TherapistSearchParams): ScrapedTherapist | null {
  try {
    // Extract name (usually at the beginning or after titles)
    const nameMatch = block.match(/(?:Dr\.\s+)?([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i)
    const name = nameMatch ? nameMatch[1].trim() : 'Unknown'
    
    // Extract phone numbers
    const phoneMatch = block.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
    const phone = phoneMatch ? phoneMatch[0] : ''
    
    // Extract email
    const emailMatch = block.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)
    const email = emailMatch ? emailMatch[0] : undefined
    
    // Extract address
    const addressMatch = block.match(/\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Boulevard|Blvd|Road|Rd|Drive|Dr|Lane|Ln)[^,]*,\s*[A-Za-z\s]+,?\s*[A-Z]{2}\s*\d{5}/i)
    const address = addressMatch ? addressMatch[0] : ''
    
    // Extract city and state from address
    const cityStateMatch = address.match(/,\s*([A-Za-z\s]+),?\s*([A-Z]{2})\s*(\d{5})/)
    const city = cityStateMatch ? cityStateMatch[1].trim() : ''
    const state = cityStateMatch ? cityStateMatch[2] : getStateFromZip(searchParams.zipCode)
    const zipCode = cityStateMatch ? cityStateMatch[3] : searchParams.zipCode
    
    // Extract specialties related to anxiety
    const specialties = extractAnxietySpecialties(block)
    
    // Extract insurance information
    const insurance = extractInsuranceInfo(block)
    
    // Extract bio/description
    const bioMatch = block.match(/(?:specializ|focus|help|treat|work)[\s\w,.-]{50,300}(?:\.|!)/i)
    const bio = bioMatch ? bioMatch[0] : undefined
    
    // Extract licensure
    const licensureMatch = block.match(/(LCSW|LMFT|LPC|LPCC|PhD|PsyD|MA|MS|LMHC|LCPC)/i)
    const licensure = licensureMatch ? licensureMatch[0] : 'Licensed Professional'
    
    // Extract years of experience
    const experienceMatch = block.match(/(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?(?:experience|practice)/i)
    const yearsOfExperience = experienceMatch ? parseInt(experienceMatch[1]) : undefined
    
    // Determine if accepting patients
    const acceptingPatients = !block.toLowerCase().includes('not accepting') && 
                             !block.toLowerCase().includes('waitlist') &&
                             !block.toLowerCase().includes('full')
    
    // Check if accepts uninsured/self-pay
    const acceptsUninsured = block.toLowerCase().includes('self-pay') ||
                            block.toLowerCase().includes('cash') ||
                            block.toLowerCase().includes('sliding scale') ||
                            block.toLowerCase().includes('uninsured')
    
    if (name === 'Unknown' || !phone) {
      return null // Skip if we can't extract basic info
    }
    
    return {
      name,
      specialty: specialties,
      address: address || `${city}, ${state} ${zipCode}`,
      city,
      state,
      zipCode,
      phone,
      email,
      bio,
      insurance,
      acceptingPatients,
      acceptsUninsured,
      licensure,
      practiceType: 'individual', // Default assumption
      yearsOfExperience
    }
  } catch (error) {
    console.error('Error parsing therapist block:', error)
    return null
  }
}

function extractAnxietySpecialties(content: string): string[] {
  const anxietyKeywords = [
    'anxiety', 'panic', 'phobia', 'ocd', 'ptsd', 'trauma',
    'cognitive behavioral', 'cbt', 'mindfulness', 'act',
    'acceptance commitment', 'exposure therapy', 'emdr'
  ]
  
  const specialties: string[] = []
  
  for (const keyword of anxietyKeywords) {
    if (content.toLowerCase().includes(keyword)) {
      if (keyword === 'cbt') specialties.push('Cognitive Behavioral Therapy')
      else if (keyword === 'act') specialties.push('Acceptance and Commitment Therapy')
      else if (keyword === 'emdr') specialties.push('EMDR')
      else specialties.push(keyword.charAt(0).toUpperCase() + keyword.slice(1))
    }
  }
  
  return [...new Set(specialties)] // Remove duplicates
}

function extractInsuranceInfo(content: string): string[] {
  const insuranceProviders = [
    'Aetna', 'Anthem', 'Blue Cross', 'BCBS', 'Cigna', 'UnitedHealth',
    'Medicare', 'Medicaid', 'Harvard Pilgrim', 'Tufts', 'Kaiser',
    'Humana', 'Tricare'
  ]
  
  const insurance: string[] = []
  
  for (const provider of insuranceProviders) {
    if (content.toLowerCase().includes(provider.toLowerCase())) {
      if (provider === 'BCBS') insurance.push('Blue Cross Blue Shield')
      else insurance.push(provider)
    }
  }
  
  return [...new Set(insurance)]
}

function getStateFromZip(zipCode: string): string {
  const zipToState: { [key: string]: string } = {
    '01': 'MA', '02': 'MA', '03': 'NH', '04': 'ME', '05': 'VT',
    '06': 'CT', '07': 'NJ', '08': 'NJ', '09': 'NJ', '10': 'NY',
    '11': 'NY', '12': 'NY', '13': 'NY', '14': 'NY', '15': 'PA',
    '16': 'PA', '17': 'PA', '18': 'PA', '19': 'PA', '20': 'DC',
    '21': 'MD', '22': 'VA', '23': 'VA', '24': 'VA', '25': 'MA',
    '26': 'MI', '27': 'MI', '28': 'NC', '29': 'SC', '30': 'GA',
    '31': 'GA', '32': 'FL', '33': 'FL', '34': 'FL', '35': 'AL',
    '36': 'AL', '37': 'TN', '38': 'TN', '39': 'OH', '40': 'KY',
    '41': 'KY', '42': 'KY', '43': 'OH', '44': 'OH', '45': 'OH',
    '46': 'IN', '47': 'IN', '48': 'IL', '49': 'IL', '50': 'IA',
    '51': 'IA', '52': 'IA', '53': 'WI', '54': 'WI', '55': 'MN',
    '56': 'MN', '57': 'SD', '58': 'ND', '59': 'MT', '60': 'IL',
    '61': 'IL', '62': 'IL', '63': 'MO', '64': 'MO', '65': 'MO',
    '66': 'KS', '67': 'KS', '68': 'NE', '69': 'NE', '70': 'LA',
    '71': 'LA', '72': 'AR', '73': 'OK', '74': 'OK', '75': 'TX',
    '76': 'TX', '77': 'TX', '78': 'TX', '79': 'TX', '80': 'CO',
    '81': 'CO', '82': 'WY', '83': 'ID', '84': 'UT', '85': 'AZ',
    '86': 'AZ', '87': 'NM', '88': 'NV', '89': 'NV', '90': 'CA',
    '91': 'CA', '92': 'CA', '93': 'CA', '94': 'CA', '95': 'CA',
    '96': 'CA', '97': 'OR', '98': 'WA', '99': 'AK'
  }
  
  const prefix = zipCode.substring(0, 2)
  return zipToState[prefix] || 'Unknown'
}

function removeDuplicates(therapists: ScrapedTherapist[]): ScrapedTherapist[] {
  const seen = new Set<string>()
  return therapists.filter(therapist => {
    const key = `${therapist.name}-${therapist.phone}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function filterTherapists(therapists: ScrapedTherapist[], searchParams: TherapistSearchParams): ScrapedTherapist[] {
  return therapists.filter(therapist => {
    // Filter by specialty if specified
    if (searchParams.specialty) {
      const hasSpecialty = therapist.specialty.some(spec => 
        spec.toLowerCase().includes(searchParams.specialty!.toLowerCase())
      )
      if (!hasSpecialty) return false
    }
    
    // Filter by insurance if specified
    if (searchParams.insuranceType && !searchParams.acceptsUninsured) {
      const hasInsurance = therapist.insurance.some(ins => 
        ins.toLowerCase().includes(searchParams.insuranceType!.toLowerCase())
      )
      if (!hasInsurance) return false
    }
    
    // Filter by uninsured acceptance if specified
    if (searchParams.acceptsUninsured && !therapist.acceptsUninsured) {
      return false
    }
    
    return true
  })
}