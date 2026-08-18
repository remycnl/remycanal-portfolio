// app/composables/useSprite.ts

/**
 * Compagnon félin animé, en singleton partagé par toute l'application.
 *
 * Capacités :
 * - course + arrêts aléatoires dans une "zone" (une section enregistrée), dans les deux sens
 * - petit bond en avant de temps en temps pendant ses trajets (variation naturelle)
 * - saut d'une zone à une autre avec une trajectoire en arc basse, depuis sa position actuelle,
 *   sans jamais changer de sens pendant le trajet
 * - déclenchement du saut inter-zones au scroll, quand la zone courante remonte trop haut à l'écran
 * - chaque zone peut avoir son propre sprite (couleur) : le chat change de skin en y atterrissant
 * - miaulement (bulle "Meow!") au survol, une seule fois par entrée de souris, jamais empilé
 * - grognement (bulle "Grrr!") au clic, une seule fois par clic, jamais empilé, et qui se
 *   referme tout seul après un court délai (pas de "sortie" à écouter comme pour le survol)
 * - les deux bulles sont décalées horizontalement (miaulement à gauche, grognement à
 *   droite) pour ne jamais se superposer si elles apparaissent en même temps
 *
 * Spritesheet attendue : 19 frames, une seule ligne, dans cet ordre :
 *   [0..5]   idle    (6 frames)
 *   [6..9]   run A   (4 frames)
 *   [10..11] jump    (2 frames)
 *   [12..18] run B   (7 frames)
 *
 * La course est un cycle logique unique de 11 frames, reconstitué à partir
 * de run A + run B (elles sont juste séparées par le saut sur la planche).
 *
 * Toutes les variantes de couleur (cat-violet.png, cat-lime.png, ...) doivent
 * partager exactement le même découpage (19 frames, même ordre).
 */

export interface UseSpriteOptions {
	/** Chemin vers la sprite sheet par défaut (19 frames sur une ligne) */
	spriteSrc: string

	/** Nombre total de frames sur la planche */
	totalFrames?: number

	/** Dimensions d'une frame si connues (sinon déduites de totalFrames) */
	frameWidth?: number
	frameHeight?: number

	/** Hauteur d'affichage du chat */
	displayHeight?: number

	/** FPS des animations idle et course (le saut n'a que 2 images, pas de FPS à régler) */
	runFps?: number
	idleFps?: number

	/** Vitesse de déplacement en px/s (course locale + sauts inter-zones) */
	speed?: number

	/** Pause entre deux trajets locaux, en ms */
	pauseMin?: number
	pauseMax?: number

	/** % min/max de la largeur de la zone parcourue par trajet local */
	legMin?: number
	legMax?: number

	/** Probabilité (0-1) d'un petit bond en avant avant un trajet local */
	hopChance?: number

	/** Hauteur (px) de l'arc lors d'un saut entre deux zones */
	jumpArcHeight?: number

	/** Distance (px) sous laquelle une zone est considérée "haute dans l'écran" */
	scrollTriggerOffset?: number

	/** Durée d'affichage (ms) de la bulle de grognement au clic, avant fermeture auto */
	growlDuration?: number

	/**
	 * Décalage horizontal (px) entre les deux bulles, pour qu'elles ne se
	 * superposent jamais si elles apparaissent en même temps : le miaulement
	 * part vers la gauche, le grognement vers la droite.
	 */
	bubbleOffset?: number
}

export interface RegisterZoneOptions {
	/** Sprite (couleur) à utiliser quand le chat est dans cette zone. Défaut : le sprite de base. */
	spriteSrc?: string
	/** Ordre explicite si tu ne veux pas te fier à l'ordre d'enregistrement. */
	order?: number
}

export interface CatZoneHandle {
	unregister: () => void
}

interface Zone {
	el: HTMLElement
	order: number
	spriteSrc?: string
}

function range(start: number, count: number) {
	return Array.from({ length: count }, (_, i) => start + i)
}

