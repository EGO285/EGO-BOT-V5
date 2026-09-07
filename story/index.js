// ============================================================
//  story/index.js  —  Façade du MODE HISTOIRE OC (Shinobi Storm)
//  Architecture : COMMANDES → GAME ENGINE (déterministe) → IA GM (narration)
//                 → SAUVEGARDE (Upstash). L'IA ne calcule jamais les chiffres.
// ============================================================
const db = require("./engine/db");
const profileMod = require("./engine/profile");
const progression = require("./engine/progression");
const combat = require("./engine/combat");
const survival = require("./engine/survival");
const inventory = require("./engine/inventory");
const economy = require("./engine/economy");
const missions = require("./engine/missions");
const exploration = require("./engine/exploration");
const training = require("./engine/training");
const relations = require("./engine/relations");
const world = require("./engine/world");
const render = require("./ui/render");
const gm = require("./ai/gm");
const { JUTSU } = require("./data/jutsu");
const { CLANS } = require("./data/clans");
const { loc, LOCATIONS } = require("./data/locations");
const { SHOPS, ITEMS } = require("./data/items");
const { NPCS } = require("./data/npcs");
const { BOSSES } = require("./data/bosses");

const BIND = (sender) => `story:bind:${sender}`;

// Résout l'OC lié à ce joueur WhatsApp.
async function resolvePseudo(sender) { return db.get(BIND(sender)); }

function combatActif(oc) { return oc && oc.combat && !oc.combat.termine; }

// Trouve un jutsu connu par nom approximatif ou id.
function resolveJutsu(oc, q) {
    if (!q) return null;
    const t = q.toLowerCase();
    let m = oc.techniques.find(x => x.id === t);
    if (m) return m.id;
    m = oc.techniques.find(x => (JUTSU[x.id]?.nom || "").toLowerCase().includes(t));
    return m ? m.id : null;
}

// Enrobe un résultat moteur d'une narration IA (si dispo), sinon texte brut.
async function withNarration(oc, mecanique, extra) {
    const n = await gm.narrate(oc, mecanique, extra || {});
    return n ? `🎴 ${n}` : `📖 ${mecanique}`;
}

// Petit panneau de fin d'action (état rapide).
function tick(oc) { return `\n\n${render.hud(oc)}`; }

