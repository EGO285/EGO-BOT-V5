const story = require("../story");

// Boutiques du monde ninja (mode Histoire) — remplace "!histoire boutique/acheter/vendre".
//   !echoppe                       → liste des boutiques ici
//   !echoppe <boutique>            → articles d'une boutique
//   !echoppe acheter <b> <objet> [q]
//   !echoppe vendre <objet> [q]
module.exports = {
    command: "!echoppe",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const arg = text.replace(/^!echoppe/i, "").trim();
        const parts = arg.split(/\s+/).filter(Boolean);
        const a0 = (parts[0] || "").toLowerCase();

        let sub = "boutique", sArg = arg;
        if (a0 === "acheter") { sub = "acheter"; sArg = parts.slice(1).join(" "); }
        else if (a0 === "vendre") { sub = "vendre"; sArg = parts.slice(1).join(" "); }

        try { await sock.sendPresenceUpdate("composing", from); } catch (e) {}
        let res;
        try {
            res = await story.runSub(senderNumber, sub, sArg);
        } catch (e) {
            console.error("⚠️ Mode Histoire erreur :", e);
            res = { text: "⚠️ Une secousse dans le flux du chakra a interrompu l’action. Réessaie." };
        }
        await sock.sendMessage(from, { text: `@${senderNumber}\n${res.text}`, mentions: [senderJid] });
        try { await sock.sendPresenceUpdate("paused", from); } catch (e) {}
    }
};
