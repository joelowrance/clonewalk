import nodemailer from 'nodemailer'

export async function sendInviteEmail(to: string, inviteUrl: string): Promise<void> {
  const smtpUrl   = process.env.SMTP_URL
  const emailFrom = process.env.EMAIL_FROM
  if (!smtpUrl || !emailFrom) {
    throw new Error('SMTP_URL and EMAIL_FROM environment variables are required')
  }
  const transport = nodemailer.createTransport(smtpUrl)
  await transport.sendMail({
    from:    emailFrom,
    to,
    subject: 'You have been invited',
    text:    `Accept your invitation: ${inviteUrl}`,
    html:    `<p>Accept your invitation: <a href="${inviteUrl}">${inviteUrl}</a></p>`,
  })
}
