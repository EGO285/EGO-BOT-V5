// ============================================================
//  story/engine/combat.js
//  Moteur de combat RPG déterministe. Le code calcule TOUT (dégâts, touche,
//  esquive, chakra, endurance, KO). L'IA ne fait que raconter le log produit.
// ============================================================
const rng = require("./rng");
const { eff } = require("./stats");
const { natureMultiplier } = require("../data/natures");
const { JUTSU } = require("../data/jutsu");
const { addXP } = require("./progression");
const inv = require("./inventory");

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

// Fabrique un ennemi jouable à partir d'une définition (npc/boss).
function makeEnemy(def) {
    const s = def.stats || {};
    return {
        nom: def.nom, niveau: def.niveau || 5, rang: def.rang || "D",
        pvMax: def.pv || 100, pv: def.pv || 100,
        chakraMax: def.chakra || 50, chakra: def.chakra || 50,
        stats: {
            force: s.force || 5, vitesse: s.vitesse || 5, reflexes: s.reflexes || 5,
            taijutsu: s.taijutsu || 5, ninjutsu: s.ninjutsu || 5, precision: s.precision || 5,
            resistance: s.resistance || 5, perception: s.perception || 5,
        },
        affinite: def.affinite || null, faiblesse: def.faiblesse || null,
        techniques: def.techniques || [], butin: def.butin || { ryo: 100, xp: 50, items: [] },
        isBoss: !!def.phases && def.phases > 1, phases: def.phases || 1, phase: 1,
    };
}

function hitChance(attPrec, defVit) {
    return clamp(0.75 + (attPrec - defVit) * 0.02, 0.4, 0.95);
}
function dodgeChance(defVit, defRef, attPrec) {
    return clamp(0.05 + (defVit + defRef - attPrec) * 0.015, 0.02, 0.6);
}

// Attaque physique du joueur.
function playerPhysical(oc, enemy) {
    const prec = eff(oc, "precision");
    if (!rng.chance(hitChance(prec, enemy.stats.vitesse)) || rng.chance(dodgeChance(enemy.stats.vitesse, enemy.stats.reflexes, prec))) {
        return { touche: false, degats: 0, txt: `Ton attaque manque ${enemy.nom}.` };
    }
    let d = 8 + eff(oc, "force") * 1.5 + eff(oc, "taijutsu") * 2.5;
    d = rng.variance(d) - enemy.stats.resistance * 0.5;
    d = Math.max(1, Math.round(d));
    enemy.pv = Math.max(0, enemy.pv - d);
    oc.vitals.endurance = Math.max(0, oc.vitals.endurance - 6);
    return { touche: true, degats: d, txt: `Tu frappes ${enemy.nom} : ${d} dégâts.` };
}

