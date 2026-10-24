import { useEffect, useState } from 'react'
import { consultarSemelhantes } from '../servicos/api'
import { LIMITES } from '../utils/solicitacao'

export function useSolicitacaoSemelhante({ tipo, endereco, localizacao }) {
  const [semelhantes, setSemelhantes] = useState([])
  const [consultando, setConsultando] = useState(false)

  useEffect(() => {
    const enderecoLimpo = endereco.trim()
    if (!tipo || enderecoLimpo.length < LIMITES.enderecoMin) {
      setSemelhantes([])
      return undefined
    }

    let ativo = true
    const timer = window.setTimeout(async () => {
      setConsultando(true)
      try {
        const dados = await consultarSemelhantes({
          tipo,
          endereco: enderecoLimpo,
          latitude: localizacao?.latitude,
          longitude: localizacao?.longitude,
        })
        if (ativo) setSemelhantes(dados)
      } catch {
        if (ativo) setSemelhantes([])
      } finally {
        if (ativo) setConsultando(false)
      }
    }, 900)

    return () => {
      ativo = false
      window.clearTimeout(timer)
    }
  }, [tipo, endereco, localizacao])

  function limpar() {
    setSemelhantes([])
  }

  return { semelhantes, consultando, limpar }
}
