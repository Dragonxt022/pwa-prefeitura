const CHAVE = 'prefeitura:servicos'
const LIMITE = 200

/**
 * Guarda a última cópia do catálogo público para o formulário continuar
 * disponível quando a API não responde. Não contém dados pessoais.
 */
export function salvarCatalogo(servicos) {
  if (!Array.isArray(servicos) || servicos.length === 0) return

  try {
    localStorage.setItem(
      CHAVE,
      JSON.stringify({
        versao: 1,
        atualizadoEm: new Date().toISOString(),
        servicos: servicos.slice(0, LIMITE),
      }),
    )
  } catch {
    // Armazenamento indisponível: seguir sem cache.
  }
}

export function carregarCatalogo() {
  try {
    const bruto = JSON.parse(localStorage.getItem(CHAVE) ?? 'null')
    if (!Array.isArray(bruto?.servicos)) return null

    const servicos = bruto.servicos.filter((item) => item?.id && item?.titulo)
    return servicos.length > 0 ? servicos : null
  } catch {
    return null
  }
}
