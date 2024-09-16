import nodemailer from "nodemailer";

export default defineEventHandler(async (event) => {
	// Récupérer les données envoyées depuis le formulaire
	const body = await readBody(event);

	// Créer le transporteur de mails via nodemailer (ici en utilisant Gmail, mais cela dépend du service email que vous utilisez)
	const transporter = nodemailer.createTransport({
		service: "gmail", // Utilisez votre propre service (ex: gmail, outlook, smtp)
		auth: {
			user: process.env.GMAIL_USER, // Remplacez par votre email
			pass: process.env.GMAIL_PASS, // Remplacez par le mot de passe ou l'App Password
		},
	});

	// Configurer les informations de l'e-mail
	const mailOptions = {
		from: body.email, // Adresse e-mail de l'expéditeur
		to: process.env.GMAIL_USER, // Votre adresse email où vous souhaitez recevoir le message
		subject: `Message from ${body.firstname} ${body.lastname}`, // Sujet de l'email
		text: `
Vous avez reçu un nouveau message depuis votre Portfolio :

------------------------------------------------------
Prénom : ${body.firstname}
Nom : ${body.lastname}
Email : ${body.email}
Entreprise : ${body.company}
------------------------------------------------------

${body.message}
`,
	};
	// Envoyer l'e-mail
	try {
		await transporter.sendMail(mailOptions);
		return { status: "success" }; // Retourne un statut de succès si tout va bien
	} catch (error) {
		console.error("Erreur lors de l'envoi de l'email:", error);
		return { status: "error", message: error.message };
	}
});
