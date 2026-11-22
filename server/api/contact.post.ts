import type { H3Event } from "h3"
import {
	assertMethod,
	createError,
	defineEventHandler,
	getHeader,
	getRequestURL,
	readBody,
} from "h3"
import { Resend } from "resend"
import { z } from "zod"

// ─── Template email ──────────────────────────────────────────────────────────

const SITE_URL = "https://remycanal.me"

const LOGO_URL = `${SITE_URL}/img/logo-violet.png`
const LOGO_HEIGHT = 32
const LOGO_DARK_URL = `${SITE_URL}/img/logo-lime.png`

const FONT =
	"-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

const BRAND = {
	black: "#201e1e",
	blackLight: "#312e2e",
	white: "#f4f4f4",
	grayLight: "#e6e6e6",
	lime: "#c6ff33",
	violet: "#6840ff",
}

const LIGHT = {
	page: BRAND.violet,
	pageText: BRAND.white,
	card: BRAND.white,
	border: BRAND.grayLight,
	title: BRAND.black,
	body: BRAND.blackLight,
	muted: "#646363",
	brand: BRAND.violet,
	onBrand: BRAND.white,
	panel: BRAND.grayLight,
	divider: BRAND.grayLight,
}

const DARK = {
	page: BRAND.black,
	pageText: "#b2b1b1",
	card: BRAND.blackLight,
	border: BRAND.blackLight,
	title: BRAND.white,
	body: BRAND.grayLight,
	muted: "#b2b1b1",
	brand: BRAND.lime,
	onBrand: BRAND.black,
	panel: BRAND.black,
	divider: BRAND.black,
}

const TABLE = 'role="presentation" cellpadding="0" cellspacing="0" border="0"'

interface ContactEmailInput {
	name: string
	email: string
	subject: string
	message: string
}

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

function truncate(value: string, max: number): string {
	const chars = Array.from(value)

	return chars.length > max
		? `${chars
				.slice(0, max - 1)
				.join("")
				.trimEnd()}…`
		: value
}

function getInitials(name: string): string {
	const parts = name.split(/\s+/).filter(Boolean)
	const picked =
		parts.length > 1 ? [parts[0]!, parts[parts.length - 1]!] : parts.slice(0, 1)

	const initials = picked.map((part) => Array.from(part)[0] ?? "").join("")

	return (initials || "?").toLocaleUpperCase("fr-FR")
}

function formatReceivedAt(date = new Date()): string {
	return new Intl.DateTimeFormat("fr-FR", {
		dateStyle: "full",
		timeStyle: "short",
		timeZone: "Europe/Paris",
	}).format(date)
}

