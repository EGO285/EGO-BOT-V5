// ============================================================
//  story/engine/arsenal.js
//  Analyse le PAVÉ de combat du joueur : détecte les jutsu et objets
//  qu'il mentionne, et sépare ce qu'il POSSÈDE de ce qu'il tente d'utiliser
//  sans l'avoir (règle : utiliser un jutsu/outil qu'on n'a pas = immobile).
// ============================================================
const { JUTSU } = require("../data/jutsu");
const { ITEMS } = require("../data/items");
const { eff } = require("./stats");

function norm(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

// Un terme du catalogue est-il mentionné dans le pavé ?
function mentionne(pave, nom, id) {
    const p = norm(pave);
    if (id && p.includes(norm(id))) return true;
    // match sur les mots significatifs du nom (>=4 lettres)
    const mots = norm(nom).split(/[^a-z0-9]+/).filter(w => w.length >= 4);
    return mots.some(w => p.includes(w));
}

// Puissance indicative d'un jutsu pour CE joueur (sert de borne à l'IA).
function puissance(oc, j, maitrise) {
    if (j.degats <= 0) return 0;
    const statVal = eff(oc, j.stat || "ninjutsu");
    return Math.round(j.degats * (1 + statVal / 50) * (0.5 + (maitrise / 100) * 0.7));
}

function detect(oc, pave) {
    const jutsuOwned = [], jutsuNotOwned = [], itemsOwned = [], itemsNotOwned = [];
    const connus = new Set(oc.techniques.map(t => t.id));

    for (const [id, j] of Object.entries(JUTSU)) {
        if (!mentionne(pave, j.nom, id)) continue;
        if (connus.has(id)) {
            const m = oc.techniques.find(t => t.id === id);
            jutsuOwned.push({ id, nom: j.nom, cout: j.cout, nature: j.nature, type: j.type, effet: j.effet, puissance: puissance(oc, j, m ? m.maitrise : 10) });
        } else {
            jutsuNotOwned.push(j.nom);
        }
    }
    for (const [id, it] of Object.entries(ITEMS)) {
        if (!mentionne(pave, it.nom, id)) continue;
        const poss = (oc.inventaire || []).find(i => i.id === id);
        if (poss && poss.qty > 0) itemsOwned.push({ id, nom: it.nom, effet: it.effet, cat: it.cat });
        else itemsNotOwned.push(it.nom);
    }
    return { jutsuOwned, jutsuNotOwned, itemsOwned, itemsNotOwned };
}

module.exports = { detect };
