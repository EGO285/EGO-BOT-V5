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
const worldmap = require("./engine/worldmap");
const coop = require("./engine/coop");
const training = require("./engine/training");
const relations = require("./engine/relations");
const world = require("./engine/world");
const render = require("./ui/render");
const gm = require("./ai/gm");
const arsenal = require("./engine/arsenal");
const combatgm = require("./ai/combatgm");
const { JUTSU } = require("./data/jutsu");
const { CLANS } = require("./data/clans");
const { loc, LOCATIONS } = require("./data/locations");
const { SHOPS, ITEMS } = require("./data/items");
const { NPCS } = require("./data/npcs");
const { BOSSES } = require("./data/bosses");
let getUser = null;
try { ({ getUser } = require("../utils/users")); } catch (e) {}

const BIND = (sender) => `story:bind:${sender}`;

// Sous-commandes reconnues (sert à distinguer un pseudo d'une commande).
const KNOWN_SUBS = new Set([
    "", "reprendre", "aide", "fiche", "perso", "stats", "jutsu", "techniques", "sac", "inventaire",
    "objet", "utiliser", "carte", "map", "explorer", "voyager", "aller", "mission", "entrainer",
    "entraîner", "manger", "boire", "dormir", "boutique", "shop", "acheter", "vendre", "relations",
    "reputation", "réputation", "apprendre", "sauvegarde", "save", "abandonner", "difficulte",
    "difficulté", "mortpermanente", "supprimer", "reset", "rang", "examen", "promotion", "combat",
    "attaquer", "jutsu", "defendre", "défendre", "esquiver", "fuir", "analyser",
    "aventurer", "frontiere", "frontière", "inconnu",
    "pause", "resume", "coop",
    "commencer", "start", "creer", "créer", "nouveau",
]);

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
        // Pseudo de la fiche = 1er mot sans "=", sinon la fiche déjà liée.
        const tokens = arg.split(/\s+/).filter(Boolean);
        let pseudoFiche = tokens.find(t => !t.includes("=")) || (await resolvePseudo(sender));
        if (!pseudoFiche) {
            return { text: "🍥 *MODE HISTOIRE* — pour commencer, donne le nom de ta fiche Shinobi Storm :\n👉 *!histoire commencer <ton pseudo>*\n_Ex : !histoire commencer Kaito clan=uchiha_\n\n_(pas encore de fiche ? crée-la avec *!new <pseudo>*)_" };
        }
        const fiche = getUser ? await getUser(pseudoFiche) : null;
        if (!fiche) return { text: `🚫 Aucune fiche Shinobi Storm au nom de *${pseudoFiche}*.\nCrée-la d'abord : *!new ${pseudoFiche}*` };

        const existant = await db.getOC(fiche.pseudo);
        if (existant) {
            await db.set(BIND(sender), fiche.pseudo);
            return { text: `📖 *${fiche.pseudo}* a déjà un personnage : *${existant.identite.prenom}*.\n✅ Fiche liée à ce compte — tape *!histoire* pour reprendre.\n_(ou *!histoire supprimer confirmer* pour recommencer)_` };
        }
        const opts = parseOpts(arg);
        const oc = profileMod.createOC(fiche.pseudo, fiche, opts);
        await db.saveOC(fiche.pseudo, oc);
        await db.set(BIND(sender), fiche.pseudo);
        await db.pushLog(fiche.pseudo, "create", `OC créé (clan ${oc.identite.clan})`);
        const intro = await withNarration(oc, `Le personnage ${oc.identite.prenom} du clan ${oc.identite.clan} entre à l'académie de Konoha, plein d'ambition.`, { lieuNom: "Académie de Konoha", consigne: "Accueille le joueur dans le monde et donne-lui envie de jouer." });
        return { text: `✅ *Personnage créé !*\n\n${intro}\n\n${render.fiche(oc)}\n\n_Tape *!histoire* pour voir tes options, ou *!histoire aide*._` };
    }

    // Résoudre le personnage courant
    let pseudo = await resolvePseudo(sender);

    // ---- Pas encore lié : lier une fiche existante ----
    if (!pseudo) {
        // "!histoire <pseudo>" (mot inconnu comme sous-commande) => tentative de liaison.
        if (sub && !KNOWN_SUBS.has(sub)) {
            const fiche = getUser ? await getUser(sub) : null;
            if (!fiche) return { text: `🚫 Aucune fiche Shinobi Storm au nom de *${sub}*.\nVérifie l'orthographe, ou crée ta fiche : *!new ${sub}*` };
            const existant = await db.getOC(fiche.pseudo);
            if (existant) {
                await db.set(BIND(sender), fiche.pseudo);
                pseudo = fiche.pseudo; // continue vers la reprise ci-dessous
                sub = ""; // affiche l'écran de reprise/HUD
            } else {
                return { text: `📇 Fiche *${fiche.pseudo}* trouvée, mais elle n'a pas encore de personnage Histoire.\n👉 *!histoire commencer ${fiche.pseudo}* pour créer ton ninja.` };
            }
        } else {
            return { text: "🍥 *SHINOBI STORM — MODE HISTOIRE*\n\nQuelle est ta fiche ? Écris ton pseudo pour la lier :\n👉 *!histoire <ton pseudo>*\n\n• Nouveau ? crée un ninja : *!histoire commencer <ton pseudo>*\n• Pas de fiche ? *!new <pseudo>* d'abord.\n_Aide complète : !histoire aide_" };
        }
    }
    let oc = await db.getOC(pseudo);
    if (!oc) { await db.del(BIND(sender)); return { text: "❌ Personnage introuvable. Refais *!histoire commencer*." }; }
    if (oc.mort) return { text: `💀 *${oc.identite.prenom}* est mort (mort permanente activée). Son aventure s'achève ici.\n\nTape *!histoire supprimer* puis *!histoire commencer* pour repartir de zéro.` };

    let out;

    // ---- COOP : combat de boss PARTAGÉ en cours ----
    const monEquipe = await coop.party(pseudo);
    const infoSubs = ["coop", "fiche", "perso", "sac", "inventaire", "jutsu", "techniques", "aide", "stats", "pause", "resume", ""];
    if (monEquipe && monEquipe.combat && !infoSubs.includes(sub)) {
        const pave = `${sub} ${arg}`.trim();
        out = await doCoopCombat(oc, pave, pseudo, monEquipe);
        await db.saveOC(pseudo, oc);
        return out;
    }

    // ---- COMBAT PAR PAVÉ (prioritaire si combat solo en cours) ----
    if (combatActif(oc)) {
        // Contrôles réservés
        if (sub === "fuir") { out = await doCombat(oc, "fuir", ""); await db.saveOC(pseudo, oc); return out; }
        if (sub === "pause") { await db.saveOC(pseudo, oc); return { text: `⏸️ Combat mis en pause et sauvegardé. Reviens avec *!histoire resume* — tu reprendras en plein duel contre *${oc.combat.enemy.nom}*.` }; }
        if (["statut", "etat", "état", "combat"].includes(sub) && !arg) {
            return { text: renderCombat(oc, [`À toi de jouer ! Écris ton action (ton pavé RP).`]) };
        }
        // Tout le reste = PAVÉ LIBRE du joueur
        const pave = `${sub} ${arg}`.trim();
        if (!pave) return { text: renderCombat(oc, ["Décris ton action : *!histoire <ton pavé de combat>*"]) };
        out = await doCombatIA(oc, pave, pseudo);
        await db.saveOC(pseudo, oc);
        return out;
    }

    // ---- Pause : sauvegarde et quitte ----
    if (sub === "pause") {
        await db.saveOC(pseudo, oc);
        return { text: `⏸️ *Histoire mise en pause et sauvegardée.*\n${oc.identite.prenom} t'attendra à *${oc.lieuNom || "Konoha"}*.\n\n▶️ Reviens quand tu veux avec *!histoire resume*.` };
    }

    // ---- Menu / reprise ----
    if (sub === "" || sub === "reprendre" || sub === "resume") {
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
            const map = await worldmap.load(pseudo);
            const ici = worldmap.resolve(map, oc.lieu);
            const dest = worldmap.destinations(map, oc.lieu).map(d => `• *${d.id}* — ${d.nom} ${d.genere ? "✨" : ""}(${d.heures}h, danger ${d.danger})`).join("\n") || "_aucune_";
            const desc = ici?.description ? `\n_${ici.description}_` : "";
            return { text: `🗺️ *CARTE* — tu es à *${ici ? ici.nom : oc.lieu}*${desc}\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\nDestinations :\n${dest}\n\n👉 *!histoire voyager <lieu>*\n🧭 *!histoire aventurer* — partir vers l'inconnu (génère une nouvelle zone)` };
        }
        case "explorer": out = await doExplore(oc, pseudo); await db.saveOC(pseudo, oc); return out;
        case "aventurer": case "frontiere": case "frontière": case "inconnu": out = await doAventurer(oc, pseudo); await db.saveOC(pseudo, oc); return out;
        case "voyager": case "aller": out = await doTravel(oc, arg, pseudo); await db.saveOC(pseudo, oc); return out;
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
        case "coop": out = await doCoop(oc, arg, pseudo); if (out.save !== false) await db.saveOC(pseudo, oc); return out;
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

