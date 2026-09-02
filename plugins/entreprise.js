const { getUser, saveUser, pushLog, buildInterface } = require("../utils/users");
const { getCooldown, setCooldown, formatDuree, rand, chance } = require("../utils/evoGame");
const { pick } = require("../utils/evoVoice");

module.exports = {
    command: "!entreprise",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const pseudo = text.replace("!entreprise", "").trim();

        if (!pseudo) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🏭 ENTREPRISE",
                lignes: ["👉 *!entreprise <pseudo>*", "Encaisse les revenus de ton business (toutes les 3h)."],
            }) });
        }

        const key = pseudo.toLowerCase();
        const user = await getUser(key);
        if (!user) return sock.sendMessage(from, { text: `❌ Joueur *${pseudo}* introuvable. Crée ta fiche avec *!new ${pseudo}*.` });

        const cd = getCooldown(user, "entreprise", 10800000);
        if (!cd.ready) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🏭 ENTREPRISE",
                lignes: [`⏳ Encore un peu de patience, *${user.pseudo}*.`, `Réessaie dans *${formatDuree(cd.resteMs)}*.`],
            }) });
        }

        const boites = ["ton échoppe de cartes", "ta taverne", "ta forge", "ta ferme à créatures"];
        const delta = rand(18000, 40000);
        const recit = `Recette de *${pick(boites)}* encaissée.`;

        setCooldown(user, "entreprise");
        user.money = Math.max(0, (user.money || 0) + delta);
        pushLog(user, "entreprise", `${delta >= 0 ? "+" : ""}${delta}🔶`);
        await saveUser(key, user);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "🏭 ENTREPRISE",
            lignes: [`_${pseudo}_`, recit, "", delta >= 0 ? `✅ +${delta}🔶` : `❌ ${delta}🔶`],
            footer: `💰 Bourse : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
