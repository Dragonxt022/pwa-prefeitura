import {
  ArrowRight,
  Building2,
  CalendarDays,
  Clock3,
  LoaderCircle,
  MapPin,
  Plus,
  Search,
  Send,
  Wrench,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Avaliacao from '../components/Avaliacao'
import ErrorState from '../components/ErrorState'
import { IlustracaoBusca } from '../components/Ilustracoes'
import { SkeletonBloco } from '../components/Loading'
import { Badge, StatusBadge } from '../components/StatusBadge'
import { consultarSolicitacao } from '../lib/api'
import {
  listarConsultas,
  listarPedidos,
  marcarNotificacoesLidas,
  marcarPedidoVisto,
  registrarConsulta,
  registrarPedido,
} from '../lib/consultas'
import { formatarDataHora, infoStatus, normalizarProtocolo } from '../lib/format'
import { infoPrazo } from '../lib/prazos'
import { visualStatus } from '../lib/visual'

function urlDoMapa(localizacao) {
  return `https://www.openstreetmap.org/?mlat=${localizacao.latitude}&mlon=${localizacao.longitude}#map=18/${localizacao.latitude}/${localizacao.longitude}`
}

export default function Acompanhar() {
  const [params, setParams] = useSearchParams()
  const protocoloParam = normalizarProtocolo(params.get('protocolo'))

  const [valor, setValor] = useState(protocoloParam)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [recentes, setRecentes] = useState(listarConsultas)
  const [pedidos, setPedidos] = useState(listarPedidos)

  const consultadoRef = useRef('')
  const campoRef = useRef(null)

  const consultar = useCallback(async (protocolo) => {
    const limpo = normalizarProtocolo(protocolo)
    setAviso('')
    setErro(null)
    setResultado(null)

    if (!limpo) {
      setAviso('Informe o protocolo.')
      campoRef.current?.focus()
      return
    }

    consultadoRef.current = limpo
    setCarregando(true)
    try {
      const dados = await consultarSolicitacao(limpo)
      setResultado(dados)
      setRecentes(registrarConsulta(dados.protocolo))
      registrarPedido(dados)
      marcarPedidoVisto(dados.protocolo)
      setPedidos(listarPedidos())
      marcarNotificacoesLidas()
      window.dispatchEvent(new CustomEvent('prefeitura:notificacoes'))
    } catch (falha) {
      setErro(falha)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    if (protocoloParam && protocoloParam !== consultadoRef.current) {
      setValor(protocoloParam)
      consultar(protocoloParam)
    }
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

  function abrirPedido(protocolo) {
    setValor(protocolo)
    setParams({ protocolo }, { replace: true })
    consultar(protocolo)
  }

  function aoEnviar(evento) {
    evento.preventDefault()
    const limpo = normalizarProtocolo(valor)
    setParams(limpo ? { protocolo: limpo } : {}, { replace: true })
    if (limpo === consultadoRef.current) consultar(limpo)
    else if (!limpo) consultar(limpo)
  }

  function voltarParaPedidos() {
    setResultado(null)
    setErro(null)
    setValor('')
    consultadoRef.current = ''
    setParams({}, { replace: true })
    setPedidos(listarPedidos())
  }

  const status = resultado ? infoStatus(resultado.status) : null
  const visual = resultado ? visualStatus(resultado.status) : null
  const prazo = resultado ? infoPrazo(resultado) : null
  const naoEncontrado = erro?.codigo === 'nao_encontrado'

  return (
    <div className="pagina pagina--estreita">
      <header className="cabecalho-pagina">
        <p className="cabecalho-pagina__sobre">Acompanhar</p>
        <h1>Seu protocolo</h1>
        <p className="texto-suave">Digite o número ou abra um dos seus pedidos.</p>
      </header>

      <form className="cartao consulta" onSubmit={aoEnviar} noValidate>
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
              onChange={(evento) => setValor(evento.target.value.toUpperCase())}
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
                    onClick={() => abrirPedido(pedido.protocolo)}
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

      {naoEncontrado && (
        <div className="cartao estado-vazio" role="status">
          <IlustracaoBusca className="estado-vazio__arte" />
          <h2>Protocolo não encontrado</h2>
          <p>Confira o número e tente novamente.</p>
          <code className="exemplo-protocolo">PREF-2026-000001</code>
        </div>
      )}

      {erro && !naoEncontrado && <ErrorState erro={erro} aoTentarNovamente={() => consultar(valor)} />}

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
              avaliacao={resultado.avaliacao}
              aoAvaliar={(atualizada) => {
                setResultado(atualizada)
                registrarPedido(atualizada)
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
