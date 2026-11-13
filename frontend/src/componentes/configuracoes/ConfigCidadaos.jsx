import { Check, Copy, KeyRound, LoaderCircle, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { ApiError, gerarLinkRecuperacaoGestao } from '../../servicos/api'
import { formatarDataHora } from '../../utils/format'

function mensagemDoErro(erro) {
  return erro instanceof ApiError ? erro.message : 'Não foi possível gerar o link.'
}

export default function ConfigCidadaos({ onSessaoExpirada }) {
  const [email, setEmail] = useState('')
  const [link, setLink] = useState('')
  const [expiraEm, setExpiraEm] = useState(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [copiado, setCopiado] = useState(false)

  async function gerar(evento) {
    evento.preventDefault()
    setErro('')
    setLink('')
    setExpiraEm(null)
    setCopiado(false)

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErro('Informe o e-mail cadastrado pelo cidadão.')
      return
    }

    setCarregando(true)
    try {
      const resposta = await gerarLinkRecuperacaoGestao({ email: email.trim() })
      setLink(resposta.link)
      setExpiraEm(resposta.expiraEm)
    } catch (falha) {
      if (falha?.status === 401) {
        onSessaoExpirada?.()
        return
      }
      setErro(mensagemDoErro(falha))
    } finally {
      setCarregando(false)
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link)
      setCopiado(true)
      window.setTimeout(() => setCopiado(false), 2500)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <div className="cartao config-secao" aria-labelledby="config-cidadaos">
      <div className="config-secao__topo">
        <span className="icone-tile tom-azul">
          <KeyRound aria-hidden="true" />
        </span>
        <div>
          <h2 id="config-cidadaos">Recuperação de senha do cidadão</h2>
          <p className="texto-suave">
            Gere um link de uso único para entregar ao cidadão por um canal verificado, como
            telefone ou atendimento presencial. O link vale 30 minutos e não revela se o e-mail
            está cadastrado a terceiros.
          </p>
        </div>
      </div>

      <form className="config-cidadaos__form" onSubmit={gerar}>
        <div className="campo">
          <label htmlFor="cidadao-email-recuperacao">E-mail da conta</label>
          <input
            id="cidadao-email-recuperacao"
            type="email"
            autoComplete="off"
            maxLength={180}
            value={email}
            onChange={(evento) => {
              setEmail(evento.target.value)
              setErro('')
            }}
            placeholder="cidadao@exemplo.com"
          />
        </div>
        <button type="submit" className="botao botao--primario" disabled={carregando}>
          {carregando ? (
            <>
              <LoaderCircle className="girando" aria-hidden="true" />
              Gerando
            </>
          ) : (
            'Gerar link'
          )}
        </button>
      </form>

      {erro && (
        <p className="alerta alerta--erro" role="alert">
          <TriangleAlert aria-hidden="true" />
          <span>{erro}</span>
        </p>
      )}

      {link && (
        <div className="config-cidadaos__resultado">
          <p className="alerta alerta--sucesso" role="status">
            <Check aria-hidden="true" />
            <span>
              Link gerado{expiraEm ? `, válido até ${formatarDataHora(expiraEm)}` : ''}. Entregue
              pessoalmente ou por um canal verificado.
            </span>
          </p>
          <div className="campo">
            <label htmlFor="cidadao-link-recuperacao">Link de recuperação</label>
            <input
              id="cidadao-link-recuperacao"
              type="text"
              readOnly
              value={link}
              onFocus={(evento) => evento.target.select()}
            />
          </div>
          <button type="button" className="botao botao--secundario" onClick={copiar}>
            {copiado ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copiado ? 'Copiado' : 'Copiar link'}
          </button>
        </div>
      )}

      <p className="campo__ajuda">
        Se o SMTP estiver configurado, o cidadão também pode pedir o link sozinho em “Perfil →
        Esqueci minha senha”.
      </p>
    </div>
  )
}
