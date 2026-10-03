import type { BadgeData } from "@/types/badge"
import { withAlpha } from "@/utils/theme/readThemeColor"

export const BADGE_TEXTURE_WIDTH = 1024
export const BADGE_TEXTURE_HEIGHT = 1434

const BARCODE_BARS = [
	3, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 2, 2, 1, 1, 3, 2, 1, 2, 1, 3, 1, 2, 1, 3, 2, 1, 1, 2,
	3, 1, 2, 1, 2, 3,
]
const MARGIN = 56
const CONTENT_WIDTH = BADGE_TEXTURE_WIDTH - MARGIN * 2

function roundRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number
) {
	ctx.beginPath()
	ctx.moveTo(x + r, y)
	ctx.arcTo(x + w, y, x + w, y + h, r)
	ctx.arcTo(x + w, y + h, x, y + h, r)
	ctx.arcTo(x, y + h, x, y, r)
	ctx.arcTo(x, y, x + w, y, r)
	ctx.closePath()
}

function clearCanvas(ctx: CanvasRenderingContext2D) {
	ctx.clearRect(0, 0, BADGE_TEXTURE_WIDTH, BADGE_TEXTURE_HEIGHT)
}

// Espacement des lettres pour les libellés en petites capitales (pastille de tagline, etc.).
// Propriété standard du Canvas Text API ; les moteurs qui ne l'implémentent pas encore l'ignorent
// simplement (aucune erreur), le texte reste juste à l'espacement normal.
function setLetterSpacing(ctx: CanvasRenderingContext2D, px: number) {
	ctx.letterSpacing = `${px}px`
}

/**
 * Choisit la plus grande taille de police (multiple de 2, entre `minSize` et `maxSize`) telle que
 * `text` tienne dans `maxWidth`. Utilisé pour le nom : il doit rester le point focal de la carte
 * quelle que soit sa longueur, sans jamais déborder ni se faire écraser par un `maxWidth` de secours.
 */
function fitFontSize(
	ctx: CanvasRenderingContext2D,
	text: string,
	maxWidth: number,
	maxSize: number,
	minSize: number,
	weight: number,
	family: string
): number {
	let size = maxSize
	while (size > minSize) {
		ctx.font = `${weight} ${size}px "${family}", system-ui, sans-serif`
		if (ctx.measureText(text).width <= maxWidth) break
		size -= 2
	}
	return size
}

interface BlurZone {
	x: number
	y: number
	w: number
	h: number
}

// Le flou gaussien détruit de toute façon les hautes fréquences : on le calcule à 1/4 de la
// résolution puis on le remonte, pour un résultat visuellement identique avec ~16× moins de pixels.
const BLUR_DOWNSCALE = 4

/**
 * Fond flouté, à bords totalement fondus (aucune forme géométrique visible), derrière chaque zone
 * de texte du recto — pour que le texte reste lisible sur la trame sans jamais avoir l'air d'un
 * bandeau plaqué. Trois calques, tous en basse résolution :
 * 1. une copie du fond déjà dessiné (fond + trame), floutée par le filtre Canvas natif ;
 * 2. un masque (un rectangle plein par zone, lui-même reflouté à un rayon généreux) qui ne laisse
 *    passer ce flou que là où c'est utile — un rectangle net reflouté devient un halo à bords
 *    totalement fondus, sans avoir à calculer de forme particulière ;
 * 3. la combinaison des deux, remontée à la taille de `ctx`.
 */
