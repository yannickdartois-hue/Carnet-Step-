# Carnet numérique de step · CA5 · Seconde

Application hors ligne (PWA) du lycée Georges Pompidou, Castelnau-le-Lez. Version **v1 · 12/10/2026**.
Une tablette par binôme : les élèves remplissent leur carnet à chaque séance, puis montrent un QR code que le professeur scanne. Même fonctionnement que le carnet de demi-fond.

## Contenu du dépôt
| Fichier | Rôle |
|---|---|
| `index.html` | toute l'application (élève + mode prof), bibliothèques QR incluses |
| `sw.js` | fonctionnement hors ligne (cache) |
| `manifest.webmanifest`, `icon-192.png`, `icon-512.png` | installation sur l'écran d'accueil |

## Installation
1. Créer un dépôt GitHub (ex. `carnet-step`), y déposer ces fichiers, puis *Settings → Pages → Deploy from a branch → main / (root)*.
2. Sur chaque tablette (Wi-Fi) : ouvrir l'adresse, puis **Ajouter à l'écran d'accueil**.
3. Sur l'iPad du professeur : idem (indispensable, sinon Safari efface les données au bout de 7 jours sans ouverture).

## Utilisation élève
- **Créer le binôme** à la 1re séance : classe, prénoms, noms, fille/garçon, **âge** (il sert au calcul de la FC max).
- **Mes repères du jour** en haut de chaque séance : FC de repos, FC max, FC de réserve, zone de la filière, ressenti visé, décision de la dernière fois.
- **S1** : FC de repos (provisoire en classe + 3 matins à la maison), bloc 1, premier effort mesuré deux fois sur le bloc 1.
- **S2 et S3** : bloc 2 et test des leviers, calcul des zones par l'élève puis « Vérifier mes calculs » ; bloc 3 et effort long de 12 min.
- **S4** : les 3 blocs enchaînés seul, curseurs version basse / haute, viser le milieu de sa zone, essai de filière, **choix argumenté de la filière** (un ressenti, un chiffre, un projet) et répartition AFL2 / AFL3.
- **S5 à S8** : échauffement coché par le coach, version personnelle des blocs (curseurs H B P A de 0 à 2), réglage 2 × 2 min, **séance de filière** (réglage de chaque série, FC lue, arrêts) : chaque FC est comparée tout de suite à la zone, avec la consigne « +1 curseur » ou « −1 curseur ».
- **Pronostic du coach** (FC prévue à la 1re mesure) et « le conseil m'a aidé » : rendent le rôle de coach évaluable (AFL3).
- **Bilan** : le coach a vu, réussite, conseil (idées tirées des mesures), effort ressenti 0-10, charge (UA), **décision pour la prochaine fois** (+1 / −1 curseur, garder).
- **S8** : note « produire » /8 calculée (zone /3, continuité /2, sécurité /2 et plan /1 jugés par le coach). L'analyse /4 est notée par le prof.
- **Mes zones** : âge, FC de repos (ou valeur donnée par le prof), zones A et B. **Ma progression** : FC d'effort et zone, écart à la zone, réussites par séance, charge.

## Défis (S3 à S7)
- **Juste Pouls** : avant chaque mesure, l'élève annonce sa FC ; à ± 5 = 3 pts, à ± 10 = 1 pt.
- **Pile dans la cible** (séances de filière S5 à S7) : milieu de la zone ± 3 = 3 pts, dans la zone = 2 pts, à 5 près = 1 pt.
- **Défis de coordination** (S2 : Le canon ; S3 : La ronde, L'annonce) : réussi / pas encore, sans points, cochés par le coach dans la séance.
- **Badges** : Mémoire, Endurant, Devin (au moins 6 annonces à ± 5 et au moins la moitié des annonces), Régleur, Coach, Chef d'orchestre (meneur devant sa rangée, 4 fois les 3 blocs sans erreur, S4 à S7), affichés sur la page du binôme et dans « Ma progression ».
- Score du binôme sur la page du binôme ; classement de la classe dans l'onglet *Défis* du mode prof (il n'entre pas dans la note). S8 : pas d'annonce ni de points.

