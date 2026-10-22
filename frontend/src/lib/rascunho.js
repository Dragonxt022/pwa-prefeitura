const CHAVE = 'prefeitura:rascunho'

export function carregarRascunho() {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE) ?? 'null')
    if (!bruto || typeof bruto !== 'object' || !bruto.formulario) return null
    return bruto
  } catch {
    return null
  }
}

export function salvarRascunho(formulario) {
  const registro = {
    versao: 1,
    atualizadoEm: new Date().toISOString(),
    formulario,
  }

  try {
    localStorage.setItem(CHAVE, JSON.stringify(registro))
    return true
  } catch {
    // Uma foto grande pode estourar a cota. O texto do pedido ainda é útil.
    try {
      localStorage.setItem(
        CHAVE,
        JSON.stringify({
          ...registro,
          formulario: { ...formulario, foto: null },
          aviso: 'A foto não foi salva no rascunho por falta de espaço.',
        }),
      )
      return true
    } catch {
      return false
    }
  }
}

export function limparRascunho() {
  try {
    localStorage.removeItem(CHAVE)
  } catch {
    // ignorar
  }
}
