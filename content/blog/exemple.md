---
title: Construire une interface qui sait se taire
description: Notes sur la retenue en design, la typographie comme structure et les médias qui respirent. Un article d'exemple qui montre tout ce que le rendu sait faire.
author: Ton Nom
date: 2026-11-18
image: /works/og_image.png
# video: /works/demo.mp4
tags:
  - Design
  - Typographie
  - Notes
---

Le premier paragraphe fait office d'introduction : il est affiché en plus grand que le reste du texte. Garde-le court, une ou deux phrases qui disent de quoi parle l'article et pourquoi il mérite d'être lu.

Le texte courant vient ensuite, en grand et sur toute la largeur. Les **mots appuyés** passent en couleur pleine, le _texte en italique_ reste discret, et on peut ~~barrer ce qui n'est plus vrai~~. Un [lien vers un autre site](https://example.com) est souligné, et il prend la couleur d'accent au survol. Le `code en ligne` utilise la police mono du site.

## Un titre de section

Chaque `h2` ouvre une vraie respiration : l'espace au-dessus est généreux, le titre est en Lineal Bold. C'est le niveau à utiliser pour découper un article en grandes parties.

### Un sous-titre

Le `h3` est plus petit et sert aux sous-parties. Il garde la même famille de police pour rester cohérent.

#### Un titre de quatrième niveau

Le `h4` est une petite étiquette en capitales, pour annoter une partie sans ouvrir un nouveau chapitre.

---

## Les colonnes

Deux blocs de texte côte à côte, toujours calés à gauche. Ils se superposent sur mobile.

::split
#first

### Le contexte

Le premier bloc accueille un court texte, une liste ou une image. Sa largeur reste limitée pour garder des lignes confortables.

#second

### La suite

Le second bloc se place à côté. Les deux blocs partagent la même grille que le reste de la page, donc ils s'alignent avec les titres et les images.
::

Avec `variant="aside"`, le premier bloc devient une étiquette étroite, et le texte principal reprend l'axe de lecture :

::split{variant="aside"}
#first

#### Note

Un bloc étroit.

#second
Le texte principal, aligné sur la même colonne que les paragraphes de la page. C'est utile pour annoter une section sans casser le rythme.
::

## Les images

Une image seule prend toute la largeur du contenu. Le texte entre guillemets après le lien devient la légende.

![Visuel de démonstration](/works/og_image.png "Une image pleine largeur avec sa légende")

Si tu connais les dimensions, indique-les. Le navigateur réserve alors la place avant le chargement, et la page ne saute pas.

![Visuel avec dimensions](/works/og_image.png "Largeur et hauteur renseignées dans le Markdown"){width="1200" height="630"}

## Les grilles

Deux images côte à côte, avec une gouttière identique à celle de la page :

::media-grid{cols="2"}
![Visuel 1](/works/og_image.png "Première image")

![Visuel 2](/works/og_image.png "Deuxième image")
::

Et trois colonnes, qui retombent sur une seule colonne en mobile :

::media-grid{cols="3"}
![Visuel 1](/works/og_image.png)

![Visuel 2](/works/og_image.png)

![Visuel 3](/works/og_image.png)
::

## Les vidéos

Une vidéo s'écrit comme une image. Elle est muette, tourne en boucle et ne joue que lorsqu'elle est visible à l'écran. Remplace `/works/demo.mp4` par ta propre vidéo.

![Démonstration](/works/demo.mp4 "Une vidéo qui boucle")

Avec des contrôles, elle ne démarre pas toute seule :

::media{src="/works/demo.mp4" caption="Vidéo avec contrôles" controls}
::

Les vidéos YouTube et Vimeo s'intègrent avec `embed`. Le titre est obligatoire : il décrit le cadre pour les lecteurs d'écran.

::embed{url="https://www.youtube.com/watch?v=aqz-KE-bpKQ" title="Big Buck Bunny" caption="Un embed YouTube, sans cookies"}
::

## Les listes

Une liste à puces utilise un filet court comme marqueur :

- Un premier point, court
- Un deuxième point, plus long, pour voir comment le texte revient à la ligne quand il dépasse la largeur de la colonne
- Un troisième point avec **du gras** et un [lien](https://example.com)
  - Un sous-point
  - Un autre sous-point

Une liste numérotée sert aux vraies séquences, comme des étapes :

1. Définir le besoin
2. Dessiner la structure
3. Choisir la typographie
4. Ajouter le mouvement, et seulement si ça sert

## Une citation

Une citation passe en très grand :

> La retenue n'est pas l'absence d'idées. C'est le choix de ne garder que celle qui compte.

## Le code

Un bloc de code occupe toute la largeur et défile horizontalement s'il est trop long.

```ts
export function formatPrice(value: number, locale = "fr-FR") {
	return new Intl.NumberFormat(locale, {
		style: "currency",
		currency: "EUR",
	}).format(value)
}
```

## Un tableau

| Élément      | Taille     | Usage                    |
| ------------ | ---------- | ------------------------ |
| Titre `h2`   | Très grand | Ouvrir une section       |
| Texte        | Grand      | Paragraphes, listes      |
| Légende, tag | Petit      | Informations secondaires |
| Code         | Petit      | Contenu technique        |

---

Un dernier paragraphe pour conclure. Le séparateur au-dessus est un simple filet qui marque la fin du contenu.