// ============================================================
//  DISPATCHER PRINCIPAL
//  ctx = { sender, fiche, sub, arg, rawArg }
// ============================================================
async function run(ctx) {
    const { sender, fiche } = ctx;
    let sub = (ctx.sub || "").toLowerCase();
    const arg = (ctx.arg || "").trim();

    // ---- Création / accès ----
    if (["commencer", "start", "creer", "créer", "nouveau"].includes(sub)) {
        if (!fiche) return { text: "🚫 Tu dois d'abord créer ta fiche Shinobi Storm avant de pouvoir commencer une Histoire OC.\n👉 *!new <pseudo>*" };
        const existant = await db.getOC(fiche.pseudo);
        if (existant && !ctx.forceReset) {
            await db.set(BIND(sender), fiche.pseudo);
            return { text: `📖 Tu as déjà un personnage : *${existant.identite.prenom}*.\nTape *!histoire* pour reprendre, ou *!histoire supprimer* pour recommencer.` };
        }
        // options : clan, sexe via arg "clan=uchiha sexe=M prenom=..."
        const opts = parseOpts(arg);
        const oc = profileMod.createOC(fiche.pseudo, fiche, opts);
        await db.saveOC(fiche.pseudo, oc);
        await db.set(BIND(sender), fiche.pseudo);
        await db.pushLog(fiche.pseudo, "create", `OC créé (clan ${oc.identite.clan})`);
        const intro = await withNarration(oc, `Le personnage ${oc.identite.prenom} du clan ${oc.identite.clan} entre à l'académie de Konoha, plein d'ambition.`, { lieuNom: "Académie de Konoha", consigne: "Accueille le joueur dans le monde et donne-lui envie de jouer." });
        return { text: `✅ *Personnage créé !*\n\n${intro}\n\n${render.fiche(oc)}\n\n_Tape *!histoire* pour voir tes options, ou *!histoire aide*._` };
    }

    // Résoudre le personnage courant
    const pseudo = await resolvePseudo(sender);
    if (!pseudo) {
        return { text: "🍥 *SHINOBI STORM — MODE HISTOIRE*\n\nTu n'as pas encore de personnage lié.\n👉 *!histoire commencer* (il te faut une fiche Shinobi Storm, sinon fais *!new <pseudo>*).\n\nOptions à la création : *!histoire commencer clan=uchiha sexe=M prenom=Kaito*" };
    }
    let oc = await db.getOC(pseudo);
    if (!oc) { await db.del(BIND(sender)); return { text: "❌ Personnage introuvable. Refais *!histoire commencer*." }; }
    if (oc.mort) return { text: `💀 *${oc.identite.prenom}* est mort (mort permanente activée). Son aventure s'achève ici.\n\nTape *!histoire supprimer* puis *!histoire commencer* pour repartir de zéro.` };

    let out;

    // ---- Actions de COMBAT (prioritaires si combat en cours) ----
    if (combatActif(oc)) {
        const actionsCombat = ["attaquer", "jutsu", "defendre", "défendre", "esquiver", "fuir", "objet", "analyser"];
        if (actionsCombat.includes(sub)) {
            out = await doCombat(oc, sub, arg);
            await db.saveOC(pseudo, oc);
            return out;
        }
        if (sub === "" || sub === "combat") {
            return { text: renderCombat(oc, ["Combat en cours."]) };
        }
        // toute autre commande pendant le combat
        return { text: `⚔️ Tu es en plein combat contre *${oc.combat.enemy.nom}* !\nActions : *attaquer · jutsu <nom> · defendre · esquiver · objet <obj> · analyser · fuir*` };
    }

    // ---- Menu / reprise ----
    if (sub === "" || sub === "reprendre") {
        const dernier = oc.journal?.[0]?.txt || "Ton aventure continue.";
        return { text: `${render.hud(oc)}\n\n🕮 _${dernier}_\n\nQue veux-tu faire ?\n▫️ explorer · voyager <lieu> · carte\n▫️ mission · entrainer <type>\n▫️ fiche · jutsu · sac · boutique\n▫️ manger · dormir · relations\n_(!histoire aide pour tout voir)_` };
    }

    switch (sub) {
        case "aide": return { text: aide() };
        case "fiche": case "perso": return { text: render.fiche(oc) + tick(oc) };
        case "stats":
            if (arg) { const r = progression.allocate(oc, arg.toLowerCase()); await db.saveOC(pseudo, oc); return { text: r.ok ? `✅ ${r.stat} → ${r.valeur} (reste ${r.reste} pts)` : `❌ ${r.error}` }; }
            return { text: render.fiche(oc) };
        case "jutsu": case "techniques": return { text: render.techniques(oc) };
        case "sac": case "inventaire": return { text: render.inventaire(oc) };
        case "objet": case "utiliser": {
            const id = resolveItem(arg); if (!id) return { text: "Quel objet ? *!histoire objet <nom>* (vois !histoire sac)." };
            const r = inventory.useItem(oc, id); await db.saveOC(pseudo, oc);
            return { text: r.ok ? `✅ ${r.nom} utilisé (${r.effets.join(", ") || "aucun effet"}).${tick(oc)}` : `❌ ${r.error}` };
        }
        case "carte": case "map": {
            const dest = exploration.destinations(oc).map(d => `• *${d.id}* — ${d.nom} (${d.heures}h, danger ${d.danger})`).join("\n");
            return { text: `🗺️ *CARTE* — tu es à *${loc(oc.lieu).nom}*\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\nDestinations :\n${dest}\n\n👉 *!histoire voyager <lieu>*` };
        }
        case "explorer": out = await doExplore(oc); await db.saveOC(pseudo, oc); return out;
        case "voyager": case "aller": out = await doTravel(oc, arg); await db.saveOC(pseudo, oc); return out;
        case "mission": out = await doMission(oc, arg); await db.saveOC(pseudo, oc); return out;
        case "entrainer": case "entraîner": out = await doTrain(oc, arg); await db.saveOC(pseudo, oc); return out;
        case "manger": out = doEat(oc, arg); await db.saveOC(pseudo, oc); return out;
        case "boire": out = doDrink(oc, arg); await db.saveOC(pseudo, oc); return out;
        case "dormir": out = await doSleep(oc, arg); await db.saveOC(pseudo, oc); return out;
        case "boutique": case "shop": return { text: doShopList(oc, arg) };
        case "acheter": out = doBuy(oc, arg); await db.saveOC(pseudo, oc); return out;
        case "vendre": out = doSell(oc, arg); await db.saveOC(pseudo, oc); return out;
        case "relations": {
            const l = relations.liste(oc); if (!l.length) return { text: "Tu n'as encore tissé aucune relation notable." };
            return { text: "🤝 *RELATIONS*\n" + l.map(r => `• ${r.nom} — ${r.type} (${r.valeur})`).join("\n") };
        }
        case "reputation": case "réputation": {
            const r = oc.reputation;
            return { text: `🏅 *RÉPUTATION*\nKonoha ${r.konoha} · clan ${r.clan} · militaire ${r.militaire} · criminel ${r.criminel} · international ${r.international}` };
        }
        case "apprendre": out = await doLearn(oc, arg); await db.saveOC(pseudo, oc); return out;
        case "rang": case "examen": case "promotion": {
            const c = progression.canPromote(oc);
            if (!c.ok) return { text: `📈 *PROGRESSION DE CARRIÈRE*\nRang actuel : *${oc.identite.rang}*\nXP de carrière : ${oc.xpCarriere || 0}\n\n⏳ ${c.raison}\n_Fais des missions et entraîne-toi pour progresser._` };
            const pr = progression.promote(oc); await db.saveOC(pseudo, oc);
            profileMod.journal(oc, `Promotion : ${pr.rang.nom} !`);
            const narr = await withNarration(oc, `Le joueur est officiellement promu au rang de ${pr.rang.nom}.`, { consigne: "Décris la cérémonie/reconnaissance de promotion." });
            return { text: `${narr}\n\n🎖️ *PROMOTION !* Tu es désormais *${pr.rang.nom}* (+${pr.rang.points} points, PV et chakra en hausse).${tick(oc)}` };
        }
        case "sauvegarde": case "save": await db.saveOC(pseudo, oc); return { text: "💾 Partie sauvegardée." };
        case "abandonner": { const r = missions.abandonner(oc); await db.saveOC(pseudo, oc); return { text: r.ok ? `🏳️ Mission « ${r.titre} » abandonnée (réputation -5).` : `❌ ${r.error}` }; }
        case "difficulte": case "difficulté": {
            const m = arg.toLowerCase(); if (!["narratif","normal","shinobi","hardcore"].includes(m)) return { text: "Difficultés : narratif, normal, shinobi, hardcore." };
            oc.difficulte = m; if (m !== "hardcore") oc.mortPermanente = false; await db.saveOC(pseudo, oc); return { text: `⚙️ Difficulté : *${m}*.` };
        }
        case "mortpermanente": { oc.mortPermanente = /on|oui|1|true/i.test(arg); await db.saveOC(pseudo, oc); return { text: `☠️ Mort permanente : *${oc.mortPermanente ? "ON" : "OFF"}*.` }; }
        case "supprimer": case "reset":
            if (!/confirmer|confirm|oui/i.test(arg)) return { text: "⚠️ Ça effacera DÉFINITIVEMENT ton personnage.\nTape *!histoire supprimer confirmer* pour valider." };
            await db.delOC(pseudo); await db.del(BIND(sender)); return { text: "🗑️ Personnage supprimé. *!histoire commencer* pour repartir." };
        default:
            return { text: `❓ Sous-commande inconnue : *${sub}*.\nTape *!histoire aide* pour la liste.` };
    }
}

