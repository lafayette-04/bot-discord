// 🔽 REMPLACE UNIQUEMENT CE BLOC (analyse + DM)

let total = participants.size;
let valid = 0;
let invalid = 0;

participants.forEach(id => {
  if (starUsers.has(id)) return;

  // ⭐ + lien = à jour
  if (starLinkUsers.has(id)) {
    valid++;
    return;
  }

  if (reactedUsers.has(id)) valid++;
  else invalid++;
});


// 🔽 DM + WARNING CORRIGÉ
const sessionTime = new Date().toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' });

let userMissing = {};

for (const
