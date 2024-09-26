<template>
	<div
		class="bg-black cursor-auto w-screen h-screen flex flex-col gap-y-20 justify-center items-center text-[#8c99b0a2]"
		v-if="error">
		<div class="mx-10 flex flex-row items-center gap-x-5 md:gap-x-10">
			<h1 class="text-3xl md:text-5xl">
				{{ error.statusCode === 404 ? "404" : error.statusCode }}
			</h1>
			<div class="rounded-full h-10 w-0.5 bg-[#8c99b0a2]"></div>
			<p class="text-xl md:text-2xl">
				{{ error.statusCode === 404 ? "Page Not Found" : error.message }}
			</p>
		</div>
		<button @click="clearError({ redirect: '/' })" class="button-error">
			Go Home
		</button>
	</div>
</template>

<script setup>
import { useError, clearError } from "#app";

const error = useError();

if (!error.value) {
	error.value = {
		statusCode: 404,
		message: "Page Not Found",
	};
}
</script>

<style scoped>
.button-error {
	font-size: 1.5rem;
	color: #8c99b0a2;
	text-transform: uppercase;
	padding: 10px 20px;
	border-radius: 10px;
	border: 2px solid #8c99b0a2;
	background: #252525;
	box-shadow: 3px 3px #8c99b0a2;
	cursor: pointer;
	margin: 35px 0;
}

.button-error:active {
	box-shadow: none;
	transform: translate(3px, 3px);
}
</style>
