<template>
	<div class="group card border-none" :class="'card-' + props.text1" @click="toggleCardEvent">
		<p class="front z-20 text-3xl text-with-shadow group-hover:text-gray-light transition-colors duration-300 ml-5 text-gray text-start flex flex-col">
			<span>{{ props.text1 }}</span>
			<span>&amp; {{ props.text2 }}</span>
		</p>
		<p class="back subtext text-center mx-10 text-xl text-gradient">{{ props.subText }}</p>
		<template v-if="props.isIcon">
			<Icon :name="props.icon" class="front z-10 group-hover:z-30 opacity-50 group-hover:opacity-100 transition-all duration-500 ease-in-out value-icon w-auto h-28" />
		</template>
		<template v-else>
			<img :src="props.pathIcon" :alt="props.text1" class="front z-10 group-hover:z-30 opacity-50 group-hover:opacity-100 transition-all duration-500 ease-in-out value-icon w-auto h-28" />
		</template>
	</div>
</template>

<script setup>
import { toggleCard } from '~/plugins/gsap';

const props = defineProps({
	text1: String,
	text2: String,
	subText: String,
	icon: String,
	pathIcon: String,
	isIcon: {
		type: Boolean,
		default: true,
	},
});

const toggleCardEvent = () => {
	if (typeof toggleCard === "function") {
		toggleCard(props.text1);
	}
};
</script>

<style scoped>
.front,
.back {
	position: absolute;
	backface-visibility: hidden;
}

.back {
	transform: rotateY(180deg);
	display: none;
}

.card {
	border-width: 2px;
	border-style: solid;
	border-color: #1f293b76;
}

.is-flipped {
	border-color: #8D6DFA;
}

.is-flipped .front {
	transform: rotateY(-180deg);
}

.is-flipped .back {
	transform: rotateY(0deg);
	display: block;
}


</style> 
