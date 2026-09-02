const { getMenuMedia } = require("../utils/menuMedia");

const MEDIA_PAR_DEFAUT = "https://files.catbox.moe/ys8fij.jpg";

module.exports = {
    command: "!menu",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        const caption =
`*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*
*_🔶SHINOBI STORM RP🎮_*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*📜 MENU PRINCIPAL*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_▲ En ligne👤:_ @${senderNumber}
_▲ Assistant : E.V.O (EGO VIRTUAL OPERATOR)_
_▲ Tape !aide <commande> pour le détail_
_▲ Nouveau : !about · !evo_
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
⟡ *COMBAT* ⚔️
⚔️ !combat
🏁 !verdict
🏆 !win
😭 !lose
🛑 !stopfight

⟡ *DUEL* 🤺
🤺 !duel debut @j1 vs @j2
❌ !duel off
📜 !historique

⟡ *CHRONO* ⏱️
⏱️ !timer <min>
📡 !latence
⏸️ !pause
▶️ !go
⏹️ !stop

⟡ *JOUEUR* 👤
🆕 !new <pseudo>
🪪 !fiche <pseudo>
🏅 !classement
📊 !rang <pseudo>
🃏 !collection <pseudo>
🎁 !daily <pseudo>
📜 !logs <pseudo>

⟡ *CARTES* 🎴
🎴 !tirage c/b/a/s/random
🔎 !carte <nom>
🛍️ !boutique
💸 !acheter <nom> <pseudo>
💰 !vendre <nom> <pseudo>
🤝 !echange <pseudoA> <pseudoB> <nom>
📖 !rules

⟡ *CASINO* 🎰
🎰 !casino
🪙 !pof
🎰 !machine
🎲 !des
🎡 !roulette
🃏 !hl
🃏 !blackjack
🎲 !craps
🎟️ !loto
🔁 !doubleornothing
🔢 !devine
🎲 !parilibre debut <p1> <p2>
📋 !parilibre liste
💵 !parier <pseudo> <montant> <p_choisi> [id]
✏️ !modifierpari <pseudo> <montant> [id]
📊 !mesparis <pseudo>
📜 !parishistorique [pseudo]

⟡ *BANQUE* 🏦
🆕 !creercompte <code> <pseudo>
💸 !emprunter <code> <pseudo> <montant>
💰 !rembourser <code> <pseudo> <montant>
💳 !dette <pseudo>
📜 !releve <pseudo>
🔁 !virement <code> <toi> <dest> <montant>
🏦 !deposer <code> <pseudo> <montant>
💵 !retirer <code> <pseudo> <montant>
📋 !condbanque

⟡ *ADMIN* 🛡️
🗑️ !delete
💰 !addmoney
⭐ !addstars
🛡️ !setstats
🎴 !donnercarte <nom> <pseudo>
📊 !stats globales
🔄 !reset
🔓 !unlock <pseudo>
⛔ !banfiche <pseudo>
✅ !unbanfiche <pseudo>
♻️ !resetfiche <pseudo>
🗂️ !listegroupes
🚪 !quittergroupe <id>
🖼️ !setmenumedia <menu> <url>
🤖 !photobot
📣 !broadcast <message>

⟡ *GESTION DE GROUPE* 🛡️
📢 !tagall [message]
🔔 !hidetag [message]
👢 !kick @membre
⬆️ !promote @membre
⬇️ !demote @membre
ℹ️ !groupinfo
✏️ !setgroupname <nom>
📝 !setgroupdesc <description>
🔒 !fermergroupe
🔓 !ouvrirgroupe

⟡ *E.V.O* 🤖
🤖 !about
💬 !evo <message>
ℹ️ !botinfo
🟢 !uptime
🕒 !heure
🧮 !calc <expr>
🖼️ !avatar [@membre]

⟡ *NOUVEAUX JEUX* 🎰
🚀 !crash <pseudo> <mise> <objectif>
💣 !mines <pseudo> <mise> [nbMines]
⚽ !penalty <g|c|d> <pseudo> <mise>
✊ !chifoumi <coup> <pseudo> <mise>
🏇 !course <1-4> <pseudo> <mise>
🎯 !fleche <pseudo> <mise>
🎫 !grattage <pseudo> <mise>
🔴 !plinko <pseudo> <mise>
🎡 !wheel <pseudo> <mise>
🔢 !keno <pseudo> <mise> <n...>
🃏 !bataille <pseudo> <mise>
🪜 !echelle <pseudo> <mise> <niv>

⟡ *ÉCONOMIE / MÉTIERS* 💼
💼 !travailler <pseudo>
💵 !salaire <pseudo>
🙏 !aumone <pseudo>
🎣 !peche <pseudo>
⛏️ !miner <pseudo>
🏹 !chasser <pseudo>
📜 !quete <pseudo>
🔪 !crime <pseudo>
🏦 !braquage <pseudo>
🔐 !casse <pseudo>
📦 !contrebande <pseudo>
🏭 !entreprise <pseudo>
📈 !investir <pseudo> <montant>
🕵️ !voler <toi> <cible>
🎁 !don <toi> <dest> <montant>

⟡ *FUN / SOCIAL* 🎉
🎱 !8ball <question>
🎲 !roll [max]
🪙 !pileouface
💘 !ship <a> <b>
📊 !niveau <pseudo> <critère>
📖 !citation
😂 !blague
🔥 !motivation
💐 !compliment [@x]
😏 !clash [@x]
🤔 !choix a | b | c
🗳️ !sondage q | o1 | o2
🧠 !quiz  ·  ✍️ !rep <réponse>
🎯 !defi  ·  💬 !verite
🔮 !horoscope <signe>
📣 !tagadmins [message]
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
_🤖 E.V.O — EGO VIRTUAL OPERATOR · créé par ego_
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`;

        const media = await getMenuMedia("menu", MEDIA_PAR_DEFAUT);

        const payload = media.type === "video"
            ? { video: { url: media.url }, caption, mentions: [senderJid] }
            : { image: { url: media.url }, caption, mentions: [senderJid] };

        try {
            await sock.sendMessage(from, payload);
        } catch (e) {
            console.error("⚠️ Média de !menu introuvable, envoi du texte seul :", e.message);
            await sock.sendMessage(from, { text: caption, mentions: [senderJid] });
        }
    }
};
