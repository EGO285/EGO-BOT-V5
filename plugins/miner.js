const { getUser, saveUser, pushLog, buildInterface } = require("../utils/users");
const { getCooldown, setCooldown, formatDuree, rand, chance } = require("../utils/evoGame");
const { pick } = require("../utils/evoVoice");

module.exports = {
    command: "!miner",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const pseudo = text.replace("!miner", "").trim();

        if (!pseudo) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "⛏️ MINE",
                lignes: ["👉 *!miner <pseudo>*", "Creuse la mine (toutes les 20 min)."],
            }) });
        }

        const key = pseudo.toLowerCase();
        const user = await getUser(key);
        if (!user) return sock.sendMessage(from, { text: `❌ Joueur *${pseudo}* introuvable. Crée ta fiche avec *!new ${pseudo}*.` });

        const cd = getCooldown(user, "miner", 1200000);
        if (!cd.ready) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "⛏️ MINE",
                lignes: [`⏳ Encore un peu de patience, *${user.pseudo}*.`, `Réessaie dans *${formatDuree(cd.resteMs)}*.`],
            }) });
        }

        const gisements = [["du charbon", 1500], ["du fer", 3500], ["de l'argent", 7000], ["de l'or", 13000], ["un diamant brut", 22000]];
        const g = pick(gisements);
        const delta = g[1];
        const recit = `Ta pioche a sorti *${g[0]}*.`;

        setCooldown(user, "miner");
        user.money = Math.max(0, (user.money || 0) + delta);
        pushLog(user, "miner", `${delta >= 0 ? "+" : ""}${delta}🔶`);
        await saveUser(key, user);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "⛏️ MINE",
            lignes: [`_${pseudo}_`, recit, "", delta >= 0 ? `✅ +${delta}🔶` : `❌ ${delta}🔶`],
            footer: `💰 Bourse : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
