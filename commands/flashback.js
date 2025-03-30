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

// Função para gerar um flashback baseado no contexto atual
async function gerarFlashback(setupInicial, historico, personagem, momento) {
  const promptBase = `
Você é Jar, um narrador de RPG de texto especializado em criar experiências narrativas imersivas e emocionantes usando apenas texto.
Estou pedindo que você crie um FLASHBACK - uma cena do passado que é relevante para a narrativa atual.

O flashback deve ter as seguintes características:
1. Ser emotivo e revelar algo significativo sobre o personagem ou mundo
2. Conectar-se com os eventos atuais da história de forma relevante
3. Aprofundar a compreensão do contexto ou motivações dos personagens
4. Ser conciso e atmosférico, como uma memória vívida

Limite sua resposta a no máximo 1500 caracteres. Seja conciso e objetivo.
`;

  const mensagemUsuario = `
# 📜 CONTEXTO DA CAMPANHA:
${setupInicial.join("\n")}

# 📚 HISTÓRICO RECENTE:
${historico.slice(-2).join("\n\n")}

# 🔮 INSTRUÇÃO PARA FLASHBACK:
${personagem ? `Crie um flashback focado no personagem "${personagem}".` : 'Crie um flashback para qualquer personagem relevante na história.'}
${momento ? `O flashback deve estar relacionado ao momento/evento "${momento}".` : 'Escolha um momento passado que se conecte com os eventos atuais.'}

# IMPORTANTE: 
O flashback deve parecer uma memória vivida, use tempo verbal no passado e detalhes sensoriais. 
Limite sua resposta a no máximo 1500 caracteres.
`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://discord-bot.com",
        "X-Title": "JarRPG Bot"
      },
      body: JSON.stringify({
        model: "mistralai/mixtral-8x7b-instruct",
        messages: [
          { role: "system", content: promptBase },
          { role: "user", content: mensagemUsuario }
        ],
        max_tokens: 800,
        temperature: 0.7
      })
    });

    // Log da resposta bruta
    const responseText = await response.text();
    console.log("Resposta bruta da API (Flashback):", responseText);
    
    if (!response.ok) {
      console.error("❌ Erro OpenRouter:", responseText);
      throw new Error(`Falha na API OpenRouter: ${response.status}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (err) {
      console.error("❌ Erro ao parsear resposta JSON:", err);
      throw new Error("Formato de resposta inválido da API");
    }
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("❌ Resposta inesperada da OpenRouter:", data);
      throw new Error("Formato de resposta inválido da API");
    }

    // Garantir que a resposta não ultrapasse o limite do Discord
    let content = data.choices[0].message.content.trim();
    
    // Verificar o comprimento e cortar se necessário
    if (content.length > 1900) {
      content = content.substring(0, 1900) + "...";
      console.log("⚠️ Resposta truncada para caber no limite do Discord");
    }
    
    return content;
  } catch (error) {
    console.error("❌ Erro ao gerar flashback:", error);
    return "Houve um problema ao gerar o flashback. Por favor, tente novamente ou entre em contato com o administrador do bot.";
  }
}

export const data = new SlashCommandBuilder()
  .setName('flashback')
  .setDescription('Gera uma cena do passado relacionada à história atual')
  .addStringOption(option =>
    option.setName('personagem')
      .setDescription('Personagem que será o foco do flashback (opcional)')
      .setRequired(false)
  )
  .addStringOption(option =>
    option.setName('momento')
      .setDescription('Momento ou evento específico a ser explorado (opcional)')
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
    
    console.log(`Processando comando /flashback no canal: ${channelId}`);
    
    // Importa dinamicamente os módulos
    const dbModule = await importDb();
    const { getCampaignData, setCampaignData } = dbModule;
    
    const campanha = await getCampaignData(channelId);

    if (!campanha || !campanha.setup?.finalizado) {
      return interaction.editReply({ content: '⚠️ Nenhuma campanha ativa encontrada. Use /iniciar para começar.' });
    }

    try {
      // Obter opções do comando
      const personagem = interaction.options.getString('personagem');
      const momento = interaction.options.getString('momento');
      
      console.log(`Gerando flashback ${personagem ? `sobre ${personagem}` : 'geral'} ${momento ? `relacionado a "${momento}"` : ''}`);
      
      // Verificar se o setup está presente
      if (!campanha.setup.mensagens || campanha.setup.mensagens.length === 0) {
        return interaction.editReply({ content: '⚠️ Setup da campanha está incompleto. Use /iniciar para configurar corretamente.' });
      }
      
      // Gerar o flashback
      const flashback = await gerarFlashback(
        campanha.setup.mensagens,
        campanha.historia || [],
        personagem,
        momento
      );

      // Adicionar o flashback ao histórico da campanha
      const novaHistoria = [...(campanha.historia || []), `[FLASHBACK] ${flashback}`];
      await setCampaignData(channelId, {
        ...campanha,
        historia: novaHistoria
      });

      // Verificar o tamanho do flashback e dividir se necessário
      if (flashback.length <= 2000) {
        // Flashback cabe em uma única mensagem
        await interaction.editReply(`🔮 **FLASHBACK${personagem ? ` - ${personagem}` : ''}**\n\n${flashback}`);
      } else {
        // Flashback precisa ser dividido
        const chunks = splitTextIntoChunks(flashback);
        
        // Responda com a primeira parte
        await interaction.editReply(`🔮 **FLASHBACK${personagem ? ` - ${personagem}` : ''}**\n\n${chunks[0]}`);
        
        // Envie o restante como mensagens separadas
        for (let i = 1; i < chunks.length; i++) {
          await channel.send(chunks[i]);
        }
      }
    } catch (error) {
      console.error('Erro ao gerar flashback:', error);
      await interaction.editReply({ content: '❌ Ocorreu um erro ao gerar o flashback. Por favor, tente novamente.' });
    }
  } catch (error) {
    console.error("Erro geral no comando flashback:", error);
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