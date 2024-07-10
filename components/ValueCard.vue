<template>
	<div class="group hover-scale-effect card border-none lg:basis-[23%] 2xl:basis-auto" :class="'card-' + props.text1" @click="toggleCardEvent">
		<h3 :class="'card-text-' + props.text1" class="front z-20 leading-[2rem] text-[1.70rem]  group-hover:scale-[0.85] text-with-shadow opacity-95 group-hover:text-gray-light transition-all duration-300 ml-5 text-gray text-start flex flex-col">
			<span>{{ props.text1 }}</span>
			<span>&amp; {{ props.text2 }}</span>
		</h3>
		<div class="back">
			<p :class="'card-subtext-' + props.text1" style="transform: rotateY(180deg); transform-origin: center" class="text-primary text-center m-6 text-[1.2rem]">
				{{ props.subText }}
			</p>
		</div>
		<template>
			<img :src="props.pathIcon" :alt="props.text1" class="front icon-select-event z-10 group-hover:z-30 opacity-50 group-hover:opacity-100 transition-all duration-500 ease-in-out value-icon w-auto h-28" />
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
