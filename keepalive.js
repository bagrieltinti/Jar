// keepalive.js
import express from 'express';
const app = express();

app.get('/', (req, res) => res.send('🟢 Jar bot está online!'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌐 Keep-alive rodando na porta ${PORT}`);
});
