const { getUser, saveUser, pushLog, buildInterface, estFicheBloquee } = require("../utils/users");
const { chance, rand } = require("../utils/evoGame");

module.exports = {
    command: "!investir",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const a = text.replace("!investir", "").trim().split(/\s+/);
        const pseudo = a[0];
        const montant = parseInt(a[1]);

        if (!pseudo || isNaN(montant) || montant <= 0) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "📈 INVESTISSEMENT",
                lignes: ["👉 *!investir <pseudo> <montant>*", "Place ton Ryo sur le marché. Ça peut monter... ou chuter.", "", "_Ex : !investir paul 10000_"],
            }) });
        }

        const key = pseudo.toLowerCase();
        const user = await getUser(key);
        if (!user) return sock.sendMessage(from, { text: `❌ Joueur *${pseudo}* introuvable.` });
        const bloc = estFicheBloquee(user);
        if (bloc.bloque) return sock.sendMessage(from, { text: bloc.error });
        if ((user.money || 0) < montant) return sock.sendMessage(from, { text: `❌ Fonds insuffisants.\n💰 Bourse : *${user.money || 0}🔶*` });

        let variation, recit;
        const r = Math.random();
        if (r < 0.15) { variation = rand(80, 140) / 100; recit = "🚀 Le marché s'envole !"; }
        else if (r < 0.55) { variation = rand(20, 60) / 100; recit = "📈 Belle hausse."; }
        else if (r < 0.75) { variation = 0; recit = "➖ Marché plat, tu récupères ta mise."; }
        else { variation = -rand(20, 60) / 100; recit = "📉 Le marché plonge..."; }

        const gainNet = Math.round(montant * variation);
        user.money = Math.max(0, user.money + gainNet);
        pushLog(user, "investir", `Investissement ${montant}🔶 → ${gainNet >= 0 ? "+" : ""}${gainNet}🔶`);
        await saveUser(key, user);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "📈 INVESTISSEMENT",
            lignes: [`_${pseudo}_`, `💵 Misé : *${montant}🔶*`, recit, "", gainNet >= 0 ? `✅ Résultat : +${gainNet}🔶` : `❌ Résultat : ${gainNet}🔶`],
            footer: `💰 Bourse : *${user.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
