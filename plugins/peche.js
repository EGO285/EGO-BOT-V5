const { getUser, saveUser, pushLog, buildInterface } = require("../utils/users");
const { getCooldown, setCooldown, formatDuree, rand, chance } = require("../utils/evoGame");
const { pick } = require("../utils/evoVoice");

module.exports = {
    command: "!peche",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const pseudo = text.replace("!peche", "").trim();

        if (!pseudo) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🎣 PÊCHE",
                lignes: ["👉 *!peche <pseudo>*", "Va pêcher (toutes les 15 min)."],
            }) });
        }

        const key = pseudo.toLowerCase();
        const user = await getUser(key);
        if (!user) return sock.sendMessage(from, { text: `❌ Joueur *${pseudo}* introuvable. Crée ta fiche avec *!new ${pseudo}*.` });

        const cd = getCooldown(user, "peche", 900000);
        if (!cd.ready) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🎣 PÊCHE",
                lignes: [`⏳ Encore un peu de patience, *${user.pseudo}*.`, `Réessaie dans *${formatDuree(cd.resteMs)}*.`],
            }) });
        }

        const prises = [["une vieille botte", 200], ["un poisson-chat", 2500], ["une carpe dorée", 6000], ["un koï légendaire", 12000], ["un coffre immergé", 18000]];
        const p = pick(prises);
        const delta = p[1];
        const recit = `Tu as attrapé *${p[0]}*.`;

        setCooldown(user, "peche");
        user.money = Math.max(0, (user.money || 0) + delta);
        pushLog(user, "peche", `${delta >= 0 ? "+" : ""}${delta}🔶`);
        await saveUser(key, user);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "🎣 PÊCHE",
            lignes: [`_${pseudo}_`, recit, "", delta >= 0 ? `✅ +${delta}🔶` : `❌ ${delta}🔶`],
            footer: `💰 Bourse : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