// ---- Fins de combat réutilisables ----
async function endVictory(oc, enemy, narr) {
    const enemyNom = enemy.nom;
    const rec = combat.applyVictory(oc, enemy);
    profileMod.journal(oc, `Victoire contre ${enemyNom}.`);
    let msg = `🏆 *VICTOIRE* contre ${enemyNom} !\n+${rec.ryo}💴 · +${rec.xp} XP` + (rec.items.length ? ` · butin : ${rec.items.map(i => ITEMS[i]?.nom || i).join(", ")}` : "");
    if (rec.lvl.niveauxGagnes.length) msg += `\n⬆️ Niveau ${rec.lvl.niveau} atteint !`;
    if (oc._missionCombat && oc.quete) { const mrec = missions.recompenser(oc, oc.quete); msg += `\n\n🎉 *MISSION ACCOMPLIE* : +${mrec.ryo}💴 · +${mrec.xp} XP`; }
    oc._missionCombat = false;
    return { text: `${narr ? `🎴 ${narr}\n\n` : ""}${msg}${tick(oc)}` };
}
async function endDefeat(oc, enemy, narr) {
    oc._missionCombat = false;
    const d = combat.applyDefeat(oc);
    profileMod.journal(oc, `Défaite contre ${enemy.nom}.`);
    if (d.mort) return { text: `${narr ? `🎴 ${narr}\n\n` : ""}💀 *${oc.identite.prenom} est tombé au combat.* (mort permanente activée)` };
    return { text: `${narr ? `🎴 ${narr}\n\n` : ""}💫 KO ! Tu te réveilles à l'hôpital de Konoha (-${d.perteRyo}💴).${tick(oc)}` };
}

