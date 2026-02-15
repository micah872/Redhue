import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── California fire data templates ──

const regions = [
  { name: 'Southern California Coast', terrain: 'Steep coastal canyons, Santa Monica Mountains', fuels: ['Coastal sage scrub', 'Chaparral', 'Ornamental WUI vegetation'], windPatterns: ['Santa Ana winds NE 40-80 mph', 'Onshore SW 10-20 mph', 'Sundowner winds N 30-50 mph'] },
  { name: 'San Diego Backcountry', terrain: 'Steep inland canyons, chaparral-covered hills', fuels: ['Dense chaparral (20+ years)', 'Sage scrub', 'Annual grass'], windPatterns: ['Santa Ana winds E 40-70 mph', 'Desert winds NE 30-50 mph', 'Light onshore W 5-15 mph'] },
  { name: 'Central Coast', terrain: 'Rolling hills, oak-studded grasslands, coastal mountains', fuels: ['Oak woodland', 'Annual grassland', 'Mixed chaparral'], windPatterns: ['Sundowner winds N 25-50 mph', 'Onshore NW 10-20 mph', 'Light variable 5-10 mph'] },
  { name: 'Sierra Nevada Foothills', terrain: 'Steep Sierra foothills, 1000-4000ft elevation, narrow canyons', fuels: ['Mixed conifer-hardwood', 'Brush', 'Annual grass', 'Blue oak woodland'], windPatterns: ['Diablo winds NE 30-60 mph', 'Upslope SW 10-25 mph', 'Downslope NE 10-20 mph'] },
  { name: 'Sierra Nevada Mountains', terrain: 'Steep mountainous, deep river canyons, 4000-9000ft elevation', fuels: ['Mixed conifer', 'Red fir', 'Heavy dead/down timber', 'Beetle-kill standing dead'], windPatterns: ['SW 10-25 mph', 'Variable ridgetop 15-30 mph', 'Canyon channeled 20-40 mph'] },
  { name: 'North Coast', terrain: 'Rugged coastal mountains, redwood forests, steep terrain', fuels: ['Douglas fir-tanoak', 'Redwood understory', 'Grass-woodland mosaic'], windPatterns: ['Offshore NE 20-40 mph', 'Onshore NW 10-20 mph', 'Light fog-belt 5 mph'] },
  { name: 'Sacramento Valley', terrain: 'Flat valley floor, river levees, agricultural edges', fuels: ['Annual grass', 'Riparian brush', 'Agricultural stubble'], windPatterns: ['Delta breeze SW 15-30 mph', 'Light N 5-10 mph', 'Variable 5-15 mph'] },
  { name: 'Napa-Sonoma Wine Country', terrain: 'Rolling hills, narrow valleys, vineyard-wildland interface', fuels: ['Oak woodland', 'Chaparral', 'Vineyard borders', 'Grass'], windPatterns: ['Diablo winds NE 40-80 mph', 'Light variable 5-10 mph', 'NW 10-20 mph'] },
  { name: 'Mendocino-Lake County', terrain: 'Mountainous, deep valleys, Clear Lake area', fuels: ['Chaparral', 'Mixed hardwood', 'Grass-brush mosaic', 'Pine-oak'], windPatterns: ['N 15-30 mph', 'Light variable 5-10 mph', 'Diablo winds NE 30-50 mph'] },
  { name: 'Shasta-Trinity', terrain: 'Steep mountainous, Sacramento River canyon, Trinity Alps', fuels: ['Mixed conifer', 'Chaparral', 'Oak woodland', 'Brush'], windPatterns: ['SW 10-25 mph', 'Thermal belt winds 15-30 mph', 'Canyon channeled 20-40 mph'] },
  { name: 'Modoc-Lassen Plateau', terrain: 'High desert plateau, volcanic terrain, juniper-sage', fuels: ['Sagebrush', 'Juniper woodland', 'Annual grass', 'Bitterbrush'], windPatterns: ['SW 15-30 mph', 'Gusty thunderstorm 30-50 mph', 'Light N 5-15 mph'] },
  { name: 'San Bernardino Mountains', terrain: 'Steep mountain slopes, 3000-8000ft, WUI communities', fuels: ['Mixed conifer', 'Chaparral', 'Ornamental WUI vegetation'], windPatterns: ['Santa Ana winds NE 50-80 mph', 'Upslope SW 10-20 mph', 'Foehn winds N 30-50 mph'] },
  { name: 'Riverside-San Jacinto', terrain: 'Desert-mountain transition, pass areas, steep canyons', fuels: ['Chaparral', 'Sage scrub', 'Desert scrub-grass transition'], windPatterns: ['Santa Ana winds NE 40-70 mph', 'Pass effect winds 50-80 mph', 'Light W 5-15 mph'] },
  { name: 'East Bay Hills', terrain: 'Steep WUI hills, eucalyptus groves, urban-wildland boundary', fuels: ['Eucalyptus', 'Annual grass', 'Monterey pine', 'Ornamental'], windPatterns: ['Diablo winds NE 40-70 mph', 'Sea breeze W 10-20 mph', 'Light variable 5-10 mph'] },
  { name: 'Plumas-Butte County', terrain: 'Sierra foothills to mountains, Feather River Canyon', fuels: ['Mixed conifer', 'Oak woodland', 'Grass-brush transition', 'Heavy dead/down'], windPatterns: ['Diablo/Jarbo Gap winds NE 35-60 mph', 'Upslope SW 10-20 mph', 'Canyon channeled 20-40 mph'] },
]

