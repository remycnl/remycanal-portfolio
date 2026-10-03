import * as THREE from "three"

export interface StrapRibbonOptions {
	/** Nombre de segments le long de la sangle (plus = plus lisse) */
	samples: number
	/** Largeur de la sangle (unités monde) */
	width: number
	/** Épaisseur de la sangle */
	thickness: number
	/** Longueur monde d'un motif de texture (la texture se répète le long de la sangle) */
	textureLength: number
	/** Longueur de repos de la sangle : sert à convertir le paramètre de courbe en distance pour les UV */
	restLength: number
	/** Coupe en biais du bout de la sangle : 0 = coupe droite, 0.3 = biais marqué (pente de la coupe) */
	endSlant?: number
	material: THREE.Material
}

export interface StrapRibbon {
	mesh: THREE.Mesh
	/**
	 * Reconstruit le ruban le long de la courbe.
	 * @param curve courbe du haut (ancre) vers le bas (clip)
	 * @param endAxis axe "largeur" du clip en monde : le ruban se tord progressivement pour s'y aligner
	 * @param widthScale 1 = largeur normale, <1 = sangle amincie quand elle est étirée
	 */
	update(
		curve: THREE.Curve<THREE.Vector3>,
		endAxis: THREE.Vector3,
		widthScale: number
	): void
}

const VERTS_PER_SAMPLE = 8 // front(2) + back(2) + tranche gauche(2) + tranche droite(2)
const CAP_VERTS = 4 // tranche de coupe au bout de la sangle

function smoothstep(edge0: number, edge1: number, x: number): number {
	const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1)
	return t * t * (3 - 2 * t)
}

/**
 * Ruban plat avec épaisseur : deux faces (texturées) + deux tranches, éclairé comme un vrai tissu.
 * Sa face regarde vers +Z (la caméra) et il se tord doucement pour suivre l'orientation du clip.
 */
