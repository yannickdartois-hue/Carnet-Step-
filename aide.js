/* aide.js — mode d'emploi du carnet élève de step (lu par eps-aide.js) */
window.EPS_AIDE={appli:'Carnet step · Élève',bouton:false,
pied:'Les carnets restent sur la tablette, chiffrés par le code de chaque binôme : ils partent seulement quand le binôme les envoie au professeur.',
publics:[
{id:'eleve',titre:'Élève',chapitres:[
{t:'Commencer (premier cours)',html:`<ol>
<li>Touche <span class="bouton">Scanner le QR de la classe</span> et vise le QR que le professeur affiche.</li>
<li>Choisis un <b>code secret à 4 chiffres</b> pour ton binôme et retiens-le : il sera demandé à chaque cours. Personne d’autre ne peut ouvrir votre carnet.</li>
<li>Dans <b>Groupe</b>, choisissez vos deux noms dans la liste, fille ou garçon et votre <b>âge</b> : ils servent à calculer la FC max et vos zones. Un 3e élève seulement si le professeur le demande (élève seul, partenaire blessé).</li>
</ol><p class="astuce">Aux cours suivants : touche le nom de ton binôme sur l’accueil, puis votre code.</p>`},
{t:'Pendant la pratique',html:`<ul>
<li>La séance du jour s’ouvre toute seule. Pour en changer : le bouton <span class="bouton">S4 ▾</span> en haut.</li>
<li>Touche le prénom de celui qui pratique. Le <b>coach</b> (l’autre élève) tient la tablette, mesure la FC à l’oxymètre et note : quelques secondes par mesure.</li>
<li><b>Mes repères du jour</b> : FC de repos, FC max, zone de ta filière, ressenti visé, ta décision de la dernière fois.</li>
<li>Chaque FC est comparée tout de suite à ta zone : la consigne s’affiche (« +1 curseur », « −1 curseur » ou garder).</li>
<li>Remplissez <b>une étape à la fois</b> : les numéros en haut montrent où vous en êtes (✓ = remplie). Glisse le doigt à gauche ou à droite pour changer d’étape.</li>
<li>Absent, blessé, pratique adaptée : touche <i>Absent, blessé, adapté ?</i> sous le titre de la séance. Coach absent : « Changer de coach ».</li>
<li><b>Défis</b> (S3 à S7) : annonce ta FC avant chaque mesure (Juste Pouls) et vise le milieu de ta zone (Pile dans la cible). Les points et les badges ne comptent pas dans la note.</li>
</ul>`},
{t:'Fin de séance : bilan et envoi (5 min)',html:`<ol>
<li>Après le retour au calme, touche <span class="bouton">Fin de séance · 5 min</span> : chacun remplit son bilan (ce que le coach a vu, réussite, conseil, effort ressenti, décision pour la prochaine fois).</li>
<li>Onglet <b>Envoyer</b> : <span class="bouton">Envoyer la séance en ligne</span> (fichiers déposés sur le Nuage du professeur) <b>ou</b> <span class="bouton">Montrer les QR codes</span> au professeur (un seul QR pour le binôme).</li>
</ol><p class="attention">Une séance pas encore envoyée est signalée par un <b>!</b> (bouton de séance, onglet Envoyer). Elle reste sur la tablette : envoyez-la au cours suivant.</p>`},
{t:'Moi : zones, progression, badges',html:`<ul>
<li><b>Mes zones</b> : FC max = 220 − âge (garçon) ou 226 − âge (fille). Si tu as déjà mesuré plus haut, c’est ta FC max observée qui compte.</li>
<li><b>Ma progression</b> : tes FC d’effort et ta zone, ton écart à la zone (il doit baisser), tes réussites, ta charge de séance, tes badges.</li>
</ul>`},
{t:'Changer de groupe, de tablette, code oublié',html:`<ul>
<li><b>Un élève change de groupe</b> : Groupe → « … part » affiche son QR ; le nouveau groupe le scanne (« Scanner le QR de l’élève »). Toutes ses séances le suivent.</li>
<li><b>Changer de tablette</b> : Groupe → « Enregistrer le carnet du groupe », puis « Reprendre un carnet » sur l’autre tablette.</li>
<li><b>Code oublié</b> : touche « Code oublié ? », montre le QR au professeur, scanne sa réponse et choisis un nouveau code.</li>
<li><b>Ancien carnet</b> : les binômes de l’ancienne appli trouvés sur la tablette sont proposés à l’accueil.</li>
<li>Le carnet se ferme seul après 20 min sans toucher l’écran, ou si la tablette reste en veille. Touche <span class="bouton">Fermer</span> en partant.</li>
</ul>`},
{t:'Chrono, lecture facilitée',html:`<ul><li>Onglet <b>Chrono</b> : le chrono des filières (A et B ensemble, bips, « Mesure » à chaque prise de FC).</li>
<li><b>Lecture facilitée</b> (case en haut de ce mode d’emploi) : la même police partout, avec des lettres et des lignes plus espacées, utile en cas de dyslexie. Le choix vaut pour toutes les applis EPS de la tablette.</li></ul>`}]},
{id:'prof',titre:'Professeur',chapitres:[
{t:'Mettre en place la classe',html:`<ol>
<li>Dans l’<b>outil prof</b> (adresse …/Carnet-Step-/prof/, onglet Classes) : importez la liste Pronote (avec « Sexe » et « Né(e) le », l’âge est rempli), collez le lien de dépôt du Nuage (« Demande de fichier »).</li>
<li>Au premier cours, affichez le <b>QR de démarrage</b> : chaque binôme le scanne sur sa tablette. Il apporte la liste, le lien (jamais affiché aux élèves) et votre clé de copie de secours.</li>
<li>Une tablette sert à plusieurs binômes et plusieurs classes : chaque carnet est chiffré par le code de son binôme.</li></ol>`},
{t:'Récupérer les séances',html:`<ul><li><b>QR</b> : en fin de cours, chaque binôme montre un seul QR ; outil prof → Recevoir → Scanner (la caméra reste ouverte). Les QR de l’ancien carnet sont acceptés.</li>
<li><b>En ligne</b> : les élèves déposent leurs fichiers sur le Nuage ; téléchargez le dossier (.zip) et importez-le dans l’outil prof. Une copie de secours chiffrée de chaque carnet arrive aussi.</li></ul>`},
{t:'Montrer l’appli à un collègue',html:`<p>Lien de démonstration (binôme fictif, rien n’est enregistré) : <b>…/Carnet-Step-/?demo</b>. Outil prof : <b>…/Carnet-Step-/prof/?demo</b>.</p>`}]}
]};
