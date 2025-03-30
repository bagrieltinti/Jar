import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

config(); // Carrega variáveis do .env

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent // Necessário para ler o conteúdo das mensagens
  ]
});

client.commands = new Collection();

// Carrega comandos
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  // Formato de URL file:// para compatibilidade com Windows
  const filePathUrl = `file://${path.join(commandsPath, file).replace(/\\/g, '/')}`;
  
  try {
    const command = await import(filePathUrl);
    
    if (command.data && command.execute) {
      client.commands.set(command.data.name, command);
      console.log(`📝 Comando carregado: ${command.data.name}`);
    } else {
      console.log(`⚠️ Comando em ${file} está faltando 'data' ou 'execute'`);
    }
  } catch (error) {
    console.error(`❌ Erro ao carregar comando ${file}:`, error);
  }
}

// Eventos
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  // Formato de URL file:// para compatibilidade com Windows
  const filePathUrl = `file://${path.join(eventsPath, file).replace(/\\/g, '/')}`;
  
  try {
    const event = (await import(filePathUrl)).default;
    
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
    
    console.log(`🔔 Evento carregado: ${event.name}`);
  } catch (error) {
    console.error(`❌ Erro ao carregar evento ${file}:`, error);
  }
}

// Inicia o bot
client.login(process.env.DISCORD_TOKEN)
  .then(() => console.log('Bot conectado com sucesso!'))
  .catch(error => console.error('Erro ao conectar o bot:', error));