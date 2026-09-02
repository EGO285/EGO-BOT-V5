const { pick } = require("../utils/evoVoice");
const CITATIONS = [
    ["La seule limite à notre épanouissement de demain sera nos doutes d'aujourd'hui.", "Franklin D. Roosevelt"],
    ["Le succès, c'est tomber sept fois et se relever huit.", "Proverbe japonais"],
    ["Fais de ta vie un rêve, et d'un rêve, une réalité.", "Antoine de Saint-Exupéry"],
    ["Ce n'est pas parce que c'est difficile qu'on n'ose pas, c'est parce qu'on n'ose pas que c'est difficile.", "Sénèque"],
    ["La chance sourit aux audacieux.", "Virgile"],
    ["Un voyage de mille lieues commence toujours par un premier pas.", "Lao Tseu"],
    ["Il n'y a pas de vent favorable pour celui qui ne sait où il va.", "Sénèque"],
    ["Le meilleur moment pour planter un arbre, c'était il y a vingt ans. Le deuxième, c'est maintenant.", "Proverbe"],
];
module.exports = {
    command: "!citation",
    async handler(sock, m, text) {
        const from = m.key.remoteJid;
        const c = pick(CITATIONS);
        await sock.sendMessage(from, { text: `📖 *CITATION*\n\n_"${c[0]}"_\n\n— *${c[1]}*` });
    }
};
