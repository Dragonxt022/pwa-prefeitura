import {
  ArrowRight,
  Building2,
  CalendarDays,
  Clock3,
  KeyRound,
  LoaderCircle,
  MapPin,
  Plus,
  Search,
  Send,
  Wrench,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  codigoAcessoValido,
  normalizarCodigoAcesso,
} from '../../../shared/codigo-acesso.js'
import Avaliacao from '../componentes/Avaliacao'
import ErrorState from '../componentes/ErrorState'
import { IlustracaoBusca } from '../componentes/Ilustracoes'
import { SkeletonBloco } from '../componentes/Loading'
import { Badge, StatusBadge } from '../componentes/StatusBadge'
import { consultarSolicitacao } from '../servicos/api'
import { CODIGOS_ERRO } from '../utils/erros'
import {
  listarConsultas,
  listarPedidos,
  marcarNotificacoesLidas,
  marcarPedidoVisto,
  registrarConsulta,
  registrarPedido,
} from '../servicos/consultas'
import { formatarDataHora, infoStatus, normalizarProtocolo } from '../utils/format'
import { infoPrazo } from '../utils/prazos'
import { visualStatus } from '../utils/visual'

function urlDoMapa(localizacao) {
  return `https://www.openstreetmap.org/?mlat=${localizacao.latitude}&mlon=${localizacao.longitude}#map=18/${localizacao.latitude}/${localizacao.longitude}`
}

