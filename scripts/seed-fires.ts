import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface FireRecord {
  incident_name: string
  year: number
  fuel: string
  wind_speed: string
  wind_direction: string
  terrain: string
  behavior: string
  tactics_used: string
  resources_deployed: string
  structures_threatened: number
  structures_destroyed: number
  outcome: string
  final_size_acres: number
}

const fires: FireRecord[] = [
  {
    incident_name: 'Camp Fire',
    year: 2018,
    fuel: 'Mixed conifer, oak woodland, dry grass',
    wind_speed: '35-50 mph gusts',
    wind_direction: 'Northeast (Diablo winds)',
    terrain: 'Steep canyon, Sierra foothills',
    behavior: 'Extreme crown fire, rapid downslope runs, massive spotting 1+ miles ahead',
    tactics_used: 'Evacuation priority, point protection of critical infrastructure, defensive firing operations',
    resources_deployed: '1,065 engines, 5,500+ personnel, air tankers',
    structures_threatened: 18000,
    structures_destroyed: 18804,
    outcome: 'Town of Paradise destroyed. 85 fatalities. Most destructive fire in CA history.',
    final_size_acres: 153336,
  },
  {
    incident_name: 'Thomas Fire',
    year: 2017,
    fuel: 'Chaparral, coastal sage scrub, grass',
    wind_speed: '40-70 mph gusts',
    wind_direction: 'North-Northeast (Santa Ana winds)',
    terrain: 'Steep coastal mountains, narrow canyons',
    behavior: 'Wind-driven runs through chaparral, spotting across Highway 101, extreme fire behavior',
    tactics_used: 'Structure protection, firing operations along ridgelines, helicopter water drops',
    resources_deployed: '8,500 firefighters, 78 helicopters, 29 air tankers',
    structures_threatened: 18000,
    structures_destroyed: 1063,
    outcome: 'Contained after 40 days. 2 fatalities. Triggered deadly Montecito mudslides.',
    final_size_acres: 281893,
  },
  {
    incident_name: 'Tubbs Fire',
    year: 2017,
    fuel: 'Oak woodland, grass, ornamental vegetation (WUI)',
    wind_speed: '40-70 mph gusts',
    wind_direction: 'North-Northeast (Diablo winds)',
    terrain: 'Rolling hills, urban-wildland interface',
    behavior: 'Extreme wind-driven fire, ember showers into subdivisions, simultaneous structure ignitions',
    tactics_used: 'Mass evacuation, defensive structure protection, triage of neighborhoods',
    resources_deployed: '3,200 personnel, multiple strike teams',
    structures_threatened: 8000,
    structures_destroyed: 5636,
    outcome: 'Coffey Park neighborhood destroyed. 22 fatalities. Rapid urban conflagration.',
    final_size_acres: 36807,
  },
  {
    incident_name: 'Dixie Fire',
    year: 2021,
    fuel: 'Mixed conifer, timber litter, brush',
    wind_speed: '10-25 mph',
    wind_direction: 'Southwest shifting',
    terrain: 'Steep mountainous, deep canyons, Feather River Canyon',
    behavior: 'Long-range spotting, group torching, plume-dominated runs, fire whirls',
    tactics_used: 'Indirect attack, burnout operations, dozer lines on ridgetops',
    resources_deployed: '6,000+ personnel, dozers, air tankers',
    structures_threatened: 14000,
    structures_destroyed: 1329,
    outcome: 'Town of Greenville destroyed. Largest single fire in CA history at time. 1 fatality.',
    final_size_acres: 963309,
  },
  {
    incident_name: 'Woolsey Fire',
    year: 2018,
    fuel: 'Coastal sage scrub, chaparral, grass',
    wind_speed: '40-60 mph gusts',
    wind_direction: 'North (Santa Ana winds)',
    terrain: 'Santa Monica Mountains, steep coastal canyons',
    behavior: 'Extreme wind-driven fire, rapid spread to coast, spotting across 101 freeway',
    tactics_used: 'Mass evacuation (250,000 people), structure protection, aerial suppression',
    resources_deployed: '3,700 personnel, helicopters, engines',
    structures_threatened: 57000,
    structures_destroyed: 1643,
    outcome: 'Burned from inland mountains to Pacific Ocean in hours. 3 fatalities.',
    final_size_acres: 96949,
  },
  {
    incident_name: 'Creek Fire',
    year: 2020,
    fuel: 'Dead standing timber, beetle-kill, heavy surface fuels',
    wind_speed: '10-20 mph',
    wind_direction: 'Variable',
    terrain: 'Sierra Nevada, steep drainages, 3000-8000ft elevation',
    behavior: 'Pyrocumulonimbus column, fire-generated lightning, massive spotting',
    tactics_used: 'Evacuation, indirect suppression, helicopter rescue of 200+ trapped campers',
    resources_deployed: '2,500 personnel, military helicopters for rescue',
    structures_threatened: 10000,
    structures_destroyed: 856,
    outcome: 'Generated rare fire tornado. Dramatic helicopter rescue at Mammoth Pool. 0 fatalities.',
    final_size_acres: 379895,
  },
  {
    incident_name: 'Mendocino Complex',
    year: 2018,
    fuel: 'Brush, oak woodland, grass, chaparral',
    wind_speed: '10-20 mph',
    wind_direction: 'Northwest',
    terrain: 'Rolling hills, lake shores, rural grassland',
    behavior: 'Two simultaneous fires, moderate spread, flanking runs through brush',
    tactics_used: 'Direct attack on flanks, dozer lines, aerial retardant, structure protection',
    resources_deployed: '4,000+ personnel, dozers, air tankers',
    structures_threatened: 12000,
    structures_destroyed: 280,
    outcome: 'Largest fire complex in CA history at time. 1 fatality. Long duration (2 months).',
    final_size_acres: 459123,
  },
  {
    incident_name: 'Kincade Fire',
    year: 2019,
    fuel: 'Chaparral, oak woodland, vineyard edges',
    wind_speed: '65-90 mph gusts',
    wind_direction: 'North-Northeast (Diablo winds)',
    terrain: 'Geyserville hills, Alexander Valley, Sonoma County',
    behavior: 'Extreme wind-driven fire, rapid spread, ember transport 1+ miles',
    tactics_used: 'Pre-positioned resources, mass evacuation (190,000), firing operations',
    resources_deployed: '5,000+ personnel, 300+ engines',
    structures_threatened: 90000,
    structures_destroyed: 374,
    outcome: 'Successful evacuation prevented fatalities. 0 deaths. PG&E power lines suspected cause.',
    final_size_acres: 77758,
  },
  {
    incident_name: 'Caldor Fire',
    year: 2021,
    fuel: 'Mixed conifer, heavy dead/down timber',
    wind_speed: '15-30 mph',
    wind_direction: 'Southwest',
    terrain: 'Sierra Nevada, steep terrain, 1000-9000ft elevation',
    behavior: 'Extreme upslope runs, crown fire, spotted across American River Canyon',
    tactics_used: 'Community evacuation (South Lake Tahoe), indirect attack, burnout along Highway 50',
    resources_deployed: '4,500 personnel, dozers, air tankers, military',
    structures_threatened: 33000,
    structures_destroyed: 1003,
    outcome: 'Reached Lake Tahoe basin. South Lake Tahoe evacuated. 0 fatalities.',
    final_size_acres: 221835,
  },
  {
    incident_name: 'Glass Fire',
    year: 2020,
    fuel: 'Oak woodland, chaparral, vineyard borders',
    wind_speed: '20-45 mph gusts',
    wind_direction: 'North (Diablo winds)',
    terrain: 'Napa/Sonoma valleys, steep hillsides',
    behavior: 'Wind-driven runs through Wine Country, rapid structure ignition',
    tactics_used: 'Structure protection, evacuation, aerial suppression, vineyard breaks as anchor points',
    resources_deployed: '2,700 personnel, helicopters, engines',
    structures_threatened: 28000,
    structures_destroyed: 1555,
    outcome: 'Major winery and resort losses. 0 fatalities. Extensive damage to Wine Country.',
    final_size_acres: 67484,
  },
  {
    incident_name: 'Cedar Fire',
    year: 2003,
    fuel: 'Chaparral, sage scrub, grass (30+ years unburned)',
    wind_speed: '40-60 mph',
    wind_direction: 'East (Santa Ana winds)',
    terrain: 'San Diego backcountry, steep canyons',
    behavior: 'Extreme wind-driven fire, ran 20 miles in 4 hours, massive ember showers',
    tactics_used: 'Defensive structure protection, evacuation, retardant drops',
    resources_deployed: '3,500 personnel, multiple agencies',
    structures_threatened: 5000,
    structures_destroyed: 2820,
    outcome: '15 fatalities including 1 firefighter. Largest fire in CA history at time.',
    final_size_acres: 273246,
  },
  {
    incident_name: 'Rim Fire',
    year: 2013,
    fuel: 'Mixed conifer, brush, timber (Stanislaus NF)',
    wind_speed: '10-20 mph',
    wind_direction: 'Southwest',
    terrain: 'Steep mountainous, Tuolumne River canyon',
    behavior: 'Plume-dominated, long-range spotting, torching and crowning',
    tactics_used: 'Indirect attack, burnout operations from ridgetops, firing from roads',
    resources_deployed: '5,000+ personnel, heavy air tanker fleet',
    structures_threatened: 4500,
    structures_destroyed: 112,
    outcome: 'Entered Yosemite NP. Threatened Hetch Hetchy reservoir (SF water supply). 0 fatalities.',
    final_size_acres: 257314,
  },
  {
    incident_name: 'Witch Fire',
    year: 2007,
    fuel: 'Chaparral, grass, ornamental (WUI)',
    wind_speed: '50-70 mph gusts',
    wind_direction: 'East-Northeast (Santa Ana winds)',
    terrain: 'San Diego inland valleys, WUI communities',
    behavior: 'Extreme wind-driven fire, rapid spread through communities, simultaneous structure fires',
    tactics_used: 'Mass evacuation (500,000+ people), triage, structure protection',
    resources_deployed: 'Massive mutual aid response, military support',
    structures_threatened: 20000,
    structures_destroyed: 1650,
    outcome: '2 fatalities. Part of 2007 San Diego fire siege (multiple simultaneous fires).',
    final_size_acres: 197990,
  },
  {
    incident_name: 'LNU Lightning Complex',
    year: 2020,
    fuel: 'Grass, oak woodland, chaparral',
    wind_speed: '5-15 mph',
    wind_direction: 'Variable (dry lightning event)',
    terrain: 'Rolling hills, valleys, lake shores',
    behavior: 'Multiple lightning-caused starts, moderate spread, flanking through grass',
    tactics_used: 'Triage of multiple fires, direct attack where possible, structure protection',
    resources_deployed: '2,600 personnel across multiple fires',
    structures_threatened: 30000,
    structures_destroyed: 1491,
    outcome: '6 fatalities. Part of historic August 2020 lightning siege. Overwhelmed resources.',
    final_size_acres: 363220,
  },
  {
    incident_name: 'SCU Lightning Complex',
    year: 2020,
    fuel: 'Grass, oak savanna, brush',
    wind_speed: '5-15 mph',
    wind_direction: 'Variable',
    terrain: 'Diablo Range foothills, grasslands, rural',
    behavior: 'Multiple starts merged, moderate grass fire spread, flanking',
    tactics_used: 'Dozer lines, direct attack in grass, firing operations, ranch road anchor points',
    resources_deployed: '1,800 personnel, dozers, engines',
    structures_threatened: 20000,
    structures_destroyed: 222,
    outcome: '0 fatalities. Large area but lower intensity. Grass fires more controllable.',
    final_size_acres: 396624,
  },
  {
    incident_name: 'Carr Fire',
    year: 2018,
    fuel: 'Chaparral, oak woodland, grass',
    wind_speed: '15-40 mph',
    wind_direction: 'South-Southwest',
    terrain: 'Sacramento River canyon, steep terrain near Redding',
    behavior: 'Generated EF-3 fire tornado (143 mph), extreme pyroconvection, massive spotting',
    tactics_used: 'Urban evacuation (38,000), direct attack, structure protection around Redding',
    resources_deployed: '5,100 personnel, air tankers, military',
    structures_threatened: 38000,
    structures_destroyed: 1614,
    outcome: '8 fatalities including 2 firefighters. Unprecedented fire tornado.',
    final_size_acres: 229651,
  },
  {
    incident_name: 'Valley Fire',
    year: 2015,
    fuel: 'Chaparral, mixed hardwood, pine',
    wind_speed: '25-40 mph gusts',
    wind_direction: 'North',
    terrain: 'Lake County, mountainous, narrow valleys',
    behavior: 'Extreme rate of spread (10 mph through chaparral), structure ignitions, ember showers',
    tactics_used: 'Evacuation, defensive structure protection, point protection',
    resources_deployed: '3,900 personnel',
    structures_threatened: 9000,
    structures_destroyed: 1955,
    outcome: '4 fatalities. Town of Middletown heavily damaged. Extremely fast-moving.',
    final_size_acres: 76067,
  },
  {
    incident_name: 'Butte Fire',
    year: 2015,
    fuel: 'Mixed conifer, brush, grass',
    wind_speed: '10-20 mph',
    wind_direction: 'Southwest',
    terrain: 'Sierra foothills, steep terrain, 1000-4000ft',
    behavior: 'Upslope runs, torching, moderate spotting, brush to timber transition',
    tactics_used: 'Direct and indirect attack, dozer lines, community evacuation',
    resources_deployed: '4,900 personnel',
    structures_threatened: 6400,
    structures_destroyed: 921,
    outcome: '2 fatalities. Small communities impacted. Drought-stressed fuels.',
    final_size_acres: 70868,
  },
  {
    incident_name: 'Palisades Fire',
    year: 2025,
    fuel: 'Coastal sage scrub, chaparral, ornamental vegetation (WUI)',
    wind_speed: '60-100 mph gusts',
    wind_direction: 'North-Northeast (extreme Santa Ana winds)',
    terrain: 'Pacific Palisades, steep coastal canyons, dense WUI',
    behavior: 'Extreme wind-driven fire, rapid spread through neighborhoods, simultaneous structure ignitions, ember transport miles ahead',
    tactics_used: 'Mass evacuation, structure triage, mutual aid from multiple states, defensive operations',
    resources_deployed: '10,000+ personnel, federal and state mutual aid',
    structures_threatened: 40000,
    structures_destroyed: 5316,
    outcome: 'Major destruction in Pacific Palisades. Part of January 2025 LA fire siege. Multiple fatalities.',
    final_size_acres: 23448,
  },
  {
    incident_name: 'Eaton Fire',
    year: 2025,
    fuel: 'Chaparral, oak woodland, grass, ornamental (WUI)',
    wind_speed: '60-100 mph gusts',
    wind_direction: 'North (extreme Santa Ana winds)',
    terrain: 'Altadena foothills, San Gabriel Mountains front, steep WUI',
    behavior: 'Extreme downslope wind-driven fire, rapid community ignition, overwhelmed fire suppression',
    tactics_used: 'Mass evacuation, defensive structure protection, water system failures complicated response',
    resources_deployed: '8,000+ personnel, federal disaster declaration',
    structures_threatened: 30000,
    structures_destroyed: 9418,
    outcome: 'Altadena devastated. Historic neighborhood losses. Multiple fatalities. Water infrastructure failed.',
    final_size_acres: 14117,
  },
]

