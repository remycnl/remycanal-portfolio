<template>
	<div class="bottom-0 text-white bg-black">
		<div class="container mx-auto px-4 pt-40 pb-20 flex flex-col items-center gap-y-32 hover:brightness-100">
			<img src="~/assets/img/fullLogo.png" alt="Rémy Canal" class="hover:saturate-200 transition-all duration-500 w-60 lg:w-60 h-auto" />
			<div
				class="flex flex-col gap-y-3 justify-center text-center text-gray-light text-4xl">
				&ldquo; Simplicity is the ultimate sophistication. &rdquo;
				<span class="text-xl">Leonardo da Vinci</span>
			</div>
			<div class="flex justify-center gap-x-6 md:gap-x-10">
				<a
					href="tel:+330619258299"
					class="hover-scale-effect group z-10 bg-primary rounded-full border border-secondary-purple hover:border-primary transition duration-300 hover:shadow-around hover:shadow-primary p-4">
					<Icon name="uil:phone" color="white" class="w-6 h-6 md:w-8 md:h-8 transition-transform transform-gpu group-hover:scale-75 duration-500" />
				</a>
				<a
					href="mailto:remy.canal@epitech.eu"
					class="hover-scale-effect group z-10 bg-primary rounded-full border border-secondary-purple hover:border-primary transition duration-300 hover:shadow-around hover:shadow-primary p-4">
					<Icon
						name="material-symbols:mail-outline-rounded"
						color="white"
						class="w-6 h-6 md:w-8 md:h-8 transition-transform transform-gpu group-hover:scale-75 duration-500" />
				</a>
				<a
					href="https://github.com/remycnl"
					target="_blank"
                    rel="noopener noreferrer"
					class="hover-scale-effect group z-10 bg-primary rounded-full border border-secondary-purple hover:border-primary transition duration-300 hover:shadow-around hover:shadow-primary p-4">
					<Icon name="uil:github" color="white" class="w-6 h-6 md:w-8 md:h-8 transition-transform transform-gpu group-hover:scale-75 duration-500" />
				</a>
                <a
					href="https://www.linkedin.com/in/remy-canal"
					target="_blank"
                    rel="noopener noreferrer"
					class="hover-scale-effect group z-10 bg-primary rounded-full border border-secondary-purple hover:border-primary transition duration-300 hover:shadow-around hover:shadow-primary p-4">
					<Icon name="uil:linkedin" color="white" class="w-6 h-6 md:w-8 md:h-8 transition-transform transform-gpu group-hover:scale-75 duration-500" />
				</a>
			</div>
			<div class="flex flex-col justify-center text-center">
				©2024. All Rights Reserved. <br class="md:hidden">Handcrafted by me.
				<span class="text-gradient ml-1 mt-1"> Rémy CANAL </span>
			</div>
		</div>
	</div>
</template>