function rand(min: number, max: number) {
	return min + Math.random() * (max - min)
}

let instance: ReturnType<typeof createSprite> | null = null

/**
 * Initialise (une seule fois) puis retourne l'instance unique du chat.
 * Tout composant qui l'appelle partage le même chat.
 * La première section qui l'enregistre (registerZone) devient sa zone de départ.
 *
 * Pour enregistrer une zone, préfère le helper `useCatZone()` ci-dessous :
 * il gère le cycle de vie (montage/démontage) tout seul.
 */
export function useSprite(options: UseSpriteOptions) {
	if (import.meta.server) {
		// Rien à faire côté serveur : API no-op pour ne pas casser le SSR.
		return {
			registerZone: (): CatZoneHandle => ({ unregister() {} }),
		}
	}

	if (!instance) instance = createSprite(options)

	return instance
}

/**
 * Sucre syntaxique : enregistre automatiquement une zone au montage du
 * composant et la désenregistre au démontage. À utiliser avec un ref de
 * template (idéalement `useTemplateRef`).
 *
 * `useSprite(options)` doit avoir été appelé au moins une fois avant
 * (typiquement dans le même composant, juste au-dessus).
 */
export function useCatZone(
	elRef: Ref<HTMLElement | null>,
	zoneOptions: RegisterZoneOptions = {}
) {
	if (import.meta.server) return

	let handle: CatZoneHandle | null = null

	onMounted(() => {
		if (!instance) {
			console.warn("[useCatZone] useSprite(options) doit être appelé avant useCatZone().")
			return
		}
		if (elRef.value) handle = instance.registerZone(elRef.value, zoneOptions)
	})

	onUnmounted(() => {
		handle?.unregister()
		handle = null
	})
}

