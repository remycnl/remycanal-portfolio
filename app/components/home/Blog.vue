<template>
	<div class="section-p-xy h-screen bg-white">
		<div class="flex -rotate-10 flex-col">
			<div class="bg-gray-light w-fit rounded-sm px-5 py-2">
				<h2
					v-text-reveal="{ theme: 'violet' }"
					class="font-lineal-bold text-3xl text-black lg:text-4xl"
				>
					I also have thoughts.
				</h2>
			</div>
			<div class="bg-violet w-fit rounded-sm px-5 py-2">
				<h3
					v-text-reveal="{ theme: 'white' }"
					class="font-lineal-bold text-3xl text-white lg:text-4xl"
				>
					Occasionally, I write them down.
				</h3>
			</div>
		</div>
	</div>
</template>

<script lang="ts" setup></script>
