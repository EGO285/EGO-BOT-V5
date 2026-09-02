const { getUser, saveUser, pushLog, buildInterface } = require("../utils/users");
const { getCooldown, setCooldown, formatDuree, rand, chance } = require("../utils/evoGame");
const { pick } = require("../utils/evoVoice");

module.exports = {
    command: "!braquage",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const pseudo = text.replace("!braquage", "").trim();

        if (!pseudo) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🏦 BRAQUAGE",
                lignes: ["👉 *!braquage <pseudo>*", "Gros risque, gros gain : 40% de réussir (toutes les 2h)."],
            }) });
        }

        const key = pseudo.toLowerCase();
        const user = await getUser(key);
        if (!user) return sock.sendMessage(from, { text: `❌ Joueur *${pseudo}* introuvable. Crée ta fiche avec *!new ${pseudo}*.` });

        const cd = getCooldown(user, "braquage", 7200000);
        if (!cd.ready) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🏦 BRAQUAGE",
                lignes: [`⏳ Encore un peu de patience, *${user.pseudo}*.`, `Réessaie dans *${formatDuree(cd.resteMs)}*.`],
            }) });
        }

        const cibles = ["la banque du village", "le convoi de Ryo", "le coffre du casino", "la caravane marchande"];
        let delta, recit;
        if (chance(0.4)) { delta = rand(20000, 60000); recit = `Braquage de *${pick(cibles)}* : gros butin !`; }
        else { delta = -rand(5000, 15000); recit = `Braquage de *${pick(cibles)}* raté : les gardes t'ont coûté cher.`; }

        setCooldown(user, "braquage");
        user.money = Math.max(0, (user.money || 0) + delta);
        pushLog(user, "braquage", `${delta >= 0 ? "+" : ""}${delta}🔶`);
        await saveUser(key, user);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "🏦 BRAQUAGE",
            lignes: [`_${pseudo}_`, recit, "", delta >= 0 ? `✅ +${delta}🔶` : `❌ ${delta}🔶`],
            footer: `💰 Bourse : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
