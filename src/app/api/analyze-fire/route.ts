import { NextResponse } from 'next/server'
import { anthropic } from '@/lib/anthropic'
import type { FireAnalysis } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const { imageBase64 } = await request.json()

    if (!imageBase64) {
      return NextResponse.json(
        { error: 'imageBase64 is required' },
        { status: 400 }
      )
    }

    // Strip data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 600,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Data,
              },
            },
            {
              type: 'text',
              text: `You are a wildfire analysis expert. Analyze this fire photo and return ONLY a JSON object with these fields:

{
  "estimated_size": "estimated area of the fire (e.g. '~2 acres', '< 1 acre', '~50 acres')",
  "intensity": "low" | "moderate" | "high" | "extreme",
  "flame_length": "estimated flame length (e.g. '2-4 feet', '8-12 feet')",
  "color_description": "describe smoke and flame colors observed",
  "behavior": "describe fire behavior patterns (e.g. 'surface fire', 'crown fire', 'spotting observed')",
  "fuel_type_visible": "describe visible fuel/vegetation (e.g. 'dry grass', 'chaparral', 'mixed conifer')"
}

Return ONLY valid JSON, no markdown or explanation.`,
            },
          ],
        },
      ],
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text : ''
    const fireAnalysis: FireAnalysis = JSON.parse(text)

    return NextResponse.json(fireAnalysis)
  } catch (error) {
    console.error('[ANALYZE-FIRE] Error:', (error as Error).message)
    return NextResponse.json(
      { error: 'Fire analysis failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}