function createSprite(options: UseSpriteOptions) {
	const { gsap } = useGsap()

	const {
		totalFrames = 19,
		displayHeight = 120,

		runFps = 14,
		idleFps = 5,

		speed = 90,
		pauseMin = 600,
		pauseMax = 2600,
		legMin = 0.2,
		legMax = 0.8,
		hopChance = 0.25,

		jumpArcHeight = 40,
		scrollTriggerOffset = 90,
		growlDuration = 900,
		bubbleOffset = 25,
	} = options

	// --------------------------------------------------
	// Groupes de frames (identiques pour tous les skins)
	// --------------------------------------------------

	const idleFrames = range(0, 6)
	const runFrames = [...range(6, 4), ...range(12, 7)]
	const jumpFrames = range(10, 2)

	// --------------------------------------------------
	// DOM (créé une seule fois, injecté dans <body>)
	// --------------------------------------------------

	const canvas = document.createElement("canvas")
	canvas.setAttribute("aria-hidden", "true")
	Object.assign(canvas.style, {
		position: "absolute",
		top: "0",
		left: "0",
		zIndex: "40",
		willChange: "transform",
		pointerEvents: "auto",
		cursor: "pointer",
	})

	const meow = document.createElement("div")
	meow.textContent = "Meow!"
	meow.className =
		"font-vg5000 text-white pointer-events-none select-none whitespace-nowrap text-sm"
	Object.assign(meow.style, {
		position: "absolute",
		top: "0",
		left: "0",
		zIndex: "41",
		opacity: "0",
		willChange: "transform, opacity",
	})

	// Bulle de grognement, déclenchée au clic (même look que la bulle de miaulement).
	const growl = document.createElement("div")
	growl.textContent = "Grrr!"
	growl.className =
		"font-vg5000 text-white pointer-events-none select-none whitespace-nowrap text-sm"
	Object.assign(growl.style, {
		position: "absolute",
		top: "0",
		left: "0",
		zIndex: "41",
		opacity: "0",
		willChange: "transform, opacity",
	})

	const ctx = canvas.getContext("2d")

	document.body.appendChild(canvas)
	document.body.appendChild(meow)
	document.body.appendChild(growl)

	// --------------------------------------------------
	// Sprites (cache par URL, pour changer de couleur sans tout recharger)
	// --------------------------------------------------

	const spriteCache = new Map<string, HTMLImageElement>()
	let activeImage: HTMLImageElement | null = null
	let activeSpriteSrc: string | null = null
	let imageLoaded = false

	function loadSprite(src: string): Promise<HTMLImageElement> {
		const cached = spriteCache.get(src)
		if (cached) return Promise.resolve(cached)

		return new Promise((resolve, reject) => {
			const img = new Image()
			img.onload = () => {
				spriteCache.set(src, img)
				resolve(img)
			}
			img.onerror = reject
			img.src = src
		})
	}

	/** Bascule le skin actif si besoin. Ignore silencieusement les échecs de chargement. */
	function applySpriteFor(zone: Zone) {
		const src = zone.spriteSrc ?? options.spriteSrc
		if (src === activeSpriteSrc) return

		loadSprite(src)
			.then((img) => {
				// La zone a pu changer pendant le chargement : on jette le résultat obsolète.
				if (currentZone !== zone) return

				activeImage = img
				activeSpriteSrc = src
				frameW = options.frameWidth ?? img.naturalWidth / totalFrames
				frameH = options.frameHeight ?? img.naturalHeight
				setupCanvas()
				updateTravelArea()
				draw()
			})
			.catch(() => {
				console.warn(`[useSprite] Impossible de charger le sprite : ${src}`)
			})
	}

	// --------------------------------------------------
	// État
	// --------------------------------------------------

	let frameW = 0
	let frameH = 0
	let displayW = 0
	const displayH = displayHeight

	const state = {
		mode: "idle" as "idle" | "run" | "jump",
		facing: -1 as 1 | -1,
		frame: 0,
	}

	let animationElapsed = 0
	let isJumping = false
	let isHopping = false
	let direction: 1 | -1 = 1

	let currentZone: Zone | null = null
	let pendingInitialZone: Zone | null = null

	const zones = new Map<HTMLElement, Zone>()
	let zoneOrderCounter = 0

	let currentTween: gsap.core.Tween | gsap.core.Timeline | undefined
	let pauseTimeout: ReturnType<typeof setTimeout> | undefined

	let meowVisible = false
	let growlVisible = false
	let growlHideTimeout: ReturnType<typeof setTimeout> | undefined

	// --------------------------------------------------
	// Dessin
	// --------------------------------------------------

	function currentFrames() {
		return state.mode === "idle"
			? idleFrames
			: state.mode === "jump"
				? jumpFrames
				: runFrames
	}

	function draw() {
		if (!imageLoaded || !ctx || !activeImage) return

		const frames = currentFrames()
		const sheetIndex = frames[state.frame % frames.length] ?? frames[0] ?? 0
		const sourceX = sheetIndex * frameW

		ctx.clearRect(0, 0, displayW, displayH)
		ctx.save()

		// Le sprite source regarde vers la droite par défaut :
		// on ne flip que lorsqu'il se déplace vers la gauche.
		if (state.facing === -1) {
			ctx.translate(displayW, 0)
			ctx.scale(-1, 1)
		}

		ctx.drawImage(activeImage, sourceX, 0, frameW, frameH, 0, 0, displayW, displayH)
		ctx.restore()
	}

	function tick(_time: number, deltaMs: number) {
		// Pendant un saut, la frame est pilotée directement par la timeline
		// GSAP (montée = image 1, sommet = bascule, descente = image 2) :
		// aucun calcul de minuteur à faire ici, on sort tout de suite.
		if (state.mode === "jump") return

		const frames = currentFrames()
		if (frames.length <= 1) return

		const fps = state.mode === "idle" ? idleFps : runFps

		animationElapsed += deltaMs
		const frameDuration = 1000 / fps

		if (animationElapsed >= frameDuration) {
			animationElapsed = 0
			state.frame = (state.frame + 1) % frames.length
			draw()
		}
	}

	function setMode(mode: typeof state.mode) {
		if (state.mode === mode) return
		state.mode = mode
		state.frame = 0
		animationElapsed = 0
		draw()
	}

	// --------------------------------------------------
	// Setup canvas (dimensions + DPR)
	// --------------------------------------------------

	function setupCanvas() {
		if (!ctx || !frameW || !frameH) return

		const dpr = Math.min(window.devicePixelRatio || 1, 2)

		displayW = displayH * (frameW / frameH)

		canvas.width = Math.round(displayW * dpr)
		canvas.height = Math.round(displayH * dpr)
		canvas.style.width = `${displayW}px`
		canvas.style.height = `${displayH}px`

		ctx.imageSmoothingEnabled = false
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
	}

	// --------------------------------------------------
	// Géométrie d'une zone, en coordonnées absolues (page)
	// --------------------------------------------------

	function zoneBounds(zone: Zone) {
		const rect = zone.el.getBoundingClientRect()
		const left = rect.left + window.scrollX
		const top = rect.top + window.scrollY + rect.height - displayH
		const maxX = left + Math.max(rect.width - displayW, 0)
		return { left, top, maxX }
	}

	function getX() {
		return Number(gsap.getProperty(canvas, "x")) || 0
	}

	function getY() {
		return Number(gsap.getProperty(canvas, "y")) || 0
	}

	/** Recale le chat dans les bornes de sa zone actuelle (resize, contenu qui bouge, etc.) */
	function updateTravelArea() {
		if (!currentZone || isJumping) return
		const bounds = zoneBounds(currentZone)
		const x = gsap.utils.clamp(bounds.left, bounds.maxX, getX())
		gsap.set(canvas, { x, y: bounds.top })
	}

	/** Place le chat dans une zone (déclenche aussi le changement de skin si besoin). */
	function activateZone(zone: Zone) {
		currentZone = zone
		applySpriteFor(zone)
	}

	// --------------------------------------------------
	// Déplacement local : course + arrêts aléatoires
	// --------------------------------------------------

	function scheduleNextLeg() {
		if (!imageLoaded || !currentZone || isJumping) return

		const bounds = zoneBounds(currentZone)
		const from = getX()
		const travelWidth = bounds.maxX - bounds.left

		if (travelWidth <= 0) {
			pauseTimeout = setTimeout(scheduleNextLeg, rand(pauseMin, pauseMax))
			return
		}

		const distance = travelWidth * rand(legMin, legMax)

		// Change parfois de direction avant d'arriver au bord (moins robotique).
		if (Math.random() < 0.2) direction = direction === 1 ? -1 : 1

		let target = from + direction * distance
		if (target < bounds.left || target > bounds.maxX) {
			direction = direction === 1 ? -1 : 1
			target = from + direction * distance
		}
		target = gsap.utils.clamp(bounds.left, bounds.maxX, target)

		const actualDistance = Math.abs(target - from)
		if (actualDistance < 10) {
			pauseTimeout = setTimeout(scheduleNextLeg, rand(pauseMin, pauseMax))
			return
		}

		state.facing = target > from ? 1 : -1

		const runToTarget = () => {
			setMode("run")
			// On repart toujours de la position réelle actuelle : si un bond a déjà
			// couvert une partie du trajet, seule la distance restante est courue.
			const remaining = Math.abs(target - getX())
			currentTween = gsap.to(canvas, {
				x: target,
				y: bounds.top,
				duration: remaining / speed,
				ease: "none",
				onComplete() {
					setMode("idle")
					pauseTimeout = setTimeout(scheduleNextLeg, rand(pauseMin, pauseMax))
				},
			})
		}

		// Petit bond avant de repartir en course : il avance en sautant (jamais
		// figé sur place), toujours dans la même direction que le trajet.
		if (!isHopping && Math.random() < hopChance) {
			isHopping = true
			setMode("jump")

			const hopDistance = actualDistance * rand(0.25, 0.45)
			const hopMidX = from + direction * hopDistance * 0.5
			const hopTarget = from + direction * hopDistance
			const hopPeakY = bounds.top - 22

			currentTween = gsap
				.timeline({
					onComplete() {
						isHopping = false
						runToTarget()
					},
				})
				// Montée : première image du saut (posée par setMode ci-dessus).
				.to(canvas, { x: hopMidX, y: hopPeakY, duration: 0.16, ease: "power1.out" })
				// Sommet atteint : on bascule sur la deuxième image, une seule fois.
				.call(() => {
					state.frame = 1
					draw()
				})
				// Descente : deuxième image jusqu'à l'atterrissage.
				.to(canvas, { x: hopTarget, y: bounds.top, duration: 0.2, ease: "power1.in" })
		} else {
			runToTarget()
		}
	}

	// --------------------------------------------------
	// Saut d'une zone à une autre (arc bas, sens figé)
	// --------------------------------------------------

	function jumpToZone(target: Zone) {
		if (!imageLoaded || isJumping || target === currentZone) return

		isJumping = true
		clearTimeout(pauseTimeout)
		currentTween?.kill()

		const bounds = zoneBounds(target)
		const landingX = gsap.utils.clamp(
			bounds.left,
			bounds.maxX,
			bounds.left + rand(0.25, 0.75) * (bounds.maxX - bounds.left)
		)

		const startX = getX()
		const startY = getY()
		const deltaX = landingX - startX

		// Le sens est figé UNE fois, avant le début du saut, et ne bouge plus
		// jusqu'à l'atterrissage. En dessous d'un petit seuil (saut quasi vertical),
		// on garde le sens déjà affiché pour éviter un flip inutile.
		if (Math.abs(deltaX) > 4) state.facing = deltaX > 0 ? 1 : -1
		setMode("jump")

		const midX = (startX + landingX) / 2
		// Arc volontairement bas : une trajectoire de saut de chat, pas un envol.
		const midY = Math.min(startY, bounds.top) - jumpArcHeight

		const dist = Math.hypot(deltaX, bounds.top - startY)
		const duration = gsap.utils.clamp(0.5, 1.3, dist / (speed * 2))

		currentTween = gsap
			.timeline({
				onComplete() {
					isJumping = false
					activateZone(target)
					setMode("idle")
					pauseTimeout = setTimeout(scheduleNextLeg, rand(pauseMin, pauseMax))
				},
			})
			// Montée : première image du saut (posée par setMode ci-dessus).
			.to(canvas, { x: midX, y: midY, duration: duration / 2, ease: "power1.out" })
			// Sommet atteint : on bascule sur la deuxième image, une seule fois.
			.call(() => {
				state.frame = 1
				draw()
			})
			// Descente : deuxième image jusqu'à l'atterrissage.
			.to(canvas, {
				x: landingX,
				y: bounds.top,
				duration: duration / 2,
				ease: "power1.in",
			})
	}

	// --------------------------------------------------
	// Miaulement au survol
	// --------------------------------------------------

	function showMeow() {
		if (meowVisible) return
		meowVisible = true

		gsap.killTweensOf(meow)
		gsap.set(meow, {
			x: getX() + displayW / 2 - bubbleOffset,
			xPercent: -50,
			yPercent: -100,
		})
		gsap.fromTo(
			meow,
			{ opacity: 0, scale: 0.8, y: getY() - 4 },
			{ opacity: 1, scale: 1, y: getY() - 16, duration: 0.28, ease: "back.out(2.2)" }
		)
	}

	function hideMeow() {
		if (!meowVisible) return
		meowVisible = false

		gsap.killTweensOf(meow)
		gsap.to(meow, { opacity: 0, scale: 0.85, duration: 0.18, ease: "power1.in" })
	}

	canvas.addEventListener("mouseenter", showMeow)
	canvas.addEventListener("mouseleave", hideMeow)

	// --------------------------------------------------
	// Grognement au clic
	// --------------------------------------------------
	//
	// Même logique d'apparition que le miaulement, mais il n'y a pas
	// d'événement de "sortie" équivalent au mouseleave pour un clic :
	// la bulle se referme donc automatiquement après `growlDuration` ms.
	// Un nouveau clic pendant qu'elle est affichée relance simplement
	// ce délai, sans jamais empiler de deuxième bulle.

	function showGrowl() {
		clearTimeout(growlHideTimeout)
		growlHideTimeout = setTimeout(hideGrowl, growlDuration)

		if (growlVisible) return
		growlVisible = true

		gsap.killTweensOf(growl)
		gsap.set(growl, {
			x: getX() + displayW / 2 + bubbleOffset,
			xPercent: -50,
			yPercent: -100,
		})
		gsap.fromTo(
			growl,
			{ opacity: 0, scale: 0.8, y: getY() - 4 },
			{ opacity: 1, scale: 1, y: getY() - 16, duration: 0.28, ease: "back.out(2.2)" }
		)
	}

	function hideGrowl() {
		if (!growlVisible) return
		growlVisible = false

		gsap.killTweensOf(growl)
		gsap.to(growl, { opacity: 0, scale: 0.85, duration: 0.18, ease: "power1.in" })
	}

	canvas.addEventListener("click", showGrowl)

	// --------------------------------------------------
	// Scroll : saute vers la zone suivante quand la zone
	// courante remonte trop haut à l'écran.
	// --------------------------------------------------

	let scrollScheduled = false

	function onScroll() {
		if (scrollScheduled) return
		scrollScheduled = true

		requestAnimationFrame(() => {
			scrollScheduled = false
			if (!currentZone || isJumping) return

			const rect = currentZone.el.getBoundingClientRect()
			if (rect.top > scrollTriggerOffset) return

			const ordered = [...zones.values()].sort((a, b) => a.order - b.order)
			const next = ordered.find((z) => z.order > currentZone!.order)
			if (!next) return

			// On ne saute que si la prochaine zone est déjà visible à l'écran.
			const nextRect = next.el.getBoundingClientRect()
			if (nextRect.top < window.innerHeight) jumpToZone(next)
		})
	}

	window.addEventListener("scroll", onScroll, { passive: true })
	window.addEventListener("resize", updateTravelArea)

	const resizeObserver = new ResizeObserver((entries) => {
		if (!currentZone) return
		if (entries.some((e) => e.target === currentZone!.el)) updateTravelArea()
	})

	// --------------------------------------------------
	// Chargement du sprite initial
	// --------------------------------------------------

	loadSprite(options.spriteSrc).then((img) => {
		activeImage = img
		activeSpriteSrc = options.spriteSrc
		frameW = options.frameWidth ?? img.naturalWidth / totalFrames
		frameH = options.frameHeight ?? img.naturalHeight

		setupCanvas()
		imageLoaded = true

		const initial = pendingInitialZone ?? [...zones.values()][0]
		if (initial) {
			currentZone = initial
			const bounds = zoneBounds(initial)
			gsap.set(canvas, {
				x: bounds.left + (bounds.maxX - bounds.left) / 2,
				y: bounds.top,
			})
			applySpriteFor(initial)
		}

		draw()
		pauseTimeout = setTimeout(scheduleNextLeg, rand(pauseMin, pauseMax))
	})

	gsap.ticker.add(tick)

	// --------------------------------------------------
	// API publique
	// --------------------------------------------------

	function registerZone(
		el: HTMLElement,
		zoneOptions: RegisterZoneOptions = {}
	): CatZoneHandle {
		const zone: Zone = {
			el,
			order: zoneOptions.order ?? zoneOrderCounter++,
			spriteSrc: zoneOptions.spriteSrc,
		}
		zones.set(el, zone)
		resizeObserver.observe(el)

		if (!currentZone && !pendingInitialZone) pendingInitialZone = zone

		return {
			unregister() {
				zones.delete(el)
				resizeObserver.unobserve(el)
				if (currentZone === zone) currentZone = null
			},
		}
	}

	return { registerZone }
}
