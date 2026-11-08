import { Resend } from "resend"
import { z } from "zod"

// Les clients mail ne rendent pas les SVG : utilise un PNG (idéalement 96×96 pour le retina)
// placé dans public/logos/, avec une URL absolue.
const LOGO_URL = "https://remycanal.me/logos/R-violet.png"

const schema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Le nom est obligatoire.")
		.max(100, "100 caractères maximum.")
		.refine((value) => !/[\r\n]/.test(value), "Nom invalide."),

	email: z
		.string()
		.trim()
		.email("Adresse email invalide.")
		.max(200, "200 caractères maximum."),

	subject: z
		.string()
		.trim()
		.min(1, "Le sujet est obligatoire.")
		.max(150, "150 caractères maximum.")
		.refine((value) => !/[\r\n]/.test(value), "Sujet invalide."),

	message: z
		.string()
		.trim()
		.min(10, "Le message doit contenir au moins 10 caractères.")
		.max(5000, "5000 caractères maximum."),

	// Honeypot
	website: z.string().max(500).optional(),
})

function escapeHtml(value: string): string {
	return value.replace(
		/[&<>"']/g,
		(char) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#39;",
			})[char]!
	)
}

function renderContactEmail(contact: {
	name: string
	email: string
	subject: string
	message: string
}) {
	const name = escapeHtml(contact.name)
	const email = escapeHtml(contact.email)
	const topic = escapeHtml(contact.subject)
	const message = escapeHtml(contact.message)

	const subject = `Nouveau message de ${contact.name} — ${contact.subject}`

	const html = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>

      <body style="
        margin: 0;
        padding: 40px 16px;
        background-color: #6840ff;
        font-family: Arial, Helvetica, sans-serif;
        color: #201e1e;
      ">
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
        >
          <tr>
            <td align="center">

              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  max-width: 560px;
                  background-color: #f4f4f4;
                  border-radius: 16px;
                "
              >
                <tr>
                  <td style="padding: 40px;">

                    <!-- LOGO -->
                    <img
                      src="${LOGO_URL}"
                      width="48"
                      height="48"
                      alt="Rémy Canal"
                      style="
                        display: block;
                        width: 48px;
                        height: 48px;
                        margin-bottom: 36px;
                        border: 0;
                      "
                    />

                    <!-- TITLE -->
                    <h1 style="
                      margin: 0 0 36px;
                      font-size: 28px;
                      line-height: 1.2;
                      font-weight: 600;
                      color: #201e1e;
                    ">
                      Nouveau message
                    </h1>

                    <!-- NAME -->
                    <p style="
                      margin: 0 0 8px;
                      font-size: 11px;
                      font-weight: bold;
                      letter-spacing: 1px;
                      color: #777777;
                      text-transform: uppercase;
                    ">
                      Nom
                    </p>

                    <p style="
                      margin: 0 0 28px;
                      font-size: 16px;
                      line-height: 1.5;
                      color: #201e1e;
                    ">
                      ${name}
                    </p>

                    <!-- EMAIL -->
                    <p style="
                      margin: 0 0 8px;
                      font-size: 11px;
                      font-weight: bold;
                      letter-spacing: 1px;
                      color: #777777;
                      text-transform: uppercase;
                    ">
                      Email
                    </p>

                    <p style="
                      margin: 0 0 28px;
                      font-size: 16px;
                      line-height: 1.5;
                    ">
                      <a
                        href="mailto:${email}"
                        style="color: #6840ff; text-decoration: none;"
                      >
                        ${email}
                      </a>
                    </p>

                    <!-- SUBJECT -->
                    <p style="
                      margin: 0 0 8px;
                      font-size: 11px;
                      font-weight: bold;
                      letter-spacing: 1px;
                      color: #777777;
                      text-transform: uppercase;
                    ">
                      Sujet
                    </p>

                    <p style="
                      margin: 0 0 32px;
                      font-size: 16px;
                      line-height: 1.5;
                      color: #201e1e;
                    ">
                      ${topic}
                    </p>

                    <!-- DIVIDER -->
                    <div style="
                      height: 1px;
                      background-color: #dedede;
                      margin-bottom: 28px;
                    "></div>

                    <!-- MESSAGE -->
                    <p style="
                      margin: 0 0 12px;
                      font-size: 11px;
                      font-weight: bold;
                      letter-spacing: 1px;
                      color: #777777;
                      text-transform: uppercase;
                    ">
                      Message
                    </p>

                    <p style="
                      margin: 0;
                      font-size: 15px;
                      line-height: 1.8;
                      color: #201e1e;
                      white-space: pre-wrap;
                      overflow-wrap: anywhere;
                    ">
                      ${message}
                    </p>

                    <!-- FOOTER -->
                    <div style="
                      height: 1px;
                      background-color: #dedede;
                      margin: 36px 0 20px;
                    "></div>

                    <p style="
                      margin: 0;
                      font-size: 11px;
                      color: #888888;
                    ">
                      Envoyé depuis remycanal.me
                    </p>

                  </td>
                </tr>
              </table>

              <p style="
                margin: 24px 0 0;
                font-size: 11px;
                color: #ffffff;
                opacity: 0.8;
              ">
                Rémy Canal · Creative Developer & Designer
              </p>

            </td>
          </tr>
        </table>
      </body>
    </html>
  `

	const text = [
		"Nouveau message depuis remycanal.me",
		"",
		`Nom : ${contact.name}`,
		`Email : ${contact.email}`,
		`Sujet : ${contact.subject}`,
		"",
		"Message :",
		contact.message,
	].join("\n")

	return { subject, html, text }
}

export default defineEventHandler(async (event) => {
	// 1. Vérification de la méthode et du contenu
	assertMethod(event, "POST")

	const contentType = getHeader(event, "content-type") || ""

	if (!contentType.includes("application/json")) {
		throw createError({
			statusCode: 415,
			statusMessage: "Format de requête non supporté.",
		})
	}

	// 2. Lecture du body
	const body = await readBody(event)

	if (!body || typeof body !== "object" || Array.isArray(body)) {
		throw createError({
			statusCode: 400,
			statusMessage: "Requête invalide.",
		})
	}

	// 3. Honeypot : faux succès pour les bots
	if (typeof body.website === "string" && body.website.trim().length > 0) {
		return { ok: true }
	}

	// 4. Validation
	const result = schema.safeParse(body)

	if (!result.success) {
		throw createError({
			statusCode: 400,
			statusMessage: "Données invalides.",
			data: {
				issues: result.error.issues.map((issue) => ({
					field: issue.path[0],
					message: issue.message,
				})),
			},
		})
	}

	const { name, email, subject, message } = result.data

	// 5. Configuration
	const config = useRuntimeConfig(event)

	if (!config.resendApiKey || !config.contactTo) {
		console.error("[contact] Missing Resend configuration.")

		throw createError({
			statusCode: 503,
			statusMessage: "Service temporairement indisponible.",
		})
	}

	// 6. Préparation de l'email
	const {
		subject: emailSubject,
		html,
		text,
	} = renderContactEmail({
		name,
		email,
		subject,
		message,
	})

	// 7. Envoi via Resend
	try {
		const resend = new Resend(config.resendApiKey)

		const { data, error } = await resend.emails.send({
			from: "Portfolio <contact@remycanal.me>",
			to: [config.contactTo],
			replyTo: email,
			subject: emailSubject,
			html,
			text,
		})

		if (error || !data?.id) {
			console.error("[contact] Resend error:", error)

			throw createError({
				statusCode: 502,
				statusMessage: "L'email n'a pas pu être envoyé.",
			})
		}

		// 8. Succès
		return {
			ok: true,
			id: data.id,
		}
	} catch (error) {
		// Ne pas transformer les erreurs HTTP déjà construites
		if (error && typeof error === "object" && "statusCode" in error) {
			throw error
		}

		console.error("[contact] Email sending failed:", error)

		throw createError({
			statusCode: 502,
			statusMessage: "L'email n'a pas pu être envoyé.",
		})
	}
})
