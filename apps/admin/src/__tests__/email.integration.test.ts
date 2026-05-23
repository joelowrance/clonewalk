import { describe, it, expect, beforeEach } from 'vitest'
import { sendInviteEmail } from '../lib/email'

const MAILPIT = 'http://localhost:8025/api/v1'

interface MailpitAddress { Address: string; Name: string }
interface MailpitSummary {
  ID:      string
  To:      MailpitAddress[]
  Subject: string
}
interface MailpitList { messages: MailpitSummary[] | null }
interface MailpitMessage { HTML: string }

async function flushMailpit(): Promise<void> {
  await fetch(`${MAILPIT}/messages`, { method: 'DELETE' })
}

async function listMessages(): Promise<MailpitSummary[]> {
  const res  = await fetch(`${MAILPIT}/messages`)
  const data = await res.json() as MailpitList
  return data.messages ?? []
}

async function getMessage(id: string): Promise<MailpitMessage> {
  const res = await fetch(`${MAILPIT}/message/${id}`)
  return res.json() as Promise<MailpitMessage>
}

beforeEach(async () => {
  await flushMailpit()
})

describe('sendInviteEmail', () => {
  it('delivers one message to Mailpit', async () => {
    await sendInviteEmail('recipient@example.com', 'http://localhost:3000/invite/token123')

    const messages = await listMessages()
    expect(messages).toHaveLength(1)
  })

  it('addresses the message to the correct recipient', async () => {
    await sendInviteEmail('recipient@example.com', 'http://localhost:3000/invite/token123')

    const [msg] = await listMessages()
    expect(msg?.To[0]?.Address).toBe('recipient@example.com')
  })

  it('sets the subject to "You have been invited"', async () => {
    await sendInviteEmail('recipient@example.com', 'http://localhost:3000/invite/token123')

    const [msg] = await listMessages()
    expect(msg?.Subject).toBe('You have been invited')
  })

  it('includes the invite URL in the HTML body', async () => {
    const inviteUrl = 'http://localhost:3000/invite/token123'
    await sendInviteEmail('recipient@example.com', inviteUrl)

    const [summary] = await listMessages()
    const full = await getMessage(summary!.ID)
    expect(full.HTML).toContain(inviteUrl)
  })
})
