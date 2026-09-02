const { getUser, saveUser, pushLog, buildInterface } = require("../utils/users");
const { getCooldown, setCooldown, formatDuree, rand, chance } = require("../utils/evoGame");
const { pick } = require("../utils/evoVoice");

module.exports = {
    command: "!crime",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const pseudo = text.replace("!crime", "").trim();

        if (!pseudo) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🔪 PETIT DÉLIT",
                lignes: ["👉 *!crime <pseudo>*", "Tente un délit : 60% de réussir, sinon amende."],
            }) });
        }

        const key = pseudo.toLowerCase();
        const user = await getUser(key);
        if (!user) return sock.sendMessage(from, { text: `❌ Joueur *${pseudo}* introuvable. Crée ta fiche avec *!new ${pseudo}*.` });

        const cd = getCooldown(user, "crime", 2700000);
        if (!cd.ready) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🔪 PETIT DÉLIT",
                lignes: [`⏳ Encore un peu de patience, *${user.pseudo}*.`, `Réessaie dans *${formatDuree(cd.resteMs)}*.`],
            }) });
        }

        const coups = ["pickpocket au marché", "arnaque à la carte truquée", "vol de fruits", "petit trafic de bonbons interdits"];
        let delta, recit;
        if (chance(0.6)) { delta = rand(8000, 20000); recit = `Ton coup (*${pick(coups)}*) a réussi.`; }
        else { delta = -rand(2000, 6000); recit = `Tu t'es fait pincer en plein *${pick(coups)}*. Amende.`; }

        setCooldown(user, "crime");
        user.money = Math.max(0, (user.money || 0) + delta);
        pushLog(user, "crime", `${delta >= 0 ? "+" : ""}${delta}🔶`);
        await saveUser(key, user);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "🔪 PETIT DÉLIT",
            lignes: [`_${pseudo}_`, recit, "", delta >= 0 ? `✅ +${delta}🔶` : `❌ ${delta}🔶`],
            footer: `💰 Bourse : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
