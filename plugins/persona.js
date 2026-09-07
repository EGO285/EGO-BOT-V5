const { PERSONAS, resolvePersona, getPersonaByKey } = require("../utils/evoPersona");
const { getPersona, setPersona } = require("../utils/evoAI");

module.exports = {
    command: "!persona",
    async handler(sock, m, text, { senderJid, senderNumber }) {
        const from = m.key.remoteJid;
        const scopeId = `${from}|${senderNumber}`;
        const arg = text.replace("!persona", "").trim();

        // Sans argument : liste les 9 personnalités + celle active.
        if (!arg) {
            const actuelle = getPersonaByKey(await getPersona(scopeId));
            const liste = PERSONAS.map((p, i) =>
                `${i + 1}. ${p.emoji} *${p.nom}*${p.key === actuelle.key ? "  ✅" : ""}\n   _${p.desc}_`
            ).join("\n");
            return sock.sendMessage(from, {
                text:
`🎭 *PERSONNALITÉS DE E.V.O*
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
${liste}
▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔
Active : ${actuelle.emoji} *${actuelle.nom}*
👉 *!persona <numéro ou nom>* pour changer.
_Ex : !persona 2  ·  !persona sensei_`,
                mentions: [senderJid],
            });
        }

        // Avec argument : change de personnalité.
        const p = resolvePersona(arg);
        if (!p) {
            return sock.sendMessage(from, {
                text: `❌ Personnalité inconnue : "${arg}".\nTape *!persona* pour voir la liste des 9.`,
                mentions: [senderJid],
            });
        }
        await setPersona(scopeId, p.key);
        await sock.sendMessage(from, {
            text: `${p.emoji} Personnalité changée : *${p.nom}*.\n_${p.desc}_\n\nParle-moi avec *!evo <message>* pour tester ce nouveau ton.`,
            mentions: [senderJid],
        });
    }
};
