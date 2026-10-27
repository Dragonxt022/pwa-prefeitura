import { gerarHashSenha, hashToken } from '../utils/seguranca.js'
import { normalizarCodigoAcesso } from '../../../shared/codigo-acesso.js'
import { adicionarDias } from '../utils/data.js'
import { normalizarEmail } from '../utils/texto.js'
import { PAPEIS, STATUS, servicos, setorDoServico } from './catalogo.js'
import { SENHA_DEMO, USUARIOS_SEMENTE } from './sementes.js'

/**
 * Normaliza dados carregados do JSON ou recebidos de uma semente. A função
 * mantém compatibilidade com versões anteriores do arquivo de dados.
 */
export function normalizarSolicitacao(item) {
  const { codigoAcesso: codigoAcessoLegado, ...dados } = item
  const servico = servicos.find((servicoAtual) => servicoAtual.id === dados.tipo)
  const criadoEm = dados.criadoEm || new Date().toISOString()
  const prazoDias = Number(dados.prazoDias) || servico?.prazoDias || 10
  const status = STATUS[dados.status] ? dados.status : 'recebida'
  const historico = Array.isArray(dados.historico) && dados.historico.length > 0
    ? dados.historico
    : [{ status, em: criadoEm, observacao: 'Solicitação registrada pelo aplicativo.' }]
  const setorId = dados.setorId || setorDoServico(dados.tipo)?.id || 'triagem'
  const codigoAcessoHash = dados.codigoAcessoHash ||
    (codigoAcessoLegado ? hashToken(normalizarCodigoAcesso(codigoAcessoLegado)) : null)

  return {
    ...dados,
    tipoTitulo: dados.tipoTitulo || servico?.titulo || 'Serviço',
    status,
    criadoEm,
    atualizadoEm: item.atualizadoEm || criadoEm,
    prazoDias,
    slaEm: item.slaEm || adicionarDias(criadoEm, prazoDias),
    prioridade: item.prioridade || 'normal',
    foto: item.foto || null,
    localizacao: item.localizacao || null,
    avaliacao: item.avaliacao || null,
    clientId: item.clientId || null,
    setorId,
    transferencias: Array.isArray(item.transferencias) ? item.transferencias : [],
    triagem: item.triagem && typeof item.triagem === 'object' ? item.triagem : null,
    codigoAcessoHash,
    historico,
  }
}

export function normalizarUsuario(item) {
  const papel = PAPEIS[item.papel] ? item.papel : 'setor'
  const setorId = papel === 'setor'
    ? item.setorId || null
    : item.setorId || (papel === 'triagem' ? 'triagem' : null)
  return {
    id: item.id,
    nome: String(item.nome ?? '').trim(),
    email: normalizarEmail(item.email),
    senhaHash: item.senhaHash || (item.senha ? gerarHashSenha(item.senha) : null),
    papel,
    setorId,
    ativo: item.ativo !== false,
    criadoEm: item.criadoEm || new Date().toISOString(),
  }
}

export function criarUsuariosSemente() {
  return USUARIOS_SEMENTE.map((usuario) =>
    normalizarUsuario({
      ...usuario,
      senha: SENHA_DEMO,
      criadoEm: new Date().toISOString(),
    }),
  )
}

export function calcularSequencia(solicitacoes) {
  return solicitacoes.reduce((maior, item) => {
    const numero = Number(String(item.protocolo).split('-').at(-1))
    return Number.isFinite(numero) && numero > maior ? numero : maior
  }, 0)
}
