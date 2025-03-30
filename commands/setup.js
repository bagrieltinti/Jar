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
  .setName('setup')
  .setDescription('Adiciona uma informação ao cenário inicial da campanha')
  .addStringOption(option =>
    option.setName('conteudo')
      .setDescription('Texto descritivo sobre o mundo, personagens ou contexto')
      .setRequired(true)
  );

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
    
    console.log(`Processando comando /setup no canal: ${channelId}`);
    
    // Importa dinamicamente o módulo db.js
    const dbModule = await importDb();
    const { getCampaignData, setCampaignData } = dbModule;
    
    const campanha = await getCampaignData(channelId);
    const conteudo = interaction.options.getString('conteudo');

    if (!campanha) {
      return interaction.reply({
        content: '❌ Nenhuma campanha encontrada neste canal. Use `/iniciar` primeiro.',
        ephemeral: true
      });
    }

    if (campanha.historia?.length > 0 || campanha.setup?.finalizado) {
      return interaction.reply({
        content: '❌ A campanha já passou da fase inicial. Use `/iniciar` para iniciar uma nova campanha.',
        ephemeral: true
      });
    }

    const novosDados = [...(campanha.setup?.mensagens || []), `[${interaction.user.username}]: ${conteudo}`];

    await setCampaignData(channelId, {
      ...campanha,
      setup: {
        mensagens: novosDados,
        finalizado: false
      }
    });

    await interaction.reply(`📝 Informações adicionadas ao cenário!`);
  } catch (error) {
    console.error("Erro geral no comando setup:", error);
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