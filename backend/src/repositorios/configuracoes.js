/**
 * Repositório de configurações administrativas.
 *
 * Guarda a configuração completa, incluindo segredos SMTP/IA, que nunca devem
 * ser devolvidos diretamente ao cliente. A montagem dos contratos públicos e
 * administrativos fica em `apresentadores/configuracoes.js`.
 */
import { estado, persistir } from './estado.js'

export function obter() {
  return structuredClone(estado.configuracoes)
}

export function salvarSecao(secao, dados, usuario) {
  estado.configuracoes[secao] = structuredClone(dados)
  estado.configuracoes.atualizadoEm = new Date().toISOString()
  estado.configuracoes.atualizadoPor = usuario
    ? { id: usuario.id, nome: usuario.nome }
    : null
  persistir()
  return obter()
}

export function registrarNotificacao(registro) {
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
  persistir()
  return structuredClone(notificacao)
}