function drawReadabilityBlur(ctx: CanvasRenderingContext2D, zones: BlurZone[]) {
	if (typeof document === "undefined" || zones.length === 0) return
	const width = ctx.canvas.width
	const height = ctx.canvas.height
	if (width === 0 || height === 0) return

	// `k` convertit les unités logiques en pixels du calque réduit
	const lowW = Math.max(1, Math.round(width / BLUR_DOWNSCALE))
	const lowH = Math.max(1, Math.round(height / BLUR_DOWNSCALE))
	const k = lowW / BADGE_TEXTURE_WIDTH

	const makeLayer = () => {
		const canvas = document.createElement("canvas")
		canvas.width = lowW
		canvas.height = lowH
		return { canvas, ctx: canvas.getContext("2d") }
	}
	const blurred = makeLayer()
	const maskSharp = makeLayer()
	const mask = makeLayer()
	if (!blurred.ctx || !maskSharp.ctx || !mask.ctx) return

	// Copie réduite du fond (fond + trame), floutée : très discret, juste assez pour casser le
	// contraste de la trame sous le texte, sans jamais toucher au texte lui-même
	blurred.ctx.imageSmoothingQuality = "high"
	blurred.ctx.filter = `blur(${6 * k}px)`
	blurred.ctx.drawImage(ctx.canvas, 0, 0, lowW, lowH)
	blurred.ctx.filter = "none"

	// Masque : un rectangle plein par zone, reflouté largement (bords totalement fondus)
	maskSharp.ctx.fillStyle = "#fff"
	for (const zone of zones) {
		const zw = zone.w * k
		const zh = zone.h * k
		roundRect(maskSharp.ctx, zone.x * k, zone.y * k, zw, zh, Math.min(zw, zh) * 0.3)
		maskSharp.ctx.fill()
	}
	mask.ctx.filter = `blur(${32 * k}px)`
	mask.ctx.drawImage(maskSharp.canvas, 0, 0)
	mask.ctx.filter = "none"

	blurred.ctx.globalCompositeOperation = "destination-in"
	blurred.ctx.drawImage(mask.canvas, 0, 0)

	ctx.imageSmoothingQuality = "high"
	ctx.drawImage(blurred.canvas, 0, 0, BADGE_TEXTURE_WIDTH, BADGE_TEXTURE_HEIGHT)
}

/**
 * Pastille pleine à côté du mot-symbole (repère visuel minimal, sans monogramme) : utilisée au
 * recto et au verso pour une cohérence de marque sur les deux faces.
 */
function drawBrandMark(
	ctx: CanvasRenderingContext2D,
	data: BadgeData,
	size: number,
	x: number,
	centerY: number
) {
	ctx.fillStyle = data.colors.nameColor
	roundRect(ctx, x, centerY - size / 2, size, size, size * 0.24)
	ctx.fill()
}

// Le SVG est rastérisé une seule fois, à sa taille réelle à l'écran, puis blitté en bitmap :
// redessiner un SVG ~100 fois (avec rotation) le re-rastérise à chaque appel.
let rasterizedLogo: {
	source: HTMLImageElement
	pixels: number
	canvas: HTMLCanvasElement
} | null = null

function getRasterizedLogo(source: HTMLImageElement, logicalSize: number, scale: number) {
	const pixels = Math.max(1, Math.round(logicalSize * scale))
	if (rasterizedLogo?.source === source && rasterizedLogo.pixels === pixels) {
		return rasterizedLogo.canvas
	}
	const canvas = document.createElement("canvas")
	canvas.width = pixels
	canvas.height = pixels
	const logoCtx = canvas.getContext("2d")
	if (logoCtx) {
		logoCtx.imageSmoothingQuality = "high"
		logoCtx.drawImage(source, 0, 0, pixels, pixels)
	}
	rasterizedLogo = { source, pixels, canvas }
	return canvas
}

/**
 * Trame de fond du recto : le logo (`logoImage`, ex. /logos/R-white.svg) répété en grille façon
 * "brique" (une ligne sur deux décalée d'un demi-pas, pour casser l'effet de grille trop régulier),
 * légèrement pivoté, puis recoloré par un dégradé diagonal (bas-gauche → centre → haut-droite),
 * comme un reflet qui balaie la trame. `source-in` remplace la couleur de chaque pixel de logo par
 * celle du dégradé à cet endroit (pas seulement son alpha) : loin du centre, un léger voile
 * (MIN_ALPHA) reste toujours visible — jamais un noir qui se fond totalement dans la carte ; au
 * centre, ça monte à PEAK_ALPHA — un blanc retenu, jamais un blanc qui claque.
 * Dessinée sur un calque à part, à la résolution physique réelle de `ctx` (déduite de son ratio à
 * BADGE_TEXTURE_WIDTH), pour rester aussi nette que le reste.
 */
