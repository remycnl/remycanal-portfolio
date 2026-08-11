<template>
	<div class="flex min-h-screen flex-col overflow-hidden">
		<LayoutAppHeader />
		<main class="flex-1">
			<slot />
		</main>
		<LayoutAppFooter />
	</div>
</template>
