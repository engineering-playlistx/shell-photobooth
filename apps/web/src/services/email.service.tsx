import { Resend } from 'resend'
import { renderToString } from 'react-dom/server'
import { PhotoResultEmail } from './emails/photo-result'

const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || 'Photobooth <no-reply@example.com>'

export interface SendPhotoEmailData {
  recipientEmail: string
  recipientName: string
  photoUrl: string
}

export class EmailService {
  private resend: Resend | null
  private fromEmail: string

  constructor() {
    const apiKey = process.env.RESEND_API_KEY
    if (apiKey) {
      this.resend = new Resend(apiKey)
    } else {
      console.warn('RESEND_API_KEY not set — emails will be logged only')
      this.resend = null
    }
    this.fromEmail = RESEND_FROM_EMAIL
  }

  async sendPhotoEmail(data: SendPhotoEmailData): Promise<void> {
    const fileName = data.photoUrl.split('/').pop() || 'photo.png'

    const emailSubject = 'Your Photobooth Result ✨'

    if (this.resend) {
      const { data: result, error } = await this.resend.emails.send(
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

      if (error) {
        console.error('Resend API error:', error)
        throw new Error(`Failed to send email: ${error.message}`)
      }

      console.log({
        message: 'Email sent successfully',
        emailId: result.id,
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
