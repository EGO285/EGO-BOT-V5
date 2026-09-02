module.exports = {
    command: "!calc",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const expr = text.replace("!calc", "").trim();
        if (!expr) {
            return sock.sendMessage(from, { text: "🧮 *!calc <expression>*\n_Ex : !calc (12 + 8) * 3_" });
        }
        if (!/^[0-9+\-*/().%\s]+$/.test(expr)) {
            return sock.sendMessage(from, { text: "❌ Expression invalide. Utilise seulement des chiffres et + - * / ( ) % ." });
        }
        let res;
        try {
            res = Function('"use strict"; return (' + expr + ');')();
        } catch (e) {
            return sock.sendMessage(from, { text: "❌ Impossible de calculer ça. Vérifie ton expression." });
        }
        if (typeof res !== "number" || !isFinite(res)) {
            return sock.sendMessage(from, { text: "❌ Résultat invalide (division par zéro ?)." });
        }
        res = Math.round(res * 1e6) / 1e6;
        await sock.sendMessage(from, { text: `🧮 *CALCUL*\n\n${expr} = *${res}*` });
    }
};
