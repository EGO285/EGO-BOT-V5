module.exports = {
    command: "!verdict",

    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;

        let content = text.replace("!verdict", "").trim();
        content = content.replace(/\n/g, " ");

        const parts = content.split(" vs ");

        if (parts.length < 2) {
            return sock.sendMessage(from, {
                text: "❌ Format invalide !\n👉 *!verdict PAVÉ1 vs PAVÉ2*"
            });
        }

        const p1 = parts[0].trim();
        const p2 = parts.slice(1).join(" vs ").trim();

        if (!p1 || !p2) {
            return sock.sendMessage(from, { text: "❌ Un des pavés est vide !" });
        }

        function narrate(txt, name) {
            let t = txt.replace(/\./g, ". ").replace(/\s+/g, " ").trim();
            if (t.length > 250) t = t.slice(0, 250) + "...";
            return `🎬 *${name}* entre dans l'arène...\n\n${t}`;
        }

        const story1 = narrate(p1, "JOUEUR 1");
        const story2 = narrate(p2, "JOUEUR 2");

        let score1 = 0;
        let score2 = 0;

        const attack = ["attaque", "rasengan", "chidori", "coup", "frappe", "jutsu", "frappe", "charge", "assaut"];
        const defense = ["esquive", "bloque", "parade", "défense", "contre", "évite"];
        const speed = ["rapide", "vite", "boost", "instant", "éclair", "soudain"];
        const power = ["puissant", "dévastateur", "immense", "ultime", "maximal"];

        function analyze(txt) {
            let score = 0;
            txt = txt.toLowerCase();
            attack.forEach(w => { if (txt.includes(w)) score += 2; });
            defense.forEach(w => { if (txt.includes(w)) score += 1; });
            speed.forEach(w => { if (txt.includes(w)) score += 1; });
            power.forEach(w => { if (txt.includes(w)) score += 2; });
            score += Math.floor(txt.split(" ").length / 10); // bonus longueur
            return score;
        }

        score1 = analyze(p1);
        score2 = analyze(p2);

        const total = score1 + score2 || 1;
        const pct1 = Math.round((score1 / total) * 100);
        const pct2 = 100 - pct1;

        const bar1 = "█".repeat(Math.round(pct1 / 10)) + "░".repeat(10 - Math.round(pct1 / 10));
        const bar2 = "█".repeat(Math.round(pct2 / 10)) + "░".repeat(10 - Math.round(pct2 / 10));

        let result = "⚖️ *MATCH ÉQUILIBRÉ...* aucun ne domine vraiment !";
        if (score1 > score2 + 1) result = "🔥 *DOMINATION DU JOUEUR 1 !* L'adversaire vacille sous la pression !";
        if (score2 > score1 + 1) result = "🔥 *DOMINATION DU JOUEUR 2 !* Une contre-attaque dévastatrice change tout !";

        await sock.sendMessage(from, {
            text:
`⚔️ *COMBAT EN DIRECT — MODE NARRATEUR ANIME* ⚔️

${story1}

━━━━━━━━━━━━━━

${story2}

━━━━━━━━━━━━━━

📊 *ANALYSE DU COMBAT :*

J1 [${bar1}] ${pct1}%
J2 [${bar2}] ${pct2}%

• Puissance J1 : ${score1} pts
• Puissance J2 : ${score2} pts

🏆 *VERDICT FINAL :*
${result}

━━━━━━━━━━━━━━
_Analyse demandée par @${senderNumber}_
🎥 FIN DU COMBAT...`,
            mentions: [senderJid]
        });
    }
};