const behaviors = [
  'Surface fire with occasional torching',
  'Active crown fire with spotting',
  'Wind-driven surface fire, rapid spread',
  'Extreme wind-driven fire, ember showers',
  'Plume-dominated fire with pyrocumulus development',
  'Backing fire, creeping through litter',
  'Flanking fire through brush',
  'Group torching, intermittent crown fire',
  'Running fire through grass, 2-4 mph',
  'Running fire through grass, 5-8 mph',
  'Long-range spotting 0.25-0.5 miles ahead',
  'Long-range spotting 1+ miles ahead',
  'Upslope runs with torching on steep terrain',
  'Downslope wind-driven runs through canyons',
  'Fire whirls observed on flanks',
  'Moderate spread through brush and timber',
  'Extreme fire behavior, pyrocumulonimbus column',
  'Rapid spread through WUI, simultaneous structure ignitions',
  'Creeping and smoldering in heavy dead/down fuels',
  'Spotting across roads and ridgelines',
]

const tacticsPool = [
  'Direct attack on flanks with handcrews and engines',
  'Indirect attack with dozer lines on ridgetops',
  'Burnout operations along containment lines',
  'Aerial retardant drops on head of fire',
  'Helicopter water drops on spot fires',
  'Structure protection with engine strike teams',
  'Point protection of critical infrastructure',
  'Evacuation of threatened communities',
  'Road closures and traffic management',
  'Firing operations from road anchor points',
  'Handline construction along fire perimeter',
  'Dozer line construction through brush',
  'Air tanker retardant lines ahead of fire',
  'Night operations with handcrews',
  'Backfiring from prepared containment lines',
  'Defensive structure triage and protection',
  'Water tender support for remote operations',
  'Hotshot crews on steep terrain assignments',
  'Mass evacuation with law enforcement support',
  'Pre-positioned resources ahead of predicted spread',
]

const outcomes = [
  'Contained within {days} days. {structures} structures destroyed. 0 fatalities.',
  'Contained after {days} days of active firefighting. Minimal structure loss. 0 fatalities.',
  'Fire contained. {structures} structures destroyed, {threatened} threatened. 0 fatalities.',
  'Contained with significant mutual aid. {structures} structures lost. {fatalities} fatality(ies).',
  'Full containment after {days} days. Evacuations lifted. {structures} structures destroyed.',
  'Controlled burn operations successful. Fire held at containment lines. Minimal losses.',
  'Fire made multiple runs before containment. {structures} structures destroyed in first 24 hours.',
  'Rapid initial attack successful. Fire held to {acres} acres. 0 structure loss.',
  'Extended attack required. {structures} structures destroyed. Community evacuated and returned.',
  'Fire escaped initial attack. {days}-day campaign fire. {structures} structures destroyed.',
  'Contained after threatening community. Successful evacuation. {structures} structures lost.',
  'Weather moderation aided containment. {structures} structures destroyed over {days} days.',
]

