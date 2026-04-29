async function runLoop(channel) {
  if (!sessionActive || sessionRunning) return;
  sessionRunning = true;

  while (sessionActive) {

    let timeLeft = 60;

    const embedStart = new EmbedBuilder()
      .setTitle("💎 SESSION ARTICLE")
      .setDescription("Poste ton article et like les autres ❤️\n🚀 Sois actif !")
      .setImage("https://i.ibb.co/6Jm36jvX/84-F407-FF-EB63-4-EB3-83-D9-553-A1-A1-B57-D6.png")
      .setColor("#ff7b00");

    // 🔥 NOUVEAU MESSAGE SESSION
    let msg = await channel.send({
      embeds: [embedStart],
      content: `🤍 **Session article**  
🕒 Temps restant : **01:00**  
🎉 ⭐️ autorisés  

Pense à réagir aux liens des autres 🧡`
    });

    // ⏱️ COMPTEUR
    while (timeLeft > 0 && sessionActive) {
      await new Promise(r => setTimeout(r, 1000));
      timeLeft--;

      try {
        await msg.edit({
          embeds: [embedStart],
          content: `🤍 **Session article**  
🕒 Temps restant : **${formatTime(timeLeft)}**  
🎉 ⭐️ autorisés  

Pense à réagir aux liens des autres 🧡`
        });
      } catch {}
    }

    if (!sessionActive) break;

    // 🔴 MESSAGE STOP (NOUVEAU)
    const embedStop = new EmbedBuilder()
      .setTitle("🛑 SESSION STOP")
      .setDescription("Session terminée ❌")
      .setImage("https://i.ibb.co/j9mGMjDm/AE44-C3-D4-5-F52-4-D45-AE27-409-BDF00-D67-B.png")
      .setColor("#ff0000");

    await channel.send({
      embeds: [embedStop],
      content: `🛑 **Session terminée**  
⏳ Prochaine dans 25 secondes`
    });

    // ⏳ attente 25 sec
    await new Promise(r => setTimeout(r, 25000));
  }

  sessionRunning = false;
}
