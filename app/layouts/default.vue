<template>
	<div class="flex min-h-screen flex-col">
		<LayoutAppHeader />
		<main class="relative z-10 flex-1">
			<slot />
		</main>
		<LayoutAppFooter />
	</div>
</template>