export default function Acompanhar() {
  const [params, setParams] = useSearchParams()
  const protocoloParam = normalizarProtocolo(params.get('protocolo'))

  const [valor, setValor] = useState(protocoloParam)
  const [codigo, setCodigo] = useState('')
  const [codigoConsultado, setCodigoConsultado] = useState('')
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [avisoCodigo, setAvisoCodigo] = useState('')
  const [recentes, setRecentes] = useState(listarConsultas)
  const [pedidos, setPedidos] = useState(listarPedidos)

  const consultadoRef = useRef({ protocolo: '', codigo: '' })
  const codigoRef = useRef('')
  const campoRef = useRef(null)
  const campoCodigoRef = useRef(null)

  const consultar = useCallback(async (protocolo, codigoAcesso = codigoRef.current) => {
    const limpo = normalizarProtocolo(protocolo)
    const codigoLimpo = normalizarCodigoAcesso(codigoAcesso)
    setAviso('')
    setAvisoCodigo('')
    setErro(null)
    setResultado(null)

    if (!limpo) {
      setAviso('Informe o protocolo.')
      campoRef.current?.focus()
      return
    }
    if (!codigoAcessoValido(codigoLimpo)) {
      setAvisoCodigo('Informe o código de acesso com 12 caracteres.')
      campoCodigoRef.current?.focus()
      return
    }

    consultadoRef.current = { protocolo: limpo, codigo: codigoLimpo }
    codigoRef.current = codigoLimpo
    setCodigo(codigoLimpo)
    setCarregando(true)
    try {
      const dados = await consultarSolicitacao(limpo, codigoLimpo)
      setCodigoConsultado(codigoLimpo)
      setResultado(dados)
      setRecentes(registrarConsulta(dados.protocolo))
      registrarPedido(dados, codigoLimpo)
      marcarPedidoVisto(dados.protocolo)
      setPedidos(listarPedidos())
      marcarNotificacoesLidas()
      window.dispatchEvent(new CustomEvent('prefeitura:notificacoes'))
    } catch (falha) {
      setErro(falha)
      if (falha?.codigo === CODIGOS_ERRO.CODIGO_ACESSO_INVALIDO) {
        setAvisoCodigo('Protocolo ou código de acesso não confere.')
        requestAnimationFrame(() => campoCodigoRef.current?.focus())
      }
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    if (!protocoloParam || consultadoRef.current.protocolo === protocoloParam) return
    const salvo = listarPedidos().find((item) => item.protocolo === protocoloParam)
    const codigoSalvo = salvo?.codigoAcesso ?? ''
    setValor(protocoloParam)
    setCodigo(codigoSalvo)
    codigoRef.current = codigoSalvo
    setAviso('')
    setAvisoCodigo(codigoSalvo ? '' : 'Informe o código de acesso deste pedido.')
    setErro(null)
    setResultado(null)
    if (codigoSalvo) {
      // A busca é agendada fora do efeito para não iniciar uma cascata de
      // renders ao sincronizar a URL com um pedido salvo.
      const timer = window.setTimeout(() => {
        void consultar(protocoloParam, codigoSalvo)
      }, 0)
      return () => window.clearTimeout(timer)
    }
    requestAnimationFrame(() => campoCodigoRef.current?.focus())
    return undefined
  }, [protocoloParam, consultar])

  useEffect(() => {
    const atualizar = () => setPedidos(listarPedidos())
    marcarNotificacoesLidas()
    window.dispatchEvent(new CustomEvent('prefeitura:notificacoes'))
    window.addEventListener('prefeitura:notificacoes', atualizar)
    window.addEventListener('prefeitura:fila', atualizar)
    return () => {
      window.removeEventListener('prefeitura:notificacoes', atualizar)
      window.removeEventListener('prefeitura:fila', atualizar)
    }
  }, [])

  function abrirPedido(protocolo, codigoAcesso) {
    const salvo = listarPedidos().find((item) => item.protocolo === protocolo)
    const codigoFinal = codigoAcesso || salvo?.codigoAcesso || ''
    setValor(protocolo)
    setCodigo(codigoFinal)
    codigoRef.current = codigoFinal
    setAvisoCodigo(codigoFinal ? '' : 'Informe o código de acesso deste pedido.')
    setParams({ protocolo }, { replace: true })
    if (codigoFinal) {
      consultar(protocolo, codigoFinal)
    } else {
      setResultado(null)
      setErro(null)
      requestAnimationFrame(() => campoCodigoRef.current?.focus())
    }
  }

  function aoEnviar(evento) {
    evento.preventDefault()
    const limpo = normalizarProtocolo(valor)
    const codigoLimpo = normalizarCodigoAcesso(codigo)
    setAviso('')
    setAvisoCodigo('')

    if (!limpo) {
      setAviso('Informe o protocolo.')
      setParams({}, { replace: true })
      campoRef.current?.focus()
      return
    }
    if (!codigoAcessoValido(codigoLimpo)) {
      setAvisoCodigo('Informe o código de acesso com 12 caracteres.')
      campoCodigoRef.current?.focus()
      return
    }

    setValor(limpo)
    setCodigo(codigoLimpo)
    setParams({ protocolo: limpo }, { replace: true })
    consultar(limpo, codigoLimpo)
  }

  function voltarParaPedidos() {
    setResultado(null)
    setCodigoConsultado('')
    setErro(null)
    setValor('')
    setCodigo('')
    setAviso('')
    setAvisoCodigo('')
    codigoRef.current = ''
    consultadoRef.current = { protocolo: '', codigo: '' }
    setParams({}, { replace: true })
    setPedidos(listarPedidos())
  }

  const status = resultado ? infoStatus(resultado.status) : null
  const visual = resultado ? visualStatus(resultado.status) : null
  const prazo = resultado ? infoPrazo(resultado) : null
  const naoEncontrado = erro?.codigo === CODIGOS_ERRO.NAO_ENCONTRADO
  const acessoInvalido = erro?.codigo === CODIGOS_ERRO.CODIGO_ACESSO_INVALIDO

  return (
    <div className="pagina pagina--estreita">
      <header className="cabecalho-pagina">
        <p className="cabecalho-pagina__sobre">Acompanhar</p>
        <h1>Seu protocolo</h1>
        <p className="texto-suave">
          Informe o protocolo e o código de acesso, ou abra um dos seus pedidos.
        </p>
      </header>

      <form className="cartao consulta" onSubmit={aoEnviar} noValidate>
        <div className="consulta__campos">
          <div className={`campo${aviso ? ' campo--erro' : ''}`}>
            <label htmlFor="protocolo" className="sr-only">
              Número do protocolo
            </label>
            <div className="campo__controle campo__controle--busca">
              <Search aria-hidden="true" />
              <input
                ref={campoRef}
                id="protocolo"
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="PREF-2026-000001"
                value={valor}
                onChange={(evento) => {
                  setValor(evento.target.value.toUpperCase())
                  setAviso('')
                }}
                aria-invalid={Boolean(aviso)}
                aria-describedby={aviso ? 'erro-protocolo' : undefined}
              />
            </div>
            {aviso && (
              <p className="campo__erro" id="erro-protocolo">
                {aviso}
              </p>
            )}
          </div>

          <div className={`campo${avisoCodigo ? ' campo--erro' : ''}`}>
            <label htmlFor="codigo-acesso">Código de acesso</label>
            <div className="campo__controle campo__controle--busca">
              <KeyRound aria-hidden="true" />
              <input
                ref={campoCodigoRef}
                id="codigo-acesso"
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                placeholder="ABCD-EFGH-JKLM"
                value={codigo}
                onChange={(evento) => {
                  setCodigo(normalizarCodigoAcesso(evento.target.value))
                  setAvisoCodigo('')
                }}
                aria-invalid={Boolean(avisoCodigo)}
                aria-describedby={`ajuda-codigo${avisoCodigo ? ' erro-codigo' : ''}`}
              />
            </div>
            <p className="campo__ajuda" id="ajuda-codigo">
              Está na confirmação do pedido. Também fica salvo em “Meus pedidos” neste aparelho.
            </p>
            {avisoCodigo && (
              <p className="campo__erro" id="erro-codigo">
                {avisoCodigo}
              </p>
            )}
          </div>
        </div>

        <button type="submit" className="botao botao--primario" disabled={carregando}>
          {carregando ? (
            <>
              <LoaderCircle className="girando" aria-hidden="true" />
              Buscando
            </>
          ) : (
            <>
              <Search aria-hidden="true" />
              Buscar
            </>
          )}
        </button>
      </form>

      {!resultado && pedidos.length > 0 && (
        <section className="meus-pedidos" aria-labelledby="titulo-meus-pedidos">
          <div className="secao__cabecalho">
            <div>
              <h2 id="titulo-meus-pedidos">Meus pedidos</h2>
              <p className="secao__apoio">Salvos neste aparelho.</p>
            </div>
            <span className="secao__contagem">{pedidos.length}</span>
          </div>
          <ul className="lista-pedidos">
            {pedidos.map((pedido) => {
              const atualizado = pedido.vistoEm !== pedido.atualizadoEm
              return (
                <li key={pedido.protocolo}>
                  <button
                    type="button"
                    className={`pedido-card${atualizado ? ' is-atualizado' : ''}`}
                    onClick={() => abrirPedido(pedido.protocolo, pedido.codigoAcesso)}
                    aria-label={`Abrir ${pedido.protocolo}, ${pedido.tipoTitulo ?? 'serviço'}`}
                  >
                    <span className="pedido-card__topo">
                      <code>{pedido.protocolo}</code>
                      <StatusBadge status={pedido.status} />
                    </span>
                    <strong className="pedido-card__titulo">{pedido.tipoTitulo ?? 'Serviço'}</strong>
                    <span className="pedido-card__endereco">{pedido.endereco}</span>
                    <span className="pedido-card__rodape">
                      <span>Atualizado em {formatarDataHora(pedido.atualizadoEm)}</span>
                      {atualizado && (
                        <span className="pedido-card__novo">
                          <span className="pedido-card__ponto" aria-hidden="true" />
                          Atualizado
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {recentes.length > 0 && !resultado && (
        <section className="recentes" aria-labelledby="titulo-recentes">
          <h2 id="titulo-recentes">Consultas recentes</h2>
          <ul>
            {recentes.map((item) => (
              <li key={item.protocolo}>
                <button type="button" className="chip" onClick={() => abrirPedido(item.protocolo)}>
                  <Clock3 aria-hidden="true" />
                  {item.protocolo}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {carregando && <SkeletonBloco linhas={4} />}

      {(naoEncontrado || acessoInvalido) && (
        <div className="cartao estado-vazio" role="status">
          <IlustracaoBusca className="estado-vazio__arte" />
          <h2>{acessoInvalido ? 'Protocolo ou código não confere' : 'Protocolo não encontrado'}</h2>
          <p>
            {acessoInvalido
              ? 'Confira o número do protocolo e o código de acesso e tente novamente.'
              : 'Confira o número e tente novamente.'}
          </p>
          {!acessoInvalido && <code className="exemplo-protocolo">PREF-2026-000001</code>}
        </div>
      )}

      {erro && !naoEncontrado && !acessoInvalido && (
        <ErrorState erro={erro} aoTentarNovamente={() => consultar(valor, codigo)} />
      )}

      {resultado && (
        <article className="cartao resultado" aria-labelledby="titulo-resultado">
          <div className="resultado__topo">
            <span className={`resultado__icone tom-${visual.tom}`}>
              <visual.Icone aria-hidden="true" />
            </span>
            <div className="resultado__protocolo">
              <span>Protocolo</span>
              <h2 id="titulo-resultado" className="protocolo-numero">
                {resultado.protocolo}
              </h2>
            </div>
            <div className="resultado__selos">
              <StatusBadge status={resultado.status} />
              {resultado.transferida && (
                <Badge tom="info">
                  <Send aria-hidden="true" />
                  Transferida
                </Badge>
              )}
            </div>
          </div>

          <p className="resultado__descricao">{status.descricao}</p>

          {prazo && (
            <div className={`prazo${prazo.vencido ? ' prazo--atrasado' : ''}`}>
              <span className="prazo__icone">
                <Clock3 aria-hidden="true" />
              </span>
              <span>
                <span className="prazo__rotulo">Prazo estimado</span>
                <strong>
                  {prazo.data} · {prazo.rotulo}
                </strong>
              </span>
            </div>
          )}

          <ul className="lista-dados lista-dados--grade">
            <li className="lista-dados__item">
              <span className="lista-dados__icone tom-azul">
                <Wrench aria-hidden="true" />
              </span>
              <span className="lista-dados__texto">
                <span className="lista-dados__rotulo">Serviço</span>
                <strong className="lista-dados__valor">{resultado.tipoTitulo}</strong>
              </span>
            </li>
            {resultado.setorNome && (
              <li className="lista-dados__item">
                <span className="lista-dados__icone tom-azul">
                  <Building2 aria-hidden="true" />
                </span>
                <span className="lista-dados__texto">
                  <span className="lista-dados__rotulo">Setor responsável</span>
                  <strong className="lista-dados__valor">{resultado.setorNome}</strong>
                </span>
              </li>
            )}
            <li className="lista-dados__item">
              <span className="lista-dados__icone tom-azul">
                <MapPin aria-hidden="true" />
              </span>
              <span className="lista-dados__texto">
                <span className="lista-dados__rotulo">Endereço</span>
                <strong className="lista-dados__valor">{resultado.endereco}</strong>
                {resultado.localizacao && (
                  <a href={urlDoMapa(resultado.localizacao)} target="_blank" rel="noreferrer">
                    Ver no mapa (online)
                  </a>
                )}
              </span>
            </li>
            <li className="lista-dados__item">
              <span className="lista-dados__icone tom-azul">
                <CalendarDays aria-hidden="true" />
              </span>
              <span className="lista-dados__texto">
                <span className="lista-dados__rotulo">Aberto em</span>
                <strong className="lista-dados__valor">{formatarDataHora(resultado.criadoEm)}</strong>
              </span>
            </li>
            <li className="lista-dados__item">
              <span className="lista-dados__icone tom-azul">
                <Clock3 aria-hidden="true" />
              </span>
              <span className="lista-dados__texto">
                <span className="lista-dados__rotulo">Atualizado em</span>
                <strong className="lista-dados__valor">{formatarDataHora(resultado.atualizadoEm)}</strong>
              </span>
            </li>
          </ul>

          {resultado.foto && (
            <figure className="resultado__foto">
              <img src={resultado.foto} alt="Foto anexada à solicitação" loading="lazy" />
              <figcaption>Foto enviada com o pedido.</figcaption>
            </figure>
          )}

          <section className="resultado__historico" aria-labelledby="titulo-historico">
            <h3 id="titulo-historico">Histórico</h3>
            <ol className="linha-tempo">
              {resultado.historico.map((evento, indice) => {
                const atual = indice === resultado.historico.length - 1
                const visualEvento = visualStatus(evento.status)
                return (
                  <li key={`${evento.status}-${evento.em}`} className={atual ? 'is-atual' : undefined}>
                    <span className="linha-tempo__ponto">
                      {evento.tipo === 'transferencia' ? (
                        <Send aria-hidden="true" />
                      ) : (
                        <visualEvento.Icone aria-hidden="true" />
                      )}
                    </span>
                    <div className="linha-tempo__conteudo">
                      <strong>
                        {evento.tipo === 'transferencia'
                          ? 'Transferência'
                          : infoStatus(evento.status).rotulo}
                      </strong>
                      <time dateTime={evento.em}>{formatarDataHora(evento.em)}</time>
                      {evento.observacao && <p>{evento.observacao}</p>}
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>

          {resultado.status === 'concluida' && (
            <Avaliacao
              protocolo={resultado.protocolo}
              codigoAcesso={codigoConsultado}
              avaliacao={resultado.avaliacao}
              aoAvaliar={(atualizada) => {
                setResultado(atualizada)
                registrarPedido(atualizada, codigoConsultado)
                setPedidos(listarPedidos())
              }}
            />
          )}

          <div className="acoes">
            <Link className="botao botao--secundario" to="/nova-solicitacao">
              <Plus aria-hidden="true" />
              Nova solicitação
            </Link>
            <button type="button" className="botao botao--secundario" onClick={voltarParaPedidos}>
              Meus pedidos
              <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </article>
      )}
    </div>
  )
}
