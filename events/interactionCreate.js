export default {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      if (!interaction.isChatInputCommand()) return;
      
      const commandName = interaction.commandName;
      console.log(`Recebido comando: ${commandName}`);
      
      // Verificar se client e commands estão disponíveis
      if (!interaction.client) {
        console.error("Client não está disponível");
        return;
      }
      
      if (!interaction.client.commands) {
        console.error("Client.commands não está disponível");
        try {
          await interaction.reply({ content: 'Erro no sistema de comandos.', ephemeral: true });
        } catch (err) {
          console.error("Erro ao responder interação:", err);
        }
        return;
      }
      
      const command = interaction.client.commands.get(commandName);
      if (!command) {
        console.warn(`Comando não encontrado: ${commandName}`);
        try {
          await interaction.reply({ content: 'Comando não encontrado.', ephemeral: true });
        } catch (err) {
          console.error("Erro ao responder interação:", err);
        }
        return;
      }

      // Execute o comando
      await command.execute(interaction);
    } catch (error) {
      console.error("Erro no handler de interactionCreate:", error);
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: 'Erro ao executar comando.', ephemeral: true });
        } else {
          await interaction.followUp({ content: 'Erro ao executar comando.', ephemeral: true });
        }
      } catch (err) {
        console.error("Erro ao responder após falha:", err);
      }
    }
  }
}