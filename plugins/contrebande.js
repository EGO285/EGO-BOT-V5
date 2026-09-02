const { getUser, saveUser, pushLog, buildInterface } = require("../utils/users");
const { getCooldown, setCooldown, formatDuree, rand, chance } = require("../utils/evoGame");
const { pick } = require("../utils/evoVoice");

module.exports = {
    command: "!contrebande",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const pseudo = text.replace("!contrebande", "").trim();

        if (!pseudo) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "📦 CONTREBANDE",
                lignes: ["👉 *!contrebande <pseudo>*", "Fais passer de la marchandise (toutes les heures)."],
            }) });
        }

        const key = pseudo.toLowerCase();
        const user = await getUser(key);
        if (!user) return sock.sendMessage(from, { text: `❌ Joueur *${pseudo}* introuvable. Crée ta fiche avec *!new ${pseudo}*.` });

        const cd = getCooldown(user, "contrebande", 3600000);
        if (!cd.ready) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "📦 CONTREBANDE",
                lignes: [`⏳ Encore un peu de patience, *${user.pseudo}*.`, `Réessaie dans *${formatDuree(cd.resteMs)}*.`],
            }) });
        }

        const marchandises = ["des épices rares", "des parchemins interdits", "des pierres précieuses", "des armes de collection"];
        let delta, recit;
        if (chance(0.55)) { delta = rand(12000, 30000); recit = `Cargaison de *${pick(marchandises)}* passée sous le nez des douanes.`; }
        else { delta = -rand(6000, 16000); recit = `Contrôle surprise : *${pick(marchandises)}* saisie(s).`; }

        setCooldown(user, "contrebande");
        user.money = Math.max(0, (user.money || 0) + delta);
        pushLog(user, "contrebande", `${delta >= 0 ? "+" : ""}${delta}🔶`);
        await saveUser(key, user);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "📦 CONTREBANDE",
            lignes: [`_${pseudo}_`, recit, "", delta >= 0 ? `✅ +${delta}🔶` : `❌ ${delta}🔶`],
            footer: `💰 Bourse : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
