// app/composables/useSprite.ts

/**
 * Compagnon félin animé, en singleton partagé par toute l'application.
 *
 * Spritesheet attendue : 19 frames, une seule ligne :
 *   [0..5]   idle    (6 frames)
 *   [6..9]   run A   (4 frames)
 *   [10..11] jump    (2 frames)
 *   [12..18] run B   (7 frames)
 *
 * La course est un cycle logique de 11 frames reconstitué à partir de run A + run B.
 * Toutes les variantes de couleur (cat-violet.png, cat-lime.png, ...) doivent
 * partager exactement le même découpage.
 */

export interface UseSpriteOptions {
	spriteSrc: string
	totalFrames?: number
	frameWidth?: number
	frameHeight?: number
	displayHeight?: number | Ref<number>

	runFps?: number
	idleFps?: number

	speed?: number
	pauseMin?: number
	pauseMax?: number
	legMin?: number
	legMax?: number
	hopChance?: number

	jumpArcHeight?: number
	scrollTriggerRatio?: number
	growlDuration?: number
	bubbleOffset?: number

	textColorClass?: string | Ref<string>

	/** Balade autonome, indépendante du scroll : toutes directions possibles. Désactivé par défaut. */
	autoWander?: boolean | Ref<boolean>
	autoWanderMinDelay?: number
	autoWanderMaxDelay?: number
	autoWanderChance?: number
	/** Facteur sur la distance du plus proche voisin non-bloqué pour définir le pool de tirage. Défaut 1.6. */
	autoWanderNeighborFactor?: number
	autoWanderMaxCandidates?: number
}

export interface RegisterZoneOptions {
	spriteSrc?: string
	order?: number
	textColorClass?: string
	minWidth?: number
	maxWidth?: number
	isInitial?: boolean
}

export interface CatZoneHandle {
	unregister: () => void
}

interface ZoneProfile {
	order: number
	spriteSrc?: string
	textColorClass?: string
	minWidth?: number
	maxWidth?: number
	isInitial?: boolean
}

interface Zone {
	el: HTMLElement
	profiles: ZoneProfile[]
}

export interface ResponsiveZoneEntry {
	zone: Ref<HTMLElement | null>
	textColorClass?: string
	spriteSrc?: string
}

export interface ResponsiveZoneGroup {
	minWidth?: number
	maxWidth?: number
	initial?: Ref<HTMLElement | null>
	zones: ResponsiveZoneEntry[]
}

function range(start: number, count: number) {
	return Array.from({ length: count }, (_, i) => start + i)
}

function rand(min: number, max: number) {
	return min + Math.random() * (max - min)
}

let instance: ReturnType<typeof createSprite> | null = null

export function useSprite(options: UseSpriteOptions) {
	if (import.meta.server) {
		return {
			registerZone: (): CatZoneHandle => ({ unregister() {} }),
		}
	}

	if (!instance) instance = createSprite(options)

	return instance
}