function renderContactEmail(contact: ContactEmailInput) {
	const receivedAt = formatReceivedAt()
	const firstName = escapeHtml(truncate(contact.name.split(/\s+/)[0] ?? contact.name, 24))

	const name = escapeHtml(contact.name)
	const email = escapeHtml(contact.email)
	const topic = escapeHtml(contact.subject)
	const initials = escapeHtml(getInitials(contact.name))

	const messageHtml = escapeHtml(contact.message).replace(/\r\n|\r|\n/g, "<br>")

	const preheader =
		escapeHtml(truncate(contact.message.replace(/\s+/g, " "), 120)) +
		"&zwnj;&nbsp;".repeat(60)

	const replyHref = escapeHtml(
		`mailto:${contact.email}?subject=${encodeURIComponent(`Re: ${contact.subject}`)}`
	)

	const logoStyle = `height: ${LOGO_HEIGHT}px; width: auto; border: 0;`

	const logoLight = `<img${LOGO_DARK_URL ? ' class="logo-light"' : ""} src="${LOGO_URL}" alt="Rémy Canal" height="${LOGO_HEIGHT}" style="display: block; ${logoStyle}">`

	const logoDark = LOGO_DARK_URL
		? `<img class="logo-dark" src="${LOGO_DARK_URL}" alt="" height="${LOGO_HEIGHT}" style="display: none; max-height: 0; overflow: hidden; mso-hide: all; ${logoStyle}">`
		: ""

	const logoDarkRules = LOGO_DARK_URL
		? `.logo-light { display: none !important; }
       .logo-dark { display: block !important; max-height: none !important; overflow: visible !important; }`
		: ""

	const subject = `Nouveau message de ${contact.name} — ${contact.subject}`

	const html = `<!DOCTYPE html>
<html lang="fr" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${topic}</title>

  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->

  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { text-decoration: none; }

    @media only screen and (max-width: 620px) {
      .px { padding-left: 24px !important; padding-right: 24px !important; }
      .h1 { font-size: 24px !important; }
    }

    @media (prefers-color-scheme: dark) {
      .bg-page { background-color: ${DARK.page} !important; }
      .bg-card { background-color: ${DARK.card} !important; border-color: ${DARK.border} !important; }
      .bg-panel { background-color: ${DARK.panel} !important; }
      .bg-brand { background-color: ${DARK.brand} !important; }
      .bg-divider { background-color: ${DARK.divider} !important; }
      .c-title { color: ${DARK.title} !important; }
      .c-body { color: ${DARK.body} !important; }
      .c-muted { color: ${DARK.muted} !important; }
      .c-brand { color: ${DARK.brand} !important; }
      .c-on-brand { color: ${DARK.onBrand} !important; }
      .c-page { color: ${DARK.pageText} !important; }
      ${logoDarkRules}
    }
  </style>
</head>

<body class="bg-page" style="margin: 0; padding: 0; background-color: ${LIGHT.page};">

  <!-- Preheader invisible -->
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; mso-hide: all; font-size: 1px; line-height: 1px; color: ${LIGHT.page};">
    ${preheader}
  </div>

  <table ${TABLE} width="100%" class="bg-page" bgcolor="${LIGHT.page}" style="background-color: ${LIGHT.page};">
    <tr>
      <td align="center" style="padding: 40px 16px;">

        <!--[if mso]><table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->

        <table ${TABLE} width="100%" style="max-width: 600px; margin: 0 auto;">
          <tr>
            <td>

              <!-- Carte -->
              <table ${TABLE} width="100%" class="bg-card" bgcolor="${LIGHT.card}" style="background-color: ${LIGHT.card}; border: 1px solid ${LIGHT.border}; border-radius: 20px; border-collapse: separate;">
                <tr>
                  <td class="px" style="padding: 36px 40px 40px; font-family: ${FONT};">

                    <!-- En-tête : logo + pastille -->
                    <table ${TABLE} width="100%">
                      <tr>
                        <td align="left" valign="middle">
                          ${logoLight}
                          ${logoDark}
                        </td>
                        <td align="right" valign="middle">
                          <span class="bg-brand c-on-brand" style="display: inline-block; padding: 6px 12px; border-radius: 999px; background-color: ${LIGHT.brand}; color: ${LIGHT.onBrand}; font-family: ${FONT}; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; line-height: 1; text-transform: uppercase;">
                            Nouveau message
                          </span>
                        </td>
                      </tr>
                    </table>

                    <!-- Sujet -->
                    <h1 class="h1 c-title" style="margin: 36px 0 0; font-family: ${FONT}; font-size: 28px; font-weight: 700; line-height: 1.25; letter-spacing: -0.02em; color: ${LIGHT.title};">
                      ${topic}
                    </h1>

                    <!-- Expéditeur -->
                    <table ${TABLE} style="margin-top: 24px;">
                      <tr>
                        <td width="44" valign="middle" style="padding-right: 14px;">
                          <table ${TABLE} width="44">
                            <tr>
                              <td class="bg-brand c-on-brand" align="center" valign="middle" width="44" height="44" bgcolor="${LIGHT.brand}" style="width: 44px; height: 44px; border-radius: 50%; background-color: ${LIGHT.brand}; color: ${LIGHT.onBrand}; font-family: ${FONT}; font-size: 15px; font-weight: 700; line-height: 44px; text-align: center;">
                                ${initials}
                              </td>
                            </tr>
                          </table>
                        </td>
                        <td valign="middle">
                          <p class="c-title" style="margin: 0; font-family: ${FONT}; font-size: 16px; font-weight: 600; line-height: 1.3; color: ${LIGHT.title};">
                            ${name}
                          </p>
                          <p style="margin: 2px 0 0; font-family: ${FONT}; font-size: 14px; line-height: 1.3;">
                            <a class="c-brand" href="mailto:${email}" style="color: ${LIGHT.brand}; text-decoration: none;">${email}</a>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <!-- Message -->
                    <table ${TABLE} width="100%" style="margin-top: 28px;">
                      <tr>
                        <td class="bg-panel c-body" bgcolor="${LIGHT.panel}" style="padding: 24px 26px; border-radius: 14px; background-color: ${LIGHT.panel}; color: ${LIGHT.body}; font-family: ${FONT}; font-size: 16px; line-height: 1.7; word-break: break-word; overflow-wrap: anywhere;">
                          ${messageHtml}
                        </td>
                      </tr>
                    </table>

                    <!-- Bouton -->
                    <table ${TABLE} style="margin-top: 28px;">
                      <tr>
                        <td class="bg-brand" bgcolor="${LIGHT.brand}" style="border-radius: 12px; background-color: ${LIGHT.brand}; mso-padding-alt: 14px 28px;">
                          <a class="c-on-brand" href="${replyHref}" style="display: inline-block; padding: 14px 28px; border-radius: 12px; color: ${LIGHT.onBrand}; font-family: ${FONT}; font-size: 15px; font-weight: 600; line-height: 1; text-decoration: none;">
                            Répondre à ${firstName}&nbsp;&rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Pied de carte -->
                    <div class="bg-divider" style="height: 1px; margin-top: 36px; background-color: ${LIGHT.divider}; font-size: 1px; line-height: 1px;">&nbsp;</div>

                    <p class="c-muted" style="margin: 20px 0 0; font-family: ${FONT}; font-size: 13px; line-height: 1.6; color: ${LIGHT.muted};">
                      Reçu le ${receivedAt} via <a class="c-brand" href="${SITE_URL}" style="color: ${LIGHT.brand}; text-decoration: none;">remycanal.me</a>.
                    </p>

                  </td>
                </tr>
              </table>

              <!-- Signature -->
              <p class="c-page" style="margin: 24px 0 0; font-family: ${FONT}; font-size: 12px; line-height: 1.5; text-align: center; color: ${LIGHT.pageText};">
                Rémy Canal · Creative Developer &amp; Designer
              </p>

            </td>
          </tr>
        </table>

        <!--[if mso]></td></tr></table><![endif]-->

      </td>
    </tr>
  </table>
</body>
</html>`

	const text = [
		`Nouveau message de ${contact.name}`,
		"",
		`Sujet : ${contact.subject}`,
		`De : ${contact.name} <${contact.email}>`,
		`Reçu le ${receivedAt}`,
		"",
		"────────────────────────────",
		contact.message,
		"────────────────────────────",
		"",
		`Répondre à cet e-mail écrit directement à ${contact.name.split(/\s+/)[0] ?? contact.name}.`,
		SITE_URL,
	].join("\n")

	return { subject, html, text }
}

