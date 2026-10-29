/* =====================================================================
   donnees.js — Step CA5 · Seconde (Lycée G. Pompidou) : séances S1-S8, filières, formats, défis, badges.
   COMMUN à l'appli élève (racine du dépôt) et à l'outil prof (dossier prof/) : un seul fichier, partagé.
   ===================================================================== */
'use strict';
/* ---- filières, formats, zones (identiques à l’outil de cycle) ---- */
const FIL={A:{nom:'A · bref et intense',court:'A',but:'développer ma puissance aérobie',zone:[80,95],rpe:'7 à 9',parole:'quelques mots',prio:'propulsion et bras'},
           B:{nom:'B · long et modéré',court:'B',but:'m’entretenir, durer',zone:[55,70],rpe:'3 à 5',parole:'des phrases',prio:'amplitude et bras, sans saut'}};
const FMT={eval:{A:{e:[4,4,4,4],r:3},B:{e:[10,10],r:5}},s5:{A:{e:[4,4,4],r:3},B:{e:[8,8],r:2}},s6:{A:{e:[3,3,3],r:2},B:{e:[13],r:0}},s4:{A:{e:[2,2,2],r:2},B:{e:[10],r:0}}};
const FMT_TXT=(f,k)=>{const F=FMT[k][f];return F.e.length+' × '+F.e[0]+' min'+(F.r?', récupération '+F.r+' min':' continues')};
/* mesures d’un format : A = fin de chaque série ; B = mi-série et fin de série */
function mesures(f,k){const F=FMT[k][f];const L=[];F.e.forEach((d,i)=>{const sr=F.e.length>1?'Série '+(i+1)+' · ':'';if(f==='B'){L.push([sr+'à '+mm(d/2),i]);L.push([sr+'fin ('+d+' min)',i])}else L.push([sr+'fin ('+d+' min)',i])});return L}
const mm=x=>{const m=Math.floor(x),s=R((x-m)*60);return s?m+' min '+s:m+' min'};
const CURS=[['H','Hauteur',['sans réhausse','1 réhausse','2 réhausses']],['B','Bras',['bas','épaules','au-dessus']],['P','Propulsion',['aucun saut','impulsion','pas sautés']],['A','Amplitude',['petite','moyenne','grande']]];

/* ---- séances (Seconde, 8 séances) ---- */
const SESS=[
 {id:'s1',n:'S1',t:'Sécurité, FC de repos, bloc 1',goal:'je fais le bloc 1 en suivant le prof, et ma 2e FC est plus haute que la 1re.',
  crit:['Pied entier posé, sans bruit','Descend toujours en arrière','Reste sur le temps de la musique'],blocks:['fcr',['bloc',1],['mes','m1','Premier effort, première mesure',[['Effort 1 · 6 min de bloc 1, mains aux hanches, sans saut','basse'],['Effort 2 · 3 min de bloc 1, bras au-dessus des épaules, genou plus haut que la hanche','haute']]]]},
 {id:'s2',n:'S2',t:'Bloc 2 et test des leviers',goal:'je sais dire quel réglage me fait gagner le plus de pulsations.',
  crit:['Jamais de descente en avant (reverse)','Regard devant, pas sur ses pieds','Ne change qu’un réglage à la fois'],blocks:[['coord',['canon']],['bloc',2],['mes','lv','Test des leviers : 3 × 3 min de bloc 1',[['Série 1 · step sans réhausse, mains aux hanches, aucun saut','version basse'],['Série 2 · + propulsion (genoux et tap up sautés)','+ propulsion'],['Série 3 · + propulsion, 1 réhausse, bras au-dessus des épaules','+ réhausse + bras']]],'zcalc']},
 {id:'s3',n:'S3',t:'Bloc 3, bref contre long, Juste Pouls',goal:'je vis les deux filières (3 × 1 min intense, 12 min sans arrêt) et j’annonce ma FC à 10 près.',
  crit:['Back sans saut, réception stable','Effort régulier sur les 12 min','Annonce faite avant de bouger'],blocks:[['coord',['ronde','annonce']],['bloc',3],['mes','bi','Juste Pouls : essai bref et intense, 3 × 1 min',[['FC après la 3e minute','A']]],['mes','lg','Effort long : 12 min de blocs 1 et 2, version basse',[['FC à 6 min','B'],['FC à 12 min','B']]]]},
 {id:'s4',n:'S4',t:'Les 3 blocs, curseurs, choix de la filière',goal:'au moins 2 mesures sur 3 dans la zone visée, et mon choix est argumenté.',
  crit:['3 blocs enchaînés sans l’enseignant','Sauts du jumping jack sur la plateforme','Annonce son réglage (H B P A)'],blocks:['tri',['coord',['chef']],'cur','vise','essai','choix']},
 {id:'s5',n:'S5',t:'S’entraîner 1 : régler sa charge',goal:'au moins 2 mesures sur 3 (A) ou 3 sur 4 (B) dans ma zone.',
  crit:['Échauffement progressif et complet','Ne change qu’un curseur à la fois','Continuité : pas d’arrêt hors mesures'],blocks:['warm',['coord',['chef']],'perso','regl',['fil','s5']]},
 {id:'s6',n:'S6',t:'S’entraîner 2 : le coach lit l’effort',goal:'mon coach relève toutes mes mesures et me donne 2 conseils utiles.',
  crit:['Coach : oxymètre dans les 5 s','Coach : conseil = constat + action','Pratiquant : pied entier, gainage'],blocks:['warm',['coord',['chef']],['fil','s6'],'obs']},
 {id:'s7',n:'S7',t:'Répétition générale (25 min)',goal:'3 mesures sur 4 dans ma zone et une analyse complète.',
  crit:['Plan écrit avant de commencer','Réglage modifié si hors zone','Analyse : constat, cause, régulation'],blocks:['warm',['coord',['chef']],'plan','regl',['fil','eval'],'analyse']},
 {id:'s8',n:'S8',t:'Évaluation',goal:'je réalise ma séance comme prévu et je l’analyse.',eval:true,
  crit:['Échauffement seul et complet','Coach précis : FC, arrêts, réglages','Séance réalisée comme annoncée'],blocks:['warm','plan',['fil','eval'],'obs','afl1','analyse','situe']}
];
/* ---- défis de coordination (réussi / pas encore, sans points) ---- */
const COORD={canon:['Le canon','Par rangée, bloc 1 en boucle : chacun démarre 8 temps après son voisin. Réussi si la vague tient 2 tours du bloc.'],
 ronde:['La ronde','Traverse de step en step, sans arrêt. Réussi si un seul élève par step, tous sur le même temps, 3 tours.'],
 annonce:['L’annonce','Pendant un pas, j’annonce le pas suivant à voix haute. Réussi si les blocs 1 et 2 sont annoncés sans erreur.'],
 chef:['Chef d’orchestre','Meneur devant sa rangée, de dos : 4 fois les 3 blocs sans aide et sans erreur = badge Chef d’orchestre.']};
