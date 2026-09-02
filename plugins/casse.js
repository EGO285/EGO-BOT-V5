const { getUser, saveUser, pushLog, buildInterface } = require("../utils/users");
const { getCooldown, setCooldown, formatDuree, rand, chance } = require("../utils/evoGame");
const { pick } = require("../utils/evoVoice");

module.exports = {
    command: "!casse",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const pseudo = text.replace("!casse", "").trim();

        if (!pseudo) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🔐 PERCEUR DE COFFRE",
                lignes: ["👉 *!casse <pseudo>*", "Perce un coffre : 1 chance sur 5 (toutes les 1h30)."],
            }) });
        }

        const key = pseudo.toLowerCase();
        const user = await getUser(key);
        if (!user) return sock.sendMessage(from, { text: `❌ Joueur *${pseudo}* introuvable. Crée ta fiche avec *!new ${pseudo}*.` });

        const cd = getCooldown(user, "casse", 5400000);
        if (!cd.ready) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🔐 PERCEUR DE COFFRE",
                lignes: [`⏳ Encore un peu de patience, *${user.pseudo}*.`, `Réessaie dans *${formatDuree(cd.resteMs)}*.`],
            }) });
        }

        const codeBot = rand(1, 5);
        const tirage = rand(1, 5);
        let delta, recit;
        if (tirage === codeBot) { delta = rand(25000, 70000); recit = `Le coffre s'ouvre (combinaison ${codeBot}) ! Magot énorme.`; }
        else { delta = -rand(4000, 12000); recit = `Mauvaise combinaison (${tirage} au lieu de ${codeBot}). Alarme déclenchée.`; }

        setCooldown(user, "casse");
        user.money = Math.max(0, (user.money || 0) + delta);
        pushLog(user, "casse", `${delta >= 0 ? "+" : ""}${delta}🔶`);
        await saveUser(key, user);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "🔐 PERCEUR DE COFFRE",
            lignes: [`_${pseudo}_`, recit, "", delta >= 0 ? `✅ +${delta}🔶` : `❌ ${delta}🔶`],
            footer: `💰 Bourse : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
