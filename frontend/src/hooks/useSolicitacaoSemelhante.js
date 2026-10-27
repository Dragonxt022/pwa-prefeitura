import { useEffect, useState } from 'react'
import { consultarSemelhantes } from '../servicos/api'
import { LIMITES } from '../utils/solicitacao'

export function useSolicitacaoSemelhante({ tipo, endereco, localizacao }) {
  const [resultado, setResultado] = useState({ chave: '', dados: [] })
  const [consultando, setConsultando] = useState(false)
  const enderecoLimpo = endereco.trim()
  const latitude = localizacao?.latitude
  const longitude = localizacao?.longitude
  const valido = Boolean(tipo && enderecoLimpo.length >= LIMITES.enderecoMin)
  const chave = `${tipo}|${enderecoLimpo}|${latitude ?? ''}|${longitude ?? ''}`

  useEffect(() => {
    if (!valido) return undefined

    let ativo = true
    const timer = window.setTimeout(async () => {
      setConsultando(true)
      try {
        const dados = await consultarSemelhantes({
          tipo,
          endereco: enderecoLimpo,
          latitude,
          longitude,
        })
        if (ativo) setResultado({ chave, dados })
      } catch {
        if (ativo) setResultado({ chave, dados: [] })
      } finally {
        if (ativo) setConsultando(false)
      }
    }, 900)

    return () => {
      ativo = false
      window.clearTimeout(timer)
    }
  }, [chave, enderecoLimpo, latitude, longitude, tipo, valido])

  function limpar() {
    setResultado({ chave: '', dados: [] })
    setConsultando(false)
  }

  return {
    semelhantes: valido && resultado.chave === chave ? resultado.dados : [],
    consultando: valido && consultando,
    limpar,
  }
}
