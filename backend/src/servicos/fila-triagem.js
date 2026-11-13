/**
 * Fila de processamento em memória.
 *
 * Usada pela triagem por IA para não bloquear a criação da solicitação e para
 * limitar quantas classificações rodam ao mesmo tempo. A fila não é durável:
 * se o processo reiniciar, a solicitação continua salva com a classificação
 * por regras e a sugestão do modelo simplesmente não é aplicada.
 */
export function criarFilaProcessamento({
  concorrencia = 1,
  limiteAviso = 2,
  maximo = 20,
  executor,
} = {}) {
  if (typeof executor !== 'function') {
    throw new Error('A fila precisa de uma função executora.')
  }

  const limiteConcorrencia = Math.max(1, Number(concorrencia) || 1)
  const limiteAvisoSanitizado = Math.max(1, Number(limiteAviso) || 1)
  const maximoSanitizado = Math.max(limiteAvisoSanitizado, Number(maximo) || 20)

  const aguardando = []
  const emAndamento = new Set()
  let ativos = 0

  function estado() {
    const total = aguardando.length + ativos
    return {
      pendentes: aguardando.length,
      processando: ativos,
      total,
      limiteAviso: limiteAvisoSanitizado,
      maximo: maximoSanitizado,
      aviso: total >= limiteAvisoSanitizado,
    }
  }

  function processar() {
    while (ativos < limiteConcorrencia && aguardando.length > 0) {
      const { item, chave } = aguardando.shift()
      ativos += 1
      Promise.resolve()
        .then(() => executor(item))
        .catch((erro) => {
          console.error('[fila] falha ao processar item:', erro?.message || erro)
        })
        .finally(() => {
          ativos -= 1
          if (chave) emAndamento.delete(chave)
          processar()
        })
    }
  }

  function adicionar(item, { chave } = {}) {
    if (chave && emAndamento.has(chave)) {
      return { aceito: false, duplicado: true, ...estado() }
    }
    if (aguardando.length >= maximoSanitizado) {
      return { aceito: false, motivo: 'fila_cheia', ...estado() }
    }

    if (chave) emAndamento.add(chave)
    aguardando.push({ item, chave })
    processar()
    return { aceito: true, duplicado: false, ...estado() }
  }

  return { adicionar, estado }
}