// ---- Combat par PAVÉ (résolu par l'IA, encadré par le moteur) ----
async function doCombatIA(oc, pave, pseudo) {
    const enemy = oc.combat.enemy;
    const usage = arsenal.detect(oc, pave);
    const r = await combatgm.resolve(oc, enemy, pave, usage);
    oc.combat.tour = (oc.combat.tour || 1) + 1;

    // Fin : ennemi vaincu (gère les phases de boss)
    if (enemy.pv <= 0) {
        if (enemy.isBoss && enemy.phase < enemy.phases) {
            enemy.phase += 1; enemy.pv = Math.round(enemy.pvMax * 0.7); enemy.chakra = enemy.chakraMax;
            const extra = `\n\n💢 ${enemy.nom} se relève — PHASE ${enemy.phase} ! Il puise dans de nouvelles forces.`;
            return { text: `🎴 ${r.narration}${extra}\n\n${renderCombatIA(oc, r)}` };
        }
        return endVictory(oc, enemy, r.narration);
    }
    // Fin : joueur KO
    if (oc.vitals.pv <= 0) return endDefeat(oc, enemy, r.narration);

    return { text: `🎴 ${r.narration}\n\n${renderCombatIA(oc, r)}` };
}

function renderCombatIA(oc, r) {
    const e = oc.combat.enemy;
    const lignes = [
        `⚔️ *COMBAT — tour ${oc.combat.tour}*  (${oc.difficulte})`,
        `🆚 ${e.nom}  ❤️ ${render.bar(e.pv, e.pvMax)} ${e.pv}/${e.pvMax}`,
        `👤 ❤️ ${oc.vitals.pv}/${oc.stats.pvMax}  🔵 ${oc.vitals.chakra}/${oc.stats.chakraMax}  ⚡ ${oc.vitals.endurance}/${oc.stats.enduranceMax}`,
    ];
    const dtl = [];
    if (r.dP) dtl.push(`💥 -${r.dP} à l'ennemi`);
    if (r.dS) dtl.push(`🩸 -${r.dS} pour toi`);
    if (r.chakraUsed) dtl.push(`🔵 -${r.chakraUsed} chakra`);
    if (r.itemsUsed?.length) dtl.push(`🎒 ${r.itemsUsed.join(", ")}`);
    if (r.fizzles?.length) dtl.push(`⚠️ chakra insuffisant : ${r.fizzles.join(", ")}`);
    if (r.invalid?.length) dtl.push(`🚫 non possédé (ignoré) : ${r.invalid.join(", ")}`);
    if (r.immobile) dtl.push(`😵 tu es resté immobile/à découvert !`);
    if (dtl.length) lignes.push("▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔", dtl.join("  ·  "));
    lignes.push("▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔", "✍️ Écris ta prochaine action (jutsu, taijutsu, ruse, objet...) · *fuir* pour tenter de partir");
    return lignes.join("\n");
}

