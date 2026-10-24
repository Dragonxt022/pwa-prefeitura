/**
 * Triagem de solicitações.
 *
 * O piloto usa um classificador local por regras, sem enviar nenhum dado para
 * serviços externos. O formato de retorno já é o contrato que uma mini IA
 * (modelo local ou endpoint HTTP) deverá implementar no futuro:
 *
 *   { setorId, setorNome, confianca, justificativa, origem, modelo }
 *
 * Para ativar a triagem automática, use a aba de IA do painel de gestão. O
 * valor inicial pode ser semeado com TRIAGEM_IA_ATIVA=true no backend. Quando
 * um modelo externo é escolhido, o adaptador em ia.js usa este mesmo contrato.
 */

const REGRAS = [
  {
    setorId: 'meio_ambiente',
    termos: [
      'poda',
      'arvore',
      'galho',
      'queimada',
      'poluicao',
      'animal',
      'maus tratos',
      'ambiental',
      'nascente',
      'desmatamento',
    ],
    peso: 3,
  },
  {
    setorId: 'infraestrutura',
    termos: [
      'poste',
      'lampada',
      'iluminacao',
      'asfalto',
      'buraco',
      'pavimentacao',
      'calcada',
      'meio fio',
      'fiacao',
      'obra',
    ],
    peso: 2,
  },
  {
    setorId: 'zeladoria',
    termos: ['lixo', 'entulho', 'limpeza', 'bueiro', 'mato', 'praca', 'mobiliario', 'esgoto'],
    peso: 2,
  },
  {
    setorId: 'fiscalizacao',
    termos: [
      'terreno abandonado',
      'construcao irregular',
      'fiscalizacao',
      'postura',
      'obra irregular',
      'muro',
    ],
    peso: 2,
  },
  {
    setorId: 'mobilidade',
    termos: ['transito', 'semaforo', 'placa', 'faixa', 'sinalizacao', 'estacionamento'],
    peso: 2,
  },
  {
    setorId: 'ouvidoria',
    termos: ['atendimento', 'reclamacao', 'elogio', 'sugestao', 'denuncia', 'servidor'],
    peso: 1,
  },
]

export const MODELO_TRIAGEM = 'regras-locais-v1'

function normalizar(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Classificador local. A pontuação combina o serviço escolhido pelo cidadão
 * com palavras-chave da descrição. Em caso de empate, o setor do serviço tem
 * prioridade; sem evidência suficiente, a solicitação fica na triagem central.
 */
export function classificarSolicitacao({ tipo, descricao = '', endereco = '', setores = [] }) {
  const texto = normalizar(`${tipo} ${descricao} ${endereco}`)
  const pontos = new Map()

  const adicionar = (setorId, valor) => {
    if (!setorId) return
    pontos.set(setorId, (pontos.get(setorId) ?? 0) + valor)
  }

  const setorDoServico = setores.find(
    (setor) => !setor.central && Array.isArray(setor.servicos) && setor.servicos.includes(tipo),
  )
  if (setorDoServico) adicionar(setorDoServico.id, 3)

  for (const regra of REGRAS) {
    if (!setores.some((setor) => setor.id === regra.setorId)) continue
    const acertos = regra.termos.filter((termo) => texto.includes(normalizar(termo))).length
    if (acertos > 0) adicionar(regra.setorId, regra.peso * Math.min(acertos, 2))
  }

  const candidatos = [...pontos.entries()].sort((a, b) => b[1] - a[1])
  const [setorId, pontuacao] = candidatos[0] ?? []
  const setor = setores.find((item) => item.id === setorId && !item.central)
  const setorSugerido = setor ?? setores.find((item) => item.central)

  if (!setor || !setorSugerido) {
    return {
      setorId: 'triagem',
      setorNome: 'Triagem e Protocolo',
      confianca: 0.3,
      justificativa: 'Não há elementos suficientes para indicar um setor. A triagem manual deve avaliar.',
      origem: 'regras',
      modelo: MODELO_TRIAGEM,
    }
  }

  const termosEncontrados = REGRAS.find((regra) => regra.setorId === setor.id)?.termos ?? []
  const termosNaDescricao = termosEncontrados.filter((termo) => texto.includes(normalizar(termo)))
  const confianca = Math.min(0.95, 0.45 + pontuacao * 0.07)
  const justificativa = termosNaDescricao.length
    ? `A descrição menciona ${termosNaDescricao.slice(0, 3).join(', ')}.`
    : `O serviço selecionado é atendido por ${setor.nome}.`

  return {
    setorId: setor.id,
    setorNome: setor.nome,
    confianca,
    justificativa,
    origem: 'regras',
    modelo: MODELO_TRIAGEM,
  }
}
