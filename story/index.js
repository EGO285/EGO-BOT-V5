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
const rng = require("./engine/rng");

// Événement inattendu pouvant survenir pendant un tour de combat.
function combatTwist(oc, enemy) {
    if (!rng.chance(0.13)) return null;
    const pool = [
        () => { const h = Math.round(enemy.pvMax * 0.12); enemy.pv = Math.min(enemy.pvMax, enemy.pv + h); return `⚡ *Imprévu* : ${enemy.nom} trouve un second souffle et récupère ${h} PV !`; },
        () => { const d = Math.max(2, Math.round(oc.stats.pvMax * 0.06)); oc.vitals.pv = Math.max(1, oc.vitals.pv - d); return `⚡ *Imprévu* : le terrain se dérobe, tu encaisses ${d} dégâts !`; },
        () => { const d = Math.round(enemy.pvMax * 0.10); enemy.pv = Math.max(0, enemy.pv - d); return `⚡ *Imprévu* : une ouverture inespérée ! Tu infliges ${d} dégâts bonus.`; },
        () => { const c = Math.round(oc.stats.chakraMax * 0.15); oc.vitals.chakra = Math.min(oc.stats.chakraMax, oc.vitals.chakra + c); return `⚡ *Imprévu* : un afflux de chakra te revigore (+${c}).`; },
        () => { return `⚡ *Imprévu* : un ninja masqué observe le combat depuis les ombres...`; },
    ];
    return rng.pick(pool)();
}
const { JUTSU } = require("./data/jutsu");
const { CLANS } = require("./data/clans");
const { loc, LOCATIONS } = require("./data/locations");
const { SHOPS, ITEMS } = require("./data/items");
const { NPCS } = require("./data/npcs");
const { BOSSES } = require("./data/bosses");
const { CHAPTERS } = require("./data/campaign");
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
    "principale", "canon", "story", "campagne",
    "commencer", "start", "creer", "créer", "nouveau",
]);