// Jutsu du joueur.
function playerJutsu(oc, enemy, jutsuId) {
    const j = JUTSU[jutsuId];
    if (!j) return { erreur: "Technique inconnue." };
    const conn = oc.techniques.find(t => t.id === jutsuId);
    if (!conn) return { erreur: "Tu ne connais pas cette technique." };
    // cooldown
    oc.combat.cooldowns = oc.combat.cooldowns || {};
    if (oc.combat.cooldowns[jutsuId] > 0) return { erreur: `${j.nom} est en recharge (${oc.combat.cooldowns[jutsuId]} tour).` };
    // coût de chakra réduit par le contrôle
    const cout = Math.max(1, Math.round(j.cout * (1 - clamp(oc.stats.controleChakra * 0.01, 0, 0.4))));
    if (oc.vitals.chakra < cout) return { erreur: `Chakra insuffisant (${cout} requis, ${oc.vitals.chakra} dispo).` };
    oc.vitals.chakra -= cout;
    if (j.cooldown) oc.combat.cooldowns[jutsuId] = j.cooldown;

    // Soin
    if (j.type === "soin" || (j.degats < 0)) {
        const soin = Math.round(Math.abs(j.degats) * (0.6 + (conn.maitrise / 100) * 0.6));
        oc.vitals.pv = Math.min(oc.stats.pvMax, oc.vitals.pv + soin);
        conn.maitrise = clamp(conn.maitrise + 2, 0, 100);
        return { touche: true, degats: 0, txt: `${j.nom} : tu récupères ${soin} PV.` };
    }
    // Support (esquive garantie, clones, bouclier...)
    if (j.type === "support" || j.type === "defense") {
        if (j.effet === "esquive_garantie") oc.combat.esquiveGarantie = true;
        if (j.effet === "bouclier") oc.combat.bouclier = 40;
        conn.maitrise = clamp(conn.maitrise + 2, 0, 100);
        return { touche: true, degats: 0, txt: `${j.nom} activé.` };
    }
    // Offensif
    const statVal = eff(oc, j.stat || "ninjutsu");
    let d = j.degats * (1 + statVal / 50) * (0.5 + (conn.maitrise / 100) * 0.7);
    d *= natureMultiplier(j.nature, enemy.affinite);
    if (enemy.faiblesse && j.nature === enemy.faiblesse) d *= 1.3;
    d = rng.variance(d) - enemy.stats.resistance * 0.5;
    d = Math.max(1, Math.round(d));
    // chance de toucher (les jutsus rapides touchent plus souvent)
    if (rng.chance(dodgeChance(enemy.stats.vitesse, enemy.stats.reflexes, statVal) * 0.6)) {
        conn.maitrise = clamp(conn.maitrise + 1, 0, 100);
        return { touche: false, degats: 0, txt: `${enemy.nom} esquive ${j.nom} !` };
    }
    enemy.pv = Math.max(0, enemy.pv - d);
    conn.maitrise = clamp(conn.maitrise + 3, 0, 100);
    oc.vitals.endurance = Math.max(0, oc.vitals.endurance - 3);
    return { touche: true, degats: d, txt: `${j.nom} touche ${enemy.nom} : ${d} dégâts !` };
}

// Tour de l'ennemi (IA simple mais qui respecte le moteur).
function enemyTurn(oc, enemy) {
    if (enemy.pv <= 0) return null;
    // Choix : jutsu si assez de chakra et qu'il en a, sinon physique.
    let move = "physique";
    if (enemy.techniques.length && enemy.chakra >= 20 && rng.chance(0.4)) move = "jutsu";

    let d, txt;
    if (move === "jutsu") {
        const j = JUTSU[rng.pick(enemy.techniques)] || {};
        enemy.chakra -= (j.cout || 20);
        d = (j.degats || 30) * (1 + enemy.stats.ninjutsu / 50);
    } else {
        d = 3 + enemy.stats.force * 1.0 + enemy.stats.taijutsu * 1.5;
    }
    // esquive du joueur
    const dodge = dodgeChance(eff(oc, "vitesse"), eff(oc, "reflexes"), enemy.stats.precision);
    if (oc.combat.esquiveGarantie) { oc.combat.esquiveGarantie = false; return { degats: 0, txt: `Tu permutes et esquives l'attaque de ${enemy.nom} !` }; }
    if (rng.chance(dodge)) return { degats: 0, txt: `Tu esquives l'attaque de ${enemy.nom}.` };

    d = rng.variance(d) - eff(oc, "resistance") * 0.8;
    if (oc.combat.garde) { d *= 0.5; oc.combat.garde = false; }
    if (oc.combat.bouclier) { const abs = Math.min(oc.combat.bouclier, d); d -= abs; oc.combat.bouclier = 0; }
    d = Math.max(1, Math.round(d));
    oc.vitals.pv = Math.max(0, oc.vitals.pv - d);
    return { degats: d, txt: `${enemy.nom} te touche : ${d} dégâts.` };
}

// Démarre un combat.
function start(oc, enemyDef) {
    oc.combat = { enemy: makeEnemy(enemyDef), tour: 1, log: [], termine: false, issue: null, cooldowns: {}, analyse: false };
    return oc.combat;
}

