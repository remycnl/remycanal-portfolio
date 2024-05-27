<script setup>
import { animationFooter } from '~/plugins/gsap';
onMounted(() => {
	if (typeof animationFooter === "function") {
		animationFooter();
	}
});
</script>

<template>
	<div class="bottom-0 text-white bg-black">
		<div class="container mx-auto px-4 lg:px-0 pt-40 pb-10 flex flex-col items-center gap-y-32 hover:brightness-100">
			<img src="~/assets/img/fullLogo.png" alt="Rémy Canal" class="hover:saturate-200 transition-all duration-500 w-60 lg:w-60 h-auto" />
			<div
				class="flex flex-col gap-y-3 justify-center text-center text-gray-light text-4xl">
				&ldquo; Simplicity is the ultimate sophistication. &rdquo;
				<span class="text-xl">Leonardo da Vinci</span>
			</div>
			<div class="flex justify-center gap-x-5 md:gap-x-10 mb-20">
				<a
					href="tel:+330619258299"
					class="hover-scale-effect group z-10 bg-primary rounded-full border border-secondary-purple hover:border-gray-dark transition duration-300 hover:shadow-around hover:shadow-primary p-4">
					<Icon name="uil:phone" color="white" class="w-8 h-8 transition-transform transform-gpu group-hover:scale-75 duration-500" />
				</a>
				<a
					href="mailto:remy.canal@epitech.eu"
					class="hover-scale-effect group z-10 bg-primary rounded-full border border-secondary-purple hover:border-gray-dark transition duration-300 hover:shadow-around hover:shadow-primary p-4">
					<Icon
						name="material-symbols:mail-outline-rounded"
						color="white"
						class="w-8 h-8 transition-transform transform-gpu group-hover:scale-75 duration-500" />
				</a>
				<a
					href="https://github.com/remycnl"
					target="_blank"
                    rel="noopener noreferrer"
					class="hover-scale-effect group z-10 bg-primary rounded-full border border-secondary-purple hover:border-gray-dark transition duration-300 hover:shadow-around hover:shadow-primary p-4">
					<Icon name="uil:github" color="white" class="w-8 h-8 transition-transform transform-gpu group-hover:scale-75 duration-500" />
				</a>
                <a
					href="https://www.linkedin.com/in/remy-canal"
					target="_blank"
                    rel="noopener noreferrer"
					class="hover-scale-effect group z-10 bg-primary rounded-full border border-secondary-purple hover:border-gray-dark transition duration-300 hover:shadow-around hover:shadow-primary p-4">
					<Icon name="uil:linkedin" color="white" class="w-8 h-8 transition-transform transform-gpu group-hover:scale-75 duration-500" />
				</a>
			</div>
			<div class="container-s flex absolute bottom-0 text-start w-screen pb-2 overflow-hidden select-none">
				<div id="letters" style="font-family: Source Code Pro;" class="s whitespace-nowrap inline-block text-sm text-gray-semi w-fit">
				<!-- Ici apparaîssent les <span> des crédits -->
				</div>
			</div>
		</div>
	</div>
</template>