// ─── Sécurité ────────────────────────────────────────────────────────────────

/** Hôtes autorisés à appeler l'endpoint (en plus de l'hôte de la requête : dev, previews). */
const ALLOWED_HOSTS = new Set(["remycanal.me", "www.remycanal.me"])

/** Taille max du body. 5000 caractères de message restent très en dessous. */
const MAX_BODY_BYTES = 32 * 1024

// ─── Validation ──────────────────────────────────────────────────────────────

/** Caractères de contrôle (\r, \n, \t, NUL…) : interdits dans les champs d'une seule ligne. */
const hasControlChars = (value: string) => /\p{Cc}/u.test(value)

const schema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Le nom est obligatoire.")
		.max(100, "100 caractères maximum.")
		.refine((value) => !hasControlChars(value), "Nom invalide."),

	email: z
		.string()
		.trim()
		.max(200, "200 caractères maximum.")
		.pipe(z.email("Adresse email invalide.")),

	subject: z
		.string()
		.trim()
		.min(1, "Le sujet est obligatoire.")
		.max(150, "150 caractères maximum.")
		.refine((value) => !hasControlChars(value), "Sujet invalide."),

	message: z
		.string()
		.trim()
		.min(10, "Le message doit contenir au moins 10 caractères.")
		.max(5000, "5000 caractères maximum."),

	// Honeypot
	website: z.string().max(500).optional(),
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Le navigateur envoie toujours Origin sur un POST : on refuse les origines inconnues. */
function isTrustedOrigin(event: H3Event, origin: string): boolean {
	try {
		const { host, hostname } = new URL(origin)

		return (
			ALLOWED_HOSTS.has(hostname) ||
			host === getRequestURL(event, { xForwardedHost: true }).host
		)
	} catch {
		return false
	}
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
	// 1. Méthode, origine, format et taille de la requête
	assertMethod(event, "POST")

	const origin = getHeader(event, "origin")

	if (origin && !isTrustedOrigin(event, origin)) {
		throw createError({
			statusCode: 403,
			statusMessage: "Origine non autorisée.",
		})
	}

	const contentType = getHeader(event, "content-type") || ""

	if (!contentType.includes("application/json")) {
		throw createError({
			statusCode: 415,
			statusMessage: "Format de requête non supporté.",
		})
	}

	if (Number(getHeader(event, "content-length") || 0) > MAX_BODY_BYTES) {
		throw createError({
			statusCode: 413,
			statusMessage: "Requête trop volumineuse.",
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
		console.warn("[contact] Honeypot déclenché.")

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

	const missing = [
		!config.resendApiKey && "NUXT_RESEND_API_KEY",
		!config.contactTo && "NUXT_CONTACT_TO",
	].filter(Boolean)

	if (missing.length > 0) {
		console.error(
			`[contact] Variables d'environnement manquantes : ${missing.join(", ")}`
		)

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
	let sendError: unknown = null

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
			sendError = error ?? "Réponse Resend sans identifiant."
		}
	} catch (error) {
		sendError = error
	}

	if (sendError) {
		console.error("[contact] Échec de l'envoi :", sendError)

		throw createError({
			statusCode: 502,
			statusMessage: "L'email n'a pas pu être envoyé.",
			// En dev uniquement : le détail de l'erreur Resend apparaît dans l'onglet Network.
			data: import.meta.dev ? { cause: sendError } : undefined,
		})
	}

	// 8. Succès
	return { ok: true }
})
