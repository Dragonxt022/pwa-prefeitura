import { LoaderCircle, LogIn, ShieldCheck, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useCidadao } from '../../contexto/useCidadao'
import { ApiError, solicitarRecuperacaoSenha } from '../../servicos/api'
import PerfilFormulario from './PerfilFormulario'

function mensagemDoErro(erro, padrao) {
  return erro instanceof ApiError ? erro.message : padrao
}

export default function PerfilAcesso() {
  const { entrar, cadastrar } = useCidadao()
  const [modo, setModo] = useState('entrar')
  const [login, setLogin] = useState({ email: '', senha: '', lembrar: true })
  const [errosLogin, setErrosLogin] = useState({})
  const [erroLogin, setErroLogin] = useState(null)
  const [enviandoLogin, setEnviandoLogin] = useState(false)

  const [errosCadastro, setErrosCadastro] = useState({})
  const [erroCadastro, setErroCadastro] = useState(null)
  const [enviandoCadastro, setEnviandoCadastro] = useState(false)

  const [emailRecuperacao, setEmailRecuperacao] = useState('')
  const [erroRecuperacao, setErroRecuperacao] = useState('')
  const [mensagemRecuperacao, setMensagemRecuperacao] = useState('')
  const [enviandoRecuperacao, setEnviandoRecuperacao] = useState(false)

  async function submeterLogin(evento) {
    evento.preventDefault()
    setErroLogin(null)
    setErrosLogin({})

    const campos = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login.email.trim())) {
      campos.email = 'Informe um e-mail válido.'
    }
    if (!login.senha) campos.senha = 'Informe sua senha.'
    if (Object.keys(campos).length > 0) {
      setErrosLogin(campos)
      return
    }

    setEnviandoLogin(true)
    try {
      await entrar({
        email: login.email.trim().toLowerCase(),
        senha: login.senha,
        lembrar: login.lembrar,
      })
    } catch (erro) {
      setErrosLogin(erro?.campos ?? {})
      setErroLogin(mensagemDoErro(erro, 'Não foi possível entrar. Tente novamente.'))
    } finally {
      setEnviandoLogin(false)
    }
  }

  async function submeterCadastro(dados) {
    setErroCadastro(null)
    setErrosCadastro({})
    setEnviandoCadastro(true)
    try {
      await cadastrar(dados)
    } catch (erro) {
      setErrosCadastro(erro?.campos ?? {})
      setErroCadastro(mensagemDoErro(erro, 'Não foi possível criar a conta.'))
    } finally {
      setEnviandoCadastro(false)
    }
  }

  async function submeterRecuperacao(evento) {
    evento.preventDefault()
    setErroRecuperacao('')
    setMensagemRecuperacao('')

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRecuperacao.trim())) {
      setErroRecuperacao('Informe o e-mail da conta.')
      return
    }

    setEnviandoRecuperacao(true)
    try {
      const resposta = await solicitarRecuperacaoSenha({ email: emailRecuperacao.trim() })
      setMensagemRecuperacao(
        resposta?.mensagem ||
          'Se houver uma conta com este e-mail, enviaremos um link para criar uma nova senha.',
      )
    } catch (erro) {
      setErroRecuperacao(
        mensagemDoErro(erro, 'Não foi possível solicitar a recuperação agora. Tente novamente.'),
      )
    } finally {
      setEnviandoRecuperacao(false)
    }
  }

  return (
    <section className="cartao perfil-acesso" aria-labelledby="titulo-conta">
      <div className="perfil-acesso__topo">
        <span className="icone-tile tom-azul">
          <ShieldCheck aria-hidden="true" />
        </span>
        <div>
          <h2 id="titulo-conta">Sua conta no atendimento</h2>
          <p className="texto-suave">
            Com o cadastro, seu telefone e endereço são preenchidos automaticamente nas solicitações.
          </p>
        </div>
      </div>

      <div className="segmento perfil-acesso__abas" role="tablist" aria-label="Acesso à conta">
        <button
          type="button"
          role="tab"
          aria-selected={modo === 'entrar'}
          className={modo === 'entrar' ? 'is-ativo' : undefined}
          onClick={() => setModo('entrar')}
        >
          <LogIn aria-hidden="true" />
          Entrar
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={modo === 'cadastrar'}
          className={modo === 'cadastrar' ? 'is-ativo' : undefined}
          onClick={() => setModo('cadastrar')}
        >
          <UserPlus aria-hidden="true" />
          Criar conta
        </button>
      </div>

      {modo === 'recuperar' ? (
        <form className="perfil-login" onSubmit={submeterRecuperacao} noValidate>
          <div>
            <h3>Recuperar senha</h3>
            <p className="texto-suave">
              Informe o e-mail da conta. Se ele existir, enviaremos um link válido por 30 minutos.
            </p>
          </div>

          {mensagemRecuperacao && (
            <p className="alerta alerta--sucesso" role="status">{mensagemRecuperacao}</p>
          )}
          {erroRecuperacao && (
            <p className="alerta alerta--erro" role="alert">{erroRecuperacao}</p>
          )}

          <div className={`campo${erroRecuperacao ? ' campo--erro' : ''}`}>
            <label htmlFor="recuperar-email">E-mail da conta</label>
            <input
              id="recuperar-email"
              type="email"
              autoComplete="email"
              maxLength={180}
              value={emailRecuperacao}
              onChange={(evento) => {
                setEmailRecuperacao(evento.target.value)
                setErroRecuperacao('')
                setMensagemRecuperacao('')
              }}
            />
          </div>

          <div className="formulario__acoes">
            <button
              type="button"
              className="botao botao--secundario"
              onClick={() => {
                setModo('entrar')
                setErroRecuperacao('')
                setMensagemRecuperacao('')
              }}
            >
              Voltar
            </button>
            <button type="submit" className="botao botao--primario" disabled={enviandoRecuperacao}>
              {enviandoRecuperacao ? (
                <>
                  <LoaderCircle className="girando" aria-hidden="true" />
                  Enviando
                </>
              ) : (
                'Enviar link'
              )}
            </button>
          </div>
        </form>
      ) : modo === 'entrar' ? (
        <form className="perfil-login" onSubmit={submeterLogin} noValidate>
          {erroLogin && (
            <p className="alerta alerta--erro" role="alert">{erroLogin}</p>
          )}

          <div className={`campo${errosLogin.email ? ' campo--erro' : ''}`}>
            <label htmlFor="conta-email">E-mail</label>
            <input
              id="conta-email"
              type="email"
              autoComplete="email"
              maxLength={180}
              value={login.email}
              onChange={(evento) => setLogin((atual) => ({ ...atual, email: evento.target.value }))}
              aria-invalid={Boolean(errosLogin.email)}
            />
            {errosLogin.email && <p className="campo__erro">{errosLogin.email}</p>}
          </div>

          <div className={`campo${errosLogin.senha ? ' campo--erro' : ''}`}>
            <label htmlFor="conta-senha">Senha</label>
            <input
              id="conta-senha"
              type="password"
              autoComplete="current-password"
              maxLength={72}
              value={login.senha}
              onChange={(evento) => setLogin((atual) => ({ ...atual, senha: evento.target.value }))}
              aria-invalid={Boolean(errosLogin.senha)}
            />
            {errosLogin.senha && <p className="campo__erro">{errosLogin.senha}</p>}
          </div>

          <label className="check-simples">
            <input
              type="checkbox"
              checked={login.lembrar}
              onChange={(evento) =>
                setLogin((atual) => ({ ...atual, lembrar: evento.target.checked }))
              }
            />
            <span>Manter conectado neste aparelho</span>
          </label>

          <button type="submit" className="botao botao--primario" disabled={enviandoLogin}>
            {enviandoLogin ? (
              <>
                <LoaderCircle className="girando" aria-hidden="true" />
                Entrando
              </>
            ) : (
              <>
                <LogIn aria-hidden="true" />
                Entrar
              </>
            )}
          </button>

          <button
            type="button"
            className="link-botao"
            onClick={() => {
              setModo('recuperar')
              setEmailRecuperacao(login.email)
              setErroRecuperacao('')
              setMensagemRecuperacao('')
            }}
          >
            Esqueci minha senha
          </button>
        </form>
      ) : (
        <PerfilFormulario
          modo="cadastro"
          errosServidor={errosCadastro}
          erroGeral={erroCadastro}
          enviando={enviandoCadastro}
          aoEnviar={submeterCadastro}
        />
      )}
    </section>
  )
}