export function useCatZone(
	elRef: Ref<HTMLElement | null>,
	zoneOptions?: RegisterZoneOptions
): void
export function useCatZone(groups: Record<string, ResponsiveZoneGroup>): void
export function useCatZone(
	arg1: Ref<HTMLElement | null> | Record<string, ResponsiveZoneGroup>,
	zoneOptions: RegisterZoneOptions = {}
) {
	if (import.meta.server) return

	if (isRef(arg1)) {
		const elRef = arg1
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
		return
	}

	const groups = arg1
	const handles: CatZoneHandle[] = []

	onMounted(() => {
		if (!instance) {
			console.warn("[useCatZone] useSprite(options) doit être appelé avant useCatZone().")
			return
		}

		let orderCursor = 0

		for (const group of Object.values(groups)) {
			const groupOrderStart = orderCursor

			group.zones.forEach((entry, index) => {
				const el = entry.zone.value
				if (!el) return

				const isInitial = group.initial ? group.initial.value === el : index === 0

				const handle = instance!.registerZone(el, {
					order: groupOrderStart + index,
					textColorClass: entry.textColorClass,
					spriteSrc: entry.spriteSrc,
					minWidth: group.minWidth,
					maxWidth: group.maxWidth,
					isInitial,
				})
				handles.push(handle)
			})

			orderCursor += group.zones.length
		}
	})

	onUnmounted(() => {
		for (const handle of handles) handle.unregister()
		handles.length = 0
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
		scrollTriggerRatio = 0.15,
		growlDuration = 900,
		bubbleOffset = 25,
		textColorClass = "text-white",

		autoWander = false,
		autoWanderMinDelay = 3500,
		autoWanderMaxDelay = 9000,
		autoWanderChance = 0.55,
		autoWanderNeighborFactor = 1.6,
		autoWanderMaxCandidates = 5,
	} = options

	const idleFrames = range(0, 6)
	const runFrames = [...range(6, 4), ...range(12, 7)]
	const jumpFrames = range(10, 2)

	function resolveDisplayHeight() {
		return isRef(displayHeight) ? displayHeight.value : displayHeight
	}

	function wanderEnabled() {
		return isRef(autoWander) ? autoWander.value : autoWander
	}

	// --------------------------------------------------
	// DOM
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
	meow.className = "font-vg5000 pointer-events-none select-none whitespace-nowrap text-sm"
	Object.assign(meow.style, {
		position: "absolute",
		top: "0",
		left: "0",
		zIndex: "41",
		opacity: "0",
		willChange: "transform, opacity",
	})

	const growl = document.createElement("div")
	growl.textContent = "Grrr!"
	growl.className = "font-vg5000 pointer-events-none select-none whitespace-nowrap text-sm"
	Object.assign(growl.style, {
		position: "absolute",
		top: "0",
		left: "0",
		zIndex: "41",
		opacity: "0",
		willChange: "transform, opacity",
	})

	function applyTextColorClass(next: string, previous?: string) {
		if (previous === next) return
		if (previous) {
			for (const cls of previous.split(" ").filter(Boolean)) {
				meow.classList.remove(cls)
				growl.classList.remove(cls)
			}
		}
		for (const cls of next.split(" ").filter(Boolean)) {
			meow.classList.add(cls)
			growl.classList.add(cls)
		}
	}

	let appliedTextColorClass: string | undefined

	function resolveDefaultTextColor() {
		return isRef(textColorClass) ? textColorClass.value : textColorClass
	}

	function activeProfile(zone: Zone): ZoneProfile | undefined {
		const w = window.innerWidth
		return zone.profiles.find(
			(p) => (p.minWidth === undefined || w >= p.minWidth) && (p.maxWidth === undefined || w <= p.maxWidth)
		)
	}

	function isZoneActive(zone: Zone) {
		return activeProfile(zone) !== undefined
	}

	function zoneOrder(zone: Zone) {
		return activeProfile(zone)?.order ?? Number.POSITIVE_INFINITY
	}

	function pickActiveInitialZone(): Zone | null {
		const active = [...zones.values()].filter(isZoneActive)
		if (active.length === 0) return null
		const preferred = active.find((z) => activeProfile(z)?.isInitial)
		if (preferred) return preferred
		return active.sort((a, b) => zoneOrder(a) - zoneOrder(b))[0]!
	}

	function updateBubbleTextColor(zone: Zone | null) {
		const next = (zone ? activeProfile(zone)?.textColorClass : undefined) ?? resolveDefaultTextColor()
		applyTextColorClass(next, appliedTextColorClass)
		appliedTextColorClass = next
	}

	updateBubbleTextColor(null)

	if (isRef(textColorClass)) {
		watch(textColorClass, () => {
			if (!currentZone || !activeProfile(currentZone)?.textColorClass) updateBubbleTextColor(currentZone)
		})
	}

	if (isRef(autoWander)) {
		watch(autoWander, (enabled) => {
			if (enabled) scheduleWander()
			else clearWanderTimer()
		})
	}

	const ctx = canvas.getContext("2d")

	document.body.appendChild(canvas)
	document.body.appendChild(meow)
	document.body.appendChild(growl)

	// --------------------------------------------------
	// Sprites
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

	function applySpriteFor(zone: Zone) {
		const src = activeProfile(zone)?.spriteSrc ?? options.spriteSrc
		if (src === activeSpriteSrc) return

		loadSprite(src)
			.then((img) => {
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
	let displayH = resolveDisplayHeight()

	const state = {
		mode: "idle" as "idle" | "run" | "jump",
		facing: -1 as 1 | -1,
		frame: 0,
	}

	let animationElapsed = 0
	let isJumping = false
	let isHopping = false
	let direction: 1 | -1 = 1

	let activeJumpTarget: Zone | null = null
	let activeJumpForward: boolean | null = null

	let scrollVelocity = 0
	let lastScrollTime = 0

	let currentZone: Zone | null = null

	const zones = new Map<HTMLElement, Zone>()
	let zoneOrderCounter = 0

	let currentTween: gsap.core.Tween | gsap.core.Timeline | undefined
	let pauseTimeout: ReturnType<typeof setTimeout> | undefined
	let wanderTimeout: ReturnType<typeof setTimeout> | undefined

	let meowVisible = false
	let growlVisible = false
	let growlHideTimeout: ReturnType<typeof setTimeout> | undefined

	if (isRef(displayHeight)) {
		watch(displayHeight, (next) => {
			displayH = next
			setupCanvas()
			if (!isJumping) updateTravelArea()
			draw()
		})
	}

	// --------------------------------------------------
	// Dessin
	// --------------------------------------------------

	function currentFrames() {
		return state.mode === "idle" ? idleFrames : state.mode === "jump" ? jumpFrames : runFrames
	}

	function draw() {
		if (!imageLoaded || !ctx || !activeImage) return

		const frames = currentFrames()
		const sheetIndex = frames[state.frame % frames.length] ?? frames[0] ?? 0
		const sourceX = sheetIndex * frameW

		ctx.clearRect(0, 0, displayW, displayH)
		ctx.save()

		if (state.facing === -1) {
			ctx.translate(displayW, 0)
			ctx.scale(-1, 1)
		}

		ctx.drawImage(activeImage, sourceX, 0, frameW, frameH, 0, 0, displayW, displayH)
		ctx.restore()
	}

	function tick(_time: number, deltaMs: number) {
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
	// Géométrie
	// --------------------------------------------------

	function zoneBounds(zone: Zone) {
		const rect = zone.el.getBoundingClientRect()
		const left = rect.left + window.scrollX
		const top = rect.top + window.scrollY + rect.height - displayH
		const maxX = left + Math.max(rect.width - displayW, 0)
		return { left, top, maxX }
	}

	/** Rect complet d'une zone en coordonnées page, pour les tests d'alignement/blocage. */
	function zoneRect(zone: Zone) {
		const rect = zone.el.getBoundingClientRect()
		const left = rect.left + window.scrollX
		const top = rect.top + window.scrollY
		return {
			left,
			top,
			right: left + rect.width,
			bottom: top + rect.height,
			centerX: left + rect.width / 2,
			centerY: top + rect.height / 2,
		}
	}

	/** Deux zones sont "en colonne" si leurs rects se chevauchent horizontalement. */
	function isColumnAligned(a: Zone, b: Zone) {
		const ra = zoneRect(a)
		const rb = zoneRect(b)
		return ra.right > rb.left && ra.left < rb.right
	}

	/**
	 * Une zone `other` bloque le trajet de `from` vers `to` si son centre
	 * tombe dans l'enveloppe rectangulaire des deux zones (union de leurs
	 * rects). Empêche de sauter par-dessus une case pour en atteindre une
	 * plus loin, aussi bien en vertical qu'en horizontal ou en diagonale.
	 */
	function isPathBlocked(from: Zone, to: Zone) {
		const a = zoneRect(from)
		const b = zoneRect(to)
		const left = Math.min(a.left, b.left)
		const right = Math.max(a.right, b.right)
		const top = Math.min(a.top, b.top)
		const bottom = Math.max(a.bottom, b.bottom)
		const margin = 4

		for (const other of zones.values()) {
			if (other === from || other === to) continue
			if (!isZoneActive(other)) continue

			const r = zoneRect(other)
			if (
				r.centerX > left + margin &&
				r.centerX < right - margin &&
				r.centerY > top + margin &&
				r.centerY < bottom - margin
			) {
				return true
			}
		}

		return false
	}

	function isZoneFullyVisible(zone: Zone) {
		const rect = zone.el.getBoundingClientRect()
		if (rect.width === 0 || rect.height === 0) return false
		return (
			rect.top >= 0 &&
			rect.left >= 0 &&
			rect.bottom <= window.innerHeight &&
			rect.right <= window.innerWidth
		)
	}

	function getX() {
		return Number(gsap.getProperty(canvas, "x")) || 0
	}

	function getY() {
		return Number(gsap.getProperty(canvas, "y")) || 0
	}

	function getCatViewportY() {
		return getY() - window.scrollY
	}

	function updateTravelArea() {
		if (!currentZone || isJumping) return
		const bounds = zoneBounds(currentZone)
		const x = gsap.utils.clamp(bounds.left, bounds.maxX, getX())
		gsap.set(canvas, { x, y: bounds.top })
	}

	function activateZone(zone: Zone) {
		currentZone = zone
		applySpriteFor(zone)
		updateBubbleTextColor(zone)
	}

	function placeInZone(zone: Zone) {
		clearTimeout(pauseTimeout)
		clearWanderTimer()
		clearTimeout(growlHideTimeout)
		currentTween?.kill()
		isJumping = false
		isHopping = false
		meowVisible = false
		growlVisible = false
		gsap.killTweensOf(meow)
		gsap.killTweensOf(growl)
		gsap.set(meow, { opacity: 0 })
		gsap.set(growl, { opacity: 0 })

		activateZone(zone)
		const bounds = zoneBounds(zone)
		gsap.set(canvas, {
			x: bounds.left + (bounds.maxX - bounds.left) / 2,
			y: bounds.top,
		})
		setMode("idle")
		draw()

		lastScrollY = window.scrollY
		lastScrollTime = performance.now()
		scrollVelocity = 0
		pauseTimeout = setTimeout(scheduleNextLeg, rand(pauseMin, pauseMax))
		scheduleWander()
	}

	function resync() {
		lastScrollY = window.scrollY
		lastScrollTime = performance.now()
		scrollVelocity = 0

		if (isJumping || isHopping) return

		if (currentZone && !isZoneActive(currentZone)) {
			const next = pickActiveInitialZone()
			if (next) {
				placeInZone(next)
				return
			}
		}

		if (currentZone && zones.has(currentZone.el)) {
			updateTravelArea()
			return
		}

		const fallback =
			pickActiveInitialZone() ?? [...zones.values()].sort((a, b) => zoneOrder(a) - zoneOrder(b))[0]
		if (fallback) placeInZone(fallback)
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
				.to(canvas, { x: hopMidX, y: hopPeakY, duration: 0.16, ease: "power1.out" })
				.call(() => {
					state.frame = 1
					draw()
				})
				.to(canvas, { x: hopTarget, y: bounds.top, duration: 0.2, ease: "power1.in" })
		} else {
			runToTarget()
		}
	}

	// --------------------------------------------------
	// Saut d'une zone à une autre (arc bas, sens figé)
	// --------------------------------------------------

	/**
	 * Montée et descente sont chronométrées indépendamment à vitesse
	 * effective constante, avec un ease plus marqué du côté de la phase la
	 * plus courte, pour rester naturel même quand les deux zones ne sont
	 * pas à la même hauteur.
	 */
	function jumpToZone(target: Zone, landingX?: number) {
		if (!imageLoaded || target === currentZone) return

		isJumping = true
		clearTimeout(pauseTimeout)
		clearWanderTimer()
		currentTween?.kill()

		const bounds = zoneBounds(target)
		const resolvedLandingX = gsap.utils.clamp(
			bounds.left,
			bounds.maxX,
			landingX ?? bounds.left + rand(0.25, 0.75) * (bounds.maxX - bounds.left)
		)

		const startX = getX()
		const startY = getY()
		const deltaX = resolvedLandingX - startX
		const straightDist = Math.hypot(deltaX, bounds.top - startY)

		if (Math.abs(deltaX) > 4) state.facing = deltaX > 0 ? 1 : -1
		setMode("jump")

		activeJumpTarget = target
		activeJumpForward = zoneOrder(target) > (currentZone ? zoneOrder(currentZone) : Number.NEGATIVE_INFINITY)

		const velocityBoost = gsap.utils.clamp(1, 3.2, 1 + scrollVelocity / 2200)
		const effectiveSpeed = speed * velocityBoost

		const arcHeight = gsap.utils.clamp(16, jumpArcHeight, straightDist * 0.22)
		const midX = (startX + resolvedLandingX) / 2
		const midY = Math.min(startY, bounds.top) - arcHeight

		const riseDist = Math.hypot(midX - startX, midY - startY)
		const fallDist = Math.hypot(resolvedLandingX - midX, bounds.top - midY)

		const riseDuration = gsap.utils.clamp(0.08, 0.55, riseDist / effectiveSpeed)
		const fallDuration = gsap.utils.clamp(0.08, 0.55, fallDist / effectiveSpeed)

		const riseIsShorter = riseDist <= fallDist
		const riseEase = riseIsShorter ? "power3.out" : "power1.out"
		const fallEase = riseIsShorter ? "power1.in" : "power3.in"

		currentTween = gsap
			.timeline({
				onComplete() {
					isJumping = false
					activeJumpTarget = null
					activeJumpForward = null
					activateZone(target)
					setMode("idle")
					pauseTimeout = setTimeout(scheduleNextLeg, rand(pauseMin, pauseMax))
					scheduleWander()
				},
			})
			.to(canvas, { x: midX, y: midY, duration: riseDuration, ease: riseEase })
			.call(() => {
				state.frame = 1
				draw()
			})
			.to(canvas, { x: resolvedLandingX, y: bounds.top, duration: fallDuration, ease: fallEase })
	}

	// --------------------------------------------------
	// Balade autonome (indépendante du scroll, toutes directions)
	// --------------------------------------------------

	function clearWanderTimer() {
		clearTimeout(wanderTimeout)
		wanderTimeout = undefined
	}

	function scheduleWander() {
		clearWanderTimer()
		if (!wanderEnabled()) return
		wanderTimeout = setTimeout(attemptWander, rand(autoWanderMinDelay, autoWanderMaxDelay))
	}

	function closestLandingPoint(zone: Zone, fromX: number, fromY: number) {
		const bounds = zoneBounds(zone)
		const x = gsap.utils.clamp(bounds.left, bounds.maxX, fromX)
		const dist = Math.hypot(x - fromX, bounds.top - fromY)
		return { zone, x, dist }
	}

	/**
	 * Voisins actifs, entièrement visibles, non bloqués par une autre zone
	 * interposée — toutes directions confondues (haut, bas, gauche, droite,
	 * diagonale), chacun avec son point d'atterrissage le plus proche.
	 */
	function collectWanderCandidates() {
		if (!currentZone) return []

		const fromX = getX()
		const fromY = getY()
		const candidates: { zone: Zone; x: number; dist: number }[] = []

		for (const zone of zones.values()) {
			if (zone === currentZone) continue
			if (!isZoneActive(zone)) continue
			if (!isZoneFullyVisible(zone)) continue
			if (isPathBlocked(currentZone, zone)) continue

			candidates.push(closestLandingPoint(zone, fromX, fromY))
		}

		return candidates
	}

	/**
	 * Tire une destination dans un pool de voisins proches (pas uniquement
	 * le plus proche strict), pondéré par proximité inverse : direction
	 * imprévisible d'une balade à l'autre, sans jamais enjamber une zone.
	 */
	function pickWanderTarget(): { zone: Zone; x: number } | null {
		const candidates = collectWanderCandidates()
		if (candidates.length === 0) return null

		candidates.sort((a, b) => a.dist - b.dist)

		const nearestDist = candidates[0]!.dist
		const threshold = nearestDist * autoWanderNeighborFactor

		let pool = candidates.filter((c) => c.dist <= threshold)
		if (pool.length < 2) pool = candidates.slice(0, Math.min(autoWanderMaxCandidates, candidates.length))
		else pool = pool.slice(0, autoWanderMaxCandidates)

		const weights = pool.map((c) => 1 / (c.dist + 1))
		const totalWeight = weights.reduce((sum, w) => sum + w, 0)

		let roll = Math.random() * totalWeight
		for (let i = 0; i < pool.length; i++) {
			roll -= weights[i]!
			if (roll <= 0) return pool[i]!
		}

		return pool[pool.length - 1]!
	}

	function attemptWander() {
		if (!wanderEnabled()) return

		if (!imageLoaded || isJumping || isHopping || !currentZone || !isZoneFullyVisible(currentZone)) {
			scheduleWander()
			return
		}

		if (Math.random() < autoWanderChance) {
			const picked = pickWanderTarget()
			if (picked) {
				jumpToZone(picked.zone, picked.x)
				return
			}
		}

		scheduleWander()
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
	// Scroll : saut inter-zones strictement vertical
	// --------------------------------------------------

	let scrollScheduled = false
	let lastScrollY = 0
	let lastScrollDirectionDown = true

	/**
	 * Cherche la zone active la plus proche verticalement, dans le sens du
	 * scroll, alignée en colonne avec la zone courante et non bloquée par
	 * une zone interposée. Jamais de saut latéral déclenché par le scroll.
	 */
	function findNearestLanding(forward: boolean) {
		if (!currentZone) return null

		const viewportH = window.innerHeight
		const fromX = getX()
		const fromY = getY()
		const currentOrder = zoneOrder(currentZone)

		let best: { zone: Zone; x: number; dist: number } | null = null

		for (const zone of zones.values()) {
			if (!isZoneActive(zone)) continue
			const order = zoneOrder(zone)
			if (forward ? order <= currentOrder : order >= currentOrder) continue
			if (!isColumnAligned(currentZone, zone)) continue
			if (isPathBlocked(currentZone, zone)) continue

			const rect = zone.el.getBoundingClientRect()
			if (rect.bottom <= 0 || rect.top >= viewportH) continue

			const candidate = closestLandingPoint(zone, fromX, fromY)
			if (!best || candidate.dist < best.dist) best = candidate
		}

		return best
	}

	function onScroll() {
		if (scrollScheduled) return
		scrollScheduled = true

		requestAnimationFrame(() => {
			scrollScheduled = false

			const now = performance.now()
			const scrollY = window.scrollY
			const delta = scrollY - lastScrollY
			const dt = Math.max(now - lastScrollTime, 1)

			const instantVelocity = (Math.abs(delta) / dt) * 1000
			scrollVelocity = scrollVelocity * 0.7 + instantVelocity * 0.3

			const scrollingDown = delta !== 0 ? delta > 0 : lastScrollDirectionDown
			lastScrollDirectionDown = scrollingDown
			lastScrollY = scrollY
			lastScrollTime = now

			if (!currentZone) return

			const viewportH = window.innerHeight

			if (isJumping) {
				if (activeJumpForward === null || scrollingDown !== activeJumpForward) return

				const landing = findNearestLanding(activeJumpForward)
				if (landing && landing.zone !== activeJumpTarget) {
					jumpToZone(landing.zone, landing.x)
				}
				return
			}

			const catY = getCatViewportY()

			if (scrollingDown) {
				if (catY > viewportH * scrollTriggerRatio) return

				const landing = findNearestLanding(true)
				if (landing) jumpToZone(landing.zone, landing.x)
			} else {
				if (catY < viewportH * (1 - scrollTriggerRatio)) return

				const landing = findNearestLanding(false)
				if (landing) jumpToZone(landing.zone, landing.x)
			}
		})
	}

	window.addEventListener("scroll", onScroll, { passive: true })
	window.addEventListener("resize", resync, { passive: true })
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible") resync()
	})

	const resizeObserver = new ResizeObserver((entries) => {
		if (!currentZone) return
		if (entries.some((e) => e.target === currentZone!.el)) updateTravelArea()
	})

	loadSprite(options.spriteSrc).then((img) => {
		activeImage = img
		activeSpriteSrc = options.spriteSrc
		frameW = options.frameWidth ?? img.naturalWidth / totalFrames
		frameH = options.frameHeight ?? img.naturalHeight

		setupCanvas()
		imageLoaded = true

		const initial = pickActiveInitialZone()
		if (initial) {
			placeInZone(initial)
		} else {
			lastScrollY = window.scrollY
			draw()
		}
	})

	gsap.ticker.add(tick)

	// --------------------------------------------------
	// API publique
	// --------------------------------------------------

	function registerZone(el: HTMLElement, zoneOptions: RegisterZoneOptions = {}): CatZoneHandle {
		let zone = zones.get(el)
		const isNewZone = !zone
		if (!zone) {
			zone = { el, profiles: [] }
			zones.set(el, zone)
		}

		const profile: ZoneProfile = {
			order: zoneOptions.order ?? zoneOrderCounter++,
			spriteSrc: zoneOptions.spriteSrc,
			textColorClass: zoneOptions.textColorClass,
			minWidth: zoneOptions.minWidth,
			maxWidth: zoneOptions.maxWidth,
			isInitial: zoneOptions.isInitial,
		}
		zone.profiles.push(profile)

		if (isNewZone) resizeObserver.observe(el)

		if (imageLoaded && !currentZone && isZoneActive(zone)) {
			placeInZone(zone)
		}

		return {
			unregister() {
				const target = zones.get(el)
				if (!target) return

				const idx = target.profiles.indexOf(profile)
				if (idx !== -1) target.profiles.splice(idx, 1)

				if (target.profiles.length > 0) return

				zones.delete(el)
				resizeObserver.unobserve(el)

				if (currentZone === target) {
					clearTimeout(pauseTimeout)
					clearWanderTimer()
					clearTimeout(growlHideTimeout)
					currentTween?.kill()
					gsap.killTweensOf(meow)
					gsap.killTweensOf(growl)
					gsap.set(meow, { opacity: 0 })
					gsap.set(growl, { opacity: 0 })
					isJumping = false
					isHopping = false
					meowVisible = false
					growlVisible = false
					currentZone = null
				}
			},
		}
	}

	return { registerZone }
}