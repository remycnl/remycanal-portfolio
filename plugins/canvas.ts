import { defineNuxtPlugin } from "#app";

// Fonction utilitaire pour limiter les valeurs dans une plage
const clamp = (value: number, min: number, max: number): number => {
    return Math.max(min, Math.min(max, value));
};

// Fonction pour appliquer l'effet granuleux
const applyGrainEffect = () => {
    const canvas = document.getElementById("canvas") as HTMLCanvasElement | null;
    const image = document.getElementById("image") as HTMLImageElement | null;
    let animationFrameId: number | null = null;

    const handleImageLoad = () => {
        if (canvas && image) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                // Ajuste la taille du canvas à la taille de l'image
                canvas.width = image.width;
                canvas.height = image.height;

                // Applique l'effet de bruit
                startAnimation(ctx);
            } else {
                console.error("Impossible d’obtenir le contexte 2D du canvas.");
            }
        } else {
            console.error("Le canvas ou l’image est null.");
        }
    };

    const startAnimation = (ctx: CanvasRenderingContext2D) => {
        const applyNoise = () => {
            if (canvas && image) {
                // Redessine l'image originale sur le canvas
                ctx.drawImage(image, 0, 0, image.width, image.height);

                // Récupère les données de l'image
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                if (imageData instanceof ImageData) {
                    const pixels = imageData.data;

                    // Augmente l'amplitude du bruit pour un effet plus granuleux
                    const noiseRange = 30; // Plage de bruit de -15 à 15 pour plus de granulosité

                    // Applique un bruit plus intense
                    for (let i = 0; i < pixels.length; i += 4) {
                        // Génère une valeur de bruit aléatoire plus intense
                        const noiseR = Math.random() * noiseRange - noiseRange / 2; // Valeur entre -15 et 15 pour le rouge
                        const noiseG = Math.random() * noiseRange - noiseRange / 2; // Valeur entre -15 et 15 pour le vert
                        const noiseB = Math.random() * noiseRange - noiseRange / 2; // Valeur entre -15 et 15 pour le bleu

                        // Applique le bruit aux canaux rouge, vert et bleu
                        pixels[i] = clamp(pixels[i] + noiseR, 0, 255); // Rouge
                        pixels[i + 1] = clamp(pixels[i + 1] + noiseG, 0, 255); // Vert
                        pixels[i + 2] = clamp(pixels[i + 2] + noiseB, 0, 255); // Bleu
                    }

                    // Mets à jour le canvas avec les nouveaux pixels
                    ctx.putImageData(imageData, 0, 0);
                } else {
                    console.error("Les données d’image ne sont pas valides.");
                }

                // Demande le prochain frame de l'animation à une fréquence plus élevée
                animationFrameId = requestAnimationFrame(applyNoise);
            }
        };

        applyNoise();
    };

    // Nettoyage
    const cleanUp = () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    };

    window.addEventListener("beforeunload", cleanUp);
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            cleanUp();
        }
    });

    // Attache l'événement de chargement de l'image
    if (image) {
        image.onload = handleImageLoad;
        // En cas de chargement déjà terminé
        if (image.complete) {
            handleImageLoad();
        }
    } else {
        console.error("L'image avec l'ID 'image' est introuvable.");
    }
};

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.provide("applyGrainEffect", applyGrainEffect);
});