const COORD_OPT={chef:[['1','✓ réussi : badge'],['0','pas encore'],['n','pas meneur aujourd’hui']]};
const SBY=Object.fromEntries(SESS.map(s=>[s.id,s]));
const bk=b=>Array.isArray(b)?b:[b];
const BLOC={1:['Genou G','Genou D','V step','V ¼ de tour à droite','Traverse','Cheval','Tap up'],2:['Pendule','Reverse','Talons G','Talons D','Lunge','Jazz square','Basique'],3:['Tap up','Back','V step','Hélicoptère','3 genoux','Jumping jack sur le step']};
const WARM_EX=[[['so','Marche, genoux, talons-fesses au sol'],['br','Step touch avec les bras']],[['bs','Basique, V step, tap up'],['ge','Genou, talons']],[['b1','Bloc 1 version basse'],['b2','Bloc 2 version basse'],['b3','Bloc 3 version basse']],[['fi','1 bloc au réglage de ma filière'],['fc','FC mesurée à la fin']]];
const WARM_NAME=Object.fromEntries([].concat(...WARM_EX));

const CYC={S:{id:'S',label:'Seconde',short:'2nde',sess:SESS}};
const cyOfSid=sid=>'S';
const sessOf=cy=>SESS;
const ST_TXT={abs:'absent',bl:'blessé / dispensé'};
const WHY_TXT={abs:'coach absent',bl:'coach blessé ou dispensé',autre:'autre raison'};
const DEG_TXT={1:'¼ · copieur-colleur',2:'⅓ · zappeur',3:'⅔ · sensitif',4:'¾ · concepteur'};
const DEFI_S=['s3','s4','s5','s6','s7'];
const BADGES=[['memoire','Mémoire','3 blocs enchaînés seul (S4)'],['endurant','Endurant','12 min sans arrêt (S3)'],['devin','Devin','au moins 6 annonces Juste Pouls à ± 5, et au moins la moitié de tes annonces'],['regleur','Régleur','2 séances de filière à 3 mesures sur 4 dans la zone'],['coach','Coach','pronostic à ± 5 % deux fois'],['chef','Chef d’orchestre','4 fois les 3 blocs devant sa rangée, sans erreur (S4 à S7)']];
const RPE_TXT=['0 · repos','1 · très, très facile','2 · facile','3 · modéré : je parle en phrases','4 · un peu dur','5 · dur : je parle par mots','6 · dur +','7 · très dur','8 · très dur +','9 · presque maximal','10 · maximal : je ne peux plus parler'];
const DEC_TXT={'+H':'+1 hauteur','+B':'+1 bras','+P':'+1 propulsion','+A':'+1 amplitude','-H':'−1 hauteur','-B':'−1 bras','-P':'−1 propulsion','-A':'−1 amplitude','=':'je garde mon réglage'};
/* Filière A : la FC chute de 10 à 20 pulsations dans les secondes qui suivent l'arrêt ; pour la note, une mesure jusqu'à 5 pulsations sous la zone compte comme dans la zone. */
const TOL_A=5;