function drawBrandPattern(
	ctx: CanvasRenderingContext2D,
	data: BadgeData,
	logoImage: HTMLImageElement
) {
	if (typeof document === "undefined") return
	const layer = document.createElement("canvas")
	layer.width = ctx.canvas.width
	layer.height = ctx.canvas.height
	const layerCtx = layer.getContext("2d")
	if (!layerCtx || layer.width === 0 || layer.height === 0) return

	const scale = layer.width / BADGE_TEXTURE_WIDTH
	layerCtx.scale(scale, scale)
	layerCtx.imageSmoothingQuality = "high"

	const TILE = 210
	const LOGO_SIZE = 156
	const ROTATION = (-18 * Math.PI) / 180
	const pad = TILE * 2 // fixe la phase de la grille (ne pas modifier sans raison)
	const reach = LOGO_SIZE * 0.72 // rayon d'un logo tourné
	const logo = getRasterizedLogo(logoImage, LOGO_SIZE, scale)

	let rowIndex = 0
	for (let row = -pad; row < BADGE_TEXTURE_HEIGHT + pad; row += TILE, rowIndex++) {
		const offsetX = rowIndex % 2 === 0 ? 0 : TILE / 2
		for (let col = -pad; col < BADGE_TEXTURE_WIDTH + pad; col += TILE) {
			const x = col + offsetX
			// Entièrement hors de la carte : inutile de le dessiner
			if (
				x < -reach ||
				x > BADGE_TEXTURE_WIDTH + reach ||
				row < -reach ||
				row > BADGE_TEXTURE_HEIGHT + reach
			) {
				continue
			}
			layerCtx.save()
			layerCtx.translate(x, row)
			layerCtx.rotate(ROTATION)
			layerCtx.drawImage(logo, -LOGO_SIZE / 2, -LOGO_SIZE / 2, LOGO_SIZE, LOGO_SIZE)
			layerCtx.restore()
		}
	}

	// source-in : remplace la couleur (et l'alpha) de chaque pixel de logo par celle du dégradé —
	// diagonale bas-gauche → haut-droite, mais moins pentue qu'un vrai coin-à-coin (DIAGONAL_ANGLE) :
	// la ligne du dégradé passe par le centre de la carte à cet angle plutôt que par les deux coins
	// exacts. Une seule bosse lisse (gaussienne) posée sur un plancher constant (MIN_ALPHA), générée
	// point par point plutôt que des arrêts choisis à la main : chaque arrêt est à peine différent du
	// précédent, donc aucun logo ne peut voir de saut brutal : juste un voile → un pic → le même voile.
	layerCtx.globalCompositeOperation = "source-in"
	const DIAGONAL_ANGLE = (40 * Math.PI) / 180 // inclinaison depuis l'horizontale (un vrai coin-à-coin ferait ~54°)
	const diagonalHalfLength = (BADGE_TEXTURE_WIDTH + BADGE_TEXTURE_HEIGHT) / 2
	const centerX = BADGE_TEXTURE_WIDTH / 2
	const centerY = BADGE_TEXTURE_HEIGHT / 2
	const dx = Math.cos(DIAGONAL_ANGLE) * diagonalHalfLength
	const dy = Math.sin(DIAGONAL_ANGLE) * diagonalHalfLength
	const gradient = layerCtx.createLinearGradient(
		centerX - dx,
		centerY + dy,
		centerX + dx,
		centerY - dy
	)
	const PEAK_ALPHA = 0.35 // intensité au centre : un reflet retenu, jamais un blanc qui claque
	const MIN_ALPHA = 0.05 // plancher partout ailleurs : jamais de noir opaque, toujours un léger voile
	const BAND_WIDTH = 0.06 // écart-type de la bosse (fraction 0–1 de la diagonale) : plus petit = bande plus fine
	const GRADIENT_STOPS = 44
	for (let i = 0; i <= GRADIENT_STOPS; i++) {
		const t = i / GRADIENT_STOPS
		const bump = Math.exp(-((t - 0.5) ** 2) / (2 * BAND_WIDTH ** 2))
		const intensity = MIN_ALPHA + (PEAK_ALPHA - MIN_ALPHA) * bump
		gradient.addColorStop(t, withAlpha(data.colors.nameColor, intensity))
	}
	layerCtx.fillStyle = gradient
	layerCtx.fillRect(0, 0, BADGE_TEXTURE_WIDTH, BADGE_TEXTURE_HEIGHT)

	ctx.drawImage(layer, 0, 0, BADGE_TEXTURE_WIDTH, BADGE_TEXTURE_HEIGHT)
}