// ---------- Actions détaillées ----------
async function doCombat(oc, sub, arg) {
    const enemyNom = oc.combat.enemy.nom;
    let param = null;
    if (sub === "jutsu") { param = resolveJutsu(oc, arg); if (!param) return { text: `❌ Tu ne connais pas « ${arg} ». Vois !histoire jutsu.` }; }
    if (sub === "objet") { param = resolveItem(arg); if (!param) return { text: "Quel objet ?" }; }
    if (sub === "défendre") sub = "defendre";

    const r = combat.action(oc, sub, param);
    if (!r.ok) return { text: `❌ ${r.error}` };

    if (r.termine) {
        if (r.issue === "victoire") {
            const rec = combat.applyVictory(oc, r.enemy);
            profileMod.journal(oc, `Victoire contre ${enemyNom}.`);
            let msg = `🏆 *VICTOIRE* contre ${enemyNom} !\n+${rec.ryo}💴 · +${rec.xp} XP` + (rec.items.length ? ` · butin : ${rec.items.map(i => ITEMS[i]?.nom || i).join(", ")}` : "");
            if (rec.lvl.niveauxGagnes.length) msg += `\n⬆️ Niveau ${rec.lvl.niveau} atteint !`;
            // Si ce combat était l'objectif d'une mission, on la clôture aussi.
            if (oc._missionCombat && oc.quete) {
                const mrec = missions.recompenser(oc, oc.quete);
                msg += `\n\n🎉 *MISSION ACCOMPLIE* : +${mrec.ryo}💴 · +${mrec.xp} XP (réputation en hausse)`;
            }
            oc._missionCombat = false;
            const narr = await withNarration(oc, `${enemyNom} s'effondre, vaincu. ${r.log.join(" ")}`, { consigne: "Raconte la fin héroïque du combat." });
            return { text: `${narr}\n\n${msg}${tick(oc)}` };
        }
        if (r.issue === "defaite") {
            oc._missionCombat = false;
            const d = combat.applyDefeat(oc);
            profileMod.journal(oc, `Défaite contre ${enemyNom}.`);
            if (d.mort) return { text: `💀 ${r.log.join("\n")}\n\n*${oc.identite.prenom} est tombé au combat.* (mort permanente)` };
            const narr = await withNarration(oc, `Le joueur est mis KO par ${enemyNom} et ramené à Konoha. ${r.log.join(" ")}`, { consigne: "Raconte la défaite sans tuer le joueur." });
            return { text: `${narr}\n\n💫 KO ! Tu te réveilles à l'hôpital de Konoha (-${d.perteRyo}💴).${tick(oc)}` };
        }
        if (r.issue === "fuite") { oc._missionCombat = false; profileMod.journal(oc, `Fuite devant ${enemyNom}.`); return { text: `🏃 ${r.log.join("\n")}${tick(oc)}` };
        }
    }
    const narr = await withNarration(oc, r.log.join(" "), { consigne: "Raconte cet échange de combat de façon nerveuse et immersive." });
    return { text: `${narr}\n\n${renderCombat(oc, r.log)}` };
}

