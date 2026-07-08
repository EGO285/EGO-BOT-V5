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
const crypto = require("crypto");
const QRCode = require("qrcode");
const { verifierEcheancesBancaires } = require("./utils/users");

// =========================
// FILET DE SÉCURITÉ ANTI-CRASH
// =========================
// Sans ça, UNE SEULE erreur non rattrapée n'importe où dans le bot (ex: une
// image/vidéo dont l'URL est cassée ou expirée, envoyée via sock.sendMessage)
// arrête TOUT le processus Node — le bot entier se déconnecte de WhatsApp
// jusqu'au prochain redémarrage manuel ou automatique sur Render.
// On journalise l'erreur au lieu de laisser le process mourir.
process.on("unhandledRejection", (reason) => {
    console.error("⚠️ Promesse rejetée non gérée (le bot continue de tourner) :", reason);
});
process.on("uncaughtException", (err) => {
    console.error("⚠️ Exception non gérée (le bot continue de tourner) :", err);
});

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
// MODE DE CONNEXION : QR CODE ou PAIRING CODE
// =========================
// USE_QR_CODE=true  -> affiche un QR à scanner, servi en image sur une URL protégée
// USE_QR_CODE=false (défaut) -> code de jumelage (pairing code) dans les logs, rien à scanner
const USE_QR_CODE = (process.env.USE_QR_CODE || "false").toLowerCase() === "true";

// Jeton secret pour protéger l'URL du QR : sans lui, impossible de voir le QR.
// Sans ça, n'importe qui trouvant l'URL publique Render pourrait scanner le QR
// à ta place et lier SON téléphone au bot au lieu du tien.
// Fixe QR_SECRET dans les variables d'environnement Render pour un lien stable,
// sinon un secret aléatoire est généré à chaque démarrage (visible dans les logs).
const QR_SECRET = process.env.QR_SECRET || crypto.randomBytes(12).toString("hex");

// URL publique du service (fournie automatiquement par Render pour un Web Service)
const PUBLIC_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`;

// État en mémoire du QR actuellement affichable (régénéré à chaque nouveau QR émis par Baileys)
let currentQrBuffer = null;
let currentQrGeneratedAt = null;

// =========================
// SERVER (Render / Heroku)
// =========================
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

    // Page HTML avec l'image du QR + auto-refresh (le QR expire après ~60s
    // et Baileys en régénère un nouveau tant qu'il n'est pas scanné)
    if (url.pathname === "/qr") {
        if (!USE_QR_CODE) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            return res.end("Mode QR désactivé (USE_QR_CODE=false). Le bot utilise le pairing code.\n");
        }
        if (url.searchParams.get("token") !== QR_SECRET) {
            res.writeHead(403, { "Content-Type": "text/plain" });
            return res.end("Accès refusé : jeton invalide.\n");
        }
        if (!currentQrBuffer) {
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            return res.end(`<meta http-equiv="refresh" content="5"><p style="font-family:sans-serif">En attente du QR code... (actualisation automatique)</p>`);
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        return res.end(`
<!DOCTYPE html>
<html>
<head><meta http-equiv="refresh" content="15"><title>EGO BOT — QR Code</title></head>
<body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#111;font-family:sans-serif;color:#fff;">
    <h2>📱 Scanne ce QR avec WhatsApp</h2>
    <img src="/qr/image.png?token=${QR_SECRET}" alt="QR Code WhatsApp" style="width:320px;height:320px;background:#fff;padding:16px;border-radius:12px;" />
    <p>Page actualisée automatiquement toutes les 15s (le QR expire après ~60s).</p>
</body>
</html>`);
    }

    // L'image PNG brute du QR (utilisée par la page ci-dessus)
    if (url.pathname === "/qr/image.png") {
        if (!USE_QR_CODE || url.searchParams.get("token") !== QR_SECRET || !currentQrBuffer) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            return res.end("QR indisponible.\n");
        }
        res.writeHead(200, { "Content-Type": "image/png" });
        return res.end(currentQrBuffer);
    }

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("EGO BOT is running\n");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur HTTP en écoute sur le port ${PORT}`);
    if (USE_QR_CODE) {
        console.log("====================================");
        console.log("      📱 EGO BOT — MODE QR CODE");
        console.log("====================================");
        console.log(`Ouvre cette URL pour scanner : ${PUBLIC_URL}/qr?token=${QR_SECRET}`);
        console.log("⚠️ Garde ce lien secret, il permet de lier un appareil au bot.");
        console.log("====================================");
    }
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
    // PAIRING CODE (uniquement si le mode QR n'est pas activé)
    // =========================
    if (!USE_QR_CODE && !sock.authState.creds.registered) {
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
        const { connection, lastDisconnect, qr } = update;

        if (qr && USE_QR_CODE) {
            try {
                currentQrBuffer = await QRCode.toBuffer(qr, { width: 400, margin: 2 });
                currentQrGeneratedAt = new Date();
                console.log(`📱 Nouveau QR disponible : ${PUBLIC_URL}/qr?token=${QR_SECRET}`);
            } catch (e) {
                console.error("Erreur génération QR:", e);
            }
        }

        if (connection === "close") {
            const shouldReconnect =
                (lastDisconnect?.error instanceof Boom)
                    ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
                    : true;

            console.log("Connexion fermée. Reconnexion :", shouldReconnect);
            if (shouldReconnect) startBot();

        } else if (connection === "open") {
            console.log("✅ EGO BOT CONNECTÉ");
            // Le QR n'est plus utile une fois connecté, on vide l'état en mémoire
            currentQrBuffer = null;
            currentQrGeneratedAt = null;

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

// =========================
// VÉRIFICATION PÉRIODIQUE DES PRÊTS
// =========================
// Indépendante de la connexion WhatsApp (ne touche que les données Redis) :
// placée au niveau module pour n'avoir qu'un seul intervalle actif, même si
// startBot() est rappelé plusieurs fois suite à des reconnexions.
const VERIF_INTERVAL_MS = 5 * 60 * 1000; // toutes les 5 minutes
setInterval(async () => {
    try {
        const nb = await verifierEcheancesBancaires();
        if (nb > 0) console.log(`🏦 ${nb} compte(s) bancaire(s) mis à jour (échéances de prêt).`);
    } catch (e) {
        console.error("Erreur vérification échéances bancaires:", e);
    }
}, VERIF_INTERVAL_MS);

startBot();
