const { getUser, saveUser, pushLog, buildInterface } = require("../utils/users");
const { getCooldown, setCooldown, formatDuree, rand, chance } = require("../utils/evoGame");
const { pick } = require("../utils/evoVoice");

module.exports = {
    command: "!travailler",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const pseudo = text.replace("!travailler", "").trim();

        if (!pseudo) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "💼 TRAVAIL",
                lignes: ["👉 *!travailler <pseudo>*", "Bosse pour gagner du Ryo (toutes les 30 min)."],
            }) });
        }

        const key = pseudo.toLowerCase();
        const user = await getUser(key);
        if (!user) return sock.sendMessage(from, { text: `❌ Joueur *${pseudo}* introuvable. Crée ta fiche avec *!new ${pseudo}*.` });

        const cd = getCooldown(user, "travailler", 1800000);
        if (!cd.ready) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "💼 TRAVAIL",
                lignes: [`⏳ Encore un peu de patience, *${user.pseudo}*.`, `Réessaie dans *${formatDuree(cd.resteMs)}*.`],
            }) });
        }

        const jobs = ["livreur de ramen", "dresseur de créatures", "garde du village", "forgeron", "marchand ambulant", "scribe", "pêcheur", "mineur du dimanche"];
        const job = pick(jobs);
        const delta = rand(3000, 9000);
        const recit = `Tu as bossé comme *${job}*.`;

        setCooldown(user, "travailler");
        user.money = Math.max(0, (user.money || 0) + delta);
        pushLog(user, "travailler", `${delta >= 0 ? "+" : ""}${delta}🔶`);
        await saveUser(key, user);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "💼 TRAVAIL",
            lignes: [`_${pseudo}_`, recit, "", delta >= 0 ? `✅ +${delta}🔶` : `❌ ${delta}🔶`],
            footer: `💰 Bourse : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
