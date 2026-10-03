import * as THREE from "three"

/**
 * Quincaillerie d'un lanyard : embout plein (la sangle s'y perd) → tige d'émerillon → fût pivotant
 * → mousqueton à gâchette, dont le bas passe dans la fente de la carte.
 *
 * Repère : centre de la carte à l'origine, y vers le haut, z vers le spectateur.
 * L'axe de l'émerillon est la verticale x = 0, z = 0.
 */

export interface HardwareParams {
	slotCenterY: number
	slotHeight: number
	/** Rotation (rad) de la boucle du mousqueton autour de l'axe vertical : on la voit de biais */
	yaw: number
}

export interface HardwareLayout {
	/** Bas de la boucle (fibre neutre du cadre au point le plus bas), dans la fente */
	loopBottomY: number
	barrelBottomY: number
	barrelHeight: number
	barrelTopY: number
	/** Bride de l'émerillon, solidaire de la sangle */
	flangeY: number
	capBodyY0: number
	capBodyHeight: number
	/** Point d'attache de la sangle : à l'intérieur de l'embout */
	attachY: number
}

// ─── Cotes (1 unité ≈ 105 mm) ────────────────────────────────────────────────

// Boucle en goutte : un petit cercle en haut, un grand en bas, reliés par deux tangentes droites.
const TOP_RADIUS = 0.027
const BOTTOM_RADIUS = 0.039
const CIRCLE_DISTANCE = 0.112 // entre les centres des deux cercles

// Cadre plat : largeur dans le plan de la boucle, épaisseur perpendiculairement
const BODY_WIDTH_TOP = 0.031
const BODY_WIDTH_NOSE = 0.0215
const GATE_WIDTH = 0.0215 // = largeur du corps au bec : le joint est net
const BODY_DEPTH = 0.032
const GATE_DEPTH = 0.026
const BEVEL = 0.0048 // arrondi des arêtes
const SEAM_GAP = 0.0016 // joint entre la gâchette et le bec : boucle fermée

const LOOP_JEU = 0.004 // entre le bord haut de la fente et le cadre
const BARREL_HEIGHT = 0.046
const CAP_BODY_HEIGHT = 0.064
const CAP_THICKNESS = 0.026

// ─── Contour de la boucle ────────────────────────────────────────────────────

interface PathSample {
	p: THREE.Vector2
	/** tangente unitaire (sens de parcours) */
	t: THREE.Vector2
	/** longueur cumulée depuis le début du chemin */
	s: number
}

interface PearPaths {
	/** Corps : du haut-avant (charnière), par-dessus le col, le long du dos, autour du bas, jusqu'au bec */
	body: PathSample[]
	/** Gâchette : ligne droite avant, du bec vers la charnière */
	gate: PathSample[]
	hinge: THREE.Vector2
	nose: THREE.Vector2
	/** Demi-largeur du cadre au point le plus bas du corps */
	bottomHalfWidth: number
	/** Hauteur du haut du cadre (extérieur) au-dessus du point le plus bas de la fibre neutre */
	outerTopY: number
	/** Direction de la gâchette (unitaire, du bec vers la charnière) */
	gateDirection: THREE.Vector2
}

function withLengths(points: { p: THREE.Vector2; t: THREE.Vector2 }[]): PathSample[] {
	let s = 0
	return points.map((q, i) => {
		if (i > 0) s += q.p.distanceTo(points[i - 1]!.p)
		return { p: q.p, t: q.t, s }
	})
}

