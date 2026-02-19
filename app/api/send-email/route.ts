import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: Request) {
  try {
    const { html, recipients, subject, screenshotBase64, screenshotName } = await req.json()

    if (!recipients || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No recipients provided' },
        { status: 400 }
      )
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'RESEND_API_KEY not configured. Add it to your Vercel environment variables.' },
        { status: 500 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    // Build attachments array for the screenshot
    const attachments: { filename: string; content: string }[] = []
    if (screenshotBase64) {
      const base64Content = screenshotBase64.split(',')[1]
      if (base64Content) {
        attachments.push({
          filename: screenshotName || 'salesforce-dashboard.png',
          content: base64Content,
        })
      }
    }

    const fromAddress =
      process.env.RESEND_FROM_EMAIL || 'Yuno SDR Team <onboarding@resend.dev>'

    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: recipients,
      subject,
      html,
      attachments: attachments.length > 0 ? attachments : undefined,
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err) {
    console.error('Error sending email:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