const namePrefix = [
  'Mountain', 'Valley', 'Canyon', 'Ridge', 'Creek', 'River', 'Lake', 'Peak', 'Meadow', 'Spring',
  'Pine', 'Oak', 'Cedar', 'Sage', 'Manzanita', 'Chaparral', 'Sequoia', 'Redwood', 'Juniper', 'Madrone',
  'Eagle', 'Hawk', 'Bear', 'Deer', 'Coyote', 'Wolf', 'Cougar', 'Elk', 'Fox', 'Falcon',
  'North', 'South', 'East', 'West', 'Upper', 'Lower', 'Middle', 'Hidden', 'Lost', 'Broken',
  'Fire', 'Smoke', 'Ash', 'Ember', 'Blaze', 'Flame', 'Burn', 'Char', 'Scorch', 'Heat',
  'Gold', 'Silver', 'Iron', 'Copper', 'Granite', 'Slate', 'Flint', 'Quartz', 'Marble', 'Basalt',
  'Storm', 'Thunder', 'Lightning', 'Wind', 'Dry', 'Dusty', 'Sandy', 'Rocky', 'Stony', 'Gravel',
  'Mill', 'Bridge', 'Ford', 'Camp', 'Ranch', 'Mine', 'Trail', 'Pass', 'Gap', 'Flat',
  'Whiskey', 'Brandy', 'Honey', 'Sugar', 'Salt', 'Pepper', 'Lime', 'Apple', 'Berry', 'Olive',
  'Shadow', 'Dark', 'Bright', 'Clear', 'Deep', 'High', 'Long', 'Broad', 'Sharp', 'Cold',
]

