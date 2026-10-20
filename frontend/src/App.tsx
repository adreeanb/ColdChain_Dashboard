import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts';
import { Thermometer, Activity, CloudOff, Cloud, ArchiveRestore } from 'lucide-react';

// 1. Importações exclusivas de Tipos (Resolve o erro "verbatimModuleSyntax")
import type { TooltipContentProps } from 'recharts';


// Interfaces TypeScript
interface LeituraAPI {
  criadoEm: string;
  temperatura: number;
  tipoOrigem: string;
}

interface LeituraFormatada {
  hora: string;
  temperatura: number;
  tipoOrigem: string;
}

// 2. CustomTooltip com tipagem exata



const CustomTooltip = ({
  active,
  payload,
  label,
}: TooltipContentProps) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const dado = payload[0].payload as LeituraFormatada;

  return (
    <div className="bg-white p-4 border rounded shadow-lg">
      <p className="font-bold text-gray-700">{label}</p>

      <p className="text-blue-600 font-semibold mt-1">
        Temp: {dado.temperatura}°C
      </p>

      <div className="mt-2 text-xs">
        {dado.tipoOrigem === 'HISTORICO' ? (
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded flex items-center gap-1">
            <ArchiveRestore size={14} />
            Forward (Recuperado)
          </span>
        ) : (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
            <Activity size={14} />
            Ao Vivo
          </span>
        )}
      </div>
    </div>
  );
};


const Dashboard = () => {
  const [dados, setDados] = useState<LeituraFormatada[]>([]);
  const [ultimaLeitura, setUltimaLeitura] = useState<LeituraFormatada | null>(null);
  const [statusConexao, setStatusConexao] = useState<'conectando' | 'online' | 'offline'>('conectando');

  useEffect(() => {
    let isMounted = true;

    const buscarDados = async () => {
      try {
        const response = await axios.get<LeituraAPI[]>('http://localhost:3001/api/temperaturas');
        
        if (!isMounted) return;

        const dadosFormatados = response.data.reverse().map((item) => ({
          hora: new Date(item.criadoEm).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          temperatura: item.temperatura,
          tipoOrigem: item.tipoOrigem
        }));

        setDados(dadosFormatados);
        
        if (dadosFormatados.length > 0) {
          setUltimaLeitura(dadosFormatados[dadosFormatados.length - 1]);
          setStatusConexao('online');
        }
      } catch (error) {
        console.error("Erro ao buscar dados da API:", error);
        if (isMounted) setStatusConexao('offline');
      }
    };

    buscarDados();
    
    const intervalo = setInterval(() => {
      buscarDados();
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalo);
    };
  }, []);

  return (
    <div className="min-h-screen p-8 text-gray-800">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Monitoramento de Temperatura</h1>
          <p className="text-gray-500 mt-1">Apresentação de Arquitetura IOT para monitoramento de temperatrura</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
          {statusConexao === 'online' ? (
            <><Cloud className="text-green-500" size={20} /> <span className="font-medium text-green-700">API Conectada</span></>
          ) : (
            <><CloudOff className="text-red-500" size={20} /> <span className="font-medium text-red-700">API Offline</span></>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Temperatura Atual</p>
              <h2 className="text-4xl font-bold mt-2">
                {ultimaLeitura ? `${ultimaLeitura.temperatura}°C` : '--'}
              </h2>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <Thermometer size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-500 text-sm font-medium">Última Atualização</p>
              <h2 className="text-2xl font-bold mt-2">
                {ultimaLeitura ? ultimaLeitura.hora : '--:--'}
              </h2>
            </div>
            <div className="p-3 bg-gray-50 text-gray-600 rounded-lg">
              <Activity size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-medium mb-4">Métricas de Resiliência (S&F)</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-600">Pacotes Ao Vivo:</span>
            <span className="font-semibold text-green-600">
              {dados.filter(d => d.tipoOrigem === 'AO_VIVO').length}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-600">Pacotes Recuperados:</span>
            <span className="font-semibold text-yellow-600">
              {dados.filter(d => d.tipoOrigem === 'HISTORICO').length}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-6 text-gray-800">Histórico de Temperatura</h3>
        <div className="h-96 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dados} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="hora" tick={{fontSize: 12}} tickMargin={10} stroke="#9ca3af" />
              <YAxis 
                domain={['auto', 'auto']} 
                tick={{fontSize: 12}} 
                stroke="#9ca3af"
                label={{ value: 'Temperatura (°C)', angle: -90, position: 'insideLeft', style: {textAnchor: 'middle'} }}
              />
              
              {/* 3. Passar a referência da função em vez de instanciar o JSX previne o erro de render */}
              <Tooltip content={CustomTooltip} />
              
              <ReferenceArea y1={2} y2={8} fill="#22c55e" fillOpacity={0.1} />

              <Line 
                type="monotone" 
                dataKey="temperatura" 
                stroke="#3b82f6" 
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                animationDuration={500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex gap-4 text-sm text-gray-500 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div> Trajeto Térmico
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div> Faixa Segura (2°C - 8°C)
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;