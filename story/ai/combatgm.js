// ============================================================
//  story/ai/combatgm.js
//  COMBAT PAR PAVÉ. Le joueur écrit son action librement ; l'IA résout
//  selon la DIFFICULTÉ. Le MOTEUR encadre : arsenal validé, chakra/objets
//  déduits réellement, dégâts BORNÉS (anti-triche). Si un jutsu/outil non
//  possédé est utilisé -> le joueur est considéré IMMOBILE (aucun effet).
// ============================================================
let evoAI = null;
try { evoAI = require("../../utils/evoAI"); } catch (e) {}
const rng = require("../engine/rng");
const { eff } = require("../engine/stats");
const inv = require("../engine/inventory");

const DIFF = {
    narratif: { pMul: 1.25, eMul: 0.55 },
    normal:   { pMul: 1.0,  eMul: 0.9 },
    shinobi:  { pMul: 0.9,  eMul: 1.2 },
    hardcore: { pMul: 0.8,  eMul: 1.45 },
};

function clamp(v, a, b) { return Math.max(a, Math.min(b, Math.round(v || 0))); }

function extractJSON(txt) {
    if (!txt) return null;
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) return null;
    try { return JSON.parse(m[0]); } catch (e) { return null; }
}

// Résout un tour de combat à partir du pavé du joueur.
// Retourne { narration, dP, dS, chakraUsed, itemsUsed, fizzles, invalid, immobile }.
async function resolve(oc, enemy, pave, usage) {
    const diff = DIFF[oc.difficulte] || DIFF.normal;

    // 1) Chakra : on tente de payer les jutsu possédés mentionnés.
    let chakraUsed = 0; const landed = []; const fizzles = [];
    for (const j of usage.jutsuOwned) {
        const cout = Math.max(1, Math.round(j.cout * (1 - Math.min(0.4, oc.stats.controleChakra * 0.01))));
        if (oc.vitals.chakra - chakraUsed >= cout) { chakraUsed += cout; landed.push(j); }
        else fizzles.push(j.nom);
    }
    oc.vitals.chakra = Math.max(0, oc.vitals.chakra - chakraUsed);

    // 2) Objets possédés utilisés : effets appliqués tout de suite.
    const itemsUsed = [];
    for (const it of usage.itemsOwned) {
        const r = inv.useItem(oc, it.id);
        if (r.ok) itemsUsed.push(it.nom);
    }

    // 3) Immobile ? -> a tenté un jutsu/outil non possédé et RIEN de valide.
    const invalid = [...usage.jutsuNotOwned, ...usage.itemsNotOwned];
    const aAgi = landed.length > 0 || itemsUsed.length > 0 || /frappe|coup|poing|pied|esquiv|court|saut|lance un kunai|shuriken|taijutsu|charge|recul|bloque|pare/i.test(pave);
    const immobile = invalid.length > 0 && !aAgi;

    // 4) Bornes de dégâts.
    const meilleurJutsu = landed.reduce((mx, j) => Math.max(mx, j.puissance), 0);
    const basePhysique = 8 + eff(oc, "force") * 1.5 + eff(oc, "taijutsu") * 2.5;
    let maxP = Math.round(Math.max(meilleurJutsu, basePhysique) * diff.pMul);
    if (immobile) maxP = 0;
    const enemyOff = 3 + (enemy.stats.force || 5) + (enemy.stats.taijutsu || 5) * 1.5 + (enemy.stats.ninjutsu || 5) * 0.8;
    let maxS = Math.round(enemyOff * diff.eMul);
    if (immobile) maxS = Math.round(maxS * 1.4); // exposé

    // 5) Résolution : IA si dispo, sinon déterministe.
    let narration = null, dP = 0, dS = 0, statut = "";
    let source = "local";
    if (evoAI && evoAI.hasToken && evoAI.hasToken()) {
        try {
            const sys = "Tu es l'arbitre-narrateur d'un combat RPG Naruto. Tu reçois l'action libre du joueur et l'état du combat. Tu réponds UNIQUEMENT par un objet JSON. Tu NE dépasses JAMAIS les bornes de dégâts fournies. Reste cohérent, immersif, nerveux.";
            const ctx = {
                joueur: { pv: oc.vitals.pv, pvMax: oc.stats.pvMax, chakra: oc.vitals.chakra, rang: oc.identite.rang, niveau: oc.niveau },
                ennemi: { nom: enemy.nom, pv: enemy.pv, pvMax: enemy.pvMax, rang: enemy.rang },
                difficulte: oc.difficulte,
                jutsu_valides: landed.map(j => j.nom),
                jutsu_rates_chakra: fizzles,
                tentatives_impossibles: invalid,      // jutsu/outils NON possédés
                objets_utilises: itemsUsed,
                immobile,
                bornes: { degats_infliges_max: maxP, degats_subis_max: maxS },
            };
            const user = [
                `ACTION DU JOUEUR (pavé) : "${pave}"`,
                `ÉTAT: ${JSON.stringify(ctx)}`,
                immobile
                    ? "Le joueur a tenté d'utiliser une technique/un objet qu'il NE POSSÈDE PAS et n'a rien fait de valide : il est donc IMMOBILE/à découvert. degats_infliges DOIT être 0, et l'ennemi en profite."
                    : "Résous l'échange en respectant STRICTEMENT les bornes.",
                `Réponds ce JSON : {"narration": string immersive (2-4 phrases), "degats_infliges": entier 0..${maxP}, "degats_subis": entier 0..${maxS}, "statut": courte étiquette (ex: "touché", "esquivé", "contré", "immobilisé")}.`,
            ].join("\n");
            const txt = await evoAI.callHF(evoAI.MODEL, [{ role: "system", content: sys }, { role: "user", content: user }]);
            const j = extractJSON(txt);
            if (j) {
                narration = String(j.narration || "").slice(0, 600);
                dP = clamp(j.degats_infliges, 0, maxP);
                dS = clamp(j.degats_subis, 0, maxS);
                statut = String(j.statut || "").slice(0, 40);
                source = "hf";
            }
        } catch (e) { console.error("⚠️ combatgm IA:", e.response?.data?.error || e.message); }
    }
    if (narration === null) {
        // Repli déterministe.
        dP = immobile ? 0 : clamp(rng.variance(maxP * 0.6, 0.25), 0, maxP);
        dS = clamp(rng.variance(maxS * (immobile ? 0.9 : 0.5), 0.3), 0, maxS);
        if (immobile) narration = `Tu tentes une technique que tu ne maîtrises pas... ton geste avorte et tu restes exposé ! ${enemy.nom} en profite.`;
        else if (landed.length) narration = `Tu enchaînes ${landed.map(j => j.nom).join(", ")} ! ${dP > 0 ? `${enemy.nom} encaisse.` : `${enemy.nom} se protège.`}`;
        else narration = `Tu passes à l'attaque au corps à corps. ${dP > 0 ? "Le coup porte." : "L'adversaire pare."}`;
        statut = immobile ? "immobilisé" : (dP > 0 ? "touché" : "paré");
    }

    // 6) Application au moteur.
    enemy.pv = Math.max(0, enemy.pv - dP);
    if (enemy.pv > 0) oc.vitals.pv = Math.max(0, oc.vitals.pv - dS);
    oc.vitals.endurance = Math.max(0, oc.vitals.endurance - (landed.length ? 4 : 6));

    return { narration, dP, dS, chakraUsed, itemsUsed, fizzles, invalid, immobile, statut, source };
}

module.exports = { resolve, DIFF };