function drawHeader(ctx: CanvasRenderingContext2D, data: BadgeData) {
	const markSize = 40
	const centerY = 62 + markSize / 2
	drawBrandMark(ctx, data, markSize, MARGIN, centerY)

	ctx.fillStyle = data.colors.nameColor
	ctx.font = '400 38px "VG5000", ui-monospace, monospace'
	ctx.textBaseline = "middle"
	ctx.textAlign = "left"
	ctx.fillText(data.company, MARGIN + markSize + 18, centerY + 1)

	ctx.fillStyle = data.colors.metaColor
	ctx.font = '400 24px "VG5000", ui-monospace, monospace'
	ctx.textAlign = "right"
	ctx.fillText(data.date.toUpperCase(), BADGE_TEXTURE_WIDTH - MARGIN, centerY - 14)
	ctx.fillText(data.location.toUpperCase(), BADGE_TEXTURE_WIDTH - MARGIN, centerY + 18)
}

function drawNameBlock(ctx: CanvasRenderingContext2D, data: BadgeData) {
	// Le nom reste le point focal de la carte, mais sans écraser le reste : il ne rétrécit que si
	// le texte est trop long pour tenir, jamais au-delà de maxSize même pour un prénom très court.
	ctx.textAlign = "left"
	ctx.textBaseline = "alphabetic"
	ctx.fillStyle = data.colors.nameColor
	const nameSize = fitFontSize(ctx, data.name, CONTENT_WIDTH, 150, 100, 400, "VG5000") // 400 = seul poids existant
	ctx.font = `400 ${nameSize}px "VG5000", ui-monospace, monospace`
	ctx.fillText(data.name, MARGIN, 850)

	ctx.fillStyle = data.colors.roleColor
	ctx.font = '400 36px "VG5000", ui-monospace, monospace'
	ctx.fillText(data.roleType.toUpperCase(), MARGIN, 918, CONTENT_WIDTH)

	if (data.tagline) {
		ctx.fillStyle = data.colors.accentColor
		ctx.font = '400 26px "VG5000", ui-monospace, monospace'
		setLetterSpacing(ctx, 2)
		ctx.fillText(data.tagline.toUpperCase(), MARGIN, 966, CONTENT_WIDTH)
		setLetterSpacing(ctx, 0)
	}
}

function drawVenueBlock(ctx: CanvasRenderingContext2D, data: BadgeData) {
	ctx.fillStyle = withAlpha(data.colors.nameColor, 0.08)
	ctx.fillRect(MARGIN, 1030, CONTENT_WIDTH, 2)

	ctx.fillStyle = data.colors.metaColor
	ctx.font = '400 28px "VG5000", ui-monospace, monospace'
	ctx.fillText(data.venue.toUpperCase(), MARGIN, 1082, CONTENT_WIDTH)
	ctx.globalAlpha = 0.65
	ctx.fillText(data.address.toUpperCase(), MARGIN, 1122, CONTENT_WIDTH)
	ctx.globalAlpha = 1
}

// Plus de bandeau opaque en bas : le site flotte directement sur le fond (et sur la trame, côté
// recto), pour que le motif couvre vraiment toute la carte jusqu'au bord bas, comme sur la
// référence. `footerBg` n'est donc plus utilisé ici.
function drawFooter(ctx: CanvasRenderingContext2D, data: BadgeData) {
	ctx.fillStyle = data.colors.footerText
	ctx.font = '400 34px "VG5000", ui-monospace, monospace'
	ctx.textAlign = "center"
	ctx.textBaseline = "middle"
	ctx.fillText(data.website, BADGE_TEXTURE_WIDTH / 2, BADGE_TEXTURE_HEIGHT - 61)
}

// Le fond remplit tout le rectangle : les coins arrondis sont gérés par la géométrie 3D
// (sinon les coins transparents du canvas apparaîtraient en noir sur les bords)
function fillBackground(ctx: CanvasRenderingContext2D, data: BadgeData) {
	clearCanvas(ctx)
	ctx.fillStyle = data.colors.cardBg
	ctx.fillRect(0, 0, BADGE_TEXTURE_WIDTH, BADGE_TEXTURE_HEIGHT)
}

