<script setup>
import { animationCheckboxColor } from "@/plugins/gsap";

defineProps(["selectedColor"]);
const emit = defineEmits(["update-color"]);

const checkboxes = ref([
	true,
	false,
	false,
	false,
	false,
	false,
	false,
	false,
	false,
]);

const colorOptions = ref([
	{
		primary: "#6C34CC",
		secondary: "#301563",
		transparent: "#6C34CC4F",
		family: "purple",
	},
	{
		primary: "#DD314E",
		secondary: "#6A1625",
		transparent: "#DD314E4F",
		family: "red",
	},
	{
		primary: "#FF3FAF",
		secondary: "#5D0C34",
		transparent: "#FF3FAF4F",
		family: "pink",
	},
	{
		primary: "#DD5F31",
		secondary: "#742F17",
		transparent: "#DD5F314F",
		family: "orange",
	},
	{
		primary: "#E9C925",
		secondary: "#7D6B10",
		transparent: "#E9C9254F",
		family: "yellow",
	},
	{
		primary: "#67D13D",
		secondary: "#2C5F14",
		transparent: "#67D13D4F",
		family: "green",
	},
	{
		primary: "#31BEDD",
		secondary: "#147C8C",
		transparent: "#31BEDD4F",
		family: "cyan",
	},
	{
		primary: "#32A1DA",
		secondary: "#0A3890",
		transparent: "#32A1DA4F",
		family: "blue",
	},
	{
		primary: "#868686",
		secondary: "#424242",
		transparent: "#8686864F",
		family: "gray",
	},
]);

const selectedColor = ref(colorOptions.value[0].family);

const updateCheckbox = (
	index,
	primaryColor,
	secondaryColor,
	primaryColorTransparent,
	selectedFamily
) => {
	checkboxes.value = checkboxes.value.map((_unused, i) => i === index);
	document.documentElement.style.setProperty("--primary-color", primaryColor);
	document.documentElement.style.setProperty(
		"--secondary-color",
		secondaryColor
	);
	document.documentElement.style.setProperty(
		"--primary-color-transparent",
		primaryColorTransparent
	);
	selectedColor.value = selectedFamily;

	const families = colorOptions.value.map((color) => color.family);

	const elements = document.querySelectorAll(".change-img-color");
	elements.forEach((element) => {
		families.forEach((family) => {
			element.classList.remove(family);
		});
		element.classList.add(selectedFamily);
	});
	emit("update-color", selectedFamily);
};

let isOpenColorMenu = ref(false);

const toggleColors = () => {
	if (window.innerWidth < 1024) {
		setTimeout(() => {
			isOpenColorMenu.value = !isOpenColorMenu.value;
			animationCheckboxColor(isOpenColorMenu.value);
		}, 200);

		const button = document.querySelector(".change-color-button");
		const checkboxs = document.querySelectorAll(".cyberpunk-checkbox-label");
		button.classList.toggle("bg-black");
		button.classList.toggle("bg-primary");
		checkboxs.forEach((checkbox) => {
			checkbox.classList.toggle("opacity-100");
			checkbox.classList.toggle("pointer-events-none");
			setTimeout(() => {
				checkbox.classList.toggle("opacity-0");
			}, 100);
		});
	}
};

const updateFavicon = (color) => {
	const faviconName = `favicon-${color}.ico`;

	let link = document.querySelector("link[rel*='icon']");

	if (!link) {
		link = document.createElement("link");
		link.rel = "shortcut icon";
		document.head.appendChild(link);
	}

	link.type = "image/x-icon";
	link.href = `https://www.remycanal.me/${faviconName}`;
};
</script>

<template>
	<div id="color-button" class="lg:opacity-0">
		<button
			@click="toggleColors"
			aria-label="Change theme color"
			class="group circle-container relative hover-scale-effect clickable cursor-pointer lg:cursor-none w-[60px] h-[60px] items-center gap-x-4 py-4 mt-16 lg:mt-0 flex justify-center lg:justify-between px-5 text-white change-color-button rounded-full tracking-widest origin-center hover:bg-secondary-dark bg-black transition-all shadow-custom-outline duration-500">
			<div>
				<Icon
					name="i-material-symbols:format-color-fill-rounded"
					ssr="true"
					mode="svg"
					style="color: var(--white)"
					class="w-7 h-7 group-hover:lg:opacity-0 lg:-ml-1 transition-all duration-300" />
			</div>

			<div
				class="absolute lg:pointer-events-none group-hover:lg:pointer-events-auto lg:relative cursor-pointer lg:cursor-none flex justify-center items-center gap-x-4">
				<label
					v-for="(color, index) in colorOptions"
					:key="index"
					:aria-label="`Select color ${color.family}`"
					class="absolute cursor-pointer lg:cursor-none lg:relative cyberpunk-checkbox-label pointer-events-none group-hover:lg:pointer-events-auto opacity-0 lg:group-hover:opacity-100 group-hover:delay-[0.1s] group-hover:lg:delay-[0.3s]">
					<input
						type="checkbox"
						class="cursor-pointer lg:cursor-none"
						:class="`color-${index + 1} cyberpunk-checkbox`"
						v-model="checkboxes[index]"
						@change="
							updateCheckbox(
								index,
								color.primary,
								color.secondary,
								color.transparent,
								color.family
							);
							updateFavicon(color.family);
						"
						:aria-checked="checkboxes[index] ? 'true' : 'false'" />
					<span class="sr-only">{{
						`Color ${index + 1}: ${color.family}`
					}}</span>
				</label>
			</div>
		</button>
	</div>
</template>
