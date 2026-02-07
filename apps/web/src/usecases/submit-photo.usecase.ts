import { UserRepository } from '../repositories/user.repository'
import { EmailService } from '../services/email.service'
import { getSupabaseAdminClient } from '../utils/supabase-admin'

const SUPABASE_BUCKET = 'photobooth-bucket'

export interface SubmitPhotoRequest {
  photoPath: string
  name: string
  email: string
  phone: string
}

export interface SubmitPhotoResult {
  photoUrl: string
  userId: string
}

export class SubmitPhotoUseCase {
  private userRepository: UserRepository
  private emailService: EmailService

  constructor() {
    this.userRepository = new UserRepository()
    this.emailService = new EmailService()
  }

  async execute(request: SubmitPhotoRequest): Promise<SubmitPhotoResult> {
    const supabase = getSupabaseAdminClient()

    const user = await this.userRepository.createUser({
      name: request.name,
      email: request.email,
      phone: request.phone,
      photoPath: request.photoPath,
    })

    const {
      data: { publicUrl: photoUrl },
    } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(request.photoPath)
    try {
      // TODO: Use CDN
      await this.emailService.sendPhotoEmail({
        recipientEmail: request.email,
        recipientName: request.name,
        photoUrl,
      })
    } catch (emailError) {
      console.error('Failed to send email:', emailError)
      throw new Error('User created but failed to send email')
    }

    return {
      photoUrl,
      userId: user.id,
    }
  }
}