export function drawBadgeFrontFace(
	ctx: CanvasRenderingContext2D,
	data: BadgeData,
	logoImage: HTMLImageElement | null
): void {
	fillBackground(ctx, data)
	if (logoImage) {
		drawBrandPattern(ctx, data, logoImage)
		drawReadabilityBlur(ctx, [
			{ x: 0, y: 44, w: BADGE_TEXTURE_WIDTH, h: 84 }, // en-tête
			{ x: 0, y: 700, w: BADGE_TEXTURE_WIDTH, h: 300 }, // nom / rôle / tagline
			{ x: 0, y: 1010, w: BADGE_TEXTURE_WIDTH, h: 145 }, // lieu / adresse
			{ x: 0, y: 1320, w: BADGE_TEXTURE_WIDTH, h: 90 }, // site (bas de carte)
		])
	}
	drawHeader(ctx, data)
	drawNameBlock(ctx, data)
	drawVenueBlock(ctx, data)
	drawFooter(ctx, data)
}

function drawBackHeader(ctx: CanvasRenderingContext2D, data: BadgeData) {
	ctx.fillStyle = data.colors.accentColor
	ctx.fillRect(0, 0, BADGE_TEXTURE_WIDTH, 16)

	const markSize = 38
	const centerY = 16 + 42 + markSize / 2
	drawBrandMark(ctx, data, markSize, MARGIN, centerY)

	ctx.fillStyle = data.colors.nameColor
	ctx.font = '400 40px "VG5000", ui-monospace, monospace'
	ctx.textAlign = "left"
	ctx.textBaseline = "middle"
	ctx.fillText(data.company, MARGIN + markSize + 18, centerY + 1)
	ctx.fillStyle = data.colors.roleColor
	ctx.font = '400 28px "VG5000", ui-monospace, monospace'
	ctx.textAlign = "right"
	ctx.fillText(`${data.eventCode} / BADGE`, BADGE_TEXTURE_WIDTH - MARGIN, centerY + 1)
}

function drawQrBlock(
	ctx: CanvasRenderingContext2D,
	data: BadgeData,
	qrImage: HTMLImageElement | null
) {
	const qrSize = 300
	const qrX = MARGIN
	const qrY = 176
	ctx.fillStyle = data.colors.nameColor
	roundRect(ctx, qrX - 18, qrY - 18, qrSize + 36, qrSize + 36, 20)
	ctx.fill()
	if (qrImage) {
		ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)
	}

	const textX = qrX + qrSize + 52
	const textWidth = BADGE_TEXTURE_WIDTH - textX - MARGIN

	// Les trois valeurs partagent la même taille : la plus grande qui fait tenir la plus longue
	const linkedinText = "linkedin.com/in/remy-canal"
	const values = [linkedinText, data.email, data.website].filter(
		(value): value is string => Boolean(value)
	)
	const valueSize = Math.min(
		...values.map((value) => fitFontSize(ctx, value, textWidth, 32, 20, 400, "VG5000"))
	)
	const valueFont = `400 ${valueSize}px "VG5000", ui-monospace, monospace`

	ctx.textAlign = "left"
	ctx.fillStyle = data.colors.metaColor
	ctx.font = '400 28px "VG5000", ui-monospace, monospace'
	ctx.fillText("SCAN TO SAY HI", textX, qrY + 34)
	ctx.fillStyle = data.colors.accentColor
	ctx.font = valueFont
	ctx.fillText(linkedinText, textX, qrY + 80, textWidth)

	if (data.email) {
		ctx.fillStyle = data.colors.metaColor
		ctx.font = '400 26px "VG5000", ui-monospace, monospace'
		ctx.fillText("EMAIL", textX, qrY + 150)
		ctx.fillStyle = data.colors.roleColor
		ctx.font = valueFont
		ctx.fillText(data.email, textX, qrY + 192, textWidth)
	}

	if (data.website) {
		ctx.fillStyle = data.colors.metaColor
		ctx.font = '400 26px "VG5000", ui-monospace, monospace'
		ctx.fillText("PORTFOLIO", textX, qrY + 256)
		ctx.fillStyle = data.colors.roleColor
		ctx.font = valueFont
		ctx.fillText(data.website, textX, qrY + 298, textWidth)
	}
}