// Sous-commandes déplacées vers leur PROPRE commande (plus de "!histoire X").
// Sert à rediriger gentiment si quelqu'un tape encore l'ancienne forme.
const MOVED = {
    fiche: "!perso", perso: "!perso", stats: "!ameliorer",
    jutsu: "!techniques", techniques: "!techniques",
    sac: "!inventaire", inventaire: "!inventaire",
    objet: "!objet", utiliser: "!objet",
    carte: "!lieux", map: "!lieux",
    explorer: "!explorer",
    aventurer: "!aventurer", frontiere: "!aventurer", "frontière": "!aventurer", inconnu: "!aventurer",
    voyager: "!voyager", aller: "!voyager",
    mission: "!mission",
    entrainer: "!entrainer", "entraîner": "!entrainer",
    apprendre: "!apprendre",
    manger: "!manger", boire: "!boire", dormir: "!dormir",
    boutique: "!echoppe", shop: "!echoppe", acheter: "!echoppe acheter", vendre: "!echoppe vendre",
    relations: "!relations", reputation: "!reputation", "réputation": "!reputation",
    rang: "!promotion", examen: "!promotion", promotion: "!promotion",
    coop: "!coop", principale: "!principale", canon: "!principale", story: "!principale", campagne: "!principale",
    sauvegarde: "!sauvegarde", save: "!sauvegarde",
    abandonner: "!abandonner",
    difficulte: "!difficulte", "difficulté": "!difficulte",
    mortpermanente: "!mortpermanente",
    aide: "!guide",
};

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
        return { text: `✅ *Personnage créé !*\n\n${intro}\n\n${render.fiche(oc)}\n\n_Tape *!histoire* pour voir tes options, ou *!guide*._` };
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
            return { text: "🍥 *SHINOBI STORM — MODE HISTOIRE*\n\nQuelle est ta fiche ? Écris ton pseudo pour la lier :\n👉 *!histoire <ton pseudo>*\n\n• Nouveau ? crée un ninja : *!histoire commencer <ton pseudo>*\n• Pas de fiche ? *!new <pseudo>* d'abord.\n_Aide complète : !guide_" };
        }
    }
    let oc = await db.getOC(pseudo);
    if (!oc) { await db.del(BIND(sender)); return { text: "❌ Personnage introuvable. Refais *!histoire commencer*." }; }
    if (oc.mort) return { text: `💀 *${oc.identite.prenom}* est mort (mort permanente activée). Son aventure s'achève ici.\n\nTape *!histoire supprimer* puis *!histoire commencer* pour repartir de zéro.` };

    let out;

    // ---- COOP : combat de boss PARTAGÉ en cours ----
    const monEquipe = await coop.party(pseudo);
    const infoSubs = ["coop", "fiche", "perso", "sac", "inventaire", "jutsu", "techniques", "aide", "stats", "pause", "resume", ""];
    if (monEquipe && monEquipe.combat) {
        // Une commande dédiée d'info reste consultable ; toute autre commande dédiée est bloquée.
        if (ctx._fromSub && !infoSubs.includes(sub)) {
            return { text: `⚔️ *Combat d'équipe en cours* contre *${monEquipe.combat.enemy.nom}* !\nÉcris ton action de combat : *!histoire <ton pavé>*\n(_infos autorisées : !perso · !techniques · !inventaire_)` };
        }
        if (!ctx._fromSub && !infoSubs.includes(sub)) {
            const pave = `${sub} ${arg}`.trim();
            out = await doCoopCombat(oc, pave, pseudo, monEquipe);
            await db.saveOC(pseudo, oc);
            return out;
        }
    }

    // ---- COMBAT PAR PAVÉ (prioritaire si combat solo en cours) ----
    if (combatActif(oc)) {
        // Contrôles réservés
        if (sub === "fuir") { out = await doCombat(oc, "fuir", ""); await db.saveOC(pseudo, oc); return out; }
        if (sub === "pause") { await db.saveOC(pseudo, oc); return { text: `⏸️ Combat mis en pause et sauvegardé. Reviens avec *!histoire resume* — tu reprendras en plein duel contre *${oc.combat.enemy.nom}*.` }; }
        if (["statut", "etat", "état", "combat"].includes(sub) && !arg) {
            return { text: renderCombat(oc, [`À toi de jouer ! Écris ton action (ton pavé RP).`]) };
        }
        // Commandes dédiées pendant le combat : seules les infos sont consultables.
        if (ctx._fromSub) {
            if (["fiche", "perso"].includes(sub)) return { text: render.fiche(oc) + tick(oc) };
            if (["jutsu", "techniques"].includes(sub)) return { text: render.techniques(oc) };
            if (["sac", "inventaire"].includes(sub)) return { text: render.inventaire(oc) };
            return { text: `⚔️ Tu es en plein combat contre *${oc.combat.enemy.nom}* !\nÉcris ton action : *!histoire <ton pavé de combat>*\n(_ou *!histoire fuir* · *!histoire pause*_)` };
        }
        // Depuis !histoire : tout le texte libre = PAVÉ du joueur
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
        return { text: `${render.hud(oc)}\n\n🕮 _${dernier}_\n\nQue veux-tu faire ? (chaque action a sa commande)\n▫️ *!explorer* · *!voyager <lieu>* · *!lieux* · *!aventurer*\n▫️ *!mission* · *!entrainer <type>* · *!principale*\n▫️ *!perso* · *!techniques* · *!inventaire* · *!echoppe*\n▫️ *!manger* · *!dormir* · *!relations* · *!coop*\n\n⚔️ En combat : écris ton action avec *!histoire <ton pavé>*\n📜 Liste complète : *!guide*` };
    }

    // ---- !histoire est réservé au combat (pavé), au lancement, à la pause et à la suppression.
    //      Toute autre action a désormais sa propre commande. ----
    if (!ctx._fromSub && MOVED[sub]) {
        return { text: `➡️ Cette action a maintenant sa propre commande : *${MOVED[sub]}*\n\n_*!histoire* ne sert plus qu'à : jouer tes actions de combat, lancer/reprendre l'aventure, la mettre en pause (*!histoire pause* / *!histoire resume*) et supprimer ton perso (*!histoire supprimer*)._\n📜 Toutes les commandes : *!guide*` };
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
            const id = resolveItem(arg); if (!id) return { text: "Quel objet ? *!objet <nom>* (vois !inventaire)." };
            const r = inventory.useItem(oc, id); await db.saveOC(pseudo, oc);
            return { text: r.ok ? `✅ ${r.nom} utilisé (${r.effets.join(", ") || "aucun effet"}).${tick(oc)}` : `❌ ${r.error}` };
        }
        case "carte": case "map": {
            const map = await worldmap.load(pseudo);
            const ici = worldmap.resolve(map, oc.lieu);
            const dest = worldmap.destinations(map, oc.lieu).map(d => `• *${d.id}* — ${d.nom} ${d.genere ? "✨" : ""}(${d.heures}h, danger ${d.danger})`).join("\n") || "_aucune_";
            const desc = ici?.description ? `\n_${ici.description}_` : "";
            return { text: `🗺️ *CARTE* — tu es à *${ici ? ici.nom : oc.lieu}*${desc}\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\nDestinations :\n${dest}\n\n👉 *!voyager <lieu>*\n🧭 *!aventurer* — partir vers l'inconnu (génère une nouvelle zone)` };
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
        case "principale": case "canon": case "story": case "campagne": out = await doPrincipale(oc, arg, pseudo); await db.saveOC(pseudo, oc); return out;
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
            return { text: `❓ Sous-commande inconnue : *${sub}*.\nTape *!guide* pour la liste.` };
    }
}

