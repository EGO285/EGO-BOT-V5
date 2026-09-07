// ============================================================
//  story/engine/economy.js
//  Monnaie Ryo du mode Histoire (indépendante du casino pour ne rien casser).
//  Achats/ventes en boutique. Prix modulés par réputation.
// ============================================================
const { ITEMS, SHOPS } = require("../data/items");
const inv = require("./inventory");

function prixAchat(oc, itemId) {
    const base = ITEMS[itemId]?.valeur || 0;
    const rep = oc.reputation?.konoha || 0;
    const remise = Math.min(0.2, Math.max(0, rep / 500)); // jusqu'à -20% avec la réputation
    return Math.max(1, Math.round(base * (1 - remise)));
}
function prixVente(itemId) { return Math.round((ITEMS[itemId]?.valeur || 0) * 0.5); }

function acheter(oc, shopId, itemId, qty = 1) {
    const shop = SHOPS[shopId];
    if (!shop) return { ok: false, error: "Boutique inconnue." };
    if (!shop.items.includes(itemId)) return { ok: false, error: `${ITEMS[itemId]?.nom || itemId} n'est pas vendu ici.` };
    const total = prixAchat(oc, itemId) * qty;
    if ((oc.ryo || 0) < total) return { ok: false, error: `Trop cher : ${total}💴 requis, tu as ${oc.ryo || 0}💴.` };
    oc.ryo -= total;
    inv.addItem(oc, itemId, qty);
    return { ok: true, total, item: ITEMS[itemId].nom };
}
function vendre(oc, itemId, qty = 1) {
    if (!inv.has(oc, itemId, qty)) return { ok: false, error: "Objet absent." };
    const gain = prixVente(itemId) * qty;
    inv.removeItem(oc, itemId, qty);
    oc.ryo = (oc.ryo || 0) + gain;
    return { ok: true, gain, item: ITEMS[itemId].nom };
}
module.exports = { prixAchat, prixVente, acheter, vendre, SHOPS, ITEMS };
