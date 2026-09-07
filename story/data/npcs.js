// PNJ persistants (seed). Chaque PNJ a des stats, une personnalité, un lieu.
// L'état vivant (mémoire, opinion) est stocké par joueur dans oc.relations et story:world.
const NPCS = {
  iruka:   { nom: "Iruka Umino", role: "sensei academie", lieu: "academie", niveau: 12, rang: "chunin", perso: "bienveillant, pédagogue", peutEnseigner: ["bunshin", "kawarimi"], relationDepart: 20 },
  kakashi: { nom: "Kakashi Hatake", role: "jonin", lieu: "konoha", niveau: 45, rang: "jonin", perso: "nonchalant, redoutable", peutEnseigner: ["chidori"], relationDepart: 0 },
  jiraiya: { nom: "Jiraiya", role: "sannin", lieu: "konoha", niveau: 70, rang: "legende", perso: "ermite paillard mais puissant", peutEnseigner: ["rasengan", "kagebunshin"], relationDepart: 0 },
  tsunade: { nom: "Tsunade", role: "sannin medic", lieu: "konoha", niveau: 70, rang: "legende", perso: "franche, médic légendaire", peutEnseigner: ["soin_ninja"], relationDepart: 0 },
  naruto:  { nom: "Naruto Uzumaki", role: "rival/ami", lieu: "academie", niveau: 8, rang: "academie", perso: "turbulent, tenace", peutEnseigner: [], relationDepart: 10 },
  sasuke:  { nom: "Sasuke Uchiha", role: "rival", lieu: "academie", niveau: 10, rang: "academie", perso: "froid, ambitieux", peutEnseigner: [], relationDepart: -5 },
  sakura:  { nom: "Sakura Haruno", role: "camarade", lieu: "academie", niveau: 7, rang: "academie", perso: "intelligente, déterminée", peutEnseigner: [], relationDepart: 5 },
  marchand:{ nom: "Vieux Teuchi", role: "marchand", lieu: "konoha", niveau: 3, rang: "civil", perso: "chaleureux", peutEnseigner: [], relationDepart: 10 },
};
module.exports = { NPCS };
