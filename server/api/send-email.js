import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default defineEventHandler(async (event) => {
	const body = await readBody(event);

	const mailOptions = {
		from: process.env.GMAIL_USER,
		to: process.env.GMAIL_USER,
		subject: `Message from ${body.firstname} ${body.lastname}`,
		html: `
		<p>Vous avez reçu un nouveau message depuis votre Portfolio :</p>
		<p>------------------------------------------------------</p>
		<p><strong>Prénom :</strong> ${body.firstname}</p>
		<p><strong>Nom :</strong> ${body.lastname}</p>
		<p><strong>Email :</strong> ${body.email}</p>
		<p><strong>Entreprise :</strong> ${body.company || "Non spécifié"}</p>
		<p>------------------------------------------------------</p>
		<p>${body.message}</p>
    `,
	};

	try {
		await resend.emails.send(mailOptions);
		return { status: "success" };
	} catch (error) {
		console.error("Erreur lors de l'envoi de l'email:", error);
		return { status: "error", message: error.message };
	}
});
