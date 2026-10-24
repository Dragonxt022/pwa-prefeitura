import { useCallback, useEffect, useMemo, useState } from 'react'
import { transferirGestao } from '../servicos/api'

const FORM_TRANSFERENCIA_INICIAL = {
  setorDestinoId: '',
  tipoDestino: '',
  motivo: '',
  recalcularSla: false,
}

export function useGestaoTransferencia({
  usuario,
  setores,
  filtros,
  carregar,
  definirSelecionada,
  definirErro,
  definirMensagem,
}) {
  const [transferindo, setTransferindo] = useState(null)
  const [formTransferencia, setFormTransferencia] = useState(FORM_TRANSFERENCIA_INICIAL)
  const [salvandoTransferencia, setSalvandoTransferencia] = useState(false)

  const setoresParaTransferencia = useMemo(
    () => setores.filter((setor) => setor.ativo !== false),
    [setores],
  )

  useEffect(() => {
    if (!transferindo) return undefined
    const fecharComEsc = (evento) => {
      if (evento.key === 'Escape') setTransferindo(null)
    }
    window.addEventListener('keydown', fecharComEsc)
    return () => window.removeEventListener('keydown', fecharComEsc)
  }, [transferindo])

  const limpar = useCallback(() => {
    setTransferindo(null)
    setFormTransferencia(FORM_TRANSFERENCIA_INICIAL)
    setSalvandoTransferencia(false)
  }, [])

  function abrir(item) {
    setTransferindo(item)
    setFormTransferencia({
      setorDestinoId: '',
      tipoDestino: item.tipo,
      motivo: '',
      recalcularSla: false,
    })
    definirErro(null)
    definirMensagem('')
  }

  function fechar() {
    setTransferindo(null)
  }

  function alterarTipo(tipo) {
    const setorSugerido = setores.find(
      (setor) => !setor.central && setor.servicos?.includes(tipo),
    )
    setFormTransferencia((atual) => ({
      ...atual,
      tipoDestino: tipo,
      setorDestinoId: setorSugerido?.id ?? atual.setorDestinoId,
    }))
  }

  function atualizarCampo(campo, valor) {
    setFormTransferencia((atual) => ({ ...atual, [campo]: valor }))
  }

  async function salvar(evento) {
    evento.preventDefault()
    if (!transferindo) return
    setSalvandoTransferencia(true)
    definirErro(null)
    definirMensagem('')
    try {
      const solicitacao = await transferirGestao(transferindo.protocolo, formTransferencia)
      definirMensagem(
        `Solicitação transferida para ${solicitacao.setorNome}. O histórico registrou a mudança.`,
      )
      setTransferindo(null)
      if (usuario?.papel === 'setor' && solicitacao.setorId !== usuario.setorId) {
        definirSelecionada(null)
      } else {
        definirSelecionada(solicitacao)
      }
      await carregar(filtros)
    } catch (falha) {
      definirErro(falha)
    } finally {
      setSalvandoTransferencia(false)
    }
  }

  return {
    aberto: Boolean(transferindo),
    solicitacao: transferindo,
    formTransferencia,
    setoresParaTransferencia,
    salvandoTransferencia,
    limpar,
    abrir,
    fechar,
    alterarTipo,
    atualizarCampo,
    salvar,
  }
}
