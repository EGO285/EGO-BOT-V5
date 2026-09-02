// ============================================================
//  utils/suggest.js
//  Suggestion de commande la plus proche quand l'utilisateur écrit
//  un "!xxx" qui ne correspond à aucune commande (fautes de frappe).
//  Basé sur la distance de Levenshtein.
// ============================================================

// Distance de Levenshtein entre deux chaînes (nombre minimal d'insertions,
// suppressions ou substitutions pour passer de a à b).
function levenshtein(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;

    const prev = new Array(n + 1);
    const curr = new Array(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;

    for (let i = 1; i <= m; i++) {
        curr[0] = i;
        for (let j = 1; j <= n; j++) {
            const cout = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(
                prev[j] + 1,       // suppression
                curr[j - 1] + 1,   // insertion
                prev[j - 1] + cout // substitution
            );
        }
        for (let j = 0; j <= n; j++) prev[j] = curr[j];
    }
    return prev[n];
}

// Trouve la commande la plus proche de `entree` parmi `commandes`.
// Retourne la commande suggérée (ex: "!tirage") ou null si rien d'assez proche.
// Seuil : distance <= 2, ou <= 40% de la longueur du mot tapé (le plus grand des deux).
function suggestCommand(entree, commandes) {
    if (!entree || !entree.startsWith("!")) return null;

    const cible = entree.toLowerCase();
    let meilleure = null;
    let meilleureDist = Infinity;

    for (const cmd of commandes) {
        const d = levenshtein(cible, cmd.toLowerCase());
        if (d < meilleureDist) {
            meilleureDist = d;
            meilleure = cmd;
        }
    }

    if (!meilleure) return null;

    const seuil = Math.max(2, Math.floor(cible.length * 0.4));
    // On évite de suggérer une commande identique (distance 0 = déjà géré ailleurs)
    if (meilleureDist === 0 || meilleureDist > seuil) return null;

    return meilleure;
}

module.exports = { levenshtein, suggestCommand };