function buildNarrative(fire: FireRecord): string {
  return [
    `Incident: ${fire.incident_name} (${fire.year})`,
    `Fuel: ${fire.fuel}`,
    `Wind: ${fire.wind_speed} from ${fire.wind_direction}`,
    `Terrain: ${fire.terrain}`,
    `Behavior: ${fire.behavior}`,
    `Tactics: ${fire.tactics_used}`,
    `Outcome: ${fire.outcome}`,
    `Final size: ${fire.final_size_acres.toLocaleString()} acres`,
  ].join('. ')
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text,
    dimensions: 1536,
  })
  return response.data[0].embedding
}

async function seed() {
  console.log(`Seeding ${fires.length} historical fires...\n`)

  for (let i = 0; i < fires.length; i++) {
    const fire = fires[i]
    const narrative = buildNarrative(fire)

    console.log(`[${i + 1}/${fires.length}] ${fire.incident_name} (${fire.year})...`)

    const embedding = await generateEmbedding(narrative)

    const { error } = await supabase.from('historical_fires').insert({
      incident_name: fire.incident_name,
      year: fire.year,
      fuel: fire.fuel,
      wind_speed: fire.wind_speed,
      wind_direction: fire.wind_direction,
      terrain: fire.terrain,
      behavior: fire.behavior,
      tactics_used: fire.tactics_used,
      resources_deployed: fire.resources_deployed,
      structures_threatened: fire.structures_threatened,
      structures_destroyed: fire.structures_destroyed,
      outcome: fire.outcome,
      final_size_acres: fire.final_size_acres,
      narrative,
      embedding,
    })

    if (error) {
      console.error(`  ERROR: ${error.message}`)
    } else {
      console.log(`  OK`)
    }

    // Small delay to respect rate limits
    await new Promise((r) => setTimeout(r, 200))
  }

  console.log('\nDone!')
}

seed().catch(console.error)
