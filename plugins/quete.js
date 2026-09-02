const { getUser, saveUser, pushLog, buildInterface } = require("../utils/users");
const { getCooldown, setCooldown, formatDuree, rand, chance } = require("../utils/evoGame");
const { pick } = require("../utils/evoVoice");

module.exports = {
    command: "!quete",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const pseudo = text.replace("!quete", "").trim();

        if (!pseudo) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "📜 QUÊTE",
                lignes: ["👉 *!quete <pseudo>*", "Accomplis une quête RP (toutes les heures)."],
            }) });
        }

        const key = pseudo.toLowerCase();
        const user = await getUser(key);
        if (!user) return sock.sendMessage(from, { text: `❌ Joueur *${pseudo}* introuvable. Crée ta fiche avec *!new ${pseudo}*.` });

        const cd = getCooldown(user, "quete", 3600000);
        if (!cd.ready) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "📜 QUÊTE",
                lignes: [`⏳ Encore un peu de patience, *${user.pseudo}*.`, `Réessaie dans *${formatDuree(cd.resteMs)}*.`],
            }) });
        }

        const quetes = ["escorter un marchand", "retrouver un chat perdu", "livrer un parchemin secret", "nettoyer un donjon", "protéger le pont"];
        let delta, recit;
        if (chance(0.8)) { delta = rand(6000, 16000); recit = `Quête accomplie : *${pick(quetes)}*.`; }
        else { delta = -rand(1000, 3000); recit = `Quête échouée : *${pick(quetes)}*. Petit revers.`; }

        setCooldown(user, "quete");
        user.money = Math.max(0, (user.money || 0) + delta);
        pushLog(user, "quete", `${delta >= 0 ? "+" : ""}${delta}🔶`);
        await saveUser(key, user);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "📜 QUÊTE",
            lignes: [`_${pseudo}_`, recit, "", delta >= 0 ? `✅ +${delta}🔶` : `❌ ${delta}🔶`],
            footer: `💰 Bourse : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
