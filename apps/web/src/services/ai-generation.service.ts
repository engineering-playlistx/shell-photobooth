import Replicate from 'replicate'

export type RacingTheme = 'pitcrew' | 'motogp' | 'f1'

export interface GenerateFaceSwapParams {
  userPhotoUrl: string
  theme: RacingTheme
}

const TEMPLATE_URLS: Record<RacingTheme, string | undefined> = {
  pitcrew: process.env.RACING_TEMPLATE_PITCREW_URL,
  motogp: process.env.RACING_TEMPLATE_MOTOGP_URL,
  f1: process.env.RACING_TEMPLATE_F1_URL,
}

const THEME_PROMPTS: Record<RacingTheme, string> = {
  pitcrew:
    'Insert the face of the person from the first image onto the body of the person in the second image. Keep the pit crew outfit, background, and pose exactly the same. Make it look natural and photorealistic.',
  motogp:
    'Insert the face of the person from the first image onto the body of the person in the second image. Keep the MotoGP racing suit, background, and pose exactly the same. Make it look natural and photorealistic.',
  f1: 'Insert the face of the person from the first image onto the body of the person in the second image. Keep the F1 racing suit, background, and pose exactly the same. Make it look natural and photorealistic.',
}

export class AIGenerationService {
  private replicate: Replicate

  constructor() {
    const apiKey = process.env.REPLICATE_API_KEY
    if (!apiKey) {
      throw new Error('REPLICATE_API_KEY environment variable is required')
    }
    this.replicate = new Replicate({ auth: apiKey })
  }

  async generateFaceSwap(params: GenerateFaceSwapParams): Promise<string> {
    const targetImageUrl = TEMPLATE_URLS[params.theme]
    if (!targetImageUrl) {
      throw new Error(
        `Template image URL not configured for theme: ${params.theme}`,
      )
    }

    const prompt = THEME_PROMPTS[params.theme]

    const output = await this.replicate.run('google/nano-banana-pro', {
      input: {
        prompt,
        image_input: [params.userPhotoUrl, targetImageUrl],
        resolution: '2K',
        output_format: 'png',
        safety_filter_level: 'block_only_high',
      },
    })

    const resultUrl = output as unknown as string
    if (!resultUrl) {
      throw new Error(
        'Unexpected response from Replicate nano-banana-pro model',
      )
    }

    return resultUrl
  }

  async downloadAsBase64(imageUrl: string): Promise<string> {
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new Error(
        `Failed to download generated image: ${response.statusText}`,
      )
    }

    const arrayBuffer = await response.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    let binary = ''
    for (const byte of uint8Array) {
      binary += String.fromCharCode(byte)
    }
    const base64 = btoa(binary)

    const contentType = response.headers.get('content-type') || 'image/png'
    return `data:${contentType};base64,${base64}`
  }
}
