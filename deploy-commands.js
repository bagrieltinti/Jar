import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

config();

// Obter o caminho atual do arquivo
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [];
// Usa path.join para construir o caminho de forma segura e compatível com Windows
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  // Constrói o caminho completo com path.join
  const filePath = `file://${path.join(commandsPath, file).replace(/\\/g, '/')}`;
  
  try {
    const command = await import(filePath);
    
    if (command.data) {
      commands.push(command.data.toJSON());
      console.log(`Comando registrado: ${command.data.name}`);
    } else {
      console.log(`AVISO: Comando em ${file} não possui propriedade 'data'`);
    }
  } catch (error) {
    console.error(`Erro ao carregar comando ${file}:`, error);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('🚀 Iniciando deploy dos comandos...');
    console.log(`🔄 Registrando ${commands.length} comandos...`);

    if (!process.env.CLIENT_ID) {
      throw new Error('CLIENT_ID não definido no arquivo .env');
    }

    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );

    console.log(`✅ ${data.length} comandos registrados com sucesso.`);
    
    // Lista todos os comandos registrados
    console.log('📋 Lista de comandos disponíveis:');
    data.forEach((cmd, index) => {
      console.log(`${index + 1}. /${cmd.name} - ${cmd.description}`);
    });
    
  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error);
  }
})();