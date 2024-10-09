<template>
	<div class="hidden lg:block">
		<div class="flex justify-center">
			<button
				class="clickable mix-darken cursor-none active:scale-95 text-white flex items-center justify-center fixed z-[100] tracking-widest rounded-full overflow-hidden origin-center hover:bg-secondary bg-black opacity-0 pointer-events-none shadow-custom-outline back-to-top hover-scale-effect lg:ml-[140vh] 2xl:ml-[176vh] lg:mt-[70vh] transition-all duration-500">
				<svg class="svgIcon" viewBox="0 0 384 512">
					<path
						d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"></path>
				</svg>
			</button>
		</div>
	</div>
</template>

<script setup>
onMounted(() => {
	const backToTopButton = document.querySelector(".back-to-top");
	if (backToTopButton) {
		backToTopButton.addEventListener("click", function () {
			window.scrollTo({
				top: 0,
				behavior: "smooth",
			});
		});
	}

	window.addEventListener("scroll", function () {
		const button = document.querySelector(".back-to-top");
		if (button && window.innerWidth >= 1024) {
			if (window.scrollY > 100) {
				button.classList.add("pointer-events-auto");
				button.classList.remove("opacity-0");
				button.classList.add("opacity-100");
			} else {
				button.classList.remove("opacity-100");
				button.classList.add("opacity-0");
				button.classList.remove("pointer-events-auto");
			}
		}
	});
});
</script>
