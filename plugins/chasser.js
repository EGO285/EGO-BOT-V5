const { getUser, saveUser, pushLog, buildInterface } = require("../utils/users");
const { getCooldown, setCooldown, formatDuree, rand, chance } = require("../utils/evoGame");
const { pick } = require("../utils/evoVoice");

module.exports = {
    command: "!chasser",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const pseudo = text.replace("!chasser", "").trim();

        if (!pseudo) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🏹 CHASSE",
                lignes: ["👉 *!chasser <pseudo>*", "Pars chasser (toutes les 20 min)."],
            }) });
        }

        const key = pseudo.toLowerCase();
        const user = await getUser(key);
        if (!user) return sock.sendMessage(from, { text: `❌ Joueur *${pseudo}* introuvable. Crée ta fiche avec *!new ${pseudo}*.` });

        const cd = getCooldown(user, "chasser", 1200000);
        if (!cd.ready) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🏹 CHASSE",
                lignes: [`⏳ Encore un peu de patience, *${user.pseudo}*.`, `Réessaie dans *${formatDuree(cd.resteMs)}*.`],
            }) });
        }

        let delta, recit;
        if (chance(0.75)) { const gibiers = [["un lapin", 2000], ["un cerf", 6000], ["un sanglier", 9000], ["un ours", 15000]]; const g = pick(gibiers); delta = g[1]; recit = `Belle prise : *${g[0]}*.`; }
        else { delta = -rand(1000, 4000); recit = "Bredouille, et tu as cassé du matériel."; }

        setCooldown(user, "chasser");
        user.money = Math.max(0, (user.money || 0) + delta);
        pushLog(user, "chasser", `${delta >= 0 ? "+" : ""}${delta}🔶`);
        await saveUser(key, user);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "🏹 CHASSE",
            lignes: [`_${pseudo}_`, recit, "", delta >= 0 ? `✅ +${delta}🔶` : `❌ ${delta}🔶`],
            footer: `💰 Bourse : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
