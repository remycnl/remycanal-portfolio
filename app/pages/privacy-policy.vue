<script setup lang="ts">
import { LEGAL } from "@/constants/legal"

useSeoMeta({
	title: "Privacy policy",
	description:
		"How remycanal.me processes personal data: purposes, legal bases, recipients, retention and your rights.",
})
</script>

<template>
	<LegalPage title="Privacy policy" :updated="LEGAL.updated">
		<p>
			I take your privacy seriously. This policy explains which personal data is processed
			when you visit this website, contact me or work with me, in line with the General
			Data Protection Regulation (GDPR) and the French Data Protection Act.
		</p>

		<h2>Data controller</h2>
		<p>
			The controller is {{ LEGAL.legalName }} (SIREN {{ LEGAL.siren }}). For any question
			or request about your data, write to
			<a :href="`mailto:${LEGAL.email}`">{{ LEGAL.email }}</a
			>.
		</p>

		<h2>Data processed, purposes and legal bases</h2>
		<h3>Contact form and email</h3>
		<ul>
			<li>
				Data: name, email address, subject, message, and any information you choose to
				share.
			</li>
			<li>Purposes: answer your request and prepare a possible collaboration.</li>
			<li>
				Legal basis: pre-contractual measures and legitimate interest in answering
				inquiries.
			</li>
			<li>
				This website does not store form submissions. The message is sent by email through
				Resend to my mailbox hosted by Hostinger.
			</li>
		</ul>
		<h3>Clients and prospects</h3>
		<ul>
			<li>
				Data: identity and contact details, company information (name, SIREN, VAT number,
				billing address), project details, quotes, invoices and payment status.
			</li>
			<li>
				Purposes: quotes, contracts, project delivery, invoicing, accounting and client
				relationship.
			</li>
			<li>
				Legal basis: performance of a contract, and compliance with legal obligations
				(accounting, tax).
			</li>
			<li>Quotes and invoices are prepared and stored with Tiime.</li>
		</ul>
		<h3>Audience and performance measurement</h3>
		<ul>
			<li>
				Vercel Web Analytics counts page views without cookies. Visitors are distinguished
				by a hash built from the request that is valid for one day only, so they cannot be
				tracked across days or sites.
			</li>
			<li>
				Vercel Speed Insights collects anonymous performance data points: route and URL,
				network speed, browser, device type, operating system, country and Web Vitals
				metrics.
			</li>
			<li>
				Purposes: understand how the site is used and improve its performance. Legal
				basis: legitimate interest. This data is not combined with other data, not used
				for advertising, and not sold.
			</li>
		</ul>
		<h3>Hosting and security logs</h3>
		<p>
			To deliver and protect the website, Vercel processes technical data such as IP
			address, browser, requested URL and date. Legal basis: legitimate interest in
			running and securing the website.
		</p>

		<h2>Cookies and similar technologies</h2>
		<p>
			This website does not set cookies and does not use local or session storage to track
			you. It contains no advertising, social-media or third-party tracking tools. As a
			result, no cookie banner is displayed. If this changes, this policy will be updated
			and your consent will be requested where the law requires it.
		</p>

		<h2>Recipients and processors</h2>
		<p>
			Your data is accessible only to me and to the providers strictly needed to operate
			the website and my business:
		</p>
		<ul>
			<li>Vercel: hosting, Web Analytics, Speed Insights.</li>
			<li>Resend: delivery of contact form emails.</li>
			<li>Hostinger: domain name and mailbox.</li>
			<li>Tiime: quotes, invoicing and accounting.</li>
		</ul>
		<p>
			These providers act as processors or independent controllers under their own
			commitments. Your data is never sold or used for advertising. It may be disclosed to
			authorities where the law requires.
		</p>

		<h2>Transfers outside the European Union</h2>
		<p>
			Some providers, such as Vercel and Resend, are based in the United States or process
			data there. These transfers rely on appropriate safeguards, such as the EU–US Data
			Privacy Framework and/or the European Commission’s Standard Contractual Clauses.
		</p>

		<h2>Retention periods</h2>
		<ul>
			<li>
				Contact messages and related emails: 12 months after the last exchange, then
				deleted.
			</li>
			<li>
				Client files and project data: duration of the contract, then archived as long as
				needed to defend legal claims.
			</li>
			<li>
				Quotes, invoices and accounting records: 10 years, as required by French law.
			</li>
			<li>
				Analytics and performance data: according to Vercel’s retention policy, in
				aggregated or anonymous form.
			</li>
			<li>Hosting logs: the short period set by Vercel for security and operation.</li>
		</ul>

		<h2>Your rights</h2>
		<p>You have the right to:</p>
		<ul>
			<li>access your data and obtain a copy;</li>
			<li>have inaccurate data rectified;</li>
			<li>request erasure of your data, where applicable;</li>
			<li>request restriction of the processing;</li>
			<li>object to processing based on legitimate interest;</li>
			<li>receive your data in a portable format, where applicable;</li>
			<li>withdraw consent at any time, where processing is based on it;</li>
			<li>give instructions about your data after your death.</li>
		</ul>
		<p>
			To exercise these rights, write to
			<a :href="`mailto:${LEGAL.email}`">{{ LEGAL.email }}</a
			>. I may ask you to prove your identity, and I answer within one month. If you
			believe your rights are not respected, you may lodge a complaint with the French
			data protection authority, the CNIL (<a
				href="https://www.cnil.fr"
				rel="noopener"
				target="_blank"
				>cnil.fr</a
			>), or with your local supervisory authority.
		</p>

		<h2>Mandatory and optional data</h2>
		<p>
			The name, email, subject and message fields of the contact form are required,
			because I cannot reply without them. Anything else you share is optional.
		</p>

		<h2>Automated decisions</h2>
		<p>
			No decision with legal effect is taken about you by automated means, and no
			profiling is carried out.
		</p>

		<h2>Security</h2>
		<p>
			The website is served over HTTPS, and access to my mailbox and tools is protected by
			authentication. In case of a personal data breach likely to harm you, I will notify
			the CNIL and the people concerned as required by law.
		</p>

		<h2>Children</h2>
		<p>
			This website is intended for professional and general audiences and is not directed
			at children under 15. Please do not send me their personal data.
		</p>

		<h2>Third-party websites</h2>
		<p>
			This website links to external platforms (for example LinkedIn, GitHub and
			Awwwards). Their own privacy policies apply once you leave this website.
		</p>

		<!--
			À AJOUTER QUAND LA BASE NEON / LES AVIS SERONT EN LIGNE :
			- Section "Reviews": données (nom, texte de l'avis, date, éventuellement email), finalité (publier un
			  témoignage), base légale (consentement), durée de conservation, droit de retrait.
			- Ajouter Neon (hébergement de la base) dans "Recipients" et "Transfers".
		-->

		<h2>Changes to this policy</h2>
		<p>
			This policy may be updated to reflect changes in the website, my tools or the law.
			The date at the top shows the latest version.
		</p>
	</LegalPage>
</template>
