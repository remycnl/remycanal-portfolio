<script setup lang="ts">
import { LEGAL } from "@/constants/legal"

useSeoMeta({
	title: "Terms",
	description:
		"Terms of use of remycanal.me and terms of service for professional clients.",
})

const jurisdiction = LEGAL.court
	? `the courts of ${LEGAL.court}`
	: "the courts with territorial jurisdiction over the Provider’s registered place of business"
</script>

<template>
	<LegalPage title="Terms" :updated="LEGAL.updated">
		<p>
			<a href="#website-terms">Part A</a> covers the use of this website.
			<a href="#services-terms">Part B</a> applies to services provided by
			{{ LEGAL.legalName }}.
		</p>

		<h2 id="website-terms">Part A. Website terms of use</h2>
		<h3>A1. Acceptance</h3>
		<p>
			By browsing this website you accept these terms. If you do not agree, please stop
			using it.
		</p>
		<h3>A2. Intellectual property</h3>
		<p>
			The content of this website is protected and remains the property of
			{{ LEGAL.name }}, except where a third party is credited (see the
			<NuxtLink to="/legal-notice">legal notice</NuxtLink> and
			<NuxtLink to="/credits">credits</NuxtLink>). No licence is granted beyond personal,
			non-commercial viewing. Projects shown on this website are presented with the
			consent of their owners.
		</p>
		<h3>A3. Acceptable use</h3>
		<p>
			You agree not to disrupt or overload the website, attempt unauthorised access,
			extract its content at scale, or use the contact form to send spam, unlawful,
			misleading or malicious content.
		</p>
		<h3>A4. Contact form</h3>
		<p>
			Messages sent through the contact form must be accurate and sent in good faith.
			Sending a message does not create a contract, and I am not obliged to reply.
			Personal data is handled as described in the
			<NuxtLink to="/privacy-policy">privacy policy</NuxtLink>.
		</p>
		<h3>A5. Availability and compatibility</h3>
		<p>
			The website uses WebGL, 3D and animations that may not work on every device or
			browser. It is provided “as is”, without any guarantee of continuous availability or
			absence of errors, and I may modify, suspend or remove it at any time.
		</p>
		<h3>A6. External links</h3>
		<p>
			Links to third-party websites are provided for convenience. I do not control them
			and am not responsible for their content or practices.
		</p>
		<h3>A7. Liability</h3>
		<p>
			To the fullest extent permitted by law, I am not liable for any damage resulting
			from the use of, or the inability to use, this website.
		</p>
		<h3>A8. Changes</h3>
		<p>
			These terms may be updated at any time. The version in force is the one published on
			this page.
		</p>
		<h3>A9. Severability and governing law</h3>
		<p>
			If a provision is found invalid, the others remain in force. These terms are
			governed by French law.
		</p>

		<h2 id="services-terms">Part B. Terms of service</h2>
		<h3>B1. Definitions and scope</h3>
		<p>
			These terms apply to all web development, design, integration, optimisation and
			maintenance services (the “Services”) provided by {{ LEGAL.legalName }} (the
			“Provider”) to its clients (the “Client”). A quote or contract signed by both
			parties may set specific terms, which prevail over these terms. The Client’s own
			general terms do not apply unless the Provider accepts them in writing.
		</p>
		<h3>B2. Professional clients only</h3>
		<p>
			The Services are provided
			<strong>exclusively to clients acting for professional purposes</strong>, such as
			companies, associations and self-employed professionals, and not to consumers. By
			ordering, the Client confirms that it acts for its professional activity and
			provides its SIREN, VAT or registration number.
		</p>
		<!--
			À METTRE DANS CHAQUE DEVIS :
			"Le client commande pour son activité professionnelle. N° SIREN / TVA / immatriculation : ______"
			Assurance RC Pro : couverture monde entier hors USA/Canada. Sans extension Orus, évite les clients USA/Canada.
		-->
		<h3>B3. Quotes and orders</h3>
		<p>
			Quotes are free and valid for 30 days. The order is binding once the Client signs
			the quote or confirms it in writing, and pays the deposit where one is requested.
			Any change to the scope is agreed in writing and may change the price and deadlines.
		</p>
		<h3>B4. Prices and invoicing</h3>
		<ul>
			<li>Prices are in euros. {{ LEGAL.vat }}.</li>
			<li>
				Invoices are issued electronically. The Client provides its SIREN, legal name and
				billing address.
			</li>
			<li>
				Domain names, hosting, licences, plugins and other third-party costs are borne by
				the Client.
			</li>
		</ul>
		<h3>B5. Payment</h3>
		<ul>
			<li>
				A 30% deposit is due on order, and the balance is payable within 30 days of the
				invoice date.
			</li>
			<li>
				Late payment automatically triggers, without prior notice, a penalty equal to
				three times the legal interest rate and a fixed recovery fee of €40, plus any
				additional recovery costs actually incurred.
			</li>
			<li>
				The Provider may suspend work and delay delivery until overdue amounts are paid.
			</li>
		</ul>
		<h3>B6. Deadlines and delivery</h3>
		<p>
			Deadlines are estimates and depend on the Client providing content, feedback and
			approvals on time. Delays on the Client’s side extend deadlines accordingly.
		</p>
		<h3>B7. Acceptance and revisions</h3>
		<p>
			The price includes two rounds of revisions within the agreed scope. The Client has 7
			business days after delivery to report defects in writing, after which the
			deliverables are deemed accepted. Additional work is quoted separately.
		</p>
		<h3>B8. Client obligations</h3>
		<p>
			The Client provides accurate information, content and access in due time, and
			guarantees that it holds the necessary rights over the materials it supplies (texts,
			images, logos, fonts and so on). The Client is responsible for the legal compliance
			of its own content, products and activities.
		</p>
		<h3>B9. Intellectual property</h3>
		<ul>
			<li>
				Rights in the deliverables specifically created for the Client are assigned to it
				upon full payment, for the scope and duration stated in the quote or, failing
				that, for the legal term of the rights and for the purposes of the project.
			</li>
			<li>
				The Provider keeps ownership of its pre-existing tools, code, components,
				templates and know-how, and grants the Client a non-exclusive licence to use them
				as embedded in the deliverables.
			</li>
			<li>
				Open-source and third-party components remain subject to their own licences.
			</li>
			<li>Until full payment, the Client has no right to use the deliverables.</li>
		</ul>
		<h3>B10. Portfolio and credit</h3>
		<p>
			Unless the Client objects in writing, the Provider may present the project in its
			portfolio and case studies, and place a discreet credit and link on the Client’s
			website.
		</p>
		<h3>B11. Warranty and maintenance</h3>
		<p>
			Defects in the delivered work are fixed free of charge for 30 days after delivery,
			provided the work has not been modified by a third party. Ongoing maintenance is
			provided only under a separate agreement. The Provider does not provide hosting
			services and is not responsible for the services of third-party providers chosen by
			the Client.
		</p>
		<h3>B12. Subcontracting</h3>
		<p>
			The Provider may use subcontractors, remains responsible for their work, and
			requires them to respect confidentiality.
		</p>
		<h3>B13. Confidentiality</h3>
		<p>
			Each party keeps confidential the non-public information received from the other in
			connection with the Services, during the contract and for three years after it ends,
			except where disclosure is required by law.
		</p>
		<h3>B14. Personal data</h3>
		<p>
			The Provider processes personal data as described in the
			<NuxtLink to="/privacy-policy">privacy policy</NuxtLink>. Where the Provider
			processes personal data on the Client’s behalf, a data processing agreement is
			available on request.
		</p>
		<h3>B15. Liability and insurance</h3>
		<p>
			The Provider is bound by an obligation of means. Its total liability for any claim
			relating to a project is limited to the fees paid for that project, and it is not
			liable for indirect or consequential damages such as loss of revenue, data or
			opportunity. The Provider holds professional liability insurance. These limits do
			not apply where the law forbids them.
		</p>
		<h3>B16. Force majeure</h3>
		<p>
			Neither party is liable for a failure caused by an event beyond its reasonable
			control.
		</p>
		<h3>B17. Cancellation and termination</h3>
		<p>
			If the Client cancels, the work performed and the deposit remain due. Either party
			may terminate the contract for a serious breach that is not remedied within 15 days
			of a written notice, in which case the work performed up to the termination date is
			invoiced.
		</p>
		<h3>B18. Independence</h3>
		<p>
			The Provider acts as an independent professional. Nothing creates an employment,
			agency or partnership relationship, and the Provider is free to work for other
			clients.
		</p>
		<h3>B19. Notices and electronic communication</h3>
		<p>
			Notices and agreements may be given and accepted by email, which is valid proof
			between the parties.
		</p>
		<h3>B20. General provisions</h3>
		<p>
			If a provision is found invalid, the others remain in force. These terms and the
			signed quote form the entire agreement and replace any prior discussion. Neither
			party may assign the contract without the other’s consent. A party that does not
			enforce a right does not waive it.
		</p>
		<h3>B21. Governing law and jurisdiction</h3>
		<p>
			French law applies. The parties first seek an amicable solution. Failing that, any
			dispute falls within the jurisdiction of {{ jurisdiction }}.
		</p>
	</LegalPage>
</template>
