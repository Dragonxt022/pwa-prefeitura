const CHAVE_CONSULTAS = 'prefeitura:consultas'
const CHAVE_ULTIMO = 'prefeitura:ultimo-protocolo'
const LIMITE = 5

export function listarConsultas() {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE_CONSULTAS) ?? '[]')
    return Array.isArray(bruto) ? bruto.filter((item) => item?.protocolo) : []
  } catch {
    return []
  }
}

export function registrarConsulta(protocolo) {
  const registros = listarConsultas().filter((item) => item.protocolo !== protocolo)
  const atualizados = [{ protocolo, em: new Date().toISOString() }, ...registros].slice(0, LIMITE)

  try {
    localStorage.setItem(CHAVE_CONSULTAS, JSON.stringify(atualizados))
    localStorage.setItem(CHAVE_ULTIMO, protocolo)
  } catch {
    // Armazenamento indisponível (modo privado): seguir sem persistir.
  }

  return atualizados
}

export function ultimoProtocolo() {
  try {
    return localStorage.getItem(CHAVE_ULTIMO)
  } catch {
    return null
  }
}

export function limparDadosLocais() {
  try {
    localStorage.removeItem(CHAVE_CONSULTAS)
    localStorage.removeItem(CHAVE_ULTIMO)
  } catch {
    // ignorar
  }
}