function buildPearPaths(): PearPaths {
	const centerBottom = new THREE.Vector2(0, BOTTOM_RADIUS) // le point le plus bas de la fibre est à y = 0
	const centerTop = new THREE.Vector2(0, BOTTOM_RADIUS + CIRCLE_DISTANCE)
	// normale des tangentes extérieures : n = (±nx, ny) avec ny = (R2 - R1) / d
	const ny = (BOTTOM_RADIUS - TOP_RADIUS) / CIRCLE_DISTANCE
	const nx = Math.sqrt(1 - ny * ny)
	const thetaR = Math.atan2(ny, nx) // angle de la normale côté droit (avant)

	const arc = (center: THREE.Vector2, radius: number, from: number, to: number) => {
		const steps = Math.max(Math.ceil(Math.abs(to - from) / 0.03), 2)
		const out: { p: THREE.Vector2; t: THREE.Vector2 }[] = []
		for (let i = 0; i <= steps; i++) {
			const a = THREE.MathUtils.lerp(from, to, i / steps)
			out.push({
				p: new THREE.Vector2(
					center.x + radius * Math.cos(a),
					center.y + radius * Math.sin(a)
				),
				t: new THREE.Vector2(-Math.sin(a), Math.cos(a)),
			})
		}
		return out
	}
	const line = (a: THREE.Vector2, b: THREE.Vector2) => {
		const dir = b.clone().sub(a)
		const length = dir.length()
		dir.normalize()
		const steps = Math.max(Math.ceil(length / 0.004), 2)
		const out: { p: THREE.Vector2; t: THREE.Vector2 }[] = []
		for (let i = 0; i <= steps; i++)
			out.push({ p: a.clone().lerp(b, i / steps), t: dir.clone() })
		return out
	}

	const tangentPoint = (center: THREE.Vector2, radius: number, side: 1 | -1) =>
		new THREE.Vector2(center.x + side * radius * nx, center.y + radius * ny)

	const topRight = tangentPoint(centerTop, TOP_RADIUS, 1)
	const topLeft = tangentPoint(centerTop, TOP_RADIUS, -1)
	const bottomRight = tangentPoint(centerBottom, BOTTOM_RADIUS, 1)
	const bottomLeft = tangentPoint(centerBottom, BOTTOM_RADIUS, -1)

	// Sens anti-horaire : arc du haut (droite → gauche), dos, arc du bas (gauche → bas → droite)
	const bodyPoints = [
		...arc(centerTop, TOP_RADIUS, thetaR, Math.PI - thetaR),
		...line(topLeft, bottomLeft).slice(1),
		...arc(centerBottom, BOTTOM_RADIUS, Math.PI - thetaR, Math.PI * 2 + thetaR).slice(1),
	]
	const gatePoints = line(bottomRight, topRight)
	const body = withLengths(bodyPoints)
	const gate = withLengths(gatePoints)

	// demi-largeur du corps au point le plus bas
	const total = body[body.length - 1]!.s
	let lowest = body[0]!
	for (const q of body) if (q.p.y < lowest.p.y) lowest = q
	const bottomHalfWidth = bodyWidthAt(lowest.s / total) / 2

	return {
		body,
		gate,
		hinge: topRight,
		nose: bottomRight,
		bottomHalfWidth,
		outerTopY: centerTop.y + TOP_RADIUS + BODY_WIDTH_TOP / 2,
		gateDirection: topRight.clone().sub(bottomRight).normalize(),
	}
}

function bodyWidthAt(fraction: number): number {
	return THREE.MathUtils.lerp(
		BODY_WIDTH_TOP,
		BODY_WIDTH_NOSE,
		THREE.MathUtils.smoothstep(fraction, 0.08, 0.97)
	)
}

const PEAR = buildPearPaths()

// ─── Cadre plat extrudé ──────────────────────────────────────────────────────

function pointAtLength(
	samples: PathSample[],
	length: number,
	out: { p: THREE.Vector2; t: THREE.Vector2 }
) {
	const last = samples[samples.length - 1]!
	const L = THREE.MathUtils.clamp(length, 0, last.s)
	let lo = 0
	let hi = samples.length - 1
	while (hi - lo > 1) {
		const mid = (lo + hi) >> 1
		if (samples[mid]!.s <= L) lo = mid
		else hi = mid
	}
	const a = samples[lo]!
	const b = samples[hi]!
	const k = b.s > a.s ? (L - a.s) / (b.s - a.s) : 0
	out.p.copy(a.p).lerp(b.p, k)
	out.t.copy(a.t).lerp(b.t, k).normalize()
}

/**
 * Cadre plat suivant `samples` : la forme 2D (contour extérieur + contour intérieur, bouts plats)
 * est extrudée sur `depth` (perpendiculairement au plan de la boucle) avec des arêtes biseautées.
 * `trimStart` / `trimEnd` raccourcissent le chemin (le biseau rend ensuite cette longueur).
 */
