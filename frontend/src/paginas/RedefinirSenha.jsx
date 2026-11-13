import { KeyRound, LoaderCircle, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ApiError, redefinirSenha } from '../servicos/api'

function mensagemDoErro(erro) {
  return erro instanceof ApiError ? erro.message : 'Não foi possível criar a nova senha.'
}

export default function RedefinirSenha() {
  const [params] = useSearchParams()
  // O link usa #token para não enviar o segredo ao servidor em logs/Referer.
  const tokenDoHash = new URLSearchParams(
    typeof window === 'undefined' ? '' : window.location.hash.replace(/^#/, ''),
  ).get('token')
  const token = tokenDoHash || params.get('token') || ''
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [concluido, setConcluido] = useState(false)

  async function enviar(evento) {
    evento.preventDefault()
    setErro('')

    if (senha.length < 8) {
      setErro('A senha precisa ter pelo menos 8 caracteres.')
      return
    }
    if (senha !== confirmacao) {
      setErro('As duas senhas precisam ser iguais.')
      return
    }

    setEnviando(true)
    try {
      await redefinirSenha({ token, novaSenha: senha })
      setConcluido(true)
    } catch (falha) {
      setErro(falha?.campos?.token || mensagemDoErro(falha))
    } finally {
      setEnviando(false)
    }
  }

  if (!token) {
    return (
      <div className="pagina pagina--estreita">
        <header className="cabecalho-pagina">
          <p className="cabecalho-pagina__sobre">Recuperação</p>
          <h1>Link inválido</h1>
          <p className="texto-suave">
            Este link não contém um código de recuperação. Solicite um novo link na página de perfil.
          </p>
        </header>
        <Link className="botao botao--primario" to="/perfil">Ir para o perfil</Link>
      </div>
    )
  }

  if (concluido) {
    return (
      <div className="pagina pagina--estreita">
        <header className="cabecalho-pagina">
          <p className="cabecalho-pagina__sobre">Recuperação</p>
          <h1>Senha alterada</h1>
        </header>
        <section className="cartao" aria-live="polite">
          <span className="selo selo--sucesso">
            <ShieldCheck aria-hidden="true" />
            Tudo certo
          </span>
          <p>Sua senha foi atualizada e todas as sessões antigas foram encerradas.</p>
          <Link className="botao botao--primario" to="/perfil">Entrar com a nova senha</Link>
        </section>
      </div>
    )
  }

  return (
    <div className="pagina pagina--estreita">
      <header className="cabecalho-pagina">
        <p className="cabecalho-pagina__sobre">Recuperação</p>
        <h1>Criar nova senha</h1>
        <p className="texto-suave">
          O link é de uso único e expira em 30 minutos. Depois de salvar, entre novamente.
        </p>
      </header>

      <form className="cartao perfil-login" onSubmit={enviar} noValidate>
        {erro && <p className="alerta alerta--erro" role="alert">{erro}</p>}

        <div className="campo">
          <label htmlFor="nova-senha">Nova senha</label>
          <div className="campo__controle">
            <KeyRound aria-hidden="true" />
            <input
              id="nova-senha"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              value={senha}
              onChange={(evento) => setSenha(evento.target.value)}
            />
          </div>
          <p className="campo__ajuda">Mínimo de 8 caracteres.</p>
        </div>

        <div className="campo">
          <label htmlFor="confirmar-senha">Repita a nova senha</label>
          <div className="campo__controle">
            <KeyRound aria-hidden="true" />
            <input
              id="confirmar-senha"
              type="password"
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              value={confirmacao}
              onChange={(evento) => setConfirmacao(evento.target.value)}
            />
          </div>
        </div>

        <div className="formulario__acoes">
          <Link className="botao botao--secundario" to="/perfil">Cancelar</Link>
          <button type="submit" className="botao botao--primario" disabled={enviando}>
            {enviando ? (
              <>
                <LoaderCircle className="girando" aria-hidden="true" />
                Salvando
              </>
            ) : (
              'Salvar nova senha'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
