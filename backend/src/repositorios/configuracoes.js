/**
 * Repositório de configurações administrativas.
 *
 * Guarda a configuração completa, incluindo segredos SMTP/IA, que nunca devem
 * ser devolvidos diretamente ao cliente. A montagem dos contratos públicos e
 * administrativos fica em `apresentadores/configuracoes.js`.
 */
import { estado, persistir } from './estado.js'
import { mysqlConfigurado } from './mysql.js'
import { salvarConfiguracoes } from './mysql-dados.js'

export function obter() {
  return structuredClone(estado.configuracoes)
}

export async function salvarSecao(secao, dados, usuario) {
  const anterior = structuredClone(estado.configuracoes)
  estado.configuracoes[secao] = structuredClone(dados)
  estado.configuracoes.atualizadoEm = new Date().toISOString()
  estado.configuracoes.atualizadoPor = usuario
    ? { id: usuario.id, nome: usuario.nome }
    : null
  try {
    if (mysqlConfigurado) {
      await salvarConfiguracoes(estado.configuracoes)
    } else {
      persistir()
    }
  } catch (erro) {
    Object.keys(estado.configuracoes).forEach((chave) => delete estado.configuracoes[chave])
    Object.assign(estado.configuracoes, anterior)
    throw erro
  }
  return obter()
}

export async function registrarNotificacao(registro) {
  const anterior = structuredClone(estado.configuracoes)
  const notificacao = {
    id: `notificacao-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    evento: String(registro.evento ?? 'evento'),
    canal: 'email',
    status: ['enviado', 'erro', 'ignorado'].includes(registro.status)
      ? registro.status
      : 'erro',
    destinatarios: Array.isArray(registro.destinatarios) ? registro.destinatarios : [],
    assunto: String(registro.assunto ?? ''),
    protocolo: registro.protocolo ? String(registro.protocolo) : null,
    codigo: registro.codigo ? String(registro.codigo).slice(0, 80) : null,
    erro: registro.erro ? String(registro.erro).slice(0, 400) : null,
    em: new Date().toISOString(),
  }
  estado.configuracoes.notificacoes.unshift(notificacao)
  estado.configuracoes.notificacoes = estado.configuracoes.notificacoes.slice(0, 30)
  try {
    if (mysqlConfigurado) {
      await salvarConfiguracoes(estado.configuracoes)
    } else {
      persistir()
    }
  } catch (erro) {
    Object.keys(estado.configuracoes).forEach((chave) => delete estado.configuracoes[chave])
    Object.assign(estado.configuracoes, anterior)
    throw erro
  }
  return structuredClone(notificacao)
}