// ---------- Actions détaillées ----------
async function doCombat(oc, sub, arg) {
    const enemyNom = oc.combat.enemy.nom;
    let param = null;
    if (sub === "jutsu") { param = resolveJutsu(oc, arg); if (!param) return { text: `❌ Tu ne connais pas « ${arg} ». Vois !techniques.` }; }
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

// Accorde une récompense de campagne (xp carrière + niveau + ryo).
function grantReward(oc, rec) {
    if (!rec) return;
    oc.ryo = (oc.ryo || 0) + (rec.ryo || 0);
    oc.xpCarriere = (oc.xpCarriere || 0) + (rec.xp || 0);
    progression.addXP(oc, rec.xp || 0);
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
    // Chapitre d'histoire principale accompli ?
    if (oc._campaignCombat) {
        oc._campaignCombat = false;
        if (!oc.campagne) oc.campagne = { i: 0 };
        const chap = CHAPTERS[oc.campagne.i];
        if (chap && chap.recompense) { grantReward(oc, chap.recompense); msg += `\n\n🎬 *CHAPITRE ACCOMPLI* : ${chap.titre} (+${chap.recompense.xp} XP)`; }
        oc.campagne.i += 1;
        msg += oc.campagne.i < CHAPTERS.length ? `\n➡️ Suite de l'histoire : *!principale*` : `\n🏆 *Tu as terminé TOUTE l'Histoire Principale !* Légende éternelle.`;
    }
    return { text: `${narr ? `🎴 ${narr}\n\n` : ""}${msg}${tick(oc)}` };
}

// ============================================================
//  HISTOIRE PRINCIPALE (canon Naruto → Boruto: Two Blue Vortex)
// ============================================================
async function doPrincipale(oc, arg, pseudo) {
    if (!oc.campagne) oc.campagne = { i: 0 };
    const total = CHAPTERS.length;
    const a = (arg || "").toLowerCase();

    if (oc.campagne.i >= total) {
        return { text: "🏆 *HISTOIRE PRINCIPALE TERMINÉE*\nDe l'Académie jusqu'au Tourbillon Bleu, tu as tout traversé. Ton nom est une légende éternelle du monde ninja. 🍥" };
    }
    let chap = CHAPTERS[oc.campagne.i];

    // Avancer une scène narrative
    if (a === "suivant" || a === "continuer") {
        if (chap.type === "scene") {
            grantReward(oc, chap.recompense);
            oc.campagne.i += 1;
            if (oc.campagne.i >= total) return { text: "🏆 *HISTOIRE PRINCIPALE TERMINÉE* — Légende éternelle ! 🍥" };
            chap = CHAPTERS[oc.campagne.i];
        } else {
            return { text: `⚔️ Ce chapitre est un combat. Lance-le : *!principale combat*.` };
        }
    }

    // Démarrer le combat du chapitre
    if ((a === "combat" || a === "go" || a === "affronter") && chap.type === "combat") {
        oc._campaignCombat = true;
        const def = BOSSES[chap.ennemi] || npcAsEnemy(chap.ennemi);
        const rangHint = combatConseil(oc, def);
        const intro = `[${chap.arc}] ${chap.titre}. ${chap.texte}`;
        const fight = await startFight(oc, def, intro);
        return { text: rangHint + fight.text };
    }

    // Affichage du chapitre courant
    const narr = await withNarration(oc, `[${chap.arc}] ${chap.titre}. ${chap.texte}`, { consigne: "Raconte ce moment culte de Naruto en y intégrant le personnage du joueur, de façon immersive et fidèle à l'univers." });
    const suite = chap.type === "scene"
        ? "▶️ *!principale suivant* pour continuer l'histoire"
        : `⚔️ *!principale combat* pour affronter *${(BOSSES[chap.ennemi] || {}).nom || chap.ennemi}*`;
    return { text: `🎬 *HISTOIRE PRINCIPALE*  —  Chapitre ${oc.campagne.i + 1}/${total}\n🏷️ Arc : ${chap.arc}\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n📖 *${chap.titre}*\n\n${narr}\n\n${suite}` };
}

// Avertit si l'ennemi de campagne semble hors de portée.
function combatConseil(oc, def) {
    const ecart = (def.niveau || 5) - oc.niveau;
    if (ecart >= 15) return `⚠️ *${def.nom}* est BIEN plus fort que toi (niv ${def.niveau} vs ${oc.niveau}). Entraîne-toi et monte en rang avant, ou tente ta chance...\n\n`;
    if (ecart >= 8) return `⚠️ *${def.nom}* est nettement plus fort — prépare-toi bien.\n\n`;
    return "";
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

    // Événement inattendu possible ce tour-ci
    const twist = combatTwist(oc, enemy);
    if (twist) r.narration = `${r.narration}\n${twist}`;

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
        if (!p) return { text: "🤝 *COOP* — tu n'es dans aucune équipe.\n▫️ *!coop creer* — créer une escouade (donne un code)\n▫️ *!coop rejoindre <code>* — rejoindre\n_Puis affrontez un boss ensemble : *!coop combat*_", save: false };
        const combatTxt = p.combat ? `\n⚔️ Combat en cours : *${p.combat.enemy.nom}* (${p.combat.enemy.pv}/${p.combat.enemy.pvMax} PV)` : "";
        return { text: `🤝 *ÉQUIPE ${p.code}*\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n👑 Chef : ${p.chef}\n🥷 Membres (${p.membres.length}/${coop.MAX}) : ${p.membres.join(", ")}${combatTxt}\n\n_Boss ensemble : *!coop combat* · quitter : *!coop quitter*_`, save: false };
    }
    if (a === "creer" || a === "créer" || a === "create") {
        const r = await coop.create(pseudo, oc.lieu);
        if (!r.ok) return { text: `❌ ${r.error}`, save: false };
        return { text: `✅ *Équipe créée !* Code : *${r.party.code}*\nPartage ce code : les autres tapent *!coop rejoindre ${r.party.code}*.\nQuand vous êtes prêts : *!coop combat*.`, save: false };
    }
    if (a === "rejoindre" || a === "join") {
        if (!suite) return { text: "Usage : *!coop rejoindre <code>*", save: false };
        const r = await coop.join(pseudo, suite.toUpperCase());
        if (!r.ok) return { text: `❌ ${r.error}`, save: false };
        return { text: `✅ Tu as rejoint l'équipe *${r.party.code}* !\nMembres : ${r.party.membres.join(", ")}.\n_Boss ensemble : *!coop combat*._`, save: false };
    }
    if (a === "quitter" || a === "leave") {
        const r = await coop.leave(pseudo);
        return { text: r.ok ? "👋 Tu as quitté l'équipe." : `❌ ${r.error}`, save: false };
    }
    if (a === "combat" || a === "boss") {
        const p = await coop.party(pseudo);
        if (!p) return { text: "Tu n'es dans aucune équipe (*!coop creer*).", save: false };
        if (p.combat) return { text: `⚔️ Un combat est déjà en cours contre *${p.combat.enemy.nom}*. Écris ton action !`, save: false };
        // Boss mis à l'échelle du nombre de membres.
        const base = BOSSES.chef_bandits;
        const n = p.membres.length;
        const def = { ...base, pv: Math.round(base.pv * (1 + (n - 1) * 0.8)), butin: { ryo: base.butin.ryo, xp: base.butin.xp, items: base.butin.items } };
        await coop.setCombat(p, combat.makeEnemy(def));
        return { text: `🐉 *BOSS COOP — ${def.nom}* apparaît devant l'équipe *${p.code}* !\n❤️ ${def.pv} PV (mis à l'échelle pour ${n} ninja${n > 1 ? "s" : ""}).\n\n✍️ Chaque membre écrit son action : *!histoire <ton pavé>*.\n_Vous partagez le même ennemi — coordonnez-vous !_`, save: false };
    }
    return { text: "Usage : *!coop* [creer|rejoindre <code>|combat|quitter|info]", save: false };
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
    if (!destArg) return { text: "Où ? *!voyager <lieu>* (vois !lieux)." };
    const map = await worldmap.load(pseudo);
    if ((oc.besoins?.fatigue || 0) > 90) return { text: "😩 Trop épuisé pour voyager. Repose-toi (!dormir)." };
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
    return { text: `🧭 *NOUVELLE ZONE DÉCOUVERTE* ✨\n\n${narr}\n\n📍 *${r.loc.nom}* (${r.loc.type}, danger ${r.loc.danger})${r.loc.services.length ? `\n🏪 Services : ${r.loc.services.join(", ")}` : ""}\n_Ce lieu est sauvegardé : tu pourras y revenir (!lieux)._${tick(oc)}` };
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
        return { text: `${prefixe}\n🧺 ${ev.txt}\nTu peux commercer : *!echoppe marche_noir*${tick(oc)}` };
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
        if (oc.quete) return { text: `📜 *MISSION EN COURS*\n${oc.quete.titre} [${oc.quete.rang}] — ${oc.quete.desc}\nLieu : ${LOCATIONS[oc.quete.lieu]?.nom || oc.quete.lieu}\n\n👉 *!mission ${oc.quete.ennemi ? "combattre" : "finir"}*` };
        const dispo = missions.disponibles(oc);
        // Échantillon de 10 missions (avec leur numéro réel), renouvelé à chaque appel.
        const echantillon = dispo.map((m, i) => [i, m])
            .sort(() => Math.random() - 0.5).slice(0, 10)
            .sort((a, b) => a[0] - b[0]);
        const l = echantillon.map(([i, m]) => `${i + 1}. [${m.rang}] *${m.titre}* — ${m.desc} _(${m.recompense.ryo}💴${m.ennemi ? " ⚔️" : ""})_`).join("\n");
        const reste = dispo.length - echantillon.length;
        return { text: `📋 *MISSIONS DISPONIBLES* — classe *${oc.identite.rang}*\n_(${dispo.length} au total)_\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n${l}\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n👉 *!mission <numéro>* pour accepter${reste > 0 ? `\n🔄 refais *!mission* pour d'autres propositions (${reste} de plus)` : ""}` };
    }
    if (/^\d+$/.test(arg)) { const r = missions.accepter(oc, parseInt(arg) - 1); return { text: r.ok ? `✅ Mission acceptée : *${r.mission.titre}*.\nRends-toi sur les lieux puis *!mission ${r.mission.ennemi ? "combattre" : "finir"}*.` : `❌ ${r.error}` }; }
    if (arg === "combattre") {
        if (!oc.quete) return { text: "Aucune mission en cours." };
        if (!oc.quete.ennemi) return { text: "Cette mission ne comporte pas d'ennemi. Fais *!mission finir*." };
        const def = { ...(BOSSES[oc.quete.ennemi] || npcAsEnemy(oc.quete.ennemi)) }; // clone (twist safe)
        let intro = `Tu affrontes l'objectif de ta mission : ${def.nom}.`;
        // Événement inattendu de mission
        if (rng.chance(0.4)) {
            const twists = [
                () => { def.pv = Math.round(def.pv * 1.25); return "🚨 Imprévu : des renforts rejoignent l'ennemi, il est plus coriace que prévu !"; },
                () => { def.pv = Math.round(def.pv * 0.8); return "🎯 Imprévu : tu prends ta cible par surprise — elle démarre affaiblie."; },
                () => { oc.vitals.pv = Math.min(oc.stats.pvMax, oc.vitals.pv + 30); return "🤝 Imprévu : un allié de passage soigne tes blessures avant l'assaut (+30 PV)."; },
                () => { oc.vitals.chakra = Math.max(0, oc.vitals.chakra - 20); return "🪤 Imprévu : un piège se déclenche, tu perds un peu de chakra (-20)."; },
                () => { def.niveau = (def.niveau || 5) + 3; def.stats = { ...def.stats, force: (def.stats.force || 5) + 3 }; return "😈 Imprévu : l'ennemi révèle sa vraie force !"; },
            ];
            intro = `${rng.pick(twists)()}\n\n${intro}`;
        }
        oc._missionCombat = true;
        return startFight(oc, def, intro);
    }
    if (arg === "finir") {
        const r = missions.resoudreNonCombat(oc);
        if (!r.ok) return { text: `❌ ${r.error}` };
        if (r.reussi) { profileMod.journal(oc, `Mission réussie : ${r.mission.titre}.`); return { text: `🎉 *MISSION RÉUSSIE* : ${r.mission.titre}\n+${r.rec.ryo}💴 · +${r.rec.xp} XP${r.rec.lvl.niveauxGagnes.length ? `\n⬆️ Niveau ${r.rec.lvl.niveau} !` : ""}${tick(oc)}` }; }
        return { text: `😓 La mission « ${r.mission.titre} » échoue cette fois (réputation -2). Retente : *!mission finir*.` };
    }
    return { text: "Usage : *!mission* · *mission <n>* · *mission combattre* · *mission finir*." };
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
    if (!id) return { text: "Tu n'as rien à manger. Achète de quoi au restaurant (*!echoppe restaurant*)." };
    const r = inventory.useItem(oc, id);
    return { text: r.ok ? `🍙 Tu manges : ${r.nom} (${r.effets.join(", ")}).` : `❌ ${r.error}` };
}
function doDrink(oc, arg) {
    const id = resolveItem(arg) || oc.inventaire.find(i => ITEMS[i.id]?.effet?.soif)?.id;
    if (!id) return { text: "Tu n'as rien à boire (*!echoppe restaurant*)." };
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
        return `🏪 *BOUTIQUES ICI* (${nomLieu})\n` + dispo.map(s => `• ${s} — ${SHOPS[s].nom}`).join("\n") + `\n\n👉 *!echoppe <nom>* pour voir les articles.`;
    }
    const shop = SHOPS[arg];
    if (!shop) return "Boutique inconnue.";
    if (!dispo.includes(arg)) return `Cette boutique n'est pas accessible ici (${nomLieu}).`;
    const items = shop.items.map(id => `• *${id}* — ${ITEMS[id].nom} : ${economy.prixAchat(oc, id)}💴`).join("\n");
    return `🏪 *${shop.nom}*  ·  Ton or : ${oc.ryo}💴\n▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔\n${items}\n\n👉 *!echoppe acheter ${arg} <objet>*`;
}
function doBuy(oc, arg) {
    const [shop, item, q] = arg.split(/\s+/);
    if (!shop || !item) return { text: "Usage : *!echoppe acheter <boutique> <objet> [quantité]*" };
    const svc = oc.lieuServices || loc(oc.lieu)?.services || [];
    if (!svc.includes(shop)) return { text: "Cette boutique n'est pas ici." };
    const r = economy.acheter(oc, shop, item, parseInt(q) || 1);
    return { text: r.ok ? `🛍️ Acheté : ${r.item} (-${r.total}💴). Il te reste ${oc.ryo}💴.` : `❌ ${r.error}` };
}
function doSell(oc, arg) {
    const [item, q] = arg.split(/\s+/);
    const id = resolveItem(item);
    if (!id) return { text: "Usage : *!echoppe vendre <objet> [quantité]*" };
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
        return { text: `📖 *MENTORS ICI*\n${l2}\n\n👉 *!apprendre <technique>*` };
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
        "🍥 *SHINOBI STORM — GUIDE DES COMMANDES*",
        "▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔",
        "🎬 *!histoire* — lancer / reprendre ton aventure",
        "   • *!histoire commencer <pseudo>* — créer ton ninja (clan=, sexe=, prenom=)",
        "   • *!histoire pause* / *!histoire resume* — mettre en pause / reprendre",
        "   • *!histoire supprimer* — effacer ton perso",
        "   • ⚔️ *en combat* : *!histoire <ton pavé d'action>* · *!histoire fuir*",
        "▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔",
        "👤 *!perso* — ta fiche · *!ameliorer <stat>* — répartir tes points",
        "🌀 *!techniques* · 🎒 *!inventaire* · *!objet <nom>*",
        "🗺️ *!lieux* · *!voyager <lieu>* · *!explorer* · *!aventurer*",
        "📜 *!mission* — missions · *!mission <n>* · *!abandonner*",
        "🏋️ *!entrainer <type>* · 📖 *!apprendre <tech>*",
        "🍙 *!manger* · 🥤 *!boire* · 😴 *!dormir [h]*",
        "🏪 *!echoppe [nom]* · *!echoppe acheter <boutique> <objet>* · *!echoppe vendre <objet>*",
        "🎖️ *!promotion* — passer un grade · 🤝 *!relations* · 🏅 *!reputation*",
        "🐉 *!coop* creer|rejoindre <code>|combat|quitter — boss à plusieurs",
        "🎞️ *!principale* — HISTOIRE canon Naruto → Boruto (suivant / combat)",
        "⚙️ *!difficulte <mode>* · ☠️ *!mortpermanente <on/off>* · 💾 *!sauvegarde*",
        "▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔",
        "Clans : " + Object.keys(CLANS).filter(c => c !== "sans-clan").join(", "),
    ].join("\n");
}

// Lance une action précise du mode Histoire depuis sa PROPRE commande (ex: !perso, !mission).
// Contrairement à run() via !histoire, le texte n'est jamais interprété comme un pavé de combat.
async function runSub(sender, sub, arg) {
    return run({ sender, sub: (sub || "").toLowerCase(), arg: arg || "", _fromSub: true });
}

module.exports = { run, runSub, resolvePseudo, aide };
