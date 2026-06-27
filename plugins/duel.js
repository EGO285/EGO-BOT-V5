const fs = require("fs");

const dbPath = "./data/duels.json";

function loadDB() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify({ active: {}, history: [] }, null, 2));
    }
    return JSON.parse(fs.readFileSync(dbPath));
}

function saveDB(db) {
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

module.exports = {
    command: "!duel",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        let db = loadDB();
        const args = text.split(" ");

        // =========================
        // 🟢 START DUEL
        // =========================
        if (args[1] === "debut") {
            const players = text.split("@").slice(1);

            if (players.length < 2) {
                return sock.sendMessage(from, {
                    text: "❌ Format : *!duel debut @joueur1 vs @joueur2*"
                });
            }

            const p1 = players[0].split(" ")[0].trim();
            const p2 = players[1].split(" ")[0].trim();

            db.active[from] = {
                p1, p2,
                start: new Date().toISOString(),
                openedBy: senderNumber
            };

            saveDB(db);

            return sock.sendMessage(from, {
                text:
`⚔️ *DUEL DÉMARRÉ !*

🥷 *Joueur 1* : @${p1}
🥷 *Joueur 2* : @${p2}

⏱️ Début : ${new Date().toLocaleString("fr-FR")}
📢 Lancé par @${senderNumber}

_!duel off winner: @joueur pour terminer_`,
                mentions: [senderJid]
            });
        }

        // =========================
        // 🔴 END DUEL
        // =========================
        if (args[1] === "off") {
            if (!db.active[from]) {
                return sock.sendMessage(from, { text: "❌ Aucun duel actif dans ce chat." });
            }

            const winner = text.split("winner:")[1]?.trim();

            if (!winner) {
                return sock.sendMessage(from, {
                    text: "❌ Format : *!duel off winner: @joueur*"
                });
            }

            const duel = db.active[from];

            const record = {
                p1: duel.p1,
                p2: duel.p2,
                winner: winner.replace("@", ""),
                start: duel.start,
                end: new Date().toISOString(),
                closedBy: senderNumber
            };

            db.history.push(record);
            delete db.active[from];
            saveDB(db);

            return sock.sendMessage(from, {
                text:
`🏁 *DUEL TERMINÉ !*

🥷 J1 : @${record.p1}
🥷 J2 : @${record.p2}

🏆 *Vainqueur* : @${record.winner}
📅 Fin : ${new Date().toLocaleString("fr-FR")}

_Clôturé par @${senderNumber}_`,
                mentions: [senderJid]
            });
        }

        // =========================
        // ❌ AIDE
        // =========================
        return sock.sendMessage(from, {
            text:
`⚔️ *DUEL SYSTEM*

👉 *!duel debut @j1 vs @j2* — Lancer
👉 *!duel off winner: @joueur* — Terminer`
        });
    }
};
