import { Resend } from 'resend'
import { z } from 'zod'

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(0).optional(), // honeypot anti-spam
})

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

export default defineEventHandler(async (event) => {
  const { resendApiKey, contactTo } = useRuntimeConfig(event)

  const result = await readValidatedBody(event, (body) => schema.safeParse(body))
  if (!result.success) {
    throw createError({ statusCode: 400, statusMessage: 'Données invalides' })
  }

  const { name, email, message, website } = result.data

  // Un bot a rempli le champ caché : on fait semblant que c'est OK
  if (website) return { ok: true }

  const resend = new Resend(resendApiKey)

  const { data, error } = await resend.emails.send({
    from: 'Portfolio <contact@remycanal.me>',
    to: [contactTo],
    replyTo: email,
    subject: `Nouveau message de ${name}`,
    html: `
      <p><strong>${escapeHtml(name)}</strong> (${escapeHtml(email)})</p>
      <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
    `,
    text: `${name} (${email})\n\n${message}`,
  })

  if (error) {
    console.error('[contact] Resend error:', error)
    throw createError({ statusCode: 502, statusMessage: "L'email n'a pas pu être envoyé" })
  }

  return { ok: true, id: data?.id }
})