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

    const output = await this.replicate.run('lucataco/face-swap:latest', {
      input: {
        source_image: params.userPhotoUrl,
        target_image: targetImageUrl,
      },
    })

    const resultUrl = output as unknown as string
    if (!resultUrl) {
      throw new Error('Unexpected response from Replicate face-swap model')
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
