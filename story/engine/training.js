// ============================================================
//  story/engine/training.js
//  Entraînements : coûtent du temps et de l'endurance, montent les stats/XP.
// ============================================================
const rng = require("./rng");
const world = require("./world");
const { addXP } = require("./progression");

const TYPES = {
    course:      { stat: "vitesse", heures: 2, txt: "Tu enchaînes les sprints autour du village." },
    meditation:  { stat: "controleChakra", heures: 2, txt: "Assis en tailleur, tu affines ton contrôle du chakra." },
    shuriken:    { stat: "precision", heures: 1, txt: "Tu lances des shuriken sur des cibles mouvantes." },
    taijutsu:    { stat: "taijutsu", heures: 2, txt: "Tu répètes des katas de combat rapproché." },
    escalade:    { stat: "endurance_stat", heures: 2, txt: "Tu grimpes en n'utilisant que ton chakra." },
    force:       { stat: "force", heures: 2, txt: "Musculation intensive et frappes lourdes." },
    genjutsu:    { stat: "genjutsu", heures: 2, txt: "Tu t'exerces à tisser des illusions." },
    ninjutsu:    { stat: "ninjutsu", heures: 2, txt: "Tu répètes tes enchaînements de signes." },
};

function entrainer(oc, type) {
    const t = TYPES[type];
    if (!t) return { ok: false, error: `Entraînements : ${Object.keys(TYPES).join(", ")}.` };
    if ((oc.besoins?.fatigue || 0) > 85) return { ok: false, error: "Trop fatigué pour t'entraîner. Repose-toi." };

    world.advanceTime(oc, t.heures);
    oc.vitals.endurance = Math.max(0, oc.vitals.endurance - 25);
    oc.besoins.fatigue = Math.min(100, oc.besoins.fatigue + 15);

    // gain : petite chance de +1 sur la stat, XP carrière garantie
    const statCible = t.stat === "endurance_stat" ? null : t.stat;
    let gainStat = null;
    const prog = rng.int(1, 4) + Math.floor((oc.potentiel || 50) / 25);
    oc.xpCarriere = (oc.xpCarriere || 0) + prog * 5;
    const lvl = addXP(oc, prog * 5);
    if (statCible && rng.chance(0.5)) { oc.stats[statCible] = (oc.stats[statCible] || 0) + 1; gainStat = statCible; }
    if (t.stat === "endurance_stat") { oc.stats.enduranceMax += 3; gainStat = "enduranceMax"; }

    oc.maitrise = Math.min(100, (oc.maitrise || 0) + 1);
    return { ok: true, txt: t.txt, gainStat, xp: prog * 5, lvl };
}
module.exports = { entrainer, TYPES };
