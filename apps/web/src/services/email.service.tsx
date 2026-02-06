import { Resend } from 'resend'
import { renderToString } from 'react-dom/server'
import { PhotoResultEmail } from './emails/photo-result'

// TODO: Move to environment variables
const RESEND_FROM_EMAIL = "L'Occitane <no-reply@loccitane.id>"
const isProduction = process.env.NODE_ENV === 'production'

export interface SendPhotoEmailData {
  recipientEmail: string
  recipientName: string
  photoUrl: string
}

export class EmailService {
  private resend: Resend | null
  private fromEmail: string

  constructor() {
    if (isProduction) {
      const apiKey = process.env.RESEND_API_KEY
      if (!apiKey) {
        throw new Error('RESEND_API_KEY environment variable is required')
      }
      this.resend = new Resend(apiKey)
    } else {
      this.resend = null
    }
    this.fromEmail = RESEND_FROM_EMAIL
  }

  async sendPhotoEmail(data: SendPhotoEmailData): Promise<void> {
    const fileName = data.photoUrl.split('/').pop() || 'photo.png'

    const emailSubject = 'Your L’Occitane Provence Holiday Prediction ✨'

    if (this.resend) {
      await this.resend.emails.send(
        {
          from: this.fromEmail,
          to: data.recipientEmail,
          subject: emailSubject,
          react: <PhotoResultEmail url={data.photoUrl} />,
          attachments: [
            {
              filename: fileName,
              path: data.photoUrl,
            },
          ],
        },
        { idempotencyKey: `${data.recipientEmail}-${fileName}` },
      )
      console.log({
        message: 'Email sent successfully',
        recipientEmail: data.recipientEmail,
        photoUrl: data.photoUrl,
      })
    } else {
      console.log('Sending email to:', data.recipientEmail)
      console.log('Email subject:', emailSubject)
      console.log(
        'Email body:',
        renderToString(<PhotoResultEmail url={data.photoUrl} />),
      )
    }
  }
}
