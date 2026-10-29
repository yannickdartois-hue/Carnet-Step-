/* aide.js — mode d'emploi de l'outil prof du carnet de step (lu par eps-aide.js) */
window.EPS_AIDE={appli:'Carnet step · Outil prof',bouton:false,pied:'Toutes les données restent sur cet appareil : pensez à la sauvegarde après chaque import.',publics:[
{id:'prof',titre:'Professeur',chapitres:[
{t:'Démarrer en 5 minutes',html:`<ol>
<li><b>Classes</b> : importez la liste Pronote (fichier xlsx/csv, ou liste collée « NOM Prénom »). Une colonne « Sexe » remplit fille/garçon, une colonne « Né(e) le » donne l’âge (FC max).</li>
<li>Collez le <b>lien de dépôt du Nuage</b> de la classe (« Demande de fichier – téléversement seulement »). Il n’est jamais montré aux élèves.</li>
<li>Au premier cours, touchez <span class="bouton">QR de démarrage</span> et affichez-le : chaque binôme le scanne dans l’appli élève.</li>
<li>Installez l’outil sur l’écran d’accueil de l’iPad (Safari → Partager → « Sur l’écran d’accueil ») et faites une <b>sauvegarde</b> après chaque import.</li></ol>`},
{t:'Les onglets : avant, pendant, après la séance',html:`<ul>
<li><b>Avant</b> — Classes : listes, lien du Nuage, QR de démarrage, archivage de fin d’année.</li>
<li><b>Pendant</b> — Appel (statut auto, corrigeable), Recevoir (scanner les QR, importer les fichiers), Chrono des filières (bips et voix sur enceinte).</li>
<li><b>Après</b> — Séance (la classe sur une séance, ★ et contrôle prof), Élèves (tableau du cycle, fiches), Défis, Note, Pilotage, Exporter.</li></ul>`},
{t:'Recevoir les séances',html:`<ul>
<li><b>QR</b> : <span class="bouton">Scanner les QR codes</span>, puis montrez les QR un par un (un par binôme). Un bip = séance rangée. Les QR de l’ancien carnet sont acceptés.</li>
<li><b>Fichiers</b> : téléchargez le dossier du Nuage en .zip et choisissez-le (ou glissez-le sur ordinateur). Réimporter ne crée pas de doublon.</li>
<li><b>Copies de secours</b> : elles arrivent avec l’envoi en ligne ; « Télécharger le carnet » permet à un binôme de reprendre son carnet sur une autre tablette.</li>
<li><b>Code oublié</b> : le QR « code oublié » d’une tablette se scanne ici ; l’outil affiche le QR de déverrouillage.</li>
<li><b>Ancien carnet</b> : l’ancien mode prof trouvé sur cet appareil s’importe en un geste (Recevoir).</li></ul>`},
{t:'Suivre les élèves',html:`<ul>
<li><b>Élèves</b> : chaque case = réussites / tentées (à partir de S4 : mesures dans la zone). Couleur <i>et</i> signe : ✓✓ ¾ et plus, ✓ ½, ! ¼, ✗ moins. Touchez une case pour le détail, un nom pour la fiche (courbes, QR de reprise, fusion de doublons).</li>
<li><b>Contrôle prof</b> (onglet Séance) : mesurez vous-même la FC d’un ou deux élèves à la 1re mesure. L’écart avec la FC notée par leur coach sert à l’AFL3 et signale les données douteuses.</li>
<li><b>Points d’attention</b> : rien reçu, zones non calculables (âge ou FC de repos manquant), filière non choisie, aucune mesure dans la zone, FC invraisemblable, effort 9-10 répété, coach muet.</li></ul>`},
{t:'Noter',html:`<ul>
<li><b>AFL1 /12</b> = produire /8, calculé depuis la séance S8 (zone /3, continuité /2, sécurité /2 et plan /1 jugés par le coach) + <b>analyse /4</b> que vous notez (« lire l’analyse »). En filière A, une mesure jusqu’à 5 pulsations sous la zone compte.</li>
<li><b>AFL2 et AFL3</b> : suggestions calculées (« ← » les reprend), sur 8 points répartis selon le choix de l’élève en S4 (6/2, 4/4, 2/6). ★ du prof : +0,5 à partir de deux.</li>
<li><b>Exporter</b> : CSV bilan et note, CSV séance par séance.</li></ul>`},
{t:'Montrer l’outil à un collègue',html:`<p>Lien de démonstration (classe fictive, rien n’est enregistré) : <b>…/Carnet-Step-/prof/?demo</b>. Appli élève : <b>…/Carnet-Step-/?demo</b>.</p>`}]}
]};
