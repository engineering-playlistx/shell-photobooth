import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Link,
  Section,
  Text,
} from '@react-email/components'

interface PhotoResultEmailProps {
  url: string
}

export function PhotoResultEmail({ url }: PhotoResultEmailProps) {
  return (
    <Html lang="id">
      <Head>
        <title>Your L’Occitane Provence Holiday Prediction ✨</title>
      </Head>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerSectionStyle}>
            <Text style={headingStyle}>
              Your L’Occitane Provence Holiday Prediction ✨
            </Text>
          </Section>
          <Section style={contentSectionStyle}>
            <Text style={textStyle}>Hi there,</Text>
            <Text style={textStyle}>
              Thank you for visiting our L’Occitane Holiday Photo Experience.
            </Text>
            <Text style={textStyle}>
              Inside, you’ll find your photo along with a little gift from us, a
              glimpse into your holiday soundtrack, or a little new year
              prediction.
            </Text>
            <Text style={textStyle}>
              We hope this small moment of glow follows you through the season.
            </Text>
            <Text style={textStyle}>See you again at our next experience.</Text>
          </Section>
          <Section style={buttonSectionStyle}>
            <Button href={url} style={buttonStyle} target="_blank" download>
              Download Your Photo
            </Button>
            <Text style={textStyle}>or open this link in your browser:</Text>
            <Link href={url} style={linkStyle} target="_blank">
              {url}
            </Link>
          </Section>
          <Section style={footerSectionStyle}>
            <Text style={footerTextStyle}>
              Warmly,
              <br />
              L’Occitane Indonesia
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

const bodyStyle: React.CSSProperties = {
  fontFamily: 'Arial, sans-serif',
  lineHeight: 1.6,
  color: '#333',
  margin: 0,
  padding: 0,
}

const containerStyle: React.CSSProperties = {
  maxWidth: '600px',
  margin: '0 auto',
  padding: '20px',
}

const headerSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '30px',
}

const headingStyle: React.CSSProperties = {
  color: '#2c3e50',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: 0,
}

const contentSectionStyle: React.CSSProperties = {
  backgroundColor: '#f9f9f9',
  padding: '20px',
  borderRadius: '8px',
  marginBottom: '30px',
}

const textStyle: React.CSSProperties = {
  margin: '0 0 16px 0',
  fontSize: '16px',
}

const buttonSectionStyle: React.CSSProperties = {
  textAlign: 'center',
  margin: '30px 0',
}

const buttonStyle: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: '#2c3e50',
  color: '#ffffff',
  padding: '15px 30px',
  textDecoration: 'none',
  borderRadius: '5px',
  fontWeight: 'bold',
  fontSize: '16px',
  marginBottom: '16px',
}

const footerSectionStyle: React.CSSProperties = {
  marginTop: '30px',
  paddingTop: '20px',
  borderTop: '1px solid #eee',
}

const footerTextStyle: React.CSSProperties = {
  margin: 0,
  fontSize: '12px',
  color: '#666',
}

const linkStyle: React.CSSProperties = {
  color: '#0066cc',
  textDecoration: 'underline',
  wordBreak: 'break-all',
}

PhotoResultEmail.PreviewProps = {
  recipientName: 'John Doe',
  url: 'https://example.com/photo.png',
}

export default PhotoResultEmail
