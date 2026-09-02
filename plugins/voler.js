const { getUser, saveUser, pushLog, buildInterface, estFicheBloquee } = require("../utils/users");
const { getCooldown, setCooldown, formatDuree, rand, chance } = require("../utils/evoGame");

module.exports = {
    command: "!voler",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const a = text.replace("!voler", "").trim().split(/\s+/);
        const moi = a[0];
        const cible = a[1];

        if (!moi || !cible) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🕵️ VOL",
                lignes: ["👉 *!voler <tonPseudo> <cible>*", "Tente de piquer du Ryo à un autre joueur (50% de réussir).", "", "_Ex : !voler paul marie_"],
            }) });
        }
        if (moi.toLowerCase() === cible.toLowerCase()) {
            return sock.sendMessage(from, { text: "❌ Tu ne peux pas te voler toi-même." });
        }

        const keyM = moi.toLowerCase(), keyC = cible.toLowerCase();
        const uMoi = await getUser(keyM);
        const uCible = await getUser(keyC);
        if (!uMoi) return sock.sendMessage(from, { text: `❌ Joueur *${moi}* introuvable.` });
        if (!uCible) return sock.sendMessage(from, { text: `❌ Cible *${cible}* introuvable.` });

        const bloc = estFicheBloquee(uMoi);
        if (bloc.bloque) return sock.sendMessage(from, { text: bloc.error });

        const cd = getCooldown(uMoi, "voler", 60 * 60 * 1000);
        if (!cd.ready) return sock.sendMessage(from, { text: `⏳ *${uMoi.pseudo}*, tu dois attendre *${formatDuree(cd.resteMs)}* avant un nouveau vol.` });

        setCooldown(uMoi, "voler");

        let recit, delta;
        if ((uCible.money || 0) < 1000) {
            delta = 0;
            recit = `*${uCible.pseudo}* n'a presque rien sur lui. Rien à voler.`;
        } else if (chance(0.5)) {
            const butin = Math.round((uCible.money) * (rand(5, 15) / 100));
            uCible.money -= butin;
            uMoi.money = (uMoi.money || 0) + butin;
            delta = butin;
            recit = `✅ Tu as délesté *${uCible.pseudo}* de *${butin}🔶* !`;
            pushLog(uCible, "vole", `Volé par ${uMoi.pseudo} : -${butin}🔶`);
        } else {
            const amende = rand(2000, 6000);
            uMoi.money = Math.max(0, (uMoi.money || 0) - amende);
            delta = -amende;
            recit = `❌ Pris la main dans le sac ! Amende de *${amende}🔶*.`;
        }

        pushLog(uMoi, "voler", recit);
        await saveUser(keyC, uCible);
        await saveUser(keyM, uMoi);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "🕵️ VOL",
            lignes: [`_${moi} → ${cible}_`, recit],
            footer: `💰 Bourse de *${uMoi.pseudo}* : *${uMoi.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
