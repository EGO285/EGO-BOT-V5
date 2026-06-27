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
_▲ Tape !aide <commande> pour le détail_
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
⟡ *COMBAT*
!combat · !verdict · !win · !lose · !stopfight

⟡ *DUEL*
!duel debut @j1 vs @j2 · !duel off · !historique

⟡ *CHRONO*
!timer <min> · !latence · !pause · !go · !stop

⟡ *JOUEUR*
!new <pseudo> · !fiche <pseudo> · !classement · !rang

⟡ *CARTES*
!tirage c/b/a/s/random · !carte <nom> · !boutique · !rules

⟡ *CASINO*
!casino · !pof · !machine · !des · !roulette · !hl

⟡ *ADMIN*
!delete · !addmoney · !addstars · !setstats · !reset · !photobot
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
*_▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩▢▩_*`;

        await sock.sendMessage(from, {
            image: { url: "https://files.catbox.moe/ys8fij.jpg" },
            caption,
            mentions: [senderJid]
        });
    }
};