// Résout une action du joueur puis la riposte ennemie.
function action(oc, act, param) {
    const c = oc.combat;
    if (!c || c.termine) return { ok: false, error: "Aucun combat en cours." };
    const enemy = c.enemy;
    const log = [];

    // Fuite
    if (act === "fuir") {
        const p = clamp(0.3 + (eff(oc, "vitesse") - enemy.stats.vitesse) * 0.03, 0.1, 0.85);
        if (rng.chance(p)) { c.termine = true; c.issue = "fuite"; return { ok: true, termine: true, issue: "fuite", log: ["Tu prends la fuite avec succès."] }; }
        log.push("Ta tentative de fuite échoue !");
    } else if (act === "attaquer") {
        log.push(playerPhysical(oc, enemy).txt);
    } else if (act === "jutsu") {
        const r = playerJutsu(oc, enemy, param);
        if (r.erreur) return { ok: false, error: r.erreur };
        log.push(r.txt);
    } else if (act === "defendre") { c.garde = true; log.push("Tu te mets en garde (dégâts réduits ce tour)."); }
    else if (act === "esquiver") { c.esquiveGarantie = rng.chance(clamp(0.4 + eff(oc, "reflexes") * 0.02, 0, 0.9)); log.push(c.esquiveGarantie ? "Tu te prépares à esquiver." : "Tu tentes de te positionner."); }
    else if (act === "objet") { const r = inv.useItem(oc, param); if (!r.ok) return { ok: false, error: r.error }; log.push(`Tu utilises ${r.nom} (${r.effets.join(", ")}).`); }
    else if (act === "analyser") { c.analyse = true; log.push(`Analyse : ${enemy.nom} — PV ${enemy.pv}/${enemy.pvMax}, faiblesse : ${enemy.faiblesse || "inconnue"}.`); }
    else return { ok: false, error: "Action inconnue (attaquer/jutsu/defendre/esquiver/objet/analyser/fuir)." };

    // Fin par KO ennemi
    if (enemy.pv <= 0) {
        // Boss multi-phases
        if (enemy.isBoss && enemy.phase < enemy.phases) {
            enemy.phase += 1; enemy.pv = Math.round(enemy.pvMax * 0.7); enemy.chakra = enemy.chakraMax;
            log.push(`💢 ${enemy.nom} entre en phase ${enemy.phase} ! Il puise dans de nouvelles forces.`);
        } else {
            c.termine = true; c.issue = "victoire";
            return { ok: true, termine: true, issue: "victoire", log, enemy };
        }
    }

    // Riposte ennemie
    const dec = c.cooldowns; for (const k in dec) if (dec[k] > 0) dec[k]--;
    const rip = enemyTurn(oc, enemy);
    if (rip) log.push(rip.txt);

    // Fin par KO joueur
    if (oc.vitals.pv <= 0) {
        c.termine = true; c.issue = "defaite";
        return { ok: true, termine: true, issue: "defaite", log, enemy };
    }
    c.tour += 1;
    return { ok: true, termine: false, log, enemy, tour: c.tour };
}

// Applique le butin après victoire (déterministe).
function applyVictory(oc, enemy) {
    const b = enemy.butin || {};
    const rap = { ryo: b.ryo || 0, xp: b.xp || 0, items: [] };
    oc.ryo = (oc.ryo || 0) + rap.ryo;
    oc.xpCarriere = (oc.xpCarriere || 0) + rap.xp;
    const lvl = addXP(oc, rap.xp);
    (b.items || []).forEach(it => { inv.addItem(oc, it, 1); rap.items.push(it); });
    oc.combat = null;
    return { ...rap, lvl };
}

// Gère la défaite selon la difficulté.
function applyDefeat(oc) {
    const hardcore = oc.difficulte === "hardcore" && oc.mortPermanente;
    oc.combat = null;
    if (hardcore) { oc.mort = true; return { mort: true }; }
    // KO : réveil, PV/chakra partiels, petite perte de ryo/réputation
    oc.vitals.pv = Math.round(oc.stats.pvMax * 0.4);
    oc.vitals.chakra = Math.round(oc.stats.chakraMax * 0.4);
    oc.lieu = "konoha";
    const perte = Math.round((oc.ryo || 0) * 0.1);
    oc.ryo = Math.max(0, (oc.ryo || 0) - perte);
    return { mort: false, ko: true, perteRyo: perte };
}

module.exports = { start, action, applyVictory, applyDefeat, makeEnemy };
