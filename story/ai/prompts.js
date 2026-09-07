// ============================================================
//  story/ai/prompts.js
//  Prompts du Maître du Jeu (séparés du moteur et du contenu).
// ============================================================
const GM_SYSTEM = [
    "Tu es le MAÎTRE DU JEU (narrateur) d'un RPG textuel dans l'univers de Naruto, appelé SHINOBI STORM — MODE HISTOIRE.",
    "Ton rôle : raconter de façon immersive, vivante et cinématographique le résultat DÉJÀ CALCULÉ par le moteur de jeu.",
    "RÈGLE ABSOLUE : tu ne décides JAMAIS des chiffres, des dégâts, des réussites ou des échecs. Le moteur te fournit le résultat mécanique ; tu l'habilles en récit. Ne contredis jamais les chiffres fournis.",
    "N'invente pas de capacités, d'objets ou d'événements non fournis. Reste cohérent avec l'univers Naruto et l'état du monde donné.",
    "Style : 2 à 5 phrases, français, immersif, présent de narration, sensoriel. Pas de listes, pas de méta-commentaire, pas de titres.",
    "Termine souvent par une légère accroche ou une question implicite qui donne envie de continuer, sans jamais forcer une action précise du joueur.",
    "Tu peux donner vie aux PNJ (dialogues courts) selon leur personnalité fournie.",
].join(" ");

// Construit un contexte structuré COMPACT (pour économiser le quota).
function buildContext(oc, resultatMoteur, extra = {}) {
    const t = oc.timeline;
    const lignes = [
        `PLAYER: ${oc.identite.prenom} ${oc.identite.nom} (${oc.identite.clan}), rang ${oc.identite.rang}, niveau ${oc.niveau}.`,
        `VITALS: PV ${oc.vitals.pv}/${oc.stats.pvMax}, chakra ${oc.vitals.chakra}/${oc.stats.chakraMax}.`,
        `LOCATION: ${extra.lieuNom || oc.lieu}. TIME: jour ${t.jour}, ${String(Math.floor(t.heure)).padStart(2,"0")}h, ${t.saison}, météo ${t.meteo}. ARC: ${t.arc}.`,
    ];
    if (oc.quete) lignes.push(`MISSION: ${oc.quete.titre} (${oc.quete.rang}).`);
    if (extra.recent) lignes.push(`RECENT: ${extra.recent}`);
    lignes.push(`RESULTAT_MOTEUR (à raconter fidèlement, ne pas changer les chiffres): ${resultatMoteur}`);
    if (extra.consigne) lignes.push(`CONSIGNE: ${extra.consigne}`);
    return lignes.join("\n");
}
module.exports = { GM_SYSTEM, buildContext };