function renderCombat(oc, log) {
    const e = oc.combat.enemy;
    return [
        `⚔️ *COMBAT — tour ${oc.combat.tour}*`,
        `🆚 ${e.nom}  ❤️ ${render.bar(e.pv, e.pvMax)} ${e.pv}/${e.pvMax}`,
        `👤 ❤️ ${oc.vitals.pv}/${oc.stats.pvMax}  🔵 ${oc.vitals.chakra}/${oc.stats.chakraMax}  ⚡ ${oc.vitals.endurance}/${oc.stats.enduranceMax}`,
        "▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔",
        ...log.map(l => "• " + l),
        "▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔",
        "Actions : attaquer · jutsu <nom> · defendre · esquiver · objet <obj> · analyser · fuir",
    ].join("\n");
}

async function startFight(oc, enemyDef, introTxt) {
    combat.start(oc, enemyDef);
    const narr = await withNarration(oc, introTxt, { consigne: "Plante le décor du combat qui commence." });
    return { text: `${narr}\n\n${renderCombat(oc, [introTxt])}` };
}

async function doExplore(oc) {
    const r = exploration.explorer(oc);
    return handleEvent(oc, r.event, `Tu explores ${r.lieu.nom}.`);
}

async function doTravel(oc, destArg) {
    if (!destArg) return { text: "Où ? *!histoire voyager <lieu>* (vois !histoire carte)." };
    const r = exploration.travel(oc, destArg.toLowerCase());
    if (!r.ok) return { text: `❌ ${r.error}` };
    profileMod.journal(oc, `Voyage vers ${r.dest.nom}.`);
    return handleEvent(oc, r.event, `Après ${r.heures}h de route, tu arrives à ${r.dest.nom}.`);
}

