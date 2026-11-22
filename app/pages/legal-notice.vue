<script setup lang="ts">
import { LEGAL } from "@/constants/legal"

useSeoMeta({
	title: "Legal notice",
	description:
		"Legal notice of remycanal.me: publisher, hosting provider, intellectual property and liability.",
})
</script>

<template>
	<LegalPage title="Legal notice" :updated="LEGAL.updated">
		<p>
			This legal notice applies to the website {{ LEGAL.url }}, in accordance with the
			French law of 21 June 2004 on confidence in the digital economy (LCEN).
		</p>

		<h2>Publisher</h2>
		<p>
			The website is published by <strong>{{ LEGAL.legalName }}</strong
			>, {{ LEGAL.status }}, registered with the French National Business Register (RNE).
		</p>
		<ul>
			<li>SIREN: {{ LEGAL.siren }} · SIRET: {{ LEGAL.siret }}</li>
			<li>VAT: {{ LEGAL.vat }}</li>
			<li>
				Email: <a :href="`mailto:${LEGAL.email}`">{{ LEGAL.email }}</a>
			</li>
			<li v-if="LEGAL.phone">Phone: {{ LEGAL.phone }}</li>
			<li v-if="LEGAL.address">Address: {{ LEGAL.address }}</li>
			<li v-else>Postal address: provided on written request by email.</li>
		</ul>

		<h2>Publication director</h2>
		<p>{{ LEGAL.name }}.</p>

		<h2>Hosting</h2>
		<p>
			The website is hosted by {{ LEGAL.host.name }}, {{ LEGAL.host.address }}, phone
			{{ LEGAL.host.phone }} (<a :href="LEGAL.host.url" rel="noopener" target="_blank"
				>vercel.com</a
			>). The domain name and the mailbox are provided by {{ LEGAL.registrar }}.
		</p>

		<template v-if="LEGAL.insurer">
			<h2>Professional liability insurance</h2>
			<p>
				The publisher holds professional liability insurance with {{ LEGAL.insurer }}.
			</p>
		</template>

		<h2>Intellectual property</h2>
		<p>
			All elements of this website, including texts, source code, UI and graphic design,
			animations, 3D models, illustrations, logos, stickers, photographs, the structure
			and the compilation of its content, are the exclusive property of {{ LEGAL.name }},
			except where a third party is credited (see
			<NuxtLink to="/credits">Credits</NuxtLink>). They are protected by the French
			Intellectual Property Code and by international treaties.
		</p>
		<p>
			Any reproduction, representation, adaptation, extraction or reuse, in whole or in
			part, by any means, without prior written permission, is prohibited and may
			constitute infringement. Third-party names, logos and trademarks belong to their
			respective owners.
		</p>

		<h2>Hyperlinks</h2>
		<p>
			Links to the home page or to a page of this website are welcome, provided the
			content is not framed, altered or presented misleadingly. I am not responsible for
			the content of third-party websites linked from this site, and a link does not imply
			endorsement.
		</p>

		<h2>Liability</h2>
		<p>
			I make reasonable efforts to keep the information accurate and up to date, but
			cannot guarantee that it is complete or error-free. The website may be modified,
			suspended or removed at any time. I am not liable for any direct or indirect damage
			resulting from its use or from the temporary unavailability of the website.
		</p>

		<h2>Reporting content</h2>
		<p>
			To report content you believe is unlawful or infringes your rights, write to
			<a :href="`mailto:${LEGAL.email}`">{{ LEGAL.email }}</a> with your identity, the
			exact URL, a description of the content and the grounds for your request.
		</p>

		<h2>Personal data and cookies</h2>
		<p>
			The processing of personal data, including cookies, is described in the
			<NuxtLink to="/privacy-policy">privacy policy</NuxtLink>.
		</p>

		<h2>Accessibility</h2>
		<p>
			I strive to make this website usable by as many people as possible. If you encounter
			an accessibility issue, please contact me by email and I will do my best to help.
		</p>

		<h2>Governing law</h2>
		<p>
			This legal notice is governed by French law. Use of the website is also subject to
			the
			<NuxtLink to="/terms">terms</NuxtLink>.
		</p>
	</LegalPage>
</template>
