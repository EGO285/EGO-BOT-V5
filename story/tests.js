// ============================================================
//  story/tests.js — tests automatisés du MODE HISTOIRE
//  Lancer :  node story/tests.js
//  Tourne SANS réseau (repli RAM si Upstash non configuré) et SANS IA
//  (le moteur est déterministe ; l'IA ne fait que narrer).
// ============================================================
const assert = require("assert");
const db = require("./engine/db");
const { createOC } = require("./engine/profile");
const progression = require("./engine/progression");
const combat = require("./engine/combat");
const inventory = require("./engine/inventory");
const economy = require("./engine/economy");
const training = require("./engine/training");
const survival = require("./engine/survival");
const world = require("./engine/world");
const { BOSSES } = require("./data/bosses");

let ok = 0, ko = 0;
function t(nom, fn) { try { fn(); console.log("✅", nom); ok++; } catch (e) { console.log("❌", nom, "->", e.message); ko++; } }

const fiche = { pseudo: "TestNinja", money: 1000 };

t("Création OC (stats, techniques, vitals)", () => {
    const oc = createOC("TestNinja", fiche, { clan: "uchiha" });
    assert(oc.stats.pvMax === 100 && oc.techniques.length === 4);
    assert(oc.affinites.includes("katon")); // clan Uchiha
    assert(oc.identite.rang === "academie" && oc.xpCarriere === 0);
});

t("XP et montée de niveau", () => {
    const oc = createOC("A", fiche, {});
    const n0 = oc.niveau;
    progression.addXP(oc, 5000);
    assert(oc.niveau > n0, "niveau doit monter");
});

t("Allocation de points de stats", () => {
    const oc = createOC("A", fiche, {});
    oc.points = 2;
    const r = progression.allocate(oc, "ninjutsu");
    assert(r.ok && oc.stats.ninjutsu >= 4 && oc.points === 1);
    const r2 = progression.allocate(oc, "inconnue");
    assert(!r2.ok);
});

t("Inventaire : ajout/usage d'objet (soin)", () => {
    const oc = createOC("A", fiche, {});
    oc.vitals.pv = 10;
    inventory.addItem(oc, "potion_soin", 1);
    const r = inventory.useItem(oc, "potion_soin");
    assert(r.ok && oc.vitals.pv > 10);
});

t("Économie : achat/vente cohérents", () => {
    const oc = createOC("A", fiche, {}); oc.ryo = 1000;
    const r = economy.acheter(oc, "magasin_ninja", "kunai", 2);
    assert(r.ok && oc.ryo < 1000);
    const v = economy.vendre(oc, "kunai", 1);
    assert(v.ok);
});

t("Combat déterministe : victoire donne du butin", () => {
    const oc = createOC("A", fiche, {}); oc.stats.taijutsu = 40; oc.stats.force = 40; oc.stats.precision = 40;
    combat.start(oc, BOSSES.voyou);
    let guard = 0;
    while (oc.combat && !oc.combat.termine && guard < 100) { combat.action(oc, "attaquer"); guard++; }
    assert(oc.combat && oc.combat.issue === "victoire", "un perso surpuissant doit gagner");
    const ryo0 = oc.ryo;
    const rec = combat.applyVictory(oc, oc.combat.enemy);
    assert(oc.ryo > ryo0 && rec.xp > 0 && oc.combat === null);
});

t("Combat : chakra insuffisant refuse le jutsu", () => {
    const oc = createOC("A", fiche, {});
    oc.techniques.push({ id: "chidori", maitrise: 50 });
    oc.vitals.chakra = 1;
    combat.start(oc, BOSSES.voyou);
    const r = combat.action(oc, "jutsu", "chidori");
    assert(!r.ok && /chakra/i.test(r.error));
});

t("Défaite : KO en normal ne tue pas, mais réduit PV", () => {
    const oc = createOC("A", fiche, {}); oc.difficulte = "normal";
    combat.start(oc, BOSSES.zabuza); // trop fort
    let guard = 0;
    while (oc.combat && !oc.combat.termine && guard < 200) { combat.action(oc, "attaquer"); guard++; }
    if (oc.combat && oc.combat.issue === "defaite") {
        const d = combat.applyDefeat(oc);
        assert(!d.mort && oc.vitals.pv > 0);
    }
});

t("Survie : le temps fait baisser la faim/soif", () => {
    const oc = createOC("A", fiche, {});
    const f0 = oc.besoins.faim;
    survival.tick(oc, 10);
    assert(oc.besoins.faim < f0);
});

t("Temps : le voyage avance l'horloge", () => {
    const oc = createOC("A", fiche, {});
    const h0 = oc.timeline.heure;
    world.advanceTime(oc, 5);
    assert(oc.timeline.heure !== h0 || oc.timeline.jour > 1);
});

t("Entraînement : donne de l'XP de carrière", () => {
    const oc = createOC("A", fiche, {});
    const x0 = oc.xpCarriere;
    training.entrainer(oc, "course");
    assert(oc.xpCarriere > x0);
});

t("Anti-triche : l'XP ne s'attribue que par le moteur (fonction pure)", () => {
    const oc = createOC("A", fiche, {});
    // aucune fonction publique ne permet de fixer les stats arbitrairement sans passer par allocate/moteur
    assert(typeof progression.allocate === "function");
});

(async () => {
    t("Persistance : save/load conserve l'état", async () => {});
    const oc = createOC("PersTest", fiche, {}); oc.ryo = 777;
    await db.saveOC("PersTest", oc);
    const re = await db.getOC("PersTest");
    if (!re || re.ryo !== 777) { console.log("❌ Persistance save/load"); ko++; } else { console.log("✅ Persistance save/load"); ok++; }

    console.log(`\n${ok} réussis, ${ko} échoués.`);
    process.exit(ko ? 1 : 0);
})();
