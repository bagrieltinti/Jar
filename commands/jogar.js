import { SlashCommandBuilder } from 'discord.js';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Funções para importar módulos de forma compatível com Windows
async function importDb() {
  const dbPath = `file://${path.join(__dirname, '..', 'firebase', 'db.js').replace(/\\/g, '/')}`;
  return await import(dbPath);
}

async function importNarrativa() {
  const narrativaPath = `file://${path.join(__dirname, '..', 'utils', 'jarNarrativa.js').replace(/\\/g, '/')}`;
  return await import(narrativaPath);
}

// Função auxiliar para dividir texto longo em partes menores
function splitTextIntoChunks(text, maxLength = 1900) {
  const chunks = [];
  let currentChunk = "";
  
  const paragraphs = text.split("\n\n");
  
  for (const paragraph of paragraphs) {
    // Se adicionar este parágrafo vai ultrapassar o limite
    if (currentChunk.length + paragraph.length + 2 > maxLength) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      if (currentChunk.length > 0) {
        currentChunk += "\n\n" + paragraph;
      } else {
        currentChunk = paragraph;
      }
    }
  }
  
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}

export const data = new SlashCommandBuilder()
  .setName('jogar')
  .setDescription('Continua a campanha atual com uma ação ou permite que o bot continue sozinho')
  .addStringOption(option =>
    option.setName('acao')
      .setDescription('O que seu personagem faz ou diz')
      .setRequired(false)
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
    
    await interaction.deferReply(); // Usar deferReply para operações que podem demorar
    
    console.log(`Processando comando /jogar no canal: ${channelId}`);
    
    // Importa dinamicamente os módulos
    const dbModule = await importDb();
    const narrativaModule = await importNarrativa();
    
    const { getCampaignData, setCampaignData } = dbModule;
    const { gerarNarrativa } = narrativaModule;
    
    const campanha = await getCampaignData(channelId);

    if (!campanha || !campanha.setup?.finalizado) {
      return interaction.editReply({ content: '⚠️ Nenhuma campanha ativa encontrada. Use /iniciar para começar.' });
    }

    try {
      const acao = interaction.options.getString('acao');
      console.log(`Ação do jogador: ${acao || 'Nenhuma (continuando narrativa)'}`);
      
      // Verificar se o setup está presente
      if (!campanha.setup.mensagens || campanha.setup.mensagens.length === 0) {
        return interaction.editReply({ content: '⚠️ Setup da campanha está incompleto. Use /iniciar para configurar corretamente.' });
      }
      
      const narrativa = await gerarNarrativa({
        setupInicial: campanha.setup.mensagens,
        historico: campanha.historia || [],
        acaoJogador: acao
      });

      // Verificar o tamanho da narrativa e dividir se necessário
      if (narrativa.length <= 2000) {
        // Narrativa cabe em uma única mensagem
        await interaction.editReply(narrativa);
      } else {
        // Narrativa precisa ser dividida
        const chunks = splitTextIntoChunks(narrativa);
        
        // Responda com a primeira parte
        await interaction.editReply(chunks[0]);
        
        // Envie o restante como mensagens separadas
        for (let i = 1; i < chunks.length; i++) {
          await channel.send(chunks[i]);
        }
      }

      // Salvar a narrativa completa no banco de dados
      const novaHistoria = [...(campanha.historia || []), narrativa];
      await setCampaignData(channelId, {
        ...campanha,
        historia: novaHistoria
      });

    } catch (error) {
      console.error('Erro ao gerar narrativa:', error);
      await interaction.editReply({ content: '❌ Ocorreu um erro ao gerar a narrativa. Por favor, tente novamente.' });
    }
  } catch (error) {
    console.error("Erro geral no comando jogar:", error);
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: "❌ Ocorreu um erro ao processar o comando. Verifique os logs." });
      } else {
        await interaction.reply({ content: "❌ Ocorreu um erro ao processar o comando. Verifique os logs.", ephemeral: true });
      }
    } catch (innerError) {
      console.error("Erro ao responder após erro inicial:", innerError);
    }
  }
}