function drawAddressBlock(ctx: CanvasRenderingContext2D, data: BadgeData) {
	const y = 636
	ctx.fillStyle = withAlpha(data.colors.nameColor, 0.08)
	ctx.fillRect(MARGIN, y, CONTENT_WIDTH, 2)
	ctx.fillStyle = data.colors.metaColor
	ctx.font = '400 28px "VG5000", ui-monospace, monospace'
	ctx.textAlign = "left"
	ctx.fillText("DETAILS", MARGIN, y + 50) // pas une vraie adresse postale : libellé plus juste
	ctx.fillStyle = data.colors.roleColor
	ctx.font = '400 32px "VG5000", ui-monospace, monospace'
	ctx.fillText(data.venue, MARGIN, y + 104, CONTENT_WIDTH)
	ctx.globalAlpha = 0.72
	ctx.fillText(data.address, MARGIN, y + 148, CONTENT_WIDTH)
	ctx.globalAlpha = 1
	ctx.fillText(data.location, MARGIN, y + 192, CONTENT_WIDTH)
}

function drawBarcode(ctx: CanvasRenderingContext2D, data: BadgeData) {
	// Vraiment en bas de la carte (juste au-dessus du site en footer), comme un vrai talon de badge —
	// pas au milieu d'un grand vide.
	const y = 1190
	const barHeight = 90
	let x = MARGIN
	const scale = CONTENT_WIDTH / BARCODE_BARS.reduce((sum, w) => sum + w * 3.5, 0)
	ctx.fillStyle = data.colors.accentColor
	BARCODE_BARS.forEach((w, i) => {
		const barWidth = w * 3.5 * scale
		if (i % 2 === 0) ctx.fillRect(x, y, barWidth, barHeight)
		x += barWidth
	})
	const scanned = `*${data.barcodeCode}*`
	ctx.fillStyle = data.colors.metaColor
	ctx.globalAlpha = 0.55
	ctx.font = '400 24px "VG5000", ui-monospace, monospace'
	ctx.textAlign = "left"
	ctx.fillText(scanned, MARGIN, y + barHeight + 38)
	ctx.globalAlpha = 1
}

export function drawBadgeBackFace(
	ctx: CanvasRenderingContext2D,
	data: BadgeData,
	qrImage: HTMLImageElement | null
): void {
	fillBackground(ctx, data)
	drawBackHeader(ctx, data)
	drawQrBlock(ctx, data, qrImage)
	drawAddressBlock(ctx, data)
	drawBarcode(ctx, data)
	drawFooter(ctx, data)
}

// ─── Sangle ──────────────────────────────────────────────────────────────────
// Les textures de sangle sont périodiques en X (le long du ruban) : 2048 et 448 sont divisibles
// par le pas du tissage (8 px), donc aucune couture visible quand la texture se répète.
// Tout est dessiné en unités logiques STRAP_TEXTURE_WIDTH × STRAP_TEXTURE_HEIGHT : la résolution
// réelle du canvas est choisie par l'appelant (via ctx.scale).
export const STRAP_TEXTURE_WIDTH = 2048
export const STRAP_TEXTURE_HEIGHT = 448

const WEAVE_STEP = 8
const STRAP_BORDER_Y = 22
const STRAP_BORDER_THICKNESS = 10

function drawTwill(
	ctx: CanvasRenderingContext2D,
	width: number,
	height: number,
	color: string,
	lineWidth: number
) {
	ctx.strokeStyle = color
	ctx.lineWidth = lineWidth
	ctx.beginPath()
	for (let x = -height; x < width + height; x += WEAVE_STEP) {
		ctx.moveTo(x, 0)
		ctx.lineTo(x + height, height)
	}
	ctx.stroke()
}

/**
 * Couleur de la sangle : tissu sergé (twill) sombre, lisières tissées plus claires
 * et impression répétée (marque + pastille) lisible dans le sens de la longueur.
 * `baseColor` et `inkColor` sont les mêmes valeurs que `data.colors.cardBg` / `nameColor` : la
 * sangle et la carte partagent exactement le même noir et le même blanc.
 */
