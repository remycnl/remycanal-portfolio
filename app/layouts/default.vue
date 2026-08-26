<template>
	<div class="flex min-h-svh flex-col">
		<LayoutAppHeader />
		<main class="relative z-10 flex-1 shadow-[0_14px_24px_-10px_rgba(0,0,0,0.4)]">
			<slot />
		</main>
		<LayoutAppFooter />
	</div>
</template>
