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
  .setName('iniciar')
  .setDescription('Inicia uma nova campanha e coleta o setup inicial');

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
    
    console.log(`Iniciando campanha no canal: ${channelId}`);
    
    // Importa dinamicamente os módulos
    const dbModule = await importDb();
    const narrativaModule = await importNarrativa();
    
    const { setCampaignData, getCampaignData, deleteCampaignData } = dbModule;
    const { gerarNarrativa } = narrativaModule;

    // Inicializar campanha com setup vazio
    await setCampaignData(channelId, {
      historia: [],
      setup: {
        mensagens: [],
        finalizado: false
      }
    });

    await interaction.reply({
      content: `🎲 Campanha iniciada! Enviem mensagens neste canal nos próximos 30 segundos para montar o cenário inicial ou usem \`/setup\`.`
    });

    // Timer visual
    const countdownMessage = await channel.send("⏳ Tempo restante: 30s");
    let tempoRestante = 30;
    const interval = setInterval(() => {
      tempoRestante -= 5;
      if (tempoRestante <= 0) {
        clearInterval(interval);
        countdownMessage.edit(`⏳ Tempo esgotado!`);
      } else {
        countdownMessage.edit(`⏳ Tempo restante: ${tempoRestante}s`);
      }
    }, 5000);

    // Coletar mensagens
    const collected = [];
    const respostas = [
      "✍️ Certo, anotado.",
      "🧠 Isso vai entrar no mundo.",
      "📚 Perfeito, vou usar isso.",
      "🗺️ Entendido, interessante.",
      "💭 Anotado para montar o cenário."
    ];

    const filter = m => !m.author.bot;
    const collector = channel.createMessageCollector({ filter, time: 30000 });

    collector.on('collect', async (message) => {
      collected.push(`[${message.author.username}]: ${message.content}`);
      const resposta = respostas[Math.floor(Math.random() * respostas.length)];
      await message.reply(resposta);
    });

    collector.on('end', async () => {
      clearInterval(interval);
      
      try {
        const campanha = await getCampaignData(channelId);
        if (!campanha) {
          console.warn("❌ Campanha não encontrada ao final do setup.");
          await channel.send("❌ Ocorreu um erro ao finalizar o setup. Por favor, tente novamente com `/iniciar`.");
          return;
        }

        const todasMensagens = [...(campanha.setup?.mensagens || []), ...collected];
        
        if (todasMensagens.length === 0) {
          await channel.send("❌ Nenhuma informação foi fornecida para o cenário. Use `/iniciar` novamente para recomeçar.");
          await deleteCampaignData(channelId);
          return;
        }

        await setCampaignData(channelId, {
          ...campanha,
          setup: {
            mensagens: todasMensagens,
            finalizado: true
          }
        });

        await channel.send("📋 **Resumo do cenário definido pelos jogadores:**\n" + todasMensagens.map(m => `• ${m}`).join("\n"));

        try {
          const narrativa = await gerarNarrativa({
            setupInicial: todasMensagens,
            historico: [],
            acaoJogador: null
          });

          // Adicionar primeira narrativa ao histórico
          await setCampaignData(channelId, {
            ...campanha,
            setup: {
              mensagens: todasMensagens,
              finalizado: true
            },
            historia: [narrativa]
          });

          // Verificar o tamanho da narrativa e dividir se necessário
          if (narrativa.length <= 2000) {
            // Narrativa cabe em uma única mensagem
            await channel.send(`📖 **Introdução da campanha:**\n${narrativa}`);
          } else {
            // Narrativa precisa ser dividida
            const chunks = splitTextIntoChunks(narrativa);
            
            // Envie a primeira parte com o título
            await channel.send(`📖 **Introdução da campanha:**\n${chunks[0]}`);
            
            // Envie o restante como mensagens separadas
            for (let i = 1; i < chunks.length; i++) {
              await channel.send(chunks[i]);
            }
          }
        } catch (error) {
          console.error("Erro ao gerar narrativa:", error);
          await channel.send("❌ Ocorreu um erro ao gerar a narrativa inicial. Por favor, tente novamente.");
        }
      } catch (error) {
        console.error("Erro ao finalizar coleta de setup:", error);
        await channel.send("❌ Ocorreu um erro ao processar as informações. Por favor, tente novamente com `/iniciar`.");
      }
    });
  } catch (error) {
    console.error("Erro geral no comando iniciar:", error);
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