function createFrameGeometry(
	samples: PathSample[],
	widthAt: (fraction: number) => number,
	depth: number,
	trimStart: number,
	trimEnd: number
): THREE.BufferGeometry {
	const total = samples[samples.length - 1]!.s
	const from = trimStart + BEVEL
	const to = total - trimEnd - BEVEL
	const steps = Math.max(Math.ceil((to - from) / 0.005), 8)
	const cur = { p: new THREE.Vector2(), t: new THREE.Vector2() }
	const outer: THREE.Vector2[] = []
	const inner: THREE.Vector2[] = []
	for (let i = 0; i <= steps; i++) {
		const length = THREE.MathUtils.lerp(from, to, i / steps)
		pointAtLength(samples, length, cur)
		const half = widthAt(length / total) / 2 - BEVEL
		// sens anti-horaire : l'extérieur est à droite de la tangente
		const nOut = new THREE.Vector2(cur.t.y, -cur.t.x)
		outer.push(cur.p.clone().addScaledVector(nOut, half))
		inner.push(cur.p.clone().addScaledVector(nOut, -half))
	}
	const shape = new THREE.Shape()
	shape.moveTo(outer[0]!.x, outer[0]!.y)
	for (let i = 1; i < outer.length; i++) shape.lineTo(outer[i]!.x, outer[i]!.y)
	for (let i = inner.length - 1; i >= 0; i--) shape.lineTo(inner[i]!.x, inner[i]!.y)
	shape.closePath()

	const extrudeDepth = depth - BEVEL * 2
	const geometry = new THREE.ExtrudeGeometry(shape, {
		depth: extrudeDepth,
		bevelEnabled: true,
		bevelThickness: BEVEL,
		bevelSize: BEVEL,
		bevelSegments: 2,
		curveSegments: 1,
	})
	geometry.translate(0, 0, -extrudeDepth / 2)
	// forme (x, y) → plan de la boucle (z, y) ; l'extrusion part sur x
	geometry.rotateY(-Math.PI / 2)
	geometry.computeVertexNormals()
	return geometry
}

/** Plaque arrondie (rectangle à coins ronds) extrudée, dans le plan de la boucle. Centrée en (0,0,0). */
function createRoundedPlateGeometry(
	width: number,
	height: number,
	radius: number,
	depth: number,
	bevel: number
) {
	const w = width / 2 - bevel
	const h = height / 2 - bevel
	const r = Math.max(radius - bevel, 0.001)
	const shape = new THREE.Shape()
	shape.moveTo(-w + r, -h)
	shape.lineTo(w - r, -h)
	shape.quadraticCurveTo(w, -h, w, -h + r)
	shape.lineTo(w, h - r)
	shape.quadraticCurveTo(w, h, w - r, h)
	shape.lineTo(-w + r, h)
	shape.quadraticCurveTo(-w, h, -w, h - r)
	shape.lineTo(-w, -h + r)
	shape.quadraticCurveTo(-w, -h, -w + r, -h)
	const d = depth - bevel * 2
	const geometry = new THREE.ExtrudeGeometry(shape, {
		depth: d,
		bevelEnabled: true,
		bevelThickness: bevel,
		bevelSize: bevel,
		bevelSegments: 2,
		curveSegments: 4,
	})
	geometry.translate(0, 0, -d / 2)
	geometry.rotateY(-Math.PI / 2)
	geometry.computeVertexNormals()
	return geometry
}

// ─── Disposition verticale ───────────────────────────────────────────────────

export function computeHardwareLayout(
	p: Pick<HardwareParams, "slotCenterY" | "slotHeight">
): HardwareLayout {
	const slotTop = p.slotCenterY + p.slotHeight / 2
	const loopBottomY = slotTop - PEAR.bottomHalfWidth - LOOP_JEU
	const loopOuterTopY = loopBottomY + PEAR.outerTopY
	const barrelBottomY = loopOuterTopY - 0.012 // le haut du cadre est noyé dans le fût
	const barrelTopY = barrelBottomY + BARREL_HEIGHT
	const flangeY = barrelTopY + 0.005
	const capBodyY0 = barrelTopY + 0.032
	return {
		loopBottomY,
		barrelBottomY,
		barrelHeight: BARREL_HEIGHT,
		barrelTopY,
		flangeY,
		capBodyY0,
		capBodyHeight: CAP_BODY_HEIGHT,
		attachY: capBodyY0 + 0.038,
	}
}

// ─── Émerillon et embout ─────────────────────────────────────────────────────

// Fût de l'émerillon (tourne avec le mousqueton) : pièce tournée, centrée en (0,0,0)
function createBarrelGeometry(): THREE.BufferGeometry {
	const h = BARREL_HEIGHT / 2
	const profile: [number, number][] = [
		[0, -h],
		[0.011, -h],
		[0.0195, -h + 0.006], // épaulement vers la boucle
		[0.0238, -h + 0.015],
		[0.0248, -h + 0.022],
		[0.0248, h - 0.011], // corps cylindrique
		[0.026, h - 0.0075], // bague
		[0.026, h - 0.003],
		[0.0232, h], // arête haute chanfreinée
		[0.0128, h],
		[0.0108, h - 0.004], // alésage où entre la tige
		[0, h - 0.004],
	]
	return new THREE.LatheGeometry(
		profile.map(([r, y]) => new THREE.Vector2(r, y)),
		36
	)
}

