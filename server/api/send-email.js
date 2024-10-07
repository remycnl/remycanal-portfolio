// import nodemailer from "nodemailer";

// export default defineEventHandler(async (event) => {
// 	const body = await readBody(event);

// 	const transporter = nodemailer.createTransport({
// 		service: "gmail",
// 		auth: {
// 			user: process.env.GMAIL_USER,
// 			pass: process.env.GMAIL_PASS,
// 		},
// 	});

// 	const mailOptions = {
// 		from: body.email,
// 		to: process.env.GMAIL_USER,
// 		subject: `Message from ${body.firstname} ${body.lastname}`,
// 		text: `
// Vous avez reçu un nouveau message depuis votre Portfolio :

// ------------------------------------------------------
// Prénom : ${body.firstname}
// Nom : ${body.lastname}
// Email : ${body.email}
// Entreprise : ${body.company || 'Non spécifié'}
// ------------------------------------------------------

// ${body.message}
// `,
// 	};
// 	try {
// 		await transporter.sendMail(mailOptions);
// 		return { status: "success" };
// 	} catch (error) {
// 		console.error("Erreur lors de l'envoi de l'email:", error);
// 		return { status: "error", message: error.message };
// 	}
// });
