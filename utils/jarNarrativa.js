import fetch from 'node-fetch';
import { config } from 'dotenv';
config();

const promptBase = `
Você é Jar, um narrador de RPG de texto especializado em criar experiências narrativas imersivas e emocionantes usando apenas texto.
Seu papel é conduzir a história com riqueza sensorial, ritmo envolvente, e reações críveis aos eventos. 
Nunca controle o personagem do jogador, apenas o mundo ao redor.

Considere tudo o que os jogadores escreveram no início como canon absoluto do universo. Nunca ignore o conteúdo do briefing.

IMPORTANTE: Limite suas respostas a no máximo 1500 caracteres total para evitar ultrapassar os limites do Discord. Seja conciso e direto.
`;

export async function gerarNarrativa({ setupInicial, historico, acaoJogador }) {
  if (!setupInicial || !Array.isArray(setupInicial) || setupInicial.length === 0) {
    throw new Error("Setup inicial inválido");
  }

  const mensagemUsuario = `
# 📜 CONTEXTO DEFINIDO PELOS JOGADORES:

Este é o briefing criado colaborativamente pelos jogadores. Ele descreve o cenário, época, personagens e tom da história. **Você deve usá-lo como base inegociável do universo narrativo.**

""" 
${setupInicial.join("\n")}
"""

# 📚 HISTÓRICO RECENTE:
${historico.slice(-3).join("\n\n")}

${acaoJogador
    ? `# 🎭 AÇÃO DO JOGADOR:\n"${acaoJogador}"`
    : "# ➡️ Nenhuma ação. Continue a narrativa com base no contexto acima."}

# IMPORTANTE: 
Limite sua resposta a no máximo 1500 caracteres. Seja conciso e objetivo para garantir uma boa experiência no Discord.
`;

  try {
    const body = {
      model: "mistralai/mixtral-8x7b-instruct",
      messages: [
        { role: "system", content: promptBase },
        { role: "user", content: mensagemUsuario }
      ],
      max_tokens: 800, // Reduzido para garantir que não ultrapasse o limite
      temperature: 0.7
    };

    console.log("🔎 Enviando requisição para OpenRouter...");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://discord-bot.com",
        "X-Title": "JarRPG Bot"
      },
      body: JSON.stringify(body)
    });

    // Log da resposta bruta
    const responseText = await response.text();
    console.log("Resposta bruta da API:", responseText);
    
    if (!response.ok) {
      console.error("❌ Erro OpenRouter:", responseText);
      throw new Error(`Falha na API OpenRouter: ${response.status} ${response.statusText}`);
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
    console.error("❌ Erro ao gerar narrativa:", error);
    return "Houve um problema ao gerar a narrativa. Por favor, tente novamente ou entre em contato com o administrador do bot.";
  }
}