// ============================================================
//  COOP — équipe + combat de boss partagé
// ============================================================
async function doCoop(oc, arg, pseudo) {
    const [action, ...rest] = arg.split(/\s+/);
    const a = (action || "").toLowerCase();
    const suite = rest.join(" ");

    if (!a || a === "info") {
        const p = await coop.party(pseudo);
        if (!p) return { text: "🤝 *COOP* — tu n'es dans aucune équipe.\n▫️ *!histoire coop creer* — créer une escouade (donne un code)\n▫️ *!histoire coop rejoindre <code>* — rejoindre\n_Puis affrontez un boss ensemble : *!histoire coop combat*_", save: false };
        const combatTxt = p.combat ? `\n⚔️ Combat en cours : *${p.combat.enemy.nom}* (${p.combat.enemy.pv}/${p.combat.enemy.pvMax} PV)` : "";
        return { text: `🤝 *ÉQUIPE ${p.code}*\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n👑 Chef : ${p.chef}\n🥷 Membres (${p.membres.length}/${coop.MAX}) : ${p.membres.join(", ")}${combatTxt}\n\n_Boss ensemble : *!histoire coop combat* · quitter : *!histoire coop quitter*_`, save: false };
    }
    if (a === "creer" || a === "créer" || a === "create") {
        const r = await coop.create(pseudo, oc.lieu);
        if (!r.ok) return { text: `❌ ${r.error}`, save: false };
        return { text: `✅ *Équipe créée !* Code : *${r.party.code}*\nPartage ce code : les autres tapent *!histoire coop rejoindre ${r.party.code}*.\nQuand vous êtes prêts : *!histoire coop combat*.`, save: false };
    }
    if (a === "rejoindre" || a === "join") {
        if (!suite) return { text: "Usage : *!histoire coop rejoindre <code>*", save: false };
        const r = await coop.join(pseudo, suite.toUpperCase());
        if (!r.ok) return { text: `❌ ${r.error}`, save: false };
        return { text: `✅ Tu as rejoint l'équipe *${r.party.code}* !\nMembres : ${r.party.membres.join(", ")}.\n_Boss ensemble : *!histoire coop combat*._`, save: false };
    }
    if (a === "quitter" || a === "leave") {
        const r = await coop.leave(pseudo);
        return { text: r.ok ? "👋 Tu as quitté l'équipe." : `❌ ${r.error}`, save: false };
    }
    if (a === "combat" || a === "boss") {
        const p = await coop.party(pseudo);
        if (!p) return { text: "Tu n'es dans aucune équipe (*!histoire coop creer*).", save: false };
        if (p.combat) return { text: `⚔️ Un combat est déjà en cours contre *${p.combat.enemy.nom}*. Écris ton action !`, save: false };
        // Boss mis à l'échelle du nombre de membres.
        const base = BOSSES.chef_bandits;
        const n = p.membres.length;
        const def = { ...base, pv: Math.round(base.pv * (1 + (n - 1) * 0.8)), butin: { ryo: base.butin.ryo, xp: base.butin.xp, items: base.butin.items } };
        await coop.setCombat(p, combat.makeEnemy(def));
        return { text: `🐉 *BOSS COOP — ${def.nom}* apparaît devant l'équipe *${p.code}* !\n❤️ ${def.pv} PV (mis à l'échelle pour ${n} ninja${n > 1 ? "s" : ""}).\n\n✍️ Chaque membre écrit son action : *!histoire <ton pavé>*.\n_Vous partagez le même ennemi — coordonnez-vous !_`, save: false };
    }
    return { text: "Usage : *!histoire coop* [creer|rejoindre <code>|combat|quitter|info]", save: false };
}

