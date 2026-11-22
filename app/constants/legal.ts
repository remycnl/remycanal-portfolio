// Source unique des informations légales : modifie ici, toutes les pages se mettent à jour.
// Les champs vides ("") ne sont pas affichés.
export const LEGAL = {
	name: "Rémy Canal",
	legalName: "Rémy Canal, EI",
	status: "sole proprietor (entrepreneur individuel, EI) operating a micro-enterprise",
	siren: "990 923 500",
	siret: "990 923 500 00013",
	email: "hello@remycanal.me",
	vat: "VAT not applicable, art. 293 B of the French General Tax Code (CGI)",
	url: "https://www.remycanal.me",
	updated: "13 November 2026",

	// Sensible : non affichés par défaut.
	// Attention : la LCEN (art. 6-III) demande le domicile et un téléphone pour un éditeur personne physique.
	// Option : renseigne une adresse de domiciliation commerciale et/ou une ligne pro dédiée.
	address: "",
	phone: "",

	// Ville du tribunal compétent (B2B). Vide = formulation générique sans ville.
	court: "",

	host: {
		name: "Vercel Inc.",
		address: "440 N Barranca Ave #4133, Covina, CA 91723, USA",
		phone: "+1 559 288 7060", // à vérifier sur vercel.com avant publication
		url: "https://vercel.com",
	},
	registrar: "Hostinger",
	insurer: "Hiscox, arranged through Orus", // vide pour ne pas l'afficher
} as const
