import express from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma.js';
import { iniciarMQTTSubscriber } from './services/mqttSubscriber.js';

const app = express();
app.use(cors());
app.use(express.json());

// Rota GET para listar as últimas leituras para o Dashboard
app.get('/api/temperaturas', async (req, res) => {
  try {
    const leituras = await prisma.leituraTemperatura.findMany({
      take: 50,
      orderBy: {
        criadoEm: 'desc',
      },
    });
    return res.json(leituras);
  } catch (error) {
    return res.status(500).json({ error: 'Erro ao buscar leituras de temperatura.' });
  }
});

// Rota de Healthcheck
app.get('/health', (req, res) => {
  return res.json({ status: 'ok', timestamp: new Date() });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  // Inicializa a escuta MQTT junto com o backend
  iniciarMQTTSubscriber();
});