// Bride de l'émerillon (solidaire de la sangle) : petite rondelle chanfreinée
function createFlangeGeometry(): THREE.BufferGeometry {
	const profile: [number, number][] = [
		[0, -0.0035],
		[0.0175, -0.0035],
		[0.0195, -0.0018],
		[0.0195, 0.0018],
		[0.0175, 0.0035],
		[0, 0.0035],
	]
	return new THREE.LatheGeometry(
		profile.map(([r, y]) => new THREE.Vector2(r, y)),
		28
	)
}

// Bossage sous l'embout : cône court qui reçoit la tige. y = 0 en haut.
function createBossGeometry(): THREE.BufferGeometry {
	const profile: [number, number][] = [
		[0, -0.022],
		[0.0098, -0.022],
		[0.0155, -0.0145],
		[0.0235, -0.0055],
		[0.028, 0],
		[0, 0],
	]
	return new THREE.LatheGeometry(
		profile.map(([r, y]) => new THREE.Vector2(r, y)),
		28
	)
}

// Embout plein : plaque rectangulaire aux coins arrondis, extrudée, arêtes biseautées. y = 0 au bas.
function createCapGeometry(strapWidth: number): THREE.BufferGeometry {
	const w = strapWidth + 0.028
	const h = CAP_BODY_HEIGHT
	const r = 0.018
	const rt = 0.011
	const shape = new THREE.Shape()
	shape.moveTo(-w / 2 + r, 0)
	shape.lineTo(w / 2 - r, 0)
	shape.quadraticCurveTo(w / 2, 0, w / 2, r)
	shape.lineTo(w / 2, h - rt)
	shape.quadraticCurveTo(w / 2, h, w / 2 - rt, h)
	shape.lineTo(-w / 2 + rt, h)
	shape.quadraticCurveTo(-w / 2, h, -w / 2, h - rt)
	shape.lineTo(-w / 2, r)
	shape.quadraticCurveTo(-w / 2, 0, -w / 2 + r, 0)
	const bevel = 0.0042
	const depth = CAP_THICKNESS - bevel * 2
	const geometry = new THREE.ExtrudeGeometry(shape, {
		depth,
		bevelEnabled: true,
		bevelThickness: bevel,
		bevelSize: bevel,
		bevelSegments: 2,
		curveSegments: 8,
	})
	geometry.translate(0, 0, -depth / 2)
	geometry.computeVertexNormals()
	return geometry
}

// ─── Assemblage ──────────────────────────────────────────────────────────────

export interface LanyardHardware {
	/** Partie qui pivote avec la carte, en repère carte. À mettre dans le groupe qui tourne au flip. */
	rotating: THREE.Group
	/** Partie fixe (ne suit pas la rotation autour de l'axe vertical), en repère centré sur le point d'attache. */
	fixed: THREE.Group
}

