import {
  ArrowLeft,
  BarChart3,
  Check,
  ChevronRight,
  Clock3,
  LoaderCircle,
  LogOut,
  MapPin,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  TriangleAlert,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import logoColorido from '../assets/logo-icone-colorido.png'
import { Badge, StatusBadge } from '../components/StatusBadge'
import {
  atualizarStatusGestao,
  listarGestao,
  listarServicos,
  validarAcessoGestao,
} from '../lib/api'
import { formatarDataHora, infoStatus } from '../lib/format'
import { infoPrazo } from '../lib/prazos'

const CHAVE_TOKEN = 'prefeitura:gestao-token'
const STATUS_OPCOES = ['recebida', 'em_analise', 'em_execucao', 'concluida', 'indeferida']
const PRIORIDADES = [
  { valor: 'normal', rotulo: 'Normal' },
  { valor: 'alta', rotulo: 'Alta' },
  { valor: 'baixa', rotulo: 'Baixa' },
]

function lerTokenSalvo() {
  try {
    return sessionStorage.getItem(CHAVE_TOKEN) ?? ''
  } catch {
    return ''
  }
}

function salvarToken(token) {
  try {
    if (token) sessionStorage.setItem(CHAVE_TOKEN, token)
    else sessionStorage.removeItem(CHAVE_TOKEN)
  } catch {
    // Sessão indisponível: o token continua apenas na memória.
  }
}

function urlDoMapa(localizacao) {
  return `https://www.openstreetmap.org/?mlat=${localizacao.latitude}&mlon=${localizacao.longitude}#map=18/${localizacao.latitude}/${localizacao.longitude}`
}

function Estatistica({ rotulo, valor, tom = 'azul', alerta = false }) {
  return (
    <div className={`gestao-stat tom-${tom}${alerta ? ' gestao-stat--alerta' : ''}`}>
      <span className="gestao-stat__rotulo">{rotulo}</span>
      <strong>{valor}</strong>
    </div>
  )
}

function Estrelas({ nota }) {
  return (
    <span className="avaliacao__resumo" aria-label={`Nota ${nota} de 5`}>
      {[1, 2, 3, 4, 5].map((valor) => (
        <Star
          key={valor}
          aria-hidden="true"
          fill={valor <= nota ? 'currentColor' : 'none'}
          className={valor <= nota ? 'is-preenchida' : undefined}
        />
      ))}
    </span>
  )
}

export default function Gestao() {
  const [token, setToken] = useState(lerTokenSalvo)
  const [autenticado, setAutenticado] = useState(false)
  const [verificando, setVerificando] = useState(Boolean(lerTokenSalvo()))
  const [erroLogin, setErroLogin] = useState('')
  const [erro, setErro] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [dados, setDados] = useState({ dados: [], total: 0, estatisticas: null })
  const [servicos, setServicos] = useState([])
  const [filtros, setFiltros] = useState({ status: '', tipo: '', busca: '' })
  const [selecionada, setSelecionada] = useState(null)
  const [formStatus, setFormStatus] = useState({ status: '', prioridade: 'normal', observacao: '' })
  const [salvandoStatus, setSalvandoStatus] = useState(false)
  const detalheRef = useRef(null)

  const carregar = useCallback(async (tokenAtual, filtrosAtuais) => {
    setCarregando(true)
    setErro(null)
    try {
      const resposta = await listarGestao(tokenAtual, filtrosAtuais)
      setDados({
        dados: resposta.dados ?? [],
        total: resposta.total ?? 0,
        estatisticas: resposta.estatisticas ?? null,
      })
      setAutenticado(true)
    } catch (falha) {
      if (falha.status === 401) {
        setAutenticado(false)
        setErroLogin('Sessão expirada. Informe o token novamente.')
        salvarToken('')
      } else {
        setErro(falha)
      }
    } finally {
      setCarregando(false)
      setVerificando(false)
    }
  }, [])

  useEffect(() => {
    listarServicos().then(setServicos).catch(() => setServicos([]))
  }, [])

  useEffect(() => {
    if (!token || !autenticado) return undefined
    const timer = window.setTimeout(() => carregar(token, filtros), 300)
    return () => window.clearTimeout(timer)
  }, [autenticado, carregar, filtros, token])

  useEffect(() => {
    if (!token || autenticado) return undefined
    let ativo = true
    validarAcessoGestao(token)
      .then(() => {
        if (ativo) setAutenticado(true)
      })
      .catch((falha) => {
        if (!ativo) return
        setVerificando(false)
        if (falha.status === 401) {
          salvarToken('')
          setToken('')
          setErroLogin('Sessão expirada. Informe o token novamente.')
        } else {
          setErroLogin(
            falha.offline
              ? 'Sem conexão para validar a sessão. Tente novamente quando voltar online.'
              : 'Não foi possível validar a sessão agora. Tente novamente.',
          )
        }
      })
      .finally(() => {
        if (ativo) setVerificando(false)
      })
    return () => {
      ativo = false
    }
  }, [autenticado, token])

  useEffect(() => {
    if (selecionada) requestAnimationFrame(() => detalheRef.current?.focus())
  }, [selecionada])

  const estatisticas = dados.estatisticas ?? {
    total: 0,
    abertas: 0,
    atrasadas: 0,
    concluidas: 0,
    avaliacoes: 0,
    mediaAvaliacao: null,
  }

  const servicosPorId = useMemo(
    () => Object.fromEntries(servicos.map((servico) => [servico.id, servico])),
    [servicos],
  )

  function entrar(evento) {
    evento.preventDefault()
    const valor = token.trim()
    if (!valor) {
      setErroLogin('Informe o token de gestão.')
      return
    }

    setVerificando(true)
    setErroLogin('')
    validarAcessoGestao(valor)
      .then(() => {
        salvarToken(valor)
        setToken(valor)
        setAutenticado(true)
      })
      .catch((falha) => {
        if (falha.status === 401) {
          salvarToken('')
          setErroLogin('Token inválido. Confira o valor configurado no backend.')
        } else {
          setErroLogin(falha.message)
        }
      })
      .finally(() => setVerificando(false))
  }

  function sair() {
    salvarToken('')
    setToken('')
    setAutenticado(false)
    setDados({ dados: [], total: 0, estatisticas: null })
    setSelecionada(null)
    setErro(null)
    setMensagem('')
  }

  function abrirDetalhe(item) {
    setSelecionada(item)
    setFormStatus({
      status: item.status,
      prioridade: item.prioridade ?? 'normal',
      observacao: '',
    })
    setMensagem('')
    setErro(null)
  }

  async function salvarAtualizacao(evento) {
    evento.preventDefault()
    if (!selecionada) return
    setSalvandoStatus(true)
    setMensagem('')
    setErro(null)
    try {
      const resposta = await atualizarStatusGestao(token, selecionada.protocolo, formStatus)
      const solicitacao = resposta.dados ?? resposta
      setSelecionada(solicitacao)
      setFormStatus({
        status: solicitacao.status,
        prioridade: solicitacao.prioridade ?? 'normal',
        observacao: '',
      })
      setMensagem('Status atualizado. O cidadão verá a mudança ao abrir o app.')
      await carregar(token, filtros)
    } catch (falha) {
      setErro(falha)
    } finally {
      setSalvandoStatus(false)
    }
  }

  function limparFiltros() {
    setFiltros({ status: '', tipo: '', busca: '' })
  }

  if (!autenticado) {
    return (
      <div className="gestao gestao--login">
        <a className="pular-para-conteudo" href="#gestao-conteudo">
          Pular para o conteúdo
        </a>
        <header className="gestao-login__marca">
          <img src={logoColorido} alt="" />
          <span>Prefeitura Digital</span>
          <span className="marca__selo">demo</span>
        </header>

        <main id="gestao-conteudo" className="gestao-login__cartao cartao" tabIndex={-1}>
          <span className="icone-tile tom-azul">
            <ShieldCheck aria-hidden="true" />
          </span>
          <p className="cabecalho-pagina__sobre">Acesso restrito</p>
          <h1>Painel de gestão</h1>
          <p className="texto-suave">
            Acompanhe protocolos, prazos e atualizações de status das solicitações.
          </p>

          <form className="gestao-login__form" onSubmit={entrar}>
            <div className="campo">
              <label htmlFor="token-gestao">Token de gestão</label>
              <input
                id="token-gestao"
                type="password"
                autoComplete="current-password"
                value={token}
                onChange={(evento) => setToken(evento.target.value)}
                aria-invalid={Boolean(erroLogin)}
                aria-describedby={erroLogin ? 'erro-token' : 'dica-token'}
                placeholder="Informe o token de acesso"
              />
              <p className="campo__ajuda" id="dica-token">
                No piloto, o token padrão é <code>prefeitura-demo</code>. Em produção, defina{' '}
                <code>ADMIN_TOKEN</code> no backend.
              </p>
            </div>

            {erroLogin && (
              <p className="alerta alerta--erro" id="erro-token" role="alert">
                <TriangleAlert aria-hidden="true" />
                <span>{erroLogin}</span>
              </p>
            )}

            <button type="submit" className="botao botao--primario" disabled={verificando}>
              {verificando ? (
                <LoaderCircle className="girando" aria-hidden="true" />
              ) : (
                <ShieldCheck aria-hidden="true" />
              )}
              {verificando ? 'Verificando…' : 'Entrar no painel'}
            </button>
          </form>

          <Link className="gestao-login__voltar" to="/">
            <ArrowLeft aria-hidden="true" />
            Voltar ao aplicativo
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="gestao">
      <a className="pular-para-conteudo" href="#gestao-conteudo">
        Pular para o conteúdo
      </a>
      <header className="gestao-topo">
        <Link className="gestao-topo__marca" to="/">
          <img src={logoColorido} alt="" />
          <span>
            <strong>Prefeitura Digital</strong>
            <small>Painel de gestão</small>
          </span>
        </Link>
        <div className="gestao-topo__acoes">
          <Link className="botao botao--secundario botao--pequeno" to="/">
            <ArrowLeft aria-hidden="true" />
            Ver app
          </Link>
          <button
            type="button"
            className="botao botao--secundario botao--pequeno"
            onClick={() => carregar(token, filtros)}
            disabled={carregando}
          >
            <RefreshCw className={carregando ? 'girando' : undefined} aria-hidden="true" />
            Atualizar
          </button>
          <button type="button" className="botao botao--secundario botao--pequeno" onClick={sair}>
            <LogOut aria-hidden="true" />
            Sair
          </button>
        </div>
      </header>

      <main id="gestao-conteudo" className="gestao-conteudo" tabIndex={-1}>
        <div className="gestao-titulo">
          <div>
            <p className="cabecalho-pagina__sobre">Operação</p>
            <h1>Solicitações</h1>
            <p className="texto-suave">Fila de atendimento e prazos em um só lugar.</p>
          </div>
          <span className="gestao-titulo__selo">
            <ShieldCheck aria-hidden="true" />
            Acesso protegido
          </span>
        </div>

        <div className="gestao-stats" aria-label="Resumo da fila">
          <Estatistica rotulo="Abertas" valor={estatisticas.abertas} tom="azul" />
          <Estatistica
            rotulo="Atrasadas"
            valor={estatisticas.atrasadas}
            tom="coral"
            alerta={estatisticas.atrasadas > 0}
          />
          <Estatistica rotulo="Concluídas" valor={estatisticas.concluidas} tom="verde" />
          <Estatistica
            rotulo="Avaliação média"
            valor={estatisticas.mediaAvaliacao ? estatisticas.mediaAvaliacao.toFixed(1) : '—'}
            tom="ambar"
          />
        </div>

        <section className="gestao-filtros" aria-label="Filtrar solicitações">
          <div className="campo-busca">
            <Search className="campo-busca__icone" aria-hidden="true" />
            <label className="sr-only" htmlFor="busca-gestao">
              Buscar protocolo, endereço ou descrição
            </label>
            <input
              id="busca-gestao"
              type="search"
              placeholder="Buscar protocolo ou endereço"
              value={filtros.busca}
              onChange={(evento) => setFiltros((atual) => ({ ...atual, busca: evento.target.value }))}
            />
          </div>
          <label className="sr-only" htmlFor="filtro-status">
            Filtrar por status
          </label>
          <select
            id="filtro-status"
            value={filtros.status}
            onChange={(evento) => setFiltros((atual) => ({ ...atual, status: evento.target.value }))}
          >
            <option value="">Todos os status</option>
            {STATUS_OPCOES.map((status) => (
              <option key={status} value={status}>
                {infoStatus(status).rotulo}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="filtro-tipo">
            Filtrar por serviço
          </label>
          <select
            id="filtro-tipo"
            value={filtros.tipo}
            onChange={(evento) => setFiltros((atual) => ({ ...atual, tipo: evento.target.value }))}
          >
            <option value="">Todos os serviços</option>
            {servicos.map((servico) => (
              <option key={servico.id} value={servico.id}>
                {servico.titulo}
              </option>
            ))}
          </select>
          <button type="button" className="botao botao--secundario botao--pequeno" onClick={limparFiltros}>
            Limpar
          </button>
        </section>

        {erro && (
          <p className="alerta alerta--erro" role="alert">
            <TriangleAlert aria-hidden="true" />
            <span>{erro.message}</span>
          </p>
        )}
        {mensagem && (
          <p className="alerta alerta--sucesso" role="status">
            <Check aria-hidden="true" />
            <span>{mensagem}</span>
          </p>
        )}

        <div className={`gestao-grid${selecionada ? ' tem-detalhe' : ''}`}>
          <section className="gestao-lista" aria-labelledby="titulo-fila">
            <div className="secao__cabecalho">
              <h2 id="titulo-fila">Fila de atendimento</h2>
              <span className="secao__contagem">{dados.total}</span>
            </div>

            {carregando && dados.dados.length === 0 ? (
              <p className="carregando" role="status">
                <span className="spinner" aria-hidden="true" />
                Carregando solicitações…
              </p>
            ) : dados.dados.length === 0 ? (
              <div className="cartao estado-vazio estado-vazio--compacto">
                <BarChart3 aria-hidden="true" />
                <h2>Nenhuma solicitação encontrada</h2>
                <p>Ajuste os filtros ou aguarde novas entradas.</p>
              </div>
            ) : (
              <ul className="gestao-itens">
                {dados.dados.map((item) => {
                  const prazo = infoPrazo(item)
                  const servico = servicosPorId[item.tipo]
                  return (
                    <li key={item.protocolo}>
                      <article
                        className={`gestao-item${item.slaVencido ? ' is-atrasado' : ''}${
                          selecionada?.protocolo === item.protocolo ? ' is-selecionado' : ''
                        }`}
                      >
                        <div className="gestao-item__principal">
                          <div className="gestao-item__linha">
                            <code>{item.protocolo}</code>
                            <StatusBadge status={item.status} />
                            {item.prioridade === 'alta' && <Badge tom="erro">Prioridade alta</Badge>}
                          </div>
                          <h3>{servico?.titulo ?? item.tipoTitulo ?? 'Serviço'}</h3>
                          <p>
                            <MapPin aria-hidden="true" />
                            {item.endereco}
                          </p>
                          <span className="gestao-item__meta">
                            Aberto em {formatarDataHora(item.criadoEm)}
                            {prazo && <span className={prazo.vencido ? 'texto-atrasado' : undefined}> · {prazo.rotulo}</span>}
                          </span>
                        </div>
                        <div className="gestao-item__lado">
                          {item.avaliacao?.nota && (
                            <span className="gestao-item__nota">
                              <Star aria-hidden="true" fill="currentColor" />
                              {item.avaliacao.nota}
                            </span>
                          )}
                          <button
                            type="button"
                            className="botao botao--secundario botao--pequeno"
                            onClick={() => abrirDetalhe(item)}
                          >
                            Abrir
                            <ChevronRight aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {selecionada && (
            <aside className="gestao-detalhe" aria-labelledby="titulo-detalhe">
              <div className="gestao-detalhe__topo">
                <div>
                  <p className="cabecalho-pagina__sobre">Solicitação</p>
                  <h2 id="titulo-detalhe" ref={detalheRef} tabIndex={-1}>
                    {selecionada.protocolo}
                  </h2>
                </div>
                <button
                  type="button"
                  className="botao botao--secundario botao--icone"
                  onClick={() => setSelecionada(null)}
                  aria-label="Fechar detalhe"
                  title="Fechar detalhe"
                >
                  <X aria-hidden="true" />
                </button>
              </div>

              <div className="gestao-detalhe__status">
                <StatusBadge status={selecionada.status} />
                {selecionada.slaVencido && (
                  <Badge tom="erro">
                    <Clock3 aria-hidden="true" />
                    Fora do prazo
                  </Badge>
                )}
                {selecionada.avaliacao?.nota && <Estrelas nota={selecionada.avaliacao.nota} />}
              </div>

              <dl className="gestao-detalhe__dados">
                <div>
                  <dt>Serviço</dt>
                  <dd>{selecionada.tipoTitulo}</dd>
                </div>
                <div>
                  <dt>Endereço</dt>
                  <dd>{selecionada.endereco}</dd>
                </div>
                <div>
                  <dt>Aberto em</dt>
                  <dd>{formatarDataHora(selecionada.criadoEm)}</dd>
                </div>
                <div>
                  <dt>Prazo</dt>
                  <dd>{infoPrazo(selecionada)?.data ?? '—'}</dd>
                </div>
                {selecionada.contato && (
                  <div>
                    <dt>Contato informado</dt>
                    <dd>{selecionada.contato}</dd>
                  </div>
                )}
                {selecionada.localizacao && (
                  <div>
                    <dt>Localização</dt>
                    <dd>
                      <a href={urlDoMapa(selecionada.localizacao)} target="_blank" rel="noreferrer">
                        Abrir no mapa (online)
                      </a>
                    </dd>
                  </div>
                )}
              </dl>

              <section className="gestao-detalhe__descricao" aria-labelledby="titulo-descricao">
                <h3 id="titulo-descricao">Descrição</h3>
                <p>{selecionada.descricao}</p>
              </section>

              {selecionada.foto && (
                <figure className="gestao-detalhe__foto">
                  <img src={selecionada.foto} alt="Foto enviada pelo cidadão" />
                  <figcaption>Foto anexada pelo cidadão.</figcaption>
                </figure>
              )}

              <section className="gestao-detalhe__historico" aria-labelledby="titulo-historico-gestao">
                <h3 id="titulo-historico-gestao">Histórico</h3>
                <ol className="linha-tempo">
                  {selecionada.historico.map((evento, indice) => (
                    <li
                      key={`${evento.status}-${evento.em}`}
                      className={indice === selecionada.historico.length - 1 ? 'is-atual' : undefined}
                    >
                      <span className="linha-tempo__ponto">
                        <Clock3 aria-hidden="true" />
                      </span>
                      <div className="linha-tempo__conteudo">
                        <strong>{infoStatus(evento.status).rotulo}</strong>
                        <time dateTime={evento.em}>{formatarDataHora(evento.em)}</time>
                        {evento.observacao && <p>{evento.observacao}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <form className="gestao-status" onSubmit={salvarAtualizacao}>
                <h3>Atualizar atendimento</h3>
                <div className="gestao-status__linha">
                  <div className="campo">
                    <label htmlFor="status-gestao">Status</label>
                    <select
                      id="status-gestao"
                      value={formStatus.status}
                      onChange={(evento) =>
                        setFormStatus((atual) => ({ ...atual, status: evento.target.value }))
                      }
                    >
                      {STATUS_OPCOES.map((status) => (
                        <option key={status} value={status}>
                          {infoStatus(status).rotulo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="campo">
                    <label htmlFor="prioridade-gestao">Prioridade</label>
                    <select
                      id="prioridade-gestao"
                      value={formStatus.prioridade}
                      onChange={(evento) =>
                        setFormStatus((atual) => ({ ...atual, prioridade: evento.target.value }))
                      }
                    >
                      {PRIORIDADES.map((prioridade) => (
                        <option key={prioridade.valor} value={prioridade.valor}>
                          {prioridade.rotulo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="campo">
                  <label htmlFor="observacao-gestao">
                    Observação para o histórico <span className="campo__opcional">(opcional)</span>
                  </label>
                  <textarea
                    id="observacao-gestao"
                    rows={3}
                    maxLength={500}
                    value={formStatus.observacao}
                    onChange={(evento) =>
                      setFormStatus((atual) => ({ ...atual, observacao: evento.target.value }))
                    }
                    placeholder="Ex.: equipe designada para vistoria na quinta-feira."
                  />
                </div>
                <button type="submit" className="botao botao--primario" disabled={salvandoStatus}>
                  {salvandoStatus ? (
                    <LoaderCircle className="girando" aria-hidden="true" />
                  ) : (
                    <Check aria-hidden="true" />
                  )}
                  {salvandoStatus ? 'Salvando…' : 'Salvar atualização'}
                </button>
              </form>
            </aside>
          )}
        </div>
      </main>
    </div>
  )
}
