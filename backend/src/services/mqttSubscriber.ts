import mqtt from 'mqtt';
import { prisma } from '../lib/prisma.js';

const BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883';

export function iniciarMQTTSubscriber() {
  const client = mqtt.connect(BROKER_URL, {
    clientId: `node_backend_subscriber_${Math.random().toString(16).substring(2, 8)}`,
  });

  client.on('connect', () => {
    console.log('✅ Backend conectado ao Broker MQTT público!');

    // Assina os tópicos ao vivo e histórico
    client.subscribe(['tcc/adrian/temperatura', 'tcc/adrian/temperatura/historico'], (err) => {
      if (!err) {
        console.log('📡 Inscrito nos tópicos:');
        console.log('   - tcc/adrian/temperatura (Ao Vivo)');
        console.log('   - tcc/adrian/temperatura/historico (Store and Forward)');
      } else {
        console.error('❌ Erro ao se inscrever nos tópicos:', err);
      }
    });
  });

  client.on('message', async (topic, message) => {
    const payload = message.toString();

    try {
      if (topic === 'tcc/adrian/temperatura') {
        // Leitura ao vivo (ex: "16.50")
        const tempValue = parseFloat(payload);

        if (!isNaN(tempValue)) {
          const novaLeitura = await prisma.leituraTemperatura.create({
            data: {
              temperatura: tempValue,
              tipoOrigem: 'AO_VIVO',
            },
          });
          console.log(`[AO VIVO] Salvo no banco: ${novaLeitura.temperatura} °C (ID: ${novaLeitura.id})`);
        }
      } else if (topic === 'tcc/adrian/temperatura/historico') {
        // Leitura vinda do Store and Forward (JSON: {"temperatura": 16.00, "timestamp": 12345})
        const dadosJson = JSON.parse(payload);
        const tempValue = parseFloat(dadosJson.temperatura);

        if (!isNaN(tempValue)) {
          const novaLeitura = await prisma.leituraTemperatura.create({
            data: {
              temperatura: tempValue,
              tipoOrigem: 'HISTORICO',
            },
          });
          console.log(`[HISTÓRICO - FORWARD] Salvo no banco: ${novaLeitura.temperatura} °C`);
        }
      }
    } catch (error) {
      console.error(`❌ Erro ao processar mensagem do tópico ${topic}:`, error);
    }
  });

  client.on('error', (err) => {
    console.error('❌ Erro no cliente MQTT:', err);
  });
}