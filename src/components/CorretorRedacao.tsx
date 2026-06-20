import { useState } from 'react';

interface Correcao {
  competencias: {
    [key: string]: { nota: number; descricao: string };
  };
  nota_total: number;
  pontos_fortes: string[];
  pontos_fracos: string[];
  feedback: string;
}

export function CorretorRedacao() {
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [correcao, setCorrecao] = useState<Correcao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const corrigir = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setStatusMsg(null);
    setCorrecao(null);

    if (!texto.trim() || texto.length < 50) {
      setErro('Redação deve ter no mínimo 50 caracteres.');
      return;
    }

    setLoading(true);
    setStatusMsg('⏳ Aguardando correção... Isso pode levar alguns segundos.');

    try {
      const res = await fetch('/api/corrigir-redacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texto }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Erro ${res.status}`);
      }

      const data = await res.json();
      if (!data.competencias || data.nota_total === undefined) {
        throw new Error('Resposta inválida da IA. Tente novamente.');
      }

      setCorrecao(data);
      setStatusMsg('✅ Redação corrigida com sucesso!');
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro desconhecido';
      setErro(`❌ Erro: ${mensagem}`);
    } finally {
      setLoading(false);
    }
  };

  const limpar = () => {
    setTexto('');
    setCorrecao(null);
    setErro(null);
    setStatusMsg(null);
  };

  const competenciaTitles: { [key: string]: string } = {
    '1': 'Domínio da Norma Padrão',
    '2': 'Compreensão da Proposta',
    '3': 'Seleção e Organização de Informações',
    '4': 'Coerência e Coesão',
    '5': 'Proposta de Solução',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8 text-center">
          <h1 className="text-4xl font-bold mb-2">🎓 Corretor de Redações ENEM</h1>
          <p className="text-lg opacity-90">Avaliação automática segundo as 5 competências ENEM</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <form onSubmit={corrigir} className="space-y-6">
            <div>
              <label className="block text-lg font-semibold text-gray-800 mb-3">
                Cole sua redação aqui:
              </label>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                placeholder="Mínimo 50 caracteres. Cole sua redação completa e clique em 'Corrigir Redação'..."
                rows={10}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 font-mono text-sm resize-vertical"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition transform hover:-translate-y-1 active:translate-y-0"
              >
                {loading ? '⏳ Processando...' : '✨ Corrigir Redação'}
              </button>
              <button
                type="button"
                onClick={limpar}
                className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 rounded-lg transition"
              >
                🗑️ Limpar
              </button>
            </div>
          </form>

          {/* Status Messages */}
          {statusMsg && (
            <div className="mt-6 p-4 bg-green-100 border-l-4 border-green-600 text-green-700 rounded">
              {statusMsg}
            </div>
          )}
          {erro && (
            <div className="mt-6 p-4 bg-red-100 border-l-4 border-red-600 text-red-700 rounded">
              {erro}
            </div>
          )}

          {/* Resultado */}
          {correcao && (
            <div className="mt-8 space-y-6">
              {/* Nota Total */}
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-8 rounded-lg text-center">
                <h2 className="text-lg opacity-90 mb-2">Nota Final</h2>
                <div className="text-6xl font-bold">{correcao.nota_total}</div>
                <div className="text-2xl opacity-90 mt-2">/ 1000</div>
              </div>

              {/* Competências */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(correcao.competencias).map(([num, comp]) => (
                  <div key={num} className="bg-gray-50 p-6 rounded-lg border-l-4 border-purple-600">
                    <h3 className="text-purple-600 font-bold text-lg mb-2">
                      Competência {num}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{competenciaTitles[num]}</p>
                    <div className="text-3xl font-bold text-indigo-600 mb-2">
                      {comp.nota}
                      <span className="text-sm text-gray-500">/200</span>
                    </div>
                    <p className="text-sm text-gray-700">{comp.descricao}</p>
                  </div>
                ))}
              </div>

              {/* Pontos Fortes */}
              {correcao.pontos_fortes.length > 0 && (
                <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-600">
                  <h3 className="text-green-700 font-bold text-lg mb-4">💪 Pontos Fortes</h3>
                  <ul className="space-y-2">
                    {correcao.pontos_fortes.map((ponto, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-700">
                        <span className="text-green-600 font-bold mt-1">✓</span>
                        <span>{ponto}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pontos Fracos */}
              {correcao.pontos_fracos.length > 0 && (
                <div className="bg-orange-50 p-6 rounded-lg border-l-4 border-orange-600">
                  <h3 className="text-orange-700 font-bold text-lg mb-4">🎯 Pontos a Melhorar</h3>
                  <ul className="space-y-2">
                    {correcao.pontos_fracos.map((ponto, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-700">
                        <span className="text-orange-600 font-bold mt-1">✕</span>
                        <span>{ponto}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Feedback */}
              {correcao.feedback && (
                <div className="bg-amber-50 p-6 rounded-lg border-l-4 border-amber-600">
                  <p className="text-gray-700">
                    <strong className="text-amber-700">💡 Feedback Geral:</strong> {correcao.feedback}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
