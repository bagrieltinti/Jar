import { SlashCommandBuilder } from 'discord.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para importar db.js de forma compatível com Windows
async function importDb() {
  const dbPath = `file://${path.join(__dirname, '..', 'firebase', 'db.js').replace(/\\/g, '/')}`;
  return await import(dbPath);
}

export const data = new SlashCommandBuilder()
  .setName('resetar')
  .setDescription('Reseta a campanha atual neste canal');

export async function execute(interaction) {
  try {
    // Obtém o ID do canal diretamente da interação
    const channelId = interaction.channelId;
    if (!channelId) {
      console.error("Erro: ID do canal não encontrado na interação");
      return await interaction.reply({
        content: "❌ Não foi possível identificar o canal. Tente novamente.",
        ephemeral: true 
      });
    }
    
    // Obtém o canal a partir do cliente Discord
    const channel = interaction.client.channels.cache.get(channelId);
    if (!channel) {
      console.error(`Erro: Canal com ID ${channelId} não encontrado`);
      return await interaction.reply({
        content: "❌ Canal não encontrado. Verifique as permissões do bot.",
        ephemeral: true 
      });
    }
    
    console.log(`Processando comando /resetar no canal: ${channelId}`);
    
    // Importa dinamicamente o módulo db.js
    const dbModule = await importDb();
    const { getCampaignData, deleteCampaignData } = dbModule;
    
    const campanha = await getCampaignData(channelId);

    if (!campanha || (!campanha.historia?.length && !campanha.setup?.mensagens?.length)) {
      return interaction.reply({
        content: '⚠️ Nenhuma campanha ativa encontrada para resetar.',
        ephemeral: true
      });
    }

    await deleteCampaignData(channelId);
    await interaction.reply('🗑️ Campanha resetada com sucesso.');
  } catch (error) {
    console.error("Erro geral no comando resetar:", error);
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: "❌ Ocorreu um erro ao processar o comando. Verifique os logs.", ephemeral: true });
      } else {
        await interaction.reply({ content: "❌ Ocorreu um erro ao processar o comando. Verifique os logs.", ephemeral: true });
      }
    } catch (innerError) {
      console.error("Erro ao responder após erro inicial:", innerError);
    }
  }
}