export function drawStrapTexture(
	ctx: CanvasRenderingContext2D,
	label: string,
	tag: string,
	baseColor: string,
	inkColor: string
): void {
	const width = STRAP_TEXTURE_WIDTH
	const height = STRAP_TEXTURE_HEIGHT
	ctx.clearRect(0, 0, width, height)

	// Base + fils de chaîne (horizontaux) + sergé diagonal
	ctx.fillStyle = baseColor
	ctx.fillRect(0, 0, width, height)
	ctx.fillStyle = withAlpha(inkColor, 0.035)
	for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 1)
	drawTwill(ctx, width, height, withAlpha(inkColor, 0.05), 2)
	drawTwill(ctx, width, height, withAlpha(baseColor, 0.25), 1)

	// Lisières tissées
	ctx.fillStyle = withAlpha(inkColor, 0.16)
	ctx.fillRect(0, STRAP_BORDER_Y, width, STRAP_BORDER_THICKNESS)
	ctx.fillRect(
		0,
		height - STRAP_BORDER_Y - STRAP_BORDER_THICKNESS,
		width,
		STRAP_BORDER_THICKNESS
	)
	ctx.fillStyle = withAlpha(inkColor, 0.07)
	ctx.fillRect(0, STRAP_BORDER_Y + STRAP_BORDER_THICKNESS + 6, width, 3)
	ctx.fillRect(0, height - STRAP_BORDER_Y - STRAP_BORDER_THICKNESS - 9, width, 3)

	// Impression : centrée à ~36 % du motif, dans la zone visible juste au-dessus du clip
	ctx.textBaseline = "middle"
	ctx.textAlign = "left"
	ctx.font = '400 150px "VG5000", ui-monospace, monospace'
	const labelWidth = ctx.measureText(label).width
	ctx.font = '400 94px "VG5000", ui-monospace, monospace'
	const tagTextWidth = ctx.measureText(tag).width
	const pillPadding = 46
	const pillWidth = tagTextWidth + pillPadding * 2
	const pillHeight = 142
	const gap = 70
	const startX = width * 0.36 - (labelWidth + gap + pillWidth) / 2
	const centerY = height / 2 + 4

	ctx.fillStyle = withAlpha(inkColor, 0.94)
	ctx.font = '400 150px "VG5000", ui-monospace, monospace'
	ctx.fillText(label, startX, centerY)

	const pillX = startX + labelWidth + gap
	ctx.strokeStyle = withAlpha(inkColor, 0.94)
	ctx.lineWidth = 8
	roundRect(ctx, pillX, centerY - pillHeight / 2, pillWidth, pillHeight, 22)
	ctx.stroke()
	ctx.font = '400 94px "VG5000", ui-monospace, monospace'
	ctx.textAlign = "center"
	ctx.fillText(tag, pillX + pillWidth / 2, centerY + 4)
}

/**
 * Relief du tissu (bump map, niveaux de gris : clair = en relief) : mêmes dimensions logiques et même
 * périodicité que la couleur, pour que les reflets de la lumière suivent le tissage. Volontairement
 * indépendant du thème (blanc/noir/lime) : ces valeurs codent un relief, pas une couleur de marque.
 */
export function drawStrapBumpTexture(ctx: CanvasRenderingContext2D): void {
	const width = STRAP_TEXTURE_WIDTH
	const height = STRAP_TEXTURE_HEIGHT
	ctx.fillStyle = "#808080"
	ctx.fillRect(0, 0, width, height)
	ctx.fillStyle = "rgba(255,255,255,0.18)"
	for (let y = 0; y < height; y += 4) ctx.fillRect(0, y, width, 2)
	drawTwill(ctx, width, height, "rgba(255,255,255,0.35)", 3)
	drawTwill(ctx, width, height, "rgba(0,0,0,0.3)", 2)
	ctx.fillStyle = "#b8b8b8"
	ctx.fillRect(0, STRAP_BORDER_Y, width, STRAP_BORDER_THICKNESS)
	ctx.fillRect(
		0,
		height - STRAP_BORDER_Y - STRAP_BORDER_THICKNESS,
		width,
		STRAP_BORDER_THICKNESS
	)
}
