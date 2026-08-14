<template>
	<section data-drag-bounds class="relative rounded-t-3xl bg-white">
		<div
			class="section-p-xy font-lineal-medium bg-grid-black relative flex justify-center rounded-3xl bg-black"
		>
			<UiGridBeams theme="black" />
			<div
				class="top-edge left-edge absolute mt-2 ml-2 flex items-center justify-center gap-4"
			>
				<h3 class="font-vg5000 text-gray-dark text-end text-sm md:text-lg">
					Based in France
				</h3>
				<UiShapeStripes class="text-violet mb-1.5 h-3 w-3 md:h-5 md:w-5" />
			</div>
			<div
				class="py-section text-gray-dark relative max-w-6xl text-center text-2xl lg:text-5xl"
			>
				<div class="py-section max-w-xl lg:max-w-6xl">
					<h2>
						I craft
						<span class="text-white">distinctive digital experiences</span> through
						thoughtful <span class="text-white">design</span>, creative
						<span class="text-white">development</span>, and refined
						<span class="text-white">interactions</span>.
					</h2>
				</div>
				<UiPopImage
					src="/stickers/sticker-remy.png"
					alt="Sticker Rémy"
					:rotate="15"
					grayscale
					draggable
					img-class="absolute -top-7 -right-7 w-auto 2xl:-right-30 h-30 lg:h-55"
				/>
				<UiPopImage
					src="/stickers/sticker-computer.png"
					alt="Sticker computer"
					:rotate="-15"
					:delay="0.12"
					grayscale
					draggable
					img-class="absolute -bottom-2 md:-bottom-10 -left-2 w-auto 2xl:-left-40 h-25 md:h-30 lg:h-55"
				/>
			</div>
			<div class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
				<UiAnimatedButton
					label="Know more about me"
					to="/about"
					pill="violet"
					bubble="violet"
					size="large"
				/>
			</div>
		</div>
	</section>
</template>
