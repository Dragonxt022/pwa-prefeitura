import {
  ArrowLeft,
  Check,
  LoaderCircle,
  LogOut,
  Mail,
  Palette,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import logoColorido from '../assets/logo-icone-colorido.png'
import ConfigEmail from '../componentes/configuracoes/ConfigEmail'
import ConfigIA from '../componentes/configuracoes/ConfigIA'
import ConfigIdentidade from '../componentes/configuracoes/ConfigIdentidade'
import { useConfiguracoes } from '../contexto/useConfiguracoes.js'
import { useI18n } from '../i18n/useI18n.js'
import {
  logoutGestao,
  obterConfiguracoesGestao,
  obterSessaoGestao,
  salvarConfiguracoesGestao,
  testarEmailGestao,
  testarIAConfiguracaoGestao,
} from '../servicos/api'
import { codigoDoErro, mensagemAmigavel } from '../utils/erros'
import { formatarDataHora } from '../utils/format'

const ABAS = [
  {
    id: 'identidade',
    Icone: Palette,
    titulo: 'config.menu.identidade',
    descricao: 'config.menu.identidadeDescricao',
  },
  {
    id: 'email',
    Icone: Mail,
    titulo: 'config.menu.email',
    descricao: 'config.menu.emailDescricao',
  },
  {
    id: 'ia',
    Icone: Sparkles,
    titulo: 'config.menu.ia',
    descricao: 'config.menu.iaDescricao',
  },
]

const PAPEIS_UI = {
  admin: 'admin.papelAdmin',
  triagem: 'admin.papelTriagem',
  setor: 'admin.papelSetor',
}

function TelaCarregando({ texto }) {
  return (
    <div className="gestao gestao--login">
      <div className="gestao-login__cartao cartao config-carregando" role="status">
        <LoaderCircle className="girando" aria-hidden="true" />
        <p>{texto}</p>
      </div>
    </div>
  )
}

export default function GestaoConfiguracoes() {
  const { t } = useI18n()
  const { identidade, recarregarConfiguracoes } = useConfiguracoes()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [sessao, setSessao] = useState(null)
  const [verificandoSessao, setVerificandoSessao] = useState(true)
  const [erroSessao, setErroSessao] = useState(null)
  const [acessoNegado, setAcessoNegado] = useState(false)
  const [config, setConfig] = useState(null)
  const [opcoes, setOpcoes] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState(null)
  const [mensagem, setMensagem] = useState('')

  const nomeApp = identidade.nome || 'Prefeitura Digital'
  const logo = identidade.logo || logoColorido
  const aba = ABAS.some((item) => item.id === params.get('aba'))
    ? params.get('aba')
    : 'identidade'
  const papel = sessao?.usuario?.papel

  useEffect(() => {
    let ativo = true
    obterSessaoGestao()
      .then((resposta) => {
        if (!ativo) return
        setSessao(resposta)
        setAcessoNegado(resposta.usuario.papel !== 'admin')
      })
      .catch((falha) => {
        if (!ativo) return
        if (falha?.status === 401) {
          navigate('/gestao', { replace: true })
          return
        }
        setErroSessao(falha)
      })
      .finally(() => {
        if (ativo) setVerificandoSessao(false)
      })
    return () => {
      ativo = false
    }
  }, [navigate])

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const resposta = await obterConfiguracoesGestao()
      setConfig(resposta.dados)
      setOpcoes(resposta.opcoes)
    } catch (falha) {
      if (falha?.status === 401) {
        navigate('/gestao', { replace: true })
      } else if (falha?.status === 403) {
        setAcessoNegado(true)
      } else {
        setErro(falha)
      }
    } finally {
      setCarregando(false)
    }
  }, [navigate])

  useEffect(() => {
    if (sessao?.usuario?.papel !== 'admin' || acessoNegado) return undefined
    // Agenda fora do efeito para não iniciar uma cascata de renders na
    // sincronização com a sessão; o timer é limpo se a sessão mudar.
    const timer = window.setTimeout(() => {
      void carregar()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [sessao, acessoNegado, carregar])

  const salvarSecao = useCallback(
    async (secao, dados) => {
      setMensagem('')
      try {
        const resposta = await salvarConfiguracoesGestao(secao, dados)
        setConfig(resposta)
        setMensagem(t('config.salvoAgora'))
        void recarregarConfiguracoes()
        return resposta
      } catch (falha) {
        if (falha?.status === 401) navigate('/gestao', { replace: true })
        throw falha
      }
    },
    [navigate, recarregarConfiguracoes, t],
  )

  const testarEmail = useCallback(
    async (destinatario) => {
      try {
        const resposta = await testarEmailGestao({ destinatario })
        if (resposta.notificacoes) {
          setConfig((atual) =>
            atual ? { ...atual, notificacoes: resposta.notificacoes } : atual,
          )
        }
        return resposta
      } catch (falha) {
        if (falha?.status === 401) navigate('/gestao', { replace: true })
        throw falha
      }
    },
    [navigate],
  )

  const testarIA = useCallback(
    async (dados) => {
      try {
        return await testarIAConfiguracaoGestao(dados)
      } catch (falha) {
        if (falha?.status === 401) navigate('/gestao', { replace: true })
        throw falha
      }
    },
    [navigate],
  )

  async function sair() {
    try {
      await logoutGestao()
    } catch {
      // A sessão local ainda deve ser encerrada visualmente.
    }
    navigate('/gestao', { replace: true })
  }

  function selecionarAba(id) {
    setParams({ aba: id })
    setMensagem('')
  }

  function navegarAbas(evento, indice) {
    const teclas = ['ArrowDown', 'ArrowUp', 'Home', 'End']
    if (!teclas.includes(evento.key)) return
    evento.preventDefault()
    let destino = indice
    if (evento.key === 'ArrowDown') destino = (indice + 1) % ABAS.length
    if (evento.key === 'ArrowUp') destino = (indice - 1 + ABAS.length) % ABAS.length
    if (evento.key === 'Home') destino = 0
    if (evento.key === 'End') destino = ABAS.length - 1
    const id = ABAS[destino].id
    selecionarAba(id)
    document.getElementById(`config-tab-${id}`)?.focus()
  }

  if (verificandoSessao) {
    return <TelaCarregando texto={t('config.carregando')} />
  }

  if (erroSessao) {
    return (
      <div className="gestao gestao--login">
        <main className="gestao-login__cartao cartao config-acesso" tabIndex={-1}>
          <TriangleAlert className="config-acesso__icone" aria-hidden="true" />
          <h1>{t('admin.acessoRestrito')}</h1>
          <p>{mensagemAmigavel(erroSessao)}</p>
          <code className="config-codigo">{codigoDoErro(erroSessao)}</code>
          <Link className="botao botao--primario" to="/gestao">
            {t('admin.irParaLogin')}
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="gestao config-gestao">
      <a className="pular-para-conteudo" href="#config-conteudo">
        {t('app.pularConteudo')}
      </a>

      <header className="gestao-topo">
        <Link className="gestao-topo__marca" to="/">
          <img src={logo} alt="" />
          <span>
            <strong>{nomeApp}</strong>
            <small>{t('config.titulo')}</small>
          </span>
        </Link>
        <div className="gestao-topo__usuario">
          <span className="gestao-topo__pessoa">
            <strong>{sessao?.usuario?.nome || t('config.titulo')}</strong>
            <small>
              {t(PAPEIS_UI[papel] || 'admin.papelSetor')}
              {sessao?.usuario?.setor?.nome ? ` · ${sessao.usuario.setor.nome}` : ''}
            </small>
          </span>
          <div className="gestao-topo__acoes">
            <Link className="botao botao--secundario botao--pequeno" to="/gestao">
              <ArrowLeft aria-hidden="true" />
              {t('admin.voltarSolicitacoes')}
            </Link>
            <Link className="botao botao--secundario botao--pequeno" to="/">
              {t('admin.verApp')}
            </Link>
            {papel === 'admin' && !acessoNegado && (
              <button
                type="button"
                className="botao botao--secundario botao--pequeno"
                onClick={() => carregar()}
                disabled={carregando}
              >
                <RefreshCw className={carregando ? 'girando' : undefined} aria-hidden="true" />
                {t('comum.atualizar')}
              </button>
            )}
            <button type="button" className="botao botao--secundario botao--pequeno" onClick={sair}>
              <LogOut aria-hidden="true" />
              {t('admin.sair')}
            </button>
          </div>
        </div>
      </header>

      <main id="config-conteudo" className="gestao-conteudo config-conteudo" tabIndex={-1}>
        <div className="config-cabecalho">
          <div>
            <p className="cabecalho-pagina__sobre">{t('config.sobre')}</p>
            <h1>{t('config.titulo')}</h1>
            <p className="texto-suave">{t('config.subtitulo')}</p>
            {config?.atualizadoEm && (
              <p className="config-atualizacao">
                {config.atualizadoPor?.nome
                  ? t('config.salvoEm', {
                      data: formatarDataHora(config.atualizadoEm),
                      nome: config.atualizadoPor.nome,
                    })
                  : t('config.salvoSemAutor')}
              </p>
            )}
          </div>
          <span className="config-selo">
            <ShieldCheck aria-hidden="true" />
            {t('admin.somenteAdmin')}
          </span>
        </div>

        {mensagem && (
          <p className="alerta alerta--sucesso" role="status">
            <Check aria-hidden="true" />
            <span>{mensagem}</span>
          </p>
        )}

        {acessoNegado ? (
          <section className="cartao config-acesso">
            <TriangleAlert className="config-acesso__icone" aria-hidden="true" />
            <h2>{t('admin.acessoRestrito')}</h2>
            <p>{t('admin.semPermissao')}</p>
            <Link className="botao botao--primario" to="/gestao">
              {t('admin.voltarSolicitacoes')}
            </Link>
          </section>
        ) : erro ? (
          <section className="cartao config-acesso" role="alert">
            <TriangleAlert className="config-acesso__icone" aria-hidden="true" />
            <h2>{t('config.erroCarregar')}</h2>
            <p>{mensagemAmigavel(erro)}</p>
            <code className="config-codigo">{codigoDoErro(erro)}</code>
            <button type="button" className="botao botao--primario" onClick={() => carregar()}>
              <RefreshCw aria-hidden="true" />
              {t('comum.tentarNovamente')}
            </button>
          </section>
        ) : (
          <div className="config-layout">
            <aside className="config-menu cartao">
              <p className="config-menu__titulo">{t('config.menuTitulo')}</p>
              <div className="config-menu__lista" role="tablist" aria-orientation="vertical">
                {ABAS.map(({ id, Icone, titulo, descricao }, indice) => {
                  const ativa = aba === id
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      id={`config-tab-${id}`}
                      aria-selected={ativa}
                      aria-controls={`config-painel-${id}`}
                      tabIndex={ativa ? 0 : -1}
                      className={`config-menu__botao${ativa ? ' is-ativa' : ''}`}
                      onClick={() => selecionarAba(id)}
                      onKeyDown={(evento) => navegarAbas(evento, indice)}
                    >
                      <span className="config-menu__icone">
                        <Icone aria-hidden="true" />
                      </span>
                      <span className="config-menu__texto">
                        <strong>{t(titulo)}</strong>
                        <small>{t(descricao)}</small>
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="config-menu__rodape">
                <ShieldCheck aria-hidden="true" />
                {t('admin.somenteAdmin')}
              </p>
            </aside>

            <section
              className="config-painel"
              id={`config-painel-${aba}`}
              role="tabpanel"
              aria-labelledby={`config-tab-${aba}`}
              aria-busy={carregando}
              tabIndex={0}
            >
              {carregando || !config || !opcoes ? (
                <div className="cartao config-carregando" role="status">
                  <LoaderCircle className="girando" aria-hidden="true" />
                  <p>{t('config.carregando')}</p>
                </div>
              ) : aba === 'identidade' ? (
                <ConfigIdentidade
                  key={`identidade-${config.atualizadoEm ?? 'inicial'}`}
                  config={config.identidade}
                  opcoes={opcoes}
                  onSalvar={salvarSecao}
                />
              ) : aba === 'email' ? (
                <ConfigEmail
                  key={`email-${config.atualizadoEm ?? 'inicial'}`}
                  config={config}
                  opcoes={opcoes}
                  onSalvar={salvarSecao}
                  onTestarEmail={testarEmail}
                />
              ) : (
                <ConfigIA
                  key={`ia-${config.atualizadoEm ?? 'inicial'}`}
                  config={config.ia}
                  opcoes={opcoes}
                  onSalvar={salvarSecao}
                  onTestarIA={testarIA}
                />
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