async function doCoopCombat(oc, pave, pseudo, party) {
    if (party.combat.downed?.includes(pseudo)) {
        return { text: "💫 Tu es KO pour ce combat. Attends que ton équipe termine (ou qu'elle gagne pour te relever)." };
    }
    const enemy = party.combat.enemy;
    const usage = arsenal.detect(oc, pave);
    const r = await combatgm.resolve(oc, enemy, pave, usage);
    party.combat.tour = (party.combat.tour || 1) + 1;

    // Victoire d'équipe
    if (enemy.pv <= 0) {
        const butin = enemy.butin || { ryo: 500, xp: 300, items: [] };
        const recompenses = [];
        for (const m of party.membres) {
            const moc = await db.getOC(m);
            if (!moc || party.combat.downed?.includes(m)) continue;
            moc.ryo = (moc.ryo || 0) + butin.ryo;
            moc.xpCarriere = (moc.xpCarriere || 0) + butin.xp;
            progression.addXP(moc, butin.xp);
            profileMod.journal(moc, `Boss coop vaincu : ${enemy.nom}.`);
            await db.saveOC(m, moc);
            recompenses.push(m);
        }
        await coop.clearCombat(party);
        await db.saveOC(pseudo, oc);
        return { text: `🎴 ${r.narration}\n\n🏆 *${enemy.nom} est terrassé par l'équipe ${party.code} !*\n🎁 Chacun reçoit +${butin.ryo}💴 · +${butin.xp} XP\n🥷 ${recompenses.join(", ")}` };
    }

    // Membre KO
    if (oc.vitals.pv <= 0) {
        party.combat.downed = party.combat.downed || [];
        if (!party.combat.downed.includes(pseudo)) party.combat.downed.push(pseudo);
        combat.applyDefeat(oc);
        await coop.saveParty(party);
        await db.saveOC(pseudo, oc);
        // toute l'équipe KO ?
        if (party.combat.downed.length >= party.membres.length) {
            await coop.clearCombat(party);
            return { text: `🎴 ${r.narration}\n\n💀 *L'équipe est vaincue...* ${enemy.nom} l'emporte. Repartez plus forts !` };
        }
        return { text: `🎴 ${r.narration}\n\n💫 *${oc.identite.prenom} est KO !* Ses coéquipiers doivent finir le combat.` };
    }

    await coop.saveParty(party);
    await db.saveOC(pseudo, oc);
    const dtl = [];
    if (r.dP) dtl.push(`💥 -${r.dP} au boss`);
    if (r.dS) dtl.push(`🩸 -${r.dS} pour toi`);
    if (r.immobile) dtl.push("😵 immobile !");
    return { text: `🎴 ${r.narration}\n\n🐉 *${enemy.nom}* ❤️ ${render.bar(enemy.pv, enemy.pvMax)} ${enemy.pv}/${enemy.pvMax}\n👤 ${oc.identite.prenom} ❤️ ${oc.vitals.pv}/${oc.stats.pvMax} 🔵 ${oc.vitals.chakra}\n${dtl.join(" · ")}\n_L'équipe continue — écrivez vos actions !_` };
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
        "✍️ *Écris ton action librement* (ex : _!histoire je fonce et lance un Katon Goukakyuu vers ses jambes_).",
        "Utilise tes jutsu/objets réels — sinon tu restes exposé. · *fuir* pour partir · *pause* pour sauver & quitter",
    ].join("\n");
}

