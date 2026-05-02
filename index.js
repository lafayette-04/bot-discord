let participants = new Set();
let reactedUsers = new Set();
let starUsers = new Set();
let starLinkUsers = new Set();

for (const m of sessionMessages) {

  const content = m.content.trim();

  const isStarOnly = content === "⭐" || content === "⭐️";
  const isStarLink = content.startsWith("⭐") && content.includes("http");

  for (const r of m.reactions.cache.values()) {
    const users = await r.users.fetch();

    users.forEach(u => {
      if (u.bot) return;

      reactedUsers.add(u.id);
    });
  }

  // ⭐ seul = ignoré
  if (isStarOnly) {
    starUsers.add(m.author.id);
    continue;
  }

  // ⭐ + lien = exclu du calcul
  if (isStarLink) {
    starLinkUsers.add(m.author.id);
    participants.add(m.author.id);
    continue;
  }

  participants.add(m.author.id);
}

let total = participants.size;
let valid = 0;
let invalid = 0;

participants.forEach(id => {

  // ⭐ seul → ignoré
  if (starUsers.has(id)) return;

  // ⭐ + lien → ignoré aussi (ni ✅ ni ❌)
  if (starLinkUsers.has(id)) return;

  if (reactedUsers.has(id)) valid++;
  else invalid++;
});