// Traite un événement de rencontre (combat / marchand / trésor / etc.).
async function handleEvent(oc, ev, prefixe) {
    if (!ev || ev.type === "rien") {
        const narr = await withNarration(oc, `${prefixe} Rien d'anormal.`, { consigne: "Décris brièvement l'ambiance des lieux." });
        return { text: `${narr}${tick(oc)}` };
    }
    if (ev.type === "combat") {
        const def = BOSSES[ev.ennemi] || npcAsEnemy(ev.ennemi);
        return startFight(oc, def, `${prefixe} ${ev.txt}`);
    }
    if (ev.type === "tresor") {
        const ryo = 100 + Math.floor(Math.random() * 400); oc.ryo += ryo;
        const narr = await withNarration(oc, `${prefixe} ${ev.txt} Tu trouves ${ryo} Ryo.`, {});
        return { text: `${narr}\n\n💰 +${ryo}💴${tick(oc)}` };
    }
    if (ev.type === "marchand") {
        return { text: `${prefixe}\n🧺 ${ev.txt}\nTu peux commercer : *!histoire boutique marche_noir*${tick(oc)}` };
    }
    // rencontre / mystere : narration pure
    const narr = await withNarration(oc, `${prefixe} ${ev.txt}`, { consigne: "Fais-en un petit moment d'histoire vivant." });
    return { text: `${narr}${tick(oc)}` };
}

function npcAsEnemy(id) {
    const n = NPCS[id] || BOSSES.chef_bandits;
    return { nom: n.nom, niveau: n.niveau, rang: n.rang, pv: 80 + n.niveau * 6, chakra: 40 + n.niveau * 3,
        stats: { force: 5 + n.niveau * 0.4, vitesse: 5 + n.niveau * 0.4, reflexes: 5, taijutsu: 5 + n.niveau * 0.3, ninjutsu: 5, precision: 5, resistance: 5 },
        techniques: n.peutEnseigner || [], butin: { ryo: n.niveau * 40, xp: n.niveau * 25, items: [] } };
}

async function doMission(oc, arg) {
    if (!arg) {
        if (oc.quete) return { text: `📜 *MISSION EN COURS*\n${oc.quete.titre} [${oc.quete.rang}] — ${oc.quete.desc}\nLieu : ${LOCATIONS[oc.quete.lieu]?.nom || oc.quete.lieu}\n\n👉 *!histoire mission ${oc.quete.ennemi ? "combattre" : "finir"}*` };
        const dispo = missions.disponibles(oc);
        const l = dispo.map((m, i) => `${i + 1}. [${m.rang}] *${m.titre}* — ${m.desc} (${m.recompense.ryo}💴)`).join("\n");
        return { text: `📋 *MISSIONS DISPONIBLES* (rang ${oc.identite.rang})\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n${l}\n\n👉 *!histoire mission <numéro>* pour accepter.` };
    }
    if (/^\d+$/.test(arg)) { const r = missions.accepter(oc, parseInt(arg) - 1); return { text: r.ok ? `✅ Mission acceptée : *${r.mission.titre}*.\nRends-toi sur les lieux puis *!histoire mission ${r.mission.ennemi ? "combattre" : "finir"}*.` : `❌ ${r.error}` }; }
    if (arg === "combattre") {
        if (!oc.quete) return { text: "Aucune mission en cours." };
        if (!oc.quete.ennemi) return { text: "Cette mission ne comporte pas d'ennemi. Fais *!histoire mission finir*." };
        const def = BOSSES[oc.quete.ennemi] || npcAsEnemy(oc.quete.ennemi);
        oc._missionCombat = true;
        return startFight(oc, def, `Tu affrontes l'objectif de ta mission : ${def.nom}.`);
    }
    if (arg === "finir") {
        const r = missions.resoudreNonCombat(oc);
        if (!r.ok) return { text: `❌ ${r.error}` };
        if (r.reussi) { profileMod.journal(oc, `Mission réussie : ${r.mission.titre}.`); return { text: `🎉 *MISSION RÉUSSIE* : ${r.mission.titre}\n+${r.rec.ryo}💴 · +${r.rec.xp} XP${r.rec.lvl.niveauxGagnes.length ? `\n⬆️ Niveau ${r.rec.lvl.niveau} !` : ""}${tick(oc)}` }; }
        return { text: `😓 La mission « ${r.mission.titre} » échoue cette fois (réputation -2). Retente : *!histoire mission finir*.` };
    }
    return { text: "Usage : *!histoire mission* · *mission <n>* · *mission combattre* · *mission finir*." };
}