async function startFight(oc, enemyDef, introTxt) {
    combat.start(oc, enemyDef);
    const narr = await withNarration(oc, introTxt, { consigne: "Plante le décor du combat qui commence." });
    return { text: `${narr}\n\n${renderCombat(oc, [introTxt])}` };
}

async function doExplore(oc, pseudo) {
    const map = await worldmap.load(pseudo);
    const ici = worldmap.resolve(map, oc.lieu) || { nom: oc.lieu, danger: 1 };
    world.advanceTime(oc, 0.5);
    const ev = exploration.rollEvent(oc, (ici.danger || 1) + 1);
    return handleEvent(oc, ev, `Tu explores ${ici.nom}.`);
}

async function doTravel(oc, destArg, pseudo) {
    if (!destArg) return { text: "Où ? *!histoire voyager <lieu>* (vois !histoire carte)." };
    const map = await worldmap.load(pseudo);
    if ((oc.besoins?.fatigue || 0) > 90) return { text: "😩 Trop épuisé pour voyager. Repose-toi (!histoire dormir)." };
    const r = worldmap.travel(oc, map, destArg.toLowerCase());
    if (!r.ok) return { text: `❌ ${r.error}` };
    oc.lieuNom = r.dest ? r.dest.nom : oc.lieu;
    oc.lieuServices = (r.dest && r.dest.services) || [];
    profileMod.journal(oc, `Voyage vers ${oc.lieuNom}.`);
    const ev = exploration.rollEvent(oc, r.danger || 0);
    return handleEvent(oc, ev, `Après ${r.heures}h de route, tu arrives à ${oc.lieuNom}.`);
}

