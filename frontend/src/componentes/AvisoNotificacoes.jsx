import { BellRing, X } from 'lucide-react'
import { useEffect, useState } from 'react'

function lerPermissao() {
  return typeof Notification === 'undefined' ? 'indisponivel' : Notification.permission
}

export default function AvisoNotificacoes() {
  const [permissao, setPermissao] = useState(lerPermissao)
  const [oculto, setOculto] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [solicitando, setSolicitando] = useState(false)

  useEffect(() => {
    const atualizar = (evento) => {
      setPermissao(evento?.detail ?? lerPermissao())
    }
    const atualizarAoVoltar = () => atualizar()
    window.addEventListener('prefeitura:permissao-notificacoes', atualizar)
    window.addEventListener('focus', atualizarAoVoltar)
    document.addEventListener('visibilitychange', atualizarAoVoltar)
    return () => {
      window.removeEventListener('prefeitura:permissao-notificacoes', atualizar)
      window.removeEventListener('focus', atualizarAoVoltar)
      document.removeEventListener('visibilitychange', atualizarAoVoltar)
    }
  }, [])

  if (permissao === 'indisponivel' || permissao === 'granted' || oculto) return null

  const bloqueada = permissao === 'denied'

  async function ativar() {
    setSolicitando(true)
    setMensagem('')
    try {
      const resposta = await Notification.requestPermission()
      setPermissao(resposta)
      if (resposta === 'granted') {
        setOculto(true)
      } else if (resposta === 'denied') {
        setMensagem('Permissão bloqueada. Libere as notificações nas configurações do navegador.')
      }
    } catch {
      setMensagem('Não foi possível pedir a permissão neste navegador.')
    } finally {
      setSolicitando(false)
    }
  }

  return (
    <aside className="aviso-notificacoes" role="status" aria-live="polite">
      <BellRing aria-hidden="true" />
      <div className="aviso-notificacoes__texto">
        <strong>{bloqueada ? 'Notificações bloqueadas' : 'Ative as notificações'}</strong>
        <p>
          {bloqueada
            ? 'Libere a permissão nas configurações do navegador para ser avisado sobre suas solicitações.'
            : 'Receba um aviso neste aparelho quando o status das suas solicitações mudar.'}
        </p>
        {mensagem && <p>{mensagem}</p>}
      </div>
      {!bloqueada && (
        <button
          type="button"
          className="botao botao--primario botao--pequeno"
          onClick={ativar}
          disabled={solicitando}
        >
          {solicitando ? 'Solicitando…' : 'Ativar notificações'}
        </button>
      )}
      <button
        type="button"
        className="aviso-notificacoes__fechar"
        onClick={() => setOculto(true)}
        aria-label="Fechar aviso de notificações"
      >
        <X aria-hidden="true" />
      </button>
    </aside>
  )
}