// Fin de mission par combat : appelée quand un combat de mission est gagné.
async function doTrain(oc, arg) {
    const r = training.entrainer(oc, (arg || "").toLowerCase());
    if (!r.ok) return { text: `❌ ${r.error}` };
    let msg = `🏋️ ${r.txt}\n+${r.xp} XP` + (r.gainStat ? ` · ${r.gainStat} +1` : "");
    if (r.lvl.niveauxGagnes.length) msg += `\n⬆️ Niveau ${r.lvl.niveau} !`;
    const narr = await withNarration(oc, `${r.txt} Progrès : ${r.gainStat || "endurance"}.`, { consigne: "Décris la séance d'entraînement." });
    return { text: `${narr}\n\n${msg}${tick(oc)}` };
}

function doEat(oc, arg) {
    const id = resolveItem(arg) || oc.inventaire.find(i => ITEMS[i.id]?.effet?.faim)?.id;
    if (!id) return { text: "Tu n'as rien à manger. Achète de quoi au restaurant (*!histoire boutique restaurant*)." };
    const r = inventory.useItem(oc, id);
    return { text: r.ok ? `🍙 Tu manges : ${r.nom} (${r.effets.join(", ")}).` : `❌ ${r.error}` };
}
function doDrink(oc, arg) {
    const id = resolveItem(arg) || oc.inventaire.find(i => ITEMS[i.id]?.effet?.soif)?.id;
    if (!id) return { text: "Tu n'as rien à boire (*!histoire boutique restaurant*)." };
    const r = inventory.useItem(oc, id);
    return { text: r.ok ? `🥤 Tu bois : ${r.nom} (${r.effets.join(", ")}).` : `❌ ${r.error}` };
}
async function doSleep(oc, arg) {
    const l = loc(oc.lieu);
    if (!l.services?.includes("repos") && oc.lieu !== "konoha" && !inventory.has(oc, "tente")) {
        return { text: "😴 Impossible de dormir ici en sécurité. Rejoins un village, une auberge, ou emporte une tente." };
    }
    const h = Math.max(1, Math.min(12, parseInt(arg) || 8));
    world.advanceTime(oc, h);
    survival.dormir(oc, h);
    profileMod.journal(oc, `Repos de ${h}h.`);
    return { text: `😴 Tu dors ${h}h. Tu te réveilles reposé.${tick(oc)}` };
}

function doShopList(oc, arg) {
    const l = loc(oc.lieu);
    const dispo = (l.services || []).filter(s => SHOPS[s]);
    if (!arg) {
        if (!dispo.length) return "🚪 Aucune boutique ici.";
        return `🏪 *BOUTIQUES ICI* (${l.nom})\n` + dispo.map(s => `• ${s} — ${SHOPS[s].nom}`).join("\n") + `\n\n👉 *!histoire boutique <nom>* pour voir les articles.`;
    }
    const shop = SHOPS[arg];
    if (!shop) return "Boutique inconnue.";
    if (!dispo.includes(arg)) return `Cette boutique n'est pas accessible ici (${l.nom}).`;
    const items = shop.items.map(id => `• *${id}* — ${ITEMS[id].nom} : ${economy.prixAchat(oc, id)}💴`).join("\n");
    return `🏪 *${shop.nom}*  ·  Ton or : ${oc.ryo}💴\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n${items}\n\n👉 *!histoire acheter ${arg} <objet>*`;
}
function doBuy(oc, arg) {
    const [shop, item, q] = arg.split(/\s+/);
    if (!shop || !item) return { text: "Usage : *!histoire acheter <boutique> <objet> [quantité]*" };
    const l = loc(oc.lieu);
    if (!(l.services || []).includes(shop)) return { text: "Cette boutique n'est pas ici." };
    const r = economy.acheter(oc, shop, item, parseInt(q) || 1);
    return { text: r.ok ? `🛍️ Acheté : ${r.item} (-${r.total}💴). Il te reste ${oc.ryo}💴.` : `❌ ${r.error}` };
}
function doSell(oc, arg) {
    const [item, q] = arg.split(/\s+/);
    const id = resolveItem(item);
    if (!id) return { text: "Usage : *!histoire vendre <objet> [quantité]*" };
    const r = economy.vendre(oc, id, parseInt(q) || 1);
    return { text: r.ok ? `💰 Vendu : ${r.item} (+${r.gain}💴).` : `❌ ${r.error}` };
}

