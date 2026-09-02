const { getUser, saveUser, pushLog, buildInterface } = require("../utils/users");

module.exports = {
    command: "!don",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const a = text.replace("!don", "").trim().split(/\s+/);
        const moi = a[0];
        const dest = a[1];
        const montant = parseInt(a[2]);

        if (!moi || !dest || isNaN(montant) || montant <= 0) {
            return sock.sendMessage(from, { text: buildInterface({
                titre: "🎁 DON",
                lignes: ["👉 *!don <tonPseudo> <destinataire> <montant>*", "Offre du Ryo de ta bourse à un autre joueur, sans frais.", "", "_Ex : !don paul marie 5000_"],
            }) });
        }
        if (moi.toLowerCase() === dest.toLowerCase()) {
            return sock.sendMessage(from, { text: "❌ Te faire un don à toi-même n'a aucun intérêt." });
        }

        const keyM = moi.toLowerCase(), keyD = dest.toLowerCase();
        const uMoi = await getUser(keyM);
        const uDest = await getUser(keyD);
        if (!uMoi) return sock.sendMessage(from, { text: `❌ Joueur *${moi}* introuvable.` });
        if (!uDest) return sock.sendMessage(from, { text: `❌ Destinataire *${dest}* introuvable.` });
        if ((uMoi.money || 0) < montant) {
            return sock.sendMessage(from, { text: `❌ Fonds insuffisants.\n💰 Bourse : *${uMoi.money || 0}🔶*` });
        }

        uMoi.money -= montant;
        uDest.money = (uDest.money || 0) + montant;
        pushLog(uMoi, "don", `Don à ${uDest.pseudo} : -${montant}🔶`);
        pushLog(uDest, "don", `Reçu de ${uMoi.pseudo} : +${montant}🔶`);
        await saveUser(keyM, uMoi);
        await saveUser(keyD, uDest);

        await sock.sendMessage(from, { text: buildInterface({
            titre: "🎁 DON",
            lignes: [`_${moi} → ${dest}_`, `✅ *${montant}🔶* transférés à *${uDest.pseudo}*. Beau geste.`],
            footer: `💰 *${uMoi.pseudo}* : *${uMoi.money}🔶*  |  *${uDest.pseudo}* : *${uDest.money}🔶*`,
        }), mentions: [senderJid] });
    }
};