## Version démo (pour présenter l'appli)
Ajouter `?demo` à l'adresse : https://yannickdartois-hue.github.io/Carnet-Step-/?demo (lien aussi en bas de l'accueil et dans *Prof → Données*). Classe fictive « 2nde Démo » : 4 binômes, S1 à S6 remplies, défis, badges, une absence avec coach remplaçant, une pratique adaptée. Bandeau DÉMO : *Côté élève*, *Côté prof*, *Réinitialiser*, *Quitter*. Les données de la démo sont rangées à part : les vraies données de la tablette ne sont jamais touchées.

## Utilisation professeur (bouton *Prof*, code **1275**)
- *Scanner* (caméra, photo ou texte collé) → *Classe* : filière, zone, réussites S1-S8, écart à la zone début → fin, « comme coach », produire /8 de la blanche (S7) et de l'évaluation (S8), analyse /4 à saisir, AFL1 /12, répartition, AFL2, AFL3, total /20.
- **Points d'attention** : QR manquants, zones non calculables (âge ou FC de repos manquant), filière non choisie, aucune mesure dans la zone sur 2 séances de filière, absences, coach qui n'écrit jamais « Ta réussite ».
- **Chrono** : les deux filières sur la même musique (A 4 × 4 min r 3 · B 2 × 10 min r 5, et formats S4, S5, S6), bips, 3-2-1, voix « Effort », « Récupération », « Mesure ».
- QR de restauration, rattrapage, étoiles AFL2 / AFL3, export CSV, sauvegarde JSON : comme dans le carnet de demi-fond.

## Données personnelles
Aucune donnée n'est envoyée sur Internet : tout reste dans le navigateur des tablettes et de l'appareil du professeur. Faire une **sauvegarde JSON** après chaque séance. En fin de cycle, effacer la classe des tablettes.

## Mise à jour
Remplacer les fichiers et **changer le numéro de version** dans `sw.js` (`carnet-step-v8` → `v9`…). Le service worker n'efface que ses propres caches : les autres applis du site gardent leur copie hors ligne.

## Versions
- v3 (29/10/2026) : version démo (`?demo`), comme le carnet de demi-fond.
- v2 (27/10/2026) : défis de coordination S2-S3, badge Chef d'orchestre, colonne « Défis coordination réussis » dans l'export CSV.
- 25-26/10/2026 : charte v1 (thème clair imposé, couleur step, polices embarquées), cache hors ligne propre à l'appli, ouverture depuis le cache si le réseau dépasse 3 s.
- v1 (12/10/2026) : première version.

## Modifier l'appli (sources)
Le dossier `src/` contient les sources ; `index.html` est **fabriqué** à partir d'elles. Ne pas modifier `index.html` à la main.
| Fichier | Rôle |
|---|---|
| `src/core.js` | séances, zones de FC, défis, badges, calculs, format des QR (commun élève + prof) |
| `src/ui.js` | écrans élève |
| `src/prof.js` | mode prof, export CSV, mode démo |
| `src/style.css`, `src/extra.css` | présentation (charte v1 comprise) |
| `src/page.html` | squelette de la page (en-tête, icônes, charte) |
| `src/keep.json` | morceaux repris du carnet de demi-fond (chiffrement QR, saisie, graphiques…) |
| `src/qrgen.js`, `src/jsqr.js` | bibliothèques QR (ne pas modifier) |
| `src/build.py` | assemble `index.html` |
| `src/tests/` | tests Playwright (`node src/tests/e2e.js`, `node src/tests/demo.js`) |

1. Modifier un fichier de `src/`.
2. `python3 src/build.py` (réécrit `index.html`).
3. Augmenter le numéro de cache dans `sw.js`.
4. Publier : GitHub lance les tests (onglet *Actions*). Coche verte = la version peut aller sur les tablettes ; croix rouge = ne pas l'installer.
