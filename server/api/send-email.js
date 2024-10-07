// import nodemailer from "nodemailer";

// export default async function handler(req, res) {
// 	// Assurez-vous que la méthode de la requête est bien POST
// 	if (req.method !== "POST") {
// 		return res.status(405).json({ message: "Method Not Allowed" });
// 	}

// 	try {
// 		// Vérifier et parser le corps de la requête
// 		const body = req.body;

// 		if (
// 			!body ||
// 			!body.email ||
// 			!body.firstname ||
// 			!body.lastname ||
// 			!body.message
// 		) {
// 			return res.status(400).json({ message: "Missing required fields" });
// 		}

// 		// Configurer le transporteur nodemailer
// 		const transporter = nodemailer.createTransport({
// 			service: "gmail",
// 			auth: {
// 				user: process.env.GMAIL_USER,
// 				pass: process.env.GMAIL_PASS,
// 			},
// 		});

// 		// Définir les options de l'e-mail
// 		const mailOptions = {
// 			from: body.email,
// 			to: process.env.GMAIL_USER,
// 			subject: `Message from ${body.firstname} ${body.lastname}`,
// 			text: `
//       Vous avez reçu un nouveau message depuis votre Portfolio :

//       ------------------------------------------------------
//       Prénom : ${body.firstname}
//       Nom : ${body.lastname}
//       Email : ${body.email}
//       Entreprise : ${body.company || "Non spécifié"}
//       ------------------------------------------------------

//       ${body.message}
//       `,
// 		};

// 		// Envoyer l'e-mail
// 		await transporter.sendMail(mailOptions);
// 		return res.status(200).json({ status: "success" });
// 	} catch (error) {
// 		console.error("Erreur lors de l'envoi de l'email:", error);
// 		return res.status(500).json({ status: "error", message: error.message });
// 	}
// }
