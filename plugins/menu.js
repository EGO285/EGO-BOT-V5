const { getMenuMedia } = require("../utils/menuMedia");

const MEDIA_PAR_DEFAUT = "https://files.catbox.moe/ys8fij.jpg";

module.exports = {
    command: "!menu",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const heure = new Date().toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });

        const caption =
`╔═══════════════════════╗
   🔷  E · V · O
   𝐄𝐆𝐎 𝐕𝐈𝐑𝐓𝐔𝐀𝐋 𝐎𝐏𝐄𝐑𝐀𝐓𝐎𝐑
╚═══════════════════════╝
  👤 @${senderNumber}
  🕒 ${heure}  ·  🌐 Shinobi Storm
  💡 *!aide <cmd>* pour le détail
  🎭 *!persona* pour changer mon ton

╭──「 🧠 E.V.O · IA 」
│ 💬 !evo <message> _(IA + mémoire)_
│ 🖼️ !evo + image _(vision)_
│ 🌐 !web <recherche>
│ ⚖️ !arbitre <action RP>
│ 🎭 !persona · 🤖 !about
╰───────────────

╭──「 ⚔️ COMBAT · DUEL 」
│ !combat · !verdict · !stopfight
│ !win · !lose
│ !duel debut @a vs @b · !duel off
│ !historique
╰───────────────

╭──「 ⏱️ CHRONO 」
│ !timer <min> · !latence
│ !pause · !go · !stop
╰───────────────

╭──「 👤 JOUEUR 」
│ !new · !fiche · !classement
│ !rang · !collection · !daily · !logs
╰───────────────

╭──「 🎴 CARTES 」
│ !tirage c/b/a/s · !carte <nom>
│ !boutique · !acheter · !vendre
│ !echange · !rules
╰───────────────

╭──「 🎰 CASINO 」_(10×/sem. par jeu)_
│ !casino · !pof · !machine · !des
│ !roulette · !hl · !blackjack · !craps
│ !loto · !doubleornothing · !devine
│ 🆕 !crash · !mines · !penalty
│ 🆕 !chifoumi · !course · !fleche
│ 🆕 !grattage · !plinko · !wheel
│ 🆕 !keno · !bataille · !echelle
╰───────────────

╭──「 💵 PARIS 」
│ !parilibre debut <p1> <p2>
│ !parilibre liste · !parier · !modifierpari
│ !mesparis · !parishistorique
╰───────────────

╭──「 🏦 BANQUE 」
│ !creercompte · !emprunter · !rembourser
│ !dette · !releve · !virement
│ !deposer · !retirer · !condbanque
╰───────────────

╭──「 🎉 FUN · SOCIAL 」
│ !8ball · !roll · !pileouface · !ship
│ !niveau · !citation · !blague
│ !motivation · !compliment · !clash
│ !choix · !sondage · !quiz + !rep
│ !defi · !verite · !horoscope · !tagadmins
╰───────────────

╭──「 🧰 OUTILS 」
│ !calc · !heure · !avatar · !uptime · !botinfo
╰───────────────

╭──「 🛡️ ADMIN · GROUPE 」
│ !addmoney · !addstars · !setstats
│ !delete · !reset · !resetfiche · !unlock
│ !banfiche · !unbanfiche · !donnercarte
│ !broadcast · !listegroupes · !quittergroupe
│ !setmenumedia · !stats · !photobot
│ !tagall · !hidetag · !kick · !promote
│ !demote · !groupinfo · !setgroupname
│ !setgroupdesc · !fermergroupe · !ouvrirgroupe
╰───────────────

  ⚡ créé par *ego*  ·  E.V.O v2
╚═══════════════════════╝`;

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
