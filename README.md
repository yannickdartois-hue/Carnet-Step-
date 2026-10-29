# Carnet step · CA5 · Seconde · Lycée Georges Pompidou

Deux applis hors ligne (PWA), sur le modèle du demi-fond et du tennis de table :

| Adresse | Pour qui | Rôle |
|---|---|---|
| https://yannickdartois-hue.github.io/Carnet-Step-/ | les élèves (tablettes) | carnet du binôme : séances S1 à S8, zones de FC, défis, envoi au prof |
| https://yannickdartois-hue.github.io/Carnet-Step-/prof/ | le professeur (iPad) | recevoir les séances, suivre la classe, préparer la note |
| https://yannickdartois-hue.github.io/Carnet-Step-/index-old.html | — | l’ancien carnet tout-en-un, gardé pour relire les anciennes données |

Démos pour un collègue (rien n’est enregistré, les vraies données ne sont pas touchées) : `…/Carnet-Step-/?demo` et `…/Carnet-Step-/prof/?demo`.

## Déroulé
1. **Avant le cycle** (outil prof → Classes) : importer la liste Pronote (xlsx, xls, csv ou liste collée). Une colonne « Sexe » remplit fille/garçon, une colonne « Né(e) le » donne l’âge : les deux servent à calculer la FC max. Coller le **lien de dépôt du Nuage** (« Demande de fichier »).
2. **Premier cours** : afficher le **QR de démarrage**. Chaque binôme le scanne, choisit son **code secret** (4 chiffres), puis ses noms dans la liste, fille ou garçon et âge.
3. **En séance, deux temps** : *Pendant la pratique*, le coach note l’essentiel (FC à l’oxymètre, réglages, arrêts) ; *Fin de séance · 5 min*, après le retour au calme, chacun remplit son bilan.
4. **Fin de séance** (onglet Envoyer) : *Envoyer en ligne* (un fichier par élève + copie de secours chiffrée, déposés sur le Nuage) ou *Montrer les QR codes* (un QR par binôme). Une séance non envoyée reste signalée.
5. **Outil prof → Recevoir** : scanner les QR à la suite, ou importer le dossier du Nuage (.zip). Puis Élèves, Défis, Note, Pilotage, Exporter.

## Cas particuliers
- **Un élève change de groupe** : Groupe → « … part » affiche son QR ; le nouveau groupe le scanne.
- **Code oublié** : « Code oublié ? » affiche un QR que le prof scanne (Recevoir) ; l’outil répond par un QR de déverrouillage.
- **Tablette perdue** : QR de reprise de l’élève (fiche élève) ou copie de secours du groupe (Recevoir) ; Groupe → « Reprendre un carnet ».
- **Ancien carnet** : les binômes de l’ancien carnet trouvés sur la tablette sont proposés à l’accueil de l’appli élève ; l’ancien mode prof s’importe dans l’outil prof (Recevoir). Les QR de l’ancien carnet sont acceptés.

## Note
- **AFL1 /12** = produire /8 calculé depuis la séance S8 (zone /3, continuité /2, sécurité /2 et plan /1 jugés par le coach) + **analyse /4** notée par le prof. En filière A, une mesure jusqu’à 5 pulsations sous la zone compte (la FC chute dès l’arrêt). FC max : 220 − âge (garçon) ou 226 − âge (fille), ou la FC max observée si elle est plus haute (plafonnée à théorique + 20).
- **AFL2 et AFL3** : suggestions (le prof décide), sur 8 points répartis selon le choix de l’élève en S4 (6/2, 4/4 ou 2/6). AFL2 : la moitié sur les réussites, le reste sur la préparation (échauffement, plan, régulation écrite). AFL3 : fiabilité du coach mesurée par le **contrôle prof** (le prof mesure lui-même la FC d’un ou deux élèves), justesse du pronostic, avis du pratiquant. ★ du prof : +0,5 à partir de deux.
- **Défis** (Juste Pouls, Pile dans la cible, badges, défis de coordination) : ils motivent, ils n’entrent pas dans la note. Badge Devin : au moins 6 annonces à ± 5 et au moins la moitié des annonces.

## Données (RGPD)
Les carnets sont **chiffrés** sur la tablette (AES-GCM, clé tirée du code du binôme) : un autre groupe ne peut ni les ouvrir ni les lire. La clé du carnet est aussi chiffrée pour la clé publique du prof (déverrouillage en cas de code oublié). Verrouillage automatique après 20 min sans activité, ou quand la tablette reste en veille plus de 2 min. Rien ne part sans l’action du binôme (QR ou dépôt). Le lien du Nuage n’est jamais affiché. Côté prof, tout reste sur l’appareil : **exporter une sauvegarde** après chaque import.

## Fichiers
Les fichiers de la nouvelle appli **sont** les sources : rien à fabriquer.

| Fichier | Rôle |
|---|---|
| `donnees.js`, `logique.js`, `scan.js`, `vues.js`, `chrono.js`, `demo-commun.js` | **communs** à l’appli élève et à l’outil prof : séances, zones de FC, réussites, défis, AFL1, format des QR « SPE », écrans de séance, chrono des filières, données de démo |
| `index.html`, `style.css`, `app.js`, `demo.js`, `aide.js` | appli élève : groupes, code secret, chiffrement, envoi, changement de groupe |
| `prof/` | outil prof : `prof.js` (onglets), `prof-demo.js`, `jszip.js` et `xlsx.js` (dossier du Nuage, fichiers Pronote) |
| `qrcode.js`, `jsqr.js` | bibliothèques QR (création, lecture caméra) |
| `sw.js` | hors ligne pour les trois pages : **augmenter le numéro** (`carnet-step-v10` → `v11`…) à chaque modification |
| `index-old.html`, `aide-old.js`, `ancien-carnet/` | l’ancien carnet et ses sources (`python3 ancien-carnet/build.py` refabrique `index-old.html`) |
| `tests/`, `.github/workflows/tests.yml` | tests lancés par GitHub à chaque dépôt (onglet *Actions*) : coche verte = tout fonctionne |

## Formats
- QR : `SPE1:` + JSON compressé (`a:'SPE'`). `t:'G'` séance d’un binôme · `t:'S'` séance d’un élève · `t:'T'` élève (changement de groupe, reprise) · `t:'C'` classe · `t:'K'` code oublié · `t:'U'` déverrouillage. Au-delà de 1 400 caractères, le QR défile en morceaux `SPEP|…`.
- Fichier : `2nde3_MARTINL_S3.json` → `{app:'step-eleves',version:1,activite:'Step',classe,eleve,sexe,age,seance,date,groupe,coach,resume,donnees}`.
- Copie de secours : `secours_….json` → `{app:'st-secours',…}` chiffrée pour la clé publique du prof (ECDH P-256).

## Versions
- v4 (29/10/2026) : nouvelle architecture (appli élève + outil prof, sur le modèle du demi-fond) : groupes protégés par un code, carnets chiffrés, envoi sur le Nuage, import Pronote avec âge, QR de démarrage, code oublié, reprise, copies de secours, appel, contrôle prof, onglets Défis, Note, Pilotage, Exporter. L’ancien carnet devient `index-old.html`.
- v3.2 (29/10/2026) : FC max observée, tolérance de mesure en filière A, essai bref et intense en S3.
- v3 (29/10/2026) : version démo, défis de coordination S2-S3, badge Chef d’orchestre.
- 25-26/10/2026 : charte v1 (thème clair imposé, couleur step, polices embarquées), cache hors ligne propre à l’appli.
- v1 (12/10/2026) : première version.
