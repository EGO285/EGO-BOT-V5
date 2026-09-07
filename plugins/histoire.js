const story = require("../story");
const { getUser } = require("../utils/users");

module.exports = {
    command: "!histoire",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        // Découpe : "!histoire <sous-commande> <arguments...>"
        const reste = text.replace(/^!histoire/i, "").trim();
        const parts = reste.split(/\s+/);
        const sub = (parts.shift() || "").toLowerCase();
        const arg = parts.join(" ");

        // Résout la fiche Shinobi Storm liée (condition d'accès à la création).
        let fiche = null;
        const pseudoLie = await story.resolvePseudo(senderNumber);
        try {
            if (pseudoLie) fiche = await getUser(pseudoLie);
            // À la création, on tente de retrouver la fiche par l'argument prenom= ou par le sous-arg.
            if (!fiche && ["commencer", "start", "creer", "créer", "nouveau"].includes(sub)) {
                // cherche un pseudo fourni : "commencer <pseudo> [options]" ou option prenom=
                const maybe = parts.find(p => !p.includes("=")) || (arg.match(/prenom=([^\s]+)/)?.[1]);
                if (maybe) fiche = await getUser(maybe.toLowerCase());
            }
        } catch (e) {}

        try { await sock.sendPresenceUpdate("composing", from); } catch (e) {}

        let res;
        try {
            res = await story.run({ sender: senderNumber, fiche, sub, arg });
        } catch (e) {
            console.error("⚠️ Mode Histoire erreur :", e);
            res = { text: "⚠️ Une secousse dans le flux du chakra a interrompu l'action. Ta progression est sauvegardée — réessaie." };
        }

        await sock.sendMessage(from, { text: res.text, mentions: [senderJid] });
        try { await sock.sendPresenceUpdate("paused", from); } catch (e) {}
    }
};
