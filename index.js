require("dotenv").config();

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    isJidBroadcast,
} = require("@whiskeysockets/baileys");

const { Boom } = require("@hapi/boom");
const fs = require("fs");
const path = require("path");
const pino = require("pino");
const http = require("http");
const crypto = require("crypto");
const QRCode = require("qrcode");
const { verifierEcheancesBancaires } = require("./utils/users");
const { suggestCommand } = require("./utils/suggest");
const { evoUnknownCommand } = require("./utils/evoVoice");

// =========================
// FILET DE SÉCURITÉ ANTI-CRASH
// =========================
process.on("unhandledRejection", (reason) => {
    console.error("⚠️ Promesse rejetée non gérée (le bot continue de tourner) :", reason);
});
process.on("uncaughtException", (err) => {
    console.error("⚠️ Exception non gérée (le bot continue de tourner) :", err);
});

// =========================
// DOSSIER DE DONNÉES
// =========================
const DATA_DIR = "./data";
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`📁 Dossier ${DATA_DIR} créé.`);
}

// =========================
// DOSSIER DE SESSION — chemin absolu pour survivre aux CWD changeants sur Render
// =========================
const SESSION_DIR = path.resolve("./session");
if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
    console.log(`📁 Dossier session créé : ${SESSION_DIR}`);
}

// =========================
// MODE DE CONNEXION : QR CODE ou PAIRING CODE
// =========================
const USE_QR_CODE = (process.env.USE_QR_CODE || "false").toLowerCase() === "true";