const nameSuffix = [
  'Fire', 'Blaze', 'Complex', 'Incident', 'Fire', 'Fire', 'Fire', 'Fire', 'Fire', 'Fire',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateFireName(index: number): string {
  const prefix = namePrefix[index % namePrefix.length]
  const suffix = pick(nameSuffix)
  return `${prefix} ${suffix}`
}

function generateFire(index: number) {
  const region = pick(regions)
  const year = randInt(1999, 2024)
  const fuel = pick(region.fuels)
  const wind = pick(region.windPatterns)
  const behavior = pick(behaviors)
  const numTactics = randInt(2, 4)
  const tactics: string[] = []
  while (tactics.length < numTactics) {
    const t = pick(tacticsPool)
    if (!tactics.includes(t)) tactics.push(t)
  }

  // Size distribution: mostly small-medium, some large, few massive
  const sizeRoll = Math.random()
  let acres: number
  if (sizeRoll < 0.3) acres = randInt(100, 500)
  else if (sizeRoll < 0.55) acres = randInt(500, 2000)
  else if (sizeRoll < 0.75) acres = randInt(2000, 10000)
  else if (sizeRoll < 0.9) acres = randInt(10000, 50000)
  else if (sizeRoll < 0.97) acres = randInt(50000, 150000)
  else acres = randInt(150000, 500000)

  const structuresDestroyed = acres > 10000 ? randInt(10, Math.min(acres / 10, 3000)) : acres > 1000 ? randInt(0, 200) : randInt(0, 20)
  const structuresThreatened = structuresDestroyed * randInt(3, 15)
  const days = acres < 500 ? randInt(1, 5) : acres < 5000 ? randInt(3, 14) : acres < 50000 ? randInt(7, 30) : randInt(14, 60)
  const fatalities = Math.random() < 0.05 ? randInt(1, 5) : 0

  const outcomeTemplate = pick(outcomes)
  const outcome = outcomeTemplate
    .replace('{days}', String(days))
    .replace('{structures}', String(Math.round(structuresDestroyed)))
    .replace('{threatened}', String(Math.round(structuresThreatened)))
    .replace('{fatalities}', String(fatalities))
    .replace('{acres}', String(acres))

  const incident_name = generateFireName(index)

  const humidity = pick(['5-10%', '8-15%', '10-20%', '15-25%', '20-35%', '25-40%', '30-50%'])
  const temp = pick(['85-95°F', '90-100°F', '95-110°F', '75-85°F', '80-90°F', '100-115°F', '70-80°F'])

  const resources = [
    `${randInt(100, 6000)} personnel`,
    randInt(1, 100) > 50 ? `${randInt(5, 300)} engines` : null,
    randInt(1, 100) > 60 ? `${randInt(1, 30)} helicopters` : null,
    randInt(1, 100) > 70 ? `${randInt(1, 15)} air tankers` : null,
    randInt(1, 100) > 70 ? `${randInt(2, 40)} dozers` : null,
    randInt(1, 100) > 60 ? `${randInt(5, 60)} handcrews` : null,
  ].filter(Boolean).join(', ')

  return {
    incident_name,
    year,
    fuel: `${fuel}, ${pick(region.fuels) !== fuel ? pick(region.fuels) : 'dry grass'}`,
    wind_speed: wind,
    wind_direction: wind.split(' ')[wind.split(' ').length - 2] || 'Variable',
    terrain: region.terrain,
    behavior: `${behavior}. Humidity ${humidity}, temp ${temp}.`,
    tactics_used: tactics.join('. '),
    resources_deployed: resources,
    structures_threatened: Math.round(structuresThreatened),
    structures_destroyed: Math.round(structuresDestroyed),
    outcome,
    final_size_acres: acres,
  }
}

function buildNarrative(fire: ReturnType<typeof generateFire>): string {
  return [
    `Incident: ${fire.incident_name} (${fire.year})`,
    `Fuel: ${fire.fuel}`,
    `Wind: ${fire.wind_speed}`,
    `Terrain: ${fire.terrain}`,
    `Behavior: ${fire.behavior}`,
    `Tactics: ${fire.tactics_used}`,
    `Outcome: ${fire.outcome}`,
    `Final size: ${fire.final_size_acres.toLocaleString()} acres`,
  ].join('. ')
}

async function batchEmbed(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: texts,
    dimensions: 1536,
  })
  return response.data.map((d) => d.embedding)
}

async function seed() {
  const TOTAL = 2000
  const BATCH_SIZE = 50 // OpenAI supports batch embedding

  console.log(`Generating ${TOTAL} fire records...\n`)

  const allFires = []
  for (let i = 0; i < TOTAL; i++) {
    allFires.push(generateFire(i))
  }

  console.log(`Seeding in batches of ${BATCH_SIZE}...\n`)

  for (let batch = 0; batch < TOTAL; batch += BATCH_SIZE) {
    const slice = allFires.slice(batch, batch + BATCH_SIZE)
    const narratives = slice.map(buildNarrative)

    process.stdout.write(`[${batch + 1}-${Math.min(batch + BATCH_SIZE, TOTAL)}/${TOTAL}] Embedding...`)

    const embeddings = await batchEmbed(narratives)

    process.stdout.write(' Inserting...')

    const rows = slice.map((fire, i) => ({
      ...fire,
      narrative: narratives[i],
      embedding: embeddings[i],
    }))

    const { error } = await supabase.from('historical_fires').insert(rows)

    if (error) {
      console.error(` ERROR: ${error.message}`)
    } else {
      console.log(` OK`)
    }

    // Rate limit pause
    await new Promise((r) => setTimeout(r, 300))
  }

  console.log(`\nDone! Seeded ${TOTAL} fires (plus ${20} existing hand-curated records).`)
}

seed().catch(console.error)