// OPEN WORLD : part vers l'inconnu, l'IA génère une nouvelle zone persistée.
async function doAventurer(oc, pseudo) {
    if ((oc.besoins?.fatigue || 0) > 90) return { text: "😩 Trop épuisé pour partir à l'aventure. Repose-toi d'abord." };
    const r = await worldmap.aventurer(oc, pseudo);
    oc.lieuNom = r.loc.nom;
    oc.lieuServices = r.loc.services || [];
    profileMod.journal(oc, `Découverte : ${r.loc.nom}.`);
    // narration : on donne la description générée à raconter
    const desc = `${r.loc.description} ${r.loc.ambiance}`.trim();
    const ev = exploration.rollEvent(oc, r.loc.danger);
    const arrivee = `Après ${r.heures}h à travers ${r.loc.type}, tu découvres un lieu inconnu : ${r.loc.nom}. ${desc}`;
    if (ev && ev.type !== "rien") {
        if (ev.type === "combat") { const def = BOSSES[ev.ennemi] || npcAsEnemy(ev.ennemi); return startFight(oc, def, `${arrivee} ${ev.txt}`); }
        return handleEvent(oc, ev, arrivee);
    }
    const narr = await withNarration(oc, arrivee, { lieuNom: r.loc.nom, consigne: "Fais découvrir ce nouveau lieu de façon immersive et donne envie de l'explorer." });
    return { text: `🧭 *NOUVELLE ZONE DÉCOUVERTE* ✨\n\n${narr}\n\n📍 *${r.loc.nom}* (${r.loc.type}, danger ${r.loc.danger})${r.loc.services.length ? `\n🏪 Services : ${r.loc.services.join(", ")}` : ""}\n_Ce lieu est sauvegardé : tu pourras y revenir (!histoire carte)._${tick(oc)}` };
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
    const svc = oc.lieuServices || loc(oc.lieu)?.services || [];
    if (!svc.includes("repos") && oc.lieu !== "konoha" && !inventory.has(oc, "tente")) {
        return { text: "😴 Impossible de dormir ici en sécurité. Rejoins un village, une auberge, ou emporte une tente." };
    }
    const h = Math.max(1, Math.min(12, parseInt(arg) || 8));
    world.advanceTime(oc, h);
    survival.dormir(oc, h);
    profileMod.journal(oc, `Repos de ${h}h.`);
    return { text: `😴 Tu dors ${h}h. Tu te réveilles reposé.${tick(oc)}` };
}

function doShopList(oc, arg) {
    const svc = oc.lieuServices || loc(oc.lieu)?.services || [];
    const nomLieu = oc.lieuNom || loc(oc.lieu)?.nom || oc.lieu;
    const dispo = svc.filter(s => SHOPS[s]);
    if (!arg) {
        if (!dispo.length) return "🚪 Aucune boutique ici.";
        return `🏪 *BOUTIQUES ICI* (${nomLieu})\n` + dispo.map(s => `• ${s} — ${SHOPS[s].nom}`).join("\n") + `\n\n👉 *!histoire boutique <nom>* pour voir les articles.`;
    }
    const shop = SHOPS[arg];
    if (!shop) return "Boutique inconnue.";
    if (!dispo.includes(arg)) return `Cette boutique n'est pas accessible ici (${nomLieu}).`;
    const items = shop.items.map(id => `• *${id}* — ${ITEMS[id].nom} : ${economy.prixAchat(oc, id)}💴`).join("\n");
    return `🏪 *${shop.nom}*  ·  Ton or : ${oc.ryo}💴\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n${items}\n\n👉 *!histoire acheter ${arg} <objet>*`;
}
function doBuy(oc, arg) {
    const [shop, item, q] = arg.split(/\s+/);
    if (!shop || !item) return { text: "Usage : *!histoire acheter <boutique> <objet> [quantité]*" };
    const svc = oc.lieuServices || loc(oc.lieu)?.services || [];
    if (!svc.includes(shop)) return { text: "Cette boutique n'est pas ici." };
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
        "⚔️ *En combat* : écris ton PAVÉ librement (utilise tes vrais jutsu/objets) · *fuir* · *pause*",
        "⏸️ *pause* / ▶️ *resume* — sauver & quitter / reprendre",
        "🤝 *coop* creer|rejoindre <code>|combat|quitter — jouer à plusieurs (boss partagé)",
        "Clans : " + Object.keys(CLANS).filter(c => c !== "sans-clan").join(", "),
    ].join("\n");
}

module.exports = { run, resolvePseudo };