const QR_SECRET = process.env.QR_SECRET || crypto.randomBytes(12).toString("hex");
const PUBLIC_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`;

let currentQrBuffer = null;
let currentQrGeneratedAt = null;

// =========================
// SERVER (Render / Heroku)
// =========================
const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);

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
<head><meta http-equiv="refresh" content="15"><title>E.V.O — QR Code</title></head>
<body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#111;font-family:sans-serif;color:#fff;">
    <h2>📱 E.V.O — Scanne ce QR avec WhatsApp</h2>
    <img src="/qr/image.png?token=${QR_SECRET}" alt="QR Code WhatsApp" style="width:320px;height:320px;background:#fff;padding:16px;border-radius:12px;" />
    <p>Page actualisée automatiquement toutes les 15s (le QR expire après ~60s).</p>
</body>
</html>`);
    }

    if (url.pathname === "/qr/image.png") {
        if (!USE_QR_CODE || url.searchParams.get("token") !== QR_SECRET || !currentQrBuffer) {
            res.writeHead(404, { "Content-Type": "text/plain" });
            return res.end("QR indisponible.\n");
        }
        res.writeHead(200, { "Content-Type": "image/png" });
        return res.end(currentQrBuffer);
    }

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("E.V.O (EGO VIRTUAL OPERATOR) is running\n");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur HTTP en écoute sur le port ${PORT}`);
    if (USE_QR_CODE) {
        console.log("====================================");
        console.log("      📱 E.V.O — EGO VIRTUAL OPERATOR — MODE QR CODE");
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
const BOT_PHONE_NUMBER = process.env.PHONE_NUMBER || "22361872227";
const BOT_PROFILE_PIC_URL = "https://files.catbox.moe/ys8fij.jpg";

// =========================
// CHARGEMENT DES PLUGINS
// =========================
const PLUGINS = fs.readdirSync("./plugins")
    .filter(file => file.endsWith(".js"))
    .map(file => require(`./plugins/${file}`))
    .sort((a, b) => b.command.length - a.command.length);

// Liste plate de toutes les commandes connues (pour la suggestion anti-faute).
const ALL_COMMANDS = PLUGINS.map(p => p.command);

// =========================
// COMPTEUR DE RECONNEXIONS
// =========================
// Évite la boucle infinie si WhatsApp ban le bot ou si la session est invalide.
// Réinitialise à 0 à chaque connexion réussie.
let reconnectCount = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_BASE_DELAY_MS = 3000;

// =========================
// BOT START
// =========================
async function startBot() {
    // FIX 1 — récupère toujours la version Baileys la plus récente compatible WA
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`📦 Baileys version : ${version.join(".")} — dernière : ${isLatest}`);

    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);

    const sock = makeWASocket({
        version,
        auth: {
            creds: state.creds,
            // FIX 2 — cache des clés de signal pour éviter les "bad mac" / décos répétés
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),

        // FIX 3 — keepalive toutes les 25s (Render coupe les idle connections après ~30s)
        keepAliveIntervalMs: 25_000,

        // FIX 4 — timeout de connexion généreux pour les démarrages lents sur Render
        connectTimeoutMs: 60_000,

        // FIX 5 — identifiant navigateur stable (WhatsApp le mémorise, moins de décos)
        browser: ["EVO-BOT", "Chrome", "10.0"],

        // FIX 6 — getMessage permet à Baileys de re-déchiffrer les messages en cas de retransmission
        getMessage: async (key) => {
            return { conversation: "" };
        },

        // FIX 7 — n'émet pas ses propres messages comme entrants (évite les boucles)
        emitOwnEvents: false,

        // FIX 8 — ignore les messages broadcast (status WA) qui causent des erreurs de déchiffrement
        shouldIgnoreJid: (jid) => isJidBroadcast(jid),

        // FIX 9 — pas de sync de l'historique complet (trop lourd, cause des timeouts sur Render)
        syncFullHistory: false,
        fireInitQueries: false,
    });

    // =========================
    // PAIRING CODE
    // =========================
    if (!USE_QR_CODE && !sock.authState.creds.registered) {
        setTimeout(async () => {
            try {
                const code = await sock.requestPairingCode(BOT_PHONE_NUMBER);
                console.log("====================================");
                console.log("      🎴 E.V.O — PAIRING CODE");
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
            currentQrBuffer = null;
            currentQrGeneratedAt = null;

            const statusCode = (lastDisconnect?.error instanceof Boom)
                ? lastDisconnect.error.output.statusCode
                : null;

            const loggedOut = statusCode === DisconnectReason.loggedOut;

            console.log(`Connexion fermée. Code : ${statusCode ?? "inconnu"}. Déconnecté définitivement : ${loggedOut}`);

            if (loggedOut) {
                // FIX 10 — supprime la session corrompue/expirée pour repartir proprement
                console.log("🗑️ Session expirée — suppression du dossier session pour forcer une nouvelle auth.");
                try {
                    fs.rmSync(SESSION_DIR, { recursive: true, force: true });
                    fs.mkdirSync(SESSION_DIR, { recursive: true });
                } catch (e) {
                    console.error("Erreur suppression session:", e.message);
                }
                reconnectCount = 0;
                startBot();
                return;
            }

            // FIX 11 — backoff exponentiel + limite de tentatives pour éviter la boucle infinie
            reconnectCount++;
            if (reconnectCount > MAX_RECONNECT_ATTEMPTS) {
                console.error(`❌ ${MAX_RECONNECT_ATTEMPTS} reconnexions échouées consécutives. Arrêt.`);
                process.exit(1); // Render redémarre automatiquement le process
                return;
            }

            const delay = Math.min(RECONNECT_BASE_DELAY_MS * Math.pow(2, reconnectCount - 1), 60_000);
            console.log(`🔄 Reconnexion #${reconnectCount} dans ${delay / 1000}s...`);
            setTimeout(() => startBot(), delay);

        } else if (connection === "open") {
            reconnectCount = 0; // reset du compteur à chaque connexion réussie
            console.log("✅ E.V.O (EGO VIRTUAL OPERATOR) CONNECTÉ");
            currentQrBuffer = null;
            currentQrGeneratedAt = null;

            // FIX 12 — vérifie que sock.user est bien défini avant d'utiliser son .id
            if (sock.user?.id) {
                try {
                    await sock.updateProfilePicture(sock.user.id, { url: BOT_PROFILE_PIC_URL });
                    console.log("🖼️ Photo de profil du bot mise à jour.");
                } catch (e) {
                    console.error("Erreur mise à jour photo de profil au démarrage :", e.message);
                }
            }
        }
    });

    // =========================
    // MESSAGES
    // =========================
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
        // FIX 13 — ignore les notifications (type !== "notify") qui ne sont pas des vrais messages
        if (type !== "notify") return;

        const m = messages[0];
        if (!m.message) return;

        // FIX 14 — ignore les messages envoyés PAR le bot lui-même
        if (m.key.fromMe) return;

        const msg = m.message;

        const text =
            msg.conversation ||
            msg.extendedTextMessage?.text ||
            msg.imageMessage?.caption ||
            msg.videoMessage?.caption ||
            "";

        const cleanText = text.toLowerCase().trim();
        const from = m.key.remoteJid;

        // FIX 15 — ignore les broadcasts WhatsApp (status, etc.)
        if (!from || isJidBroadcast(from)) return;

        // =========================
        // RÉCUPÉRER SENDER
        // =========================
        const senderJid = m.key.participantPn || m.key.participant || m.key.remoteJidAlt || m.key.remoteJid;
        const senderNumber = senderJid
            .split("@")[0]
            .split(":")[0]
            .replace("+", "")
            .trim();
        const isAdmin = ADMIN_NUMBERS.some(n => senderNumber === n || senderNumber.endsWith(n.slice(-9)));

        // =========================
        // PLUGINS SYSTEM
        // =========================
        let matched = false;
        for (const cmd of PLUGINS) {
            if (cleanText.startsWith(cmd.command)) {
                matched = true;
                if (cmd.adminOnly && !isAdmin) {
                    sock.sendMessage(from, {
                        text: `⛔ @${senderNumber} tu n'as pas la permission d'utiliser cette commande.`,
                        mentions: [senderJid]
                    });
                    return;
                }
                cmd.handler(sock, m, cleanText, { senderJid, senderNumber, isAdmin });
                break;
            }
        }

        // =========================
        // SUGGESTION ANTI-FAUTE (façon IA)
        // =========================
        // Si le message commence par "!" (donc l'utilisateur VOULAIT une commande)
        // mais qu'aucune commande ne matche, E.V.O propose la plus proche
        // ("ne vouliez-vous pas écrire ... à tout hasard ?").
        if (!matched && cleanText.startsWith("!")) {
            const premierMot = cleanText.split(/\s+/)[0];
            const suggestion = suggestCommand(premierMot, ALL_COMMANDS);
            await sock.sendMessage(from, {
                text: evoUnknownCommand(premierMot, suggestion),
                mentions: [senderJid]
            });
            return;
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
const VERIF_INTERVAL_MS = 5 * 60 * 1000;
setInterval(async () => {
    try {
        const nb = await verifierEcheancesBancaires();
        if (nb > 0) console.log(`🏦 ${nb} compte(s) bancaire(s) mis à jour (échéances de prêt).`);
    } catch (e) {
        console.error("Erreur vérification échéances bancaires:", e);
    }
}, VERIF_INTERVAL_MS);

startBot();