async function doLearn(oc, arg) {
    // Apprendre auprès d'un PNJ présent : "apprendre <technique>"
    const l = loc(oc.lieu);
    const mentorsIci = Object.entries(NPCS).filter(([id, n]) => n.lieu === oc.lieu && (n.peutEnseigner || []).length);
    if (!arg) {
        if (!mentorsIci.length) return { text: "Aucun mentor ici. Cherche un sensei (Iruka, Kakashi, Jiraiya, Tsunade...)." };
        const l2 = mentorsIci.map(([id, n]) => `• ${n.nom} enseigne : ${n.peutEnseigner.map(j => JUTSU[j]?.nom || j).join(", ")}`).join("\n");
        return { text: `📖 *MENTORS ICI*\n${l2}\n\n👉 *!histoire apprendre <technique>*` };
    }
    const cible = arg.toLowerCase();
    for (const [id, n] of mentorsIci) {
        for (const jid of n.peutEnseigner) {
            if (jid === cible || (JUTSU[jid]?.nom || "").toLowerCase().includes(cible)) {
                if (oc.techniques.find(t => t.id === jid)) return { text: "Tu connais déjà cette technique." };
                const rel = relations.ensure(oc, id).valeur;
                if (rel < 20) return { text: `🙅 ${n.nom} ne te fait pas encore assez confiance pour t'enseigner ça (relation ${rel}/100). Gagne sa confiance d'abord.` };
                oc.techniques.push({ id: jid, maitrise: 10 });
                profileMod.journal(oc, `${n.nom} t'a enseigné ${JUTSU[jid].nom}.`);
                const narr = await withNarration(oc, `${n.nom} enseigne ${JUTSU[jid].nom} au joueur.`, { consigne: "Décris la scène d'apprentissage." });
                return { text: `${narr}\n\n✅ Nouvelle technique : *${JUTSU[jid].nom}* !` };
            }
        }
    }
    return { text: "Personne ici ne peut t'enseigner ça." };
}

// ---------- Utilitaires ----------
function resolveItem(q) {
    if (!q) return null;
    const t = q.toLowerCase();
    if (ITEMS[t]) return t;
    const e = Object.entries(ITEMS).find(([id, d]) => d.nom.toLowerCase().includes(t));
    return e ? e[0] : null;
}
function parseOpts(arg) {
    const o = {};
    (arg || "").split(/\s+/).forEach(p => { const [k, v] = p.split("="); if (k && v) o[k.trim()] = v.trim(); });
    if (o.mortpermanente) o.mortPermanente = /on|oui|1/i.test(o.mortpermanente);
    return o;
}
function aide() {
    return [
        "🍥 *MODE HISTOIRE — AIDE*",
        "▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔",
        "*!histoire commencer* — créer ton ninja (options: clan=, sexe=, prenom=)",
        "*!histoire* — reprendre / voir ton état",
        "— *fiche* · *stats <stat>* · *jutsu* · *sac*",
        "— *carte* · *voyager <lieu>* · *explorer*",
        "— *mission* · *mission <n>* · *mission combattre/finir*",
        "— *entrainer <type>* · *apprendre <tech>*",
        "— *manger* · *boire* · *dormir [h]*",
        "— *boutique [nom]* · *acheter* · *vendre*",
        "— *rang* (passer un grade) · *relations* · *reputation*",
        "— *difficulte <mode>* · *sauvegarde* · *supprimer*",
        "",
        "⚔️ *En combat* : attaquer · jutsu <nom> · defendre · esquiver · objet <obj> · analyser · fuir",
        "Clans : " + Object.keys(CLANS).filter(c => c !== "sans-clan").join(", "),
    ].join("\n");
}

module.exports = { run, resolvePseudo };
