<script setup>
import { onMounted, onBeforeUnmount } from "vue";

let canvas, ctx;
let intervalId;

const drawGrain = () => {
	const width = canvas.width;
	const height = canvas.height;

	const imageData = ctx.createImageData(width, height);
	const buffer = imageData.data;

	for (let i = 0; i < buffer.length; i += 4) {
		const value = Math.random() * 255;
		buffer[i] = buffer[i + 1] = buffer[i + 2] = value;
		buffer[i + 3] = 30;
	}

	ctx.putImageData(imageData, 0, 0);
};

const initGrainCanvas = () => {
	const dpr = window.devicePixelRatio || 1;
	const grainSize = 512;

	canvas = document.createElement("canvas");
	canvas.width = grainSize * dpr;
	canvas.height = grainSize * dpr;
	canvas.style.width = "100%";
	canvas.style.height = "100%";
	canvas.style.position = "fixed";
	canvas.style.top = 0;
	canvas.style.left = 0;
	canvas.style.pointerEvents = "none";
	canvas.style.zIndex = "9999";
	canvas.style.opacity = "0.1";
	ctx = canvas.getContext("2d");

	document.body.appendChild(canvas);

	intervalId = setInterval(drawGrain, 100);
};

const removeGrainCanvas = () => {
	if (intervalId) clearInterval(intervalId);
	if (canvas) canvas.remove();
	canvas = null;
	ctx = null;
};

onMounted(initGrainCanvas);
onBeforeUnmount(removeGrainCanvas);
</script>

<template>
	<div></div>
</template>
