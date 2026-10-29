/* aide.js — mode d'emploi du carnet de step (lu par eps-aide.js) */
window.EPS_AIDE={appli:'Carnet step · Seconde',bouton:false,
pied:'Les carnets restent sur la tablette ; rien n’est envoyé sur Internet.',
publics:[{id:'eleve',titre:'Élève',chapitres:[
{t:'Premier cours : créer le binôme',html:`<ol>
<li>Touche <span class="bouton">＋ Créer un binôme</span> : classe, prénoms, noms, fille ou garçon et <b>âge</b> (il sert à calculer ta FC max).</li>
<li>Aux cours suivants, touche le nom de ton binôme sur l’accueil.</li></ol>
<p class="astuce">En haut de chaque séance, <b>Mes repères du jour</b> : FC de repos, FC max, zone de ta filière, ressenti visé, décision de la dernière fois.</p>`},
{t:'Pendant la séance',html:`<ul>
<li>Celui qui pratique travaille ; le <b>coach</b> tient la tablette, compte la FC, coche et note.</li>
<li>Chaque FC est comparée tout de suite à ta zone : la consigne s’affiche (« +1 curseur », « −1 curseur » ou garder).</li>
<li><span class="bouton">Une étape à la fois</span> affiche les étapes une par une ; <span class="bouton">Tout afficher</span> pour tout voir.</li>
<li>Absent, blessé, pratique adaptée : <span class="bouton">Absent, blessé, adapté ?</span> sous le titre de la séance. Coach absent : « Changer le coach ».</li>
<li><b>Défis</b> (S3 à S7) : annonce ta FC avant chaque mesure (Juste Pouls) et vise le milieu de ta zone (Pile dans la cible). Les points et badges ne comptent pas dans la note.</li></ul>`},
{t:'Fin de séance : le QR pour le professeur',html:`<ol>
<li>Remplis le <b>bilan</b> : ce que le coach a vu, la réussite, le conseil, l’effort ressenti de 0 à 10, la décision pour la prochaine fois.</li>
<li>Touche <span class="bouton">Fin de séance : afficher le QR</span> et montre-le au professeur.</li></ol>
<p class="attention">Une séance pas encore montrée : <span class="bouton">QR de rattrapage</span> au cours suivant.</p>`},
{t:'Mes zones, ma progression',html:`<ul>
<li><b>Mes zones</b> : FC de repos, FC max, zones A (80-95 %) et B (55-70 %). Si ta FC de repos manque, le professeur peut t’en donner une.</li>
<li><b>Ma progression</b> : FC d’effort, écart à ta zone, réussites et charge, séance après séance.</li></ul>`},
{t:'Lecture facilitée',html:`<p><b>Lecture facilitée</b> (case en haut de ce mode d’emploi) : police plus lisible, lettres et lignes espacées, utile en cas de dyslexie. Le choix vaut pour toutes les applis EPS de la tablette.</p>`}]},
{id:'prof',titre:'Professeur',chapitres:[
{t:'Mettre en place',html:`<ul>
<li>Sur chaque tablette (avec Wi-Fi), ouvrez l’appli puis « Sur l’écran d’accueil » : elle marche ensuite sans réseau.</li>
<li>Bouton <span class="bouton">Prof</span> en haut, puis le code prof. À la première ouverture, indiquez si l’appareil est le vôtre ou une tablette d’élève.</li>
<li>Démo pour un collègue : <b>…/Carnet-Step-/?demo</b> (classe fictive ; les vraies données ne sont pas touchées).</li></ul>`},
{t:'Récupérer et suivre',html:`<ul>
<li><b>Scanner</b> : caméra (elle reste ouverte), photo ou texte collé. Un QR par binôme et par séance.</li>
<li><b>Classe</b> : filière, zone, réussites S1-S8, « comme coach », produire /8, analyse /4 à saisir, AFL1, AFL2, AFL3, total /20.</li>
<li><b>Points d’attention</b> : QR manquants, zones non calculables, filière non choisie, aucune mesure dans la zone sur 2 séances, absences.</li></ul>`},
{t:'Chrono des filières',html:`<ul>
<li>Onglet <b>Chrono</b> : A et B sur la même musique, bips, 3-2-1, voix « Effort », « Récupération », « Mesure ». Téléphone branché sur l’enceinte.</li>
<li>Le chrono suit l’heure réelle : il reste juste après une mise en veille, et reprend après un rechargement quand vous rouvrez l’onglet Chrono.</li></ul>`},
{t:'Sauvegarder, fin de cycle',html:`<ul>
<li><span class="bouton">Sauvegarde complète (JSON)</span> après chaque séance ; <span class="bouton">Export CSV</span> pour les notes.</li>
<li>Un binôme a perdu sa tablette : « Restaurer un binôme avec le QR du professeur ».</li>
<li>En fin de cycle : « Effacer la classe » des tablettes.</li></ul>`}]}]};
