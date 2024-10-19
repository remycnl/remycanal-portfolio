import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
    res.setHeader("Access-Control-Allow-Origin", "https://www.remycanal.me");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.status(200).end();
        return;
    }

    if (req.method === "POST") {
        const body = req.body;

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
            res.status(200).json({ status: "success" });
        } catch (error) {
            console.error("Erreur lors de l'envoi de l'email:", error);
            res.status(500).json({ status: "error", message: error.message });
        }
    } else {
        res.setHeader("Allow", ["POST"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
