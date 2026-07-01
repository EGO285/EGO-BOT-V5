require("dotenv").config();

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const { Boom } = require("@hapi/boom");
const fs = require("fs");
const pino = require("pino");
const http = require("http");

// =========================
// DOSSIER DE DONNÉES
// =========================
// Sur un disque vierge (premier déploiement Render, ou après un redéploiement
// puisque le disque est éphémère), ce dossier n'existe pas encore.
// fs.writeFileSync peut créer un fichier manquant, mais pas un dossier manquant
// → on le crée explicitement ici, une seule fois, avant tout le reste.
const DATA_DIR = "./data";
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`📁 Dossier ${DATA_DIR} créé.`);
}

// =========================
// SERVER (Render / Heroku)
// =========================
const server = http.createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("EGO BOT is running\n");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur HTTP en écoute sur le port ${PORT}`);
});

// =========================
// CONFIG ADMINS
// =========================
const ADMIN_NUMBERS = ["330665384876", "233275249576"]; // ← ajoute tes numéros ici (sans +)

// Numéro sur lequel le bot lui-même se connecte (pairing code), sans le +
const BOT_PHONE_NUMBER = process.env.PHONE_NUMBER || "22361872227";

// Image de profil appliquée automatiquement au démarrage
const BOT_PROFILE_PIC_URL = "https://files.catbox.moe/ys8fij.jpg";

// =========================
// CHARGEMENT DES PLUGINS
// =========================
// Chargés une seule fois au démarrage (au lieu de relire le dossier et de
// recharger chaque fichier à chaque message reçu, ce qui était coûteux).
// Triés par longueur de commande décroissante pour que les commandes plus
// longues et spécifiques (ex: !stopfight) soient testées avant les plus
// courtes qui pourraient matcher par erreur (ex: !stop).
const PLUGINS = fs.readdirSync("./plugins")
    .filter(file => file.endsWith(".js"))
    .map(file => require(`./plugins/${file}`))
    .sort((a, b) => b.command.length - a.command.length);

// =========================
// BOT START
// =========================
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./session");

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" })
    });

    // =========================
    // PAIRING CODE
    // =========================
    if (!sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(BOT_PHONE_NUMBER);
                console.log("====================================");
                console.log("      🎴 EGO BOT PAIRING CODE");
                console.log("====================================");
                console.log(code);
                console.log("====================================");
            } catch (e) {
                console.error("Pairing error:", e);
            }
        }, 4000);
    }

    sock.ev.on("creds.update", saveCreds);

    // =========================
    // CONNECTION
    // =========================
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "close") {
            const shouldReconnect =
                (lastDisconnect?.error instanceof Boom)
                    ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                    : true;

            console.log("Connexion fermée. Reconnexion :", shouldReconnect);
            if (shouldReconnect) startBot();

        } else if (connection === "open") {
            console.log("✅ EGO BOT CONNECTÉ");

            // Applique automatiquement la photo de profil du bot au démarrage
            try {
                await sock.updateProfilePicture(sock.user.id, { url: BOT_PROFILE_PIC_URL });
                console.log("🖼️ Photo de profil du bot mise à jour.");
            } catch (e) {
                console.error("Erreur mise à jour photo de profil au démarrage :", e.message);
            }
        }
    });

    // =========================
    // MESSAGES
    // =========================
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        const msg = m.message;

        const text =
            msg.conversation ||
            msg.extendedTextMessage?.text ||
            msg.imageMessage?.caption ||
            msg.videoMessage?.caption ||
            "";

        const cleanText = text.toLowerCase().trim();
        const from = m.key.remoteJid;

        // =========================
        // RÉCUPÉRER SENDER
        // =========================
        // participantPn / remoteJidAlt contient le vrai numéro même si participant est un JID @lid
        const senderJid = m.key.participantPn || m.key.participant || m.key.remoteJidAlt || m.key.remoteJid;
        const senderNumber = senderJid
            .split("@")[0]
            .split(":")[0]   // retire le suffixe device (ex: 33665384876:14)
            .replace("+", "")
            .trim();
        const isAdmin = ADMIN_NUMBERS.some(n => senderNumber === n || senderNumber.endsWith(n.slice(-9)));

        // =========================
        // PLUGINS SYSTEM
        // =========================
        for (const cmd of PLUGINS) {
            if (cleanText.startsWith(cmd.command)) {
                // Certaines commandes sont admin-only
                if (cmd.adminOnly && !isAdmin) {
                    sock.sendMessage(from, {
                        text: `⛔ @${senderNumber} tu n'as pas la permission d'utiliser cette commande.`,
                        mentions: [senderJid]
                    });
                    return;
                }
                cmd.handler(sock, m, cleanText, { senderJid, senderNumber, isAdmin });
                break; // une seule commande par message
            }
        }

        // =========================
        // STOCKAGE COMBATS
        // =========================
        const dbPath = "./data/combats.json";

        if (!fs.existsSync(dbPath)) {
            fs.writeFileSync(dbPath, JSON.stringify({ active: {} }, null, 2));
        }

        const db = JSON.parse(fs.readFileSync(dbPath));

        if (db.active[from]) {
            if (!cleanText.startsWith("!")) {
                db.active[from].messages.push(cleanText);
                fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
            }
        }
    });
}

startBot();