export function createStrapRibbon(options: StrapRibbonOptions): StrapRibbon {
	const { samples, width, thickness, textureLength, restLength, material } = options
	const endSlant = options.endSlant ?? 0
	const capBase = (samples + 1) * VERTS_PER_SAMPLE
	const vertexCount = capBase + CAP_VERTS

	const positions = new Float32Array(vertexCount * 3)
	const normals = new Float32Array(vertexCount * 3)
	const uvs = new Float32Array(vertexCount * 2)
	const indices: number[] = []

	// index d'un sommet : échantillon i, bande s (0 front, 1 back, 2 gauche, 3 droite), côté k (0/1)
	const vi = (i: number, s: number, k: number) => i * VERTS_PER_SAMPLE + s * 2 + k

	for (let i = 0; i < samples; i++) {
		// Face avant (normale +N)
		indices.push(vi(i, 0, 1), vi(i + 1, 0, 1), vi(i, 0, 0))
		indices.push(vi(i, 0, 0), vi(i + 1, 0, 1), vi(i + 1, 0, 0))
		// Face arrière (normale -N)
		indices.push(vi(i, 1, 0), vi(i + 1, 1, 0), vi(i, 1, 1))
		indices.push(vi(i, 1, 1), vi(i + 1, 1, 0), vi(i + 1, 1, 1))
		// Tranche gauche (normale -B)
		indices.push(vi(i, 2, 1), vi(i + 1, 2, 1), vi(i, 2, 0))
		indices.push(vi(i, 2, 0), vi(i + 1, 2, 1), vi(i + 1, 2, 0))
		// Tranche droite (normale +B)
		indices.push(vi(i, 3, 0), vi(i + 1, 3, 0), vi(i, 3, 1))
		indices.push(vi(i, 3, 1), vi(i + 1, 3, 0), vi(i + 1, 3, 1))
	}

	// Tranche de coupe (bout de la sangle) : sommets propres pour avoir sa propre normale
	indices.push(capBase, capBase + 1, capBase + 2)
	indices.push(capBase, capBase + 2, capBase + 3)

	// UV : u le long de la sangle (le texte se lit du bas vers le haut), v en travers
	for (let i = 0; i <= samples; i++) {
		const t = i / samples
		const u = ((1 - t) * restLength) / textureLength
		const set = (s: number, k: number, v: number) => {
			const idx = vi(i, s, k) * 2
			uvs[idx] = u
			uvs[idx + 1] = v
		}
		set(0, 0, 0)
		set(0, 1, 1)
		set(1, 0, 1) // dos : v inversé pour que l'impression ne soit pas en miroir
		set(1, 1, 0)
		set(2, 0, 0.99)
		set(2, 1, 0.99)
		set(3, 0, 0.01)
		set(3, 1, 0.01)
	}

	for (let k = 0; k < CAP_VERTS; k++) {
		uvs[(capBase + k) * 2] = 0
		uvs[(capBase + k) * 2 + 1] = k < 2 ? k : 3 - k
	}

	const geometry = new THREE.BufferGeometry()
	const positionAttr = new THREE.BufferAttribute(positions, 3)
	const normalAttr = new THREE.BufferAttribute(normals, 3)
	positionAttr.setUsage(THREE.DynamicDrawUsage)
	normalAttr.setUsage(THREE.DynamicDrawUsage)
	geometry.setAttribute("position", positionAttr)
	geometry.setAttribute("normal", normalAttr)
	geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2))
	geometry.setIndex(indices)

	const mesh = new THREE.Mesh(geometry, material)
	mesh.frustumCulled = false

	// Vecteurs de travail réutilisés à chaque frame (aucune allocation dans update)
	const P = new THREE.Vector3()
	const T = new THREE.Vector3()
	const B = new THREE.Vector3()
	const N = new THREE.Vector3()
	const endB = new THREE.Vector3()
	const Z = new THREE.Vector3(0, 0, 1)
	const tmp = new THREE.Vector3()
	const capNormal = new THREE.Vector3()
	const negN = new THREE.Vector3()
	const nLeft = new THREE.Vector3()

	function writeVertex(idx: number, p: THREE.Vector3, n: THREE.Vector3) {
		positions[idx * 3] = p.x
		positions[idx * 3 + 1] = p.y
		positions[idx * 3 + 2] = p.z
		normals[idx * 3] = n.x
		normals[idx * 3 + 1] = n.y
		normals[idx * 3 + 2] = n.z
	}

	function update(
		curve: THREE.Curve<THREE.Vector3>,
		endAxis: THREE.Vector3,
		widthScale: number
	) {
		const hw = (width * widthScale) / 2
		const ht = thickness / 2

		for (let i = 0; i <= samples; i++) {
			const t = i / samples
			curve.getPoint(t, P)
			curve.getTangent(t, T)

			// Largeur "au repos" : perpendiculaire à la tangente, face tournée vers +Z
			B.crossVectors(Z, T)
			if (B.lengthSq() < 1e-6) B.set(1, 0, 0)
			B.normalize()

			// Vers le clip, la largeur s'aligne progressivement sur l'axe du clip (torsion naturelle)
			endB.copy(endAxis).addScaledVector(T, -endAxis.dot(T))
			if (endB.lengthSq() > 1e-6) {
				endB.normalize()
				if (endB.dot(B) < 0) endB.negate() // le ruban est identique des deux côtés : on prend le chemin court
				B.lerp(endB, smoothstep(0.55, 1, t))
				B.addScaledVector(T, -B.dot(T)).normalize()
			}

			N.crossVectors(T, B).normalize()
			negN.copy(N).negate()
			nLeft.copy(B).negate()

			// Coupe en biais : au dernier échantillon, seul le côté +B avance le long de T
			// (jamais de recul : cela retournerait le dernier segment)
			const slantRight = i === samples ? endSlant * hw * 2 : 0
			const slantLeft = 0

			// Face avant
			tmp
				.copy(P)
				.addScaledVector(N, ht)
				.addScaledVector(B, hw)
				.addScaledVector(T, slantRight)
			writeVertex(vi(i, 0, 0), tmp, N)
			tmp
				.copy(P)
				.addScaledVector(N, ht)
				.addScaledVector(B, -hw)
				.addScaledVector(T, slantLeft)
			writeVertex(vi(i, 0, 1), tmp, N)

			// Face arrière
			tmp
				.copy(P)
				.addScaledVector(N, -ht)
				.addScaledVector(B, hw)
				.addScaledVector(T, slantRight)
			writeVertex(vi(i, 1, 0), tmp, negN)
			tmp
				.copy(P)
				.addScaledVector(N, -ht)
				.addScaledVector(B, -hw)
				.addScaledVector(T, slantLeft)
			writeVertex(vi(i, 1, 1), tmp, negN)

			// Tranche gauche (côté -B)
			tmp
				.copy(P)
				.addScaledVector(B, -hw)
				.addScaledVector(N, ht)
				.addScaledVector(T, slantLeft)
			writeVertex(vi(i, 2, 0), tmp, nLeft)
			tmp
				.copy(P)
				.addScaledVector(B, -hw)
				.addScaledVector(N, -ht)
				.addScaledVector(T, slantLeft)
			writeVertex(vi(i, 2, 1), tmp, nLeft)

			// Tranche droite (côté +B)
			tmp
				.copy(P)
				.addScaledVector(B, hw)
				.addScaledVector(N, ht)
				.addScaledVector(T, slantRight)
			writeVertex(vi(i, 3, 0), tmp, B)
			tmp
				.copy(P)
				.addScaledVector(B, hw)
				.addScaledVector(N, -ht)
				.addScaledVector(T, slantRight)
			writeVertex(vi(i, 3, 1), tmp, B)

			if (i === samples) {
				// Tranche de coupe : normale = direction de la sangle, redressée par le biais
				capNormal.copy(T).addScaledVector(B, -endSlant).normalize()
				const copyPos = (dst: number, src: number) => {
					tmp.set(positions[src * 3]!, positions[src * 3 + 1]!, positions[src * 3 + 2]!)
					writeVertex(dst, tmp, capNormal)
				}
				copyPos(capBase, vi(i, 0, 0))
				copyPos(capBase + 1, vi(i, 0, 1))
				copyPos(capBase + 2, vi(i, 1, 1))
				copyPos(capBase + 3, vi(i, 1, 0))
			}
		}

		positionAttr.needsUpdate = true
		normalAttr.needsUpdate = true
	}

	return { mesh, update }
}
