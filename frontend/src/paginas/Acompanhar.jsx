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
import Avaliacao from '../componentes/Avaliacao'
import ErrorState from '../componentes/ErrorState'
import { IlustracaoBusca } from '../componentes/Ilustracoes'
import { SkeletonBloco } from '../componentes/Loading'
import { Badge, StatusBadge } from '../componentes/StatusBadge'
import {
  avaliarMinhaSolicitacao,
  consultarMinhaSolicitacao,
  consultarSolicitacao,
  listarMinhasSolicitacoes,
  vincularMinhaSolicitacao,
} from '../servicos/api'
import { useCidadao } from '../contexto/useCidadao'
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

function codigoSalvoDoPedido(protocolo) {
  return listarPedidos().find((item) => item.protocolo === protocolo)?.codigoAcesso ?? ''
}

export default function Acompanhar() {
  const [params, setParams] = useSearchParams()
  const protocoloParam = normalizarProtocolo(params.get('protocolo'))

  const [valor, setValor] = useState(protocoloParam)
  const [codigoAtual, setCodigoAtual] = useState('')
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [recentes, setRecentes] = useState(listarConsultas)
  const [pedidos, setPedidos] = useState(listarPedidos)
  const [minhas, setMinhas] = useState([])
  const [carregandoMinhas, setCarregandoMinhas] = useState(false)
  const [detalheConta, setDetalheConta] = useState(false)
  const { cidadao } = useCidadao()

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

    // O código continua salvo no aparelho e é usado para ações sensíveis,
    // mas não é mais necessário para consultar o andamento.
    const codigoAcesso = codigoSalvoDoPedido(limpo)
    consultadoRef.current = limpo
    setValor(limpo)
    setCodigoAtual(codigoAcesso)
    setCarregando(true)
    try {
      const dados = await consultarSolicitacao(limpo, codigoAcesso)
      setResultado(dados)
      setDetalheConta(false)
      setRecentes(registrarConsulta(dados.protocolo))
      registrarPedido(dados, codigoAcesso)
      marcarPedidoVisto(dados.protocolo)
      setPedidos(listarPedidos())
      marcarNotificacoesLidas()
      window.dispatchEvent(new CustomEvent('prefeitura:notificacoes'))

      // Aproveita o código válido para vincular o pedido antigo à conta.
      if (cidadao && codigoAcesso) {
        vincularMinhaSolicitacao({ protocolo: dados.protocolo, codigoAcesso })
          .then(() => listarMinhasSolicitacoes())
          .then((resposta) => setMinhas(resposta?.dados ?? []))
          .catch(() => {
            // O vínculo é opcional; a consulta por protocolo continua valendo.
          })
      }
    } catch (falha) {
      setErro(falha)
    } finally {
      setCarregando(false)
    }
  }, [cidadao])

  useEffect(() => {
    if (!protocoloParam || consultadoRef.current === protocoloParam) return
    setValor(protocoloParam)
    setAviso('')
    setErro(null)
    setResultado(null)
    // A busca é agendada fora do efeito para não iniciar uma cascata de
    // renders ao sincronizar a URL com o protocolo.
    const timer = window.setTimeout(() => {
      void consultar(protocoloParam)
    }, 0)
    return () => window.clearTimeout(timer)
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

  useEffect(() => {
    if (!cidadao) return undefined
    let ativo = true
    // Carregamento assíncrono da lista da conta.
    // oxlint-disable-next-line react/set-state-in-effect
    setCarregandoMinhas(true)
    listarMinhasSolicitacoes()
      .then((resposta) => {
        if (ativo) setMinhas(resposta?.dados ?? [])
      })
      .catch(() => {
        if (ativo) setMinhas([])
      })
      .finally(() => {
        if (ativo) setCarregandoMinhas(false)
      })
    return () => {
      ativo = false
    }
  }, [cidadao])

  async function abrirPedidoConta(protocolo) {
    setAviso('')
    setErro(null)
    setResultado(null)
    setCarregando(true)
    try {
      const dados = await consultarMinhaSolicitacao(protocolo)
      setValor(protocolo)
      setCodigoAtual('')
      consultadoRef.current = protocolo
      setResultado(dados)
      setDetalheConta(true)
      setParams({ protocolo }, { replace: true })
      setRecentes(registrarConsulta(dados.protocolo))
      marcarNotificacoesLidas()
      window.dispatchEvent(new CustomEvent('prefeitura:notificacoes'))
    } catch (falha) {
      setErro(falha)
    } finally {
      setCarregando(false)
    }
  }

  function abrirPedido(protocolo) {
    setValor(protocolo)
    setParams({ protocolo }, { replace: true })
    consultar(protocolo)
  }

  function aoEnviar(evento) {
    evento.preventDefault()
    const limpo = normalizarProtocolo(valor)
    setAviso('')

    if (!limpo) {
      setAviso('Informe o protocolo.')
      setParams({}, { replace: true })
      campoRef.current?.focus()
      return
    }

    setValor(limpo)
    setParams({ protocolo: limpo }, { replace: true })
    consultar(limpo)
  }

  function voltarParaPedidos() {
    setResultado(null)
    setDetalheConta(false)
    setCodigoAtual('')
    setErro(null)
    setValor('')
    setAviso('')
    consultadoRef.current = ''
    setParams({}, { replace: true })
    setPedidos(listarPedidos())
  }

  const status = resultado ? infoStatus(resultado.status) : null
  const visual = resultado ? visualStatus(resultado.status) : null
  const prazo = resultado ? infoPrazo(resultado) : null
  const protocolosDaConta = new Set(minhas.map((item) => item.protocolo))
  const pedidosLocais = cidadao
    ? pedidos.filter((item) => !protocolosDaConta.has(item.protocolo))
    : pedidos
  const naoEncontrado = erro?.codigo === CODIGOS_ERRO.NAO_ENCONTRADO

  return (
    <div className="pagina pagina--estreita">
      <header className="cabecalho-pagina">
        <p className="cabecalho-pagina__sobre">Acompanhar</p>
        <h1>Seu protocolo</h1>
        <p className="texto-suave">
          Informe o número do protocolo para acompanhar o andamento, ou abra um dos seus pedidos.
        </p>
      </header>

      <form className="cartao consulta" onSubmit={aoEnviar} noValidate>
        <div className="consulta__campos">
          <div className={`campo${aviso ? ' campo--erro' : ''}`}>
            <label htmlFor="protocolo">Número do protocolo</label>
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
                aria-describedby={aviso ? 'erro-protocolo' : 'ajuda-protocolo'}
              />
            </div>
            <p className="campo__ajuda" id="ajuda-protocolo">
              O número aparece na confirmação do pedido e em “Meus pedidos”.
            </p>
            {aviso && (
              <p className="campo__erro" id="erro-protocolo">
                {aviso}
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

      {cidadao && !resultado && (
        <section className="meus-pedidos" aria-labelledby="titulo-pedidos-conta">
          <div className="secao__cabecalho">
            <div>
              <h2 id="titulo-pedidos-conta">Pedidos da minha conta</h2>
              <p className="secao__apoio">Sincronizados com o servidor.</p>
            </div>
            <span className="secao__contagem">{minhas.length}</span>
          </div>

          {carregandoMinhas ? (
            <SkeletonBloco linhas={2} />
          ) : minhas.length === 0 ? (
            <p className="texto-suave">
              Nenhum pedido vinculado ainda. Pedidos feitos com a conta entram aqui automaticamente.
            </p>
          ) : (
            <ul className="lista-pedidos">
              {minhas.map((pedido) => (
                <li key={pedido.protocolo}>
                  <button
                    type="button"
                    className="pedido-card"
                    onClick={() => abrirPedidoConta(pedido.protocolo)}
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
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="campo__ajuda">
            Para trazer um pedido antigo para a conta, consulte-o com protocolo e código de acesso.
          </p>
        </section>
      )}

      {!resultado && pedidosLocais.length > 0 && (
        <section className="meus-pedidos" aria-labelledby="titulo-meus-pedidos">
          <div className="secao__cabecalho">
            <div>
              <h2 id="titulo-meus-pedidos">Meus pedidos</h2>
              <p className="secao__apoio">Salvos neste aparelho.</p>
            </div>
            <span className="secao__contagem">{pedidosLocais.length}</span>
          </div>
          <ul className="lista-pedidos">
            {pedidosLocais.map((pedido) => {
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

      {erro && !naoEncontrado && (
        <ErrorState erro={erro} aoTentarNovamente={() => consultar(valor)} />
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

          {resultado.status === 'concluida' && (detalheConta || codigoAtual) && (
            <Avaliacao
              protocolo={resultado.protocolo}
              codigoAcesso={codigoAtual}
              avaliacao={resultado.avaliacao}
              aoEnviarAvaliacao={detalheConta
                ? (dados) => avaliarMinhaSolicitacao(resultado.protocolo, dados)
                : undefined}
              aoAvaliar={(atualizada) => {
                setResultado(atualizada)
                if (detalheConta) {
                  setMinhas((atuais) =>
                    atuais.map((item) =>
                      item.protocolo === atualizada.protocolo
                        ? { ...item, avaliacao: atualizada.avaliacao, status: atualizada.status }
                        : item,
                    ),
                  )
                } else {
                  registrarPedido(atualizada, codigoAtual)
                  setPedidos(listarPedidos())
                }
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