export function createLanyardHardware(
	p: HardwareParams,
	strapWidth: number,
	material: THREE.Material
): LanyardHardware {
	const layout = computeHardwareLayout(p)
	const rotating = new THREE.Group()
	const fixed = new THREE.Group()

	// ── Fût de l'émerillon
	const barrel = new THREE.Mesh(createBarrelGeometry(), material)
	barrel.position.set(0, layout.barrelBottomY + layout.barrelHeight / 2, 0)
	rotating.add(barrel)

	// ── Mousqueton : boucle dans un plan vertical, tournée de `yaw` autour de l'axe de l'émerillon
	const mousqueton = new THREE.Group()
	mousqueton.position.set(0, layout.loopBottomY, 0)
	mousqueton.rotation.y = p.yaw
	rotating.add(mousqueton)

	// La goutte est centrée sur l'axe : on décale son repère plan pour que x_plan = 0 soit l'axe
	// (le contour est déjà symétrique autour de x = 0, avec la gâchette du côté +u)

	// corps : arc du haut, dos, arc du bas, jusqu'au bec (bout plat à la charnière et au bec)
	mousqueton.add(
		new THREE.Mesh(
			createFrameGeometry(PEAR.body, bodyWidthAt, BODY_DEPTH, 0, SEAM_GAP / 2),
			material
		)
	)

	// gâchette : barre droite avant, du bec à la charnière. Un joint fin la sépare du bec (boucle fermée) ;
	// en haut elle pénètre dans le corps, où passe le rivet de charnière.
	mousqueton.add(
		new THREE.Mesh(
			createFrameGeometry(PEAR.gate, () => GATE_WIDTH, GATE_DEPTH, SEAM_GAP / 2, -0.012),
			material
		)
	)

	// rivet de charnière : traverse le col, ses têtes dépassent de chaque côté
	const hinge = PEAR.hinge
	const rivetLength = BODY_DEPTH + 0.004
	const rivet = new THREE.Mesh(
		new THREE.CylinderGeometry(0.005, 0.005, rivetLength, 16),
		material
	)
	rivet.rotation.z = Math.PI / 2 // axe le long de x (perpendiculaire à la boucle)
	rivet.position.set(0, hinge.y, hinge.x)
	mousqueton.add(rivet)
	for (const side of [-1, 1]) {
		const head = new THREE.Mesh(
			new THREE.SphereGeometry(0.0062, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
			material
		)
		head.rotation.z = -side * (Math.PI / 2)
		head.position.set(side * (rivetLength / 2 - 0.0002), hinge.y, hinge.x)
		mousqueton.add(head)
	}

	// poussoir de gâchette : plaque arrondie striée, collée sur l'extérieur de la gâchette, dans son tiers haut.
	// Elle est inclinée comme la gâchette.
	const gateAngle = Math.atan2(PEAR.gateDirection.x, PEAR.gateDirection.y) // écart à la verticale, dans le plan
	const thumbAlong = 0.3 // fraction de la gâchette depuis la charnière
	const thumbCenter = PEAR.hinge.clone().lerp(PEAR.nose, thumbAlong)
	const outward = new THREE.Vector2(PEAR.gateDirection.y, -PEAR.gateDirection.x) // vers l'extérieur (côté +u)
	const thumbOffset = GATE_WIDTH / 2 + 0.006
	const thumb = new THREE.Group()
	thumb.position.set(
		0,
		thumbCenter.y + outward.y * thumbOffset,
		thumbCenter.x + outward.x * thumbOffset
	)
	thumb.rotation.x = gateAngle // rotation dans le plan (y, z)
	const plate = new THREE.Mesh(
		createRoundedPlateGeometry(0.019, 0.04, 0.008, 0.022, 0.0028),
		material
	)
	thumb.add(plate)
	for (let k = -2; k <= 2; k++) {
		const rib = new THREE.Mesh(
			createRoundedPlateGeometry(0.0125, 0.0034, 0.0016, 0.0195, 0.0009),
			material
		)
		rib.position.set(0, k * 0.0072, 0.0044)
		thumb.add(rib)
	}
	mousqueton.add(thumb)

	// ── Partie fixe (repère centré sur le point d'attache)
	const fromAttach = (y: number) => y - layout.attachY

	const flange = new THREE.Mesh(createFlangeGeometry(), material)
	flange.position.set(0, fromAttach(layout.flangeY), 0)
	fixed.add(flange)

	const stemBottom = layout.barrelTopY - 0.012
	const stemTop = layout.capBodyY0 + 0.008
	const stem = new THREE.Mesh(
		new THREE.CylinderGeometry(0.008, 0.008, stemTop - stemBottom, 16),
		material
	)
	stem.position.set(0, fromAttach((stemBottom + stemTop) / 2), 0)
	fixed.add(stem)

	const cap = new THREE.Mesh(createCapGeometry(strapWidth), material)
	cap.position.set(0, fromAttach(layout.capBodyY0), 0)
	fixed.add(cap)

	const boss = new THREE.Mesh(createBossGeometry(), material)
	boss.position.set(0, fromAttach(layout.capBodyY0 + 0.001), 0)
	fixed.add(boss)

	// deux rivets de sertissage sur chaque face de l'embout
	const capW = strapWidth + 0.028
	for (const side of [-1, 1]) {
		for (const sx of [-1, 1]) {
			const dome = new THREE.Mesh(
				new THREE.SphereGeometry(0.0055, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
				material
			)
			dome.rotation.x = side * (Math.PI / 2)
			dome.position.set(
				sx * (capW / 2 - 0.019),
				fromAttach(layout.capBodyY0 + 0.046),
				side * (CAP_THICKNESS / 2 - 0.001)
			)
			fixed.add(dome)
		}
	}

	return { rotating, fixed }
}
