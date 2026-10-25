<template>
	<section
		data-drag-bounds
		class="section-p-xy font-lineal-medium bg-grid-black relative flex justify-center bg-black"
	>
		<UiGridBeams theme="black" />
		<div
			class="top-edge left-edge absolute mt-2 ml-2 flex items-baseline-last justify-center gap-4"
		>
			<h3
				v-text-reveal="{ theme: 'violet' }"
				class="font-vg5000 text-fit text-gray-dark text-end text-sm md:text-lg"
			>
				Based in France / Remote worldwide.
			</h3>
			<UiShapeStripes data-reveal-follow class="text-violet h-3 w-3 md:h-5 md:w-5" />
		</div>
		<div
			class="py-section text-gray-dark relative max-w-6xl text-center text-2xl lg:text-5xl"
		>
			<div class="py-section max-w-xl lg:max-w-6xl">
				<h2 v-text-reveal="{ theme: 'violet', singlePhrase: true }">
					Bonjour, I'm <span class="text-white">Rémy Canal</span>. I make websites that
					look cool, feel good, and care about the little things.<br />

					<span class="mt-6 inline-block">
						I bring together <span class="text-white">design</span>,
						<span class="text-white">code</span>, and
						<span class="text-white">motion</span> to create digital experiences that feel
						truly yours.
					</span>
				</h2>
			</div>
			<UiPopImage
				src="/stickers/character_violet.svg"
				alt="Sticker Rémy"
				:rotate="15"
				draggable
				img-class="absolute top-0 -right-4 w-auto 2xl:-right-30 h-20 md:h-30 lg:h-42 2xl:h-50"
			/>
			<UiPopImage
				src="/stickers/computer_violet.svg"
				alt="Sticker computer"
				:rotate="-15"
				:delay="0.12"
				draggable
				img-class="absolute bottom-0 -left-2 w-auto 2xl:-left-40 h-20 md:h-30 lg:h-42 2xl:h-50"
			/>
		</div>
		<div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
			<UiAnimatedButton
				label="Rémy who?"
				to="/about"
				pill="violet"
				bubble="violet"
				size="large"
			/>
		</div>
	</section>
</template>
