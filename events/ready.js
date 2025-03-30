export default {
    name: 'ready',
    once: true,
    execute(client) {
      console.log(`🤖 Bot ${client.user.tag} online.`);
    }
  }
  