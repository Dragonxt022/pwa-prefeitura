import { ArrowLeft, LoaderCircle, LockKeyhole, Mail, ShieldCheck, TriangleAlert } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function GestaoLogin({
  logoMarca,
  nomeApp,
  email,
  senha,
  lembrar,
  erroLogin,
  entrando,
  verificandoSessao,
  aoMudarEmail,
  aoMudarSenha,
  aoMudarLembrar,
  aoEntrar,
}) {
  return (
    <div className="gestao gestao--login">
      <a className="pular-para-conteudo" href="#gestao-conteudo">
        Pular para o conteúdo
      </a>
      <header className="gestao-login__marca">
        <img src={logoMarca} alt="" />
        <span>{nomeApp}</span>
        <span className="marca__selo">demo</span>
      </header>

      <main id="gestao-conteudo" className="gestao-login__cartao cartao" tabIndex={-1}>
        <span className="icone-tile tom-azul">
          <ShieldCheck aria-hidden="true" />
        </span>
        <p className="cabecalho-pagina__sobre">Acesso restrito</p>
        <h1>Painel de gestão</h1>
        <p className="texto-suave">
          Entre com seu e-mail funcional. A sessão fica salva por 30 dias quando você marca
          “manter conectado”.
        </p>

        <form className="gestao-login__form" onSubmit={aoEntrar}>
          <div className="campo">
            <label htmlFor="email-gestao">E-mail</label>
            <div className="campo__controle">
              <Mail aria-hidden="true" />
              <input
                id="email-gestao"
                type="email"
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(evento) => aoMudarEmail(evento.target.value)}
                placeholder="nome@prefeitura.gov.br"
                required
              />
            </div>
          </div>
          <div className="campo">
            <label htmlFor="senha-gestao">Senha</label>
            <div className="campo__controle">
              <LockKeyhole aria-hidden="true" />
              <input
                id="senha-gestao"
                type="password"
                autoComplete="current-password"
                value={senha}
                onChange={(evento) => aoMudarSenha(evento.target.value)}
                aria-invalid={Boolean(erroLogin)}
                aria-describedby={erroLogin ? 'erro-login' : 'dica-login'}
                placeholder="Sua senha de acesso"
                required
              />
            </div>
          </div>

          <label className="checkbox checkbox--linha">
            <input
              type="checkbox"
              checked={lembrar}
              onChange={(evento) => aoMudarLembrar(evento.target.checked)}
            />
            <span>Manter conectado neste dispositivo</span>
          </label>

          {erroLogin && (
            <p className="alerta alerta--erro" id="erro-login" role="alert">
              <TriangleAlert aria-hidden="true" />
              <span>{erroLogin}</span>
            </p>
          )}

          <button type="submit" className="botao botao--primario" disabled={entrando || verificandoSessao}>
            {entrando || verificandoSessao ? (
              <LoaderCircle className="girando" aria-hidden="true" />
            ) : (
              <ShieldCheck aria-hidden="true" />
            )}
            {entrando ? 'Entrando…' : verificandoSessao ? 'Verificando sessão…' : 'Entrar no painel'}
          </button>

          <p className="campo__ajuda gestao-login__demo" id="dica-login">
            Demonstração: <code>admin@prefeitura.demo</code> ou{' '}
            <code>triagem@prefeitura.demo</code>; senha <code>prefeitura-demo</code>. Os setores
            usam endereços como <code>obras@prefeitura.demo</code>.
          </p>
        </form>

        <Link className="gestao-login__voltar" to="/">
          <ArrowLeft aria-hidden="true" />
          Voltar ao aplicativo
        </Link>
      </main>
    </div>
  )
}
