// Structure : chronos.active[groupId] = { [targetNumber]: { timeout, remaining, start, jid, number } }
// Idem pour chronos.paused[groupId] = { [targetNumber]: { remaining, jid, number } }
// Permet plusieurs chronomètres simultanés dans un même groupe, chacun attribué à un joueur différent.
module.exports = {
    active: {},
    paused: {}
};
