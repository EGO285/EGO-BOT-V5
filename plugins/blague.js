const { pick } = require("../utils/evoVoice");
const BLAGUES = [
    ["Que dit un informaticien qui se noie ?", "F1 ! F1 !"],
    ["Pourquoi les plongeurs plongent-ils toujours en arrière ?", "Parce que sinon ils tombent dans le bateau."],
    ["Quel est le comble pour un électricien ?", "De ne pas être au courant."],
    ["Que fait une fraise sur un cheval ?", "Tagada tagada."],
    ["Pourquoi le café est allé à la police ?", "Parce qu'il s'est fait tabasser (taba-ssé)."],
    ["Quel est le sport le plus fruité ?", "La boxe, parce qu'on prend des pêches."],
    ["Comment appelle-t-on un chat tout terrain ?", "Un chat-mois (chamois)."],
    ["Quel est le comble pour un jardinier ?", "Raconter des salades."],
];
module.exports = {
    command: "!blague",
    async handler(sock, m, text) {
        const from = m.key.remoteJid;
        const b = pick(BLAGUES);
        await sock.sendMessage(from, { text: `😂 *BLAGUE*\n\n${b[0]}\n\n👉 _${b[1]}_` });
    }
};
