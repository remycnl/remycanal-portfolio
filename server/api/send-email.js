import nodemailer from "nodemailer";

export default async function handler(req, res) {
	if (req.method !== "POST") {
		res.status(405).json({ message: "Method Not Allowed" });
		return;
	}

	const body = req.body;

	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.GMAIL_USER,
			pass: process.env.GMAIL_PASS,
		},
	});

	const mailOptions = {
		from: body.email,
		to: process.env.GMAIL_USER,
		subject: `Message from ${body.firstname} ${body.lastname}`,
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

	try {
		await transporter.sendMail(mailOptions);
		res.status(200).json({ status: "success" });
	} catch (error) {
		console.error("Erreur lors de l'envoi de l'email:", error);
		res.status(500).json({ status: "error", message: error.message });
	}
}
