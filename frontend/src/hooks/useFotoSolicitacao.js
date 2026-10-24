import { useRef, useState } from 'react'
import { prepararFoto } from '../utils/imagem'

export function useFotoSolicitacao({ aoAlterarFoto }) {
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [processando, setProcessando] = useState(false)
  const inputRef = useRef(null)

  async function escolher(evento) {
    const arquivo = evento.target.files?.[0]
    if (!arquivo) return

    setErro('')
    setMensagem('')
    setProcessando(true)
    try {
      const preparada = await prepararFoto(arquivo)
      aoAlterarFoto(preparada.dataUrl)
      setMensagem('Foto pronta. Metadados de localização foram removidos.')
    } catch (falha) {
      setErro(falha.message)
    } finally {
      setProcessando(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  function remover() {
    aoAlterarFoto(null)
    setMensagem('')
  }

  function limparErro() {
    setErro('')
  }

  function limpar() {
    setErro('')
    setMensagem('')
  }

  return {
    erro,
    mensagem,
    processando,
    inputRef,
    escolher,
    remover,
    limparErro,
    limpar,
    definirErro: setErro,
  }
}
