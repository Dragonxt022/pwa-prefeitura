import {
  ArrowRight,
  CalendarDays,
  Clock3,
  LoaderCircle,
  MapPin,
  Plus,
  Search,
  Wrench,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import { IlustracaoBusca } from '../components/Ilustracoes'
import { SkeletonBloco } from '../components/Loading'
import { StatusBadge } from '../components/StatusBadge'
import { consultarSolicitacao } from '../lib/api'
import { listarConsultas, registrarConsulta } from '../lib/consultas'
import { formatarDataHora, infoStatus, normalizarProtocolo } from '../lib/format'
import { visualStatus } from '../lib/visual'

export default function Acompanhar() {
  const [params, setParams] = useSearchParams()
  const protocoloParam = normalizarProtocolo(params.get('protocolo'))

  const [valor, setValor] = useState(protocoloParam)
  const [resultado, setResultado] = useState(null)
  const [erro, setErro] = useState(null)
  const [carregando, setCarregando] = useState(false)
  const [aviso, setAviso] = useState('')
  const [recentes, setRecentes] = useState(listarConsultas)

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

  function aoEnviar(evento) {
    evento.preventDefault()
    const limpo = normalizarProtocolo(valor)
    setParams(limpo ? { protocolo: limpo } : {}, { replace: true })
    if (limpo === consultadoRef.current) consultar(limpo)
    else if (!limpo) consultar(limpo)
  }

  const status = resultado ? infoStatus(resultado.status) : null
  const visual = resultado ? visualStatus(resultado.status) : null
  const naoEncontrado = erro?.codigo === 'nao_encontrado'

  return (
    <div className="pagina pagina--estreita">
      <header className="cabecalho-pagina">
        <p className="cabecalho-pagina__sobre">Acompanhar</p>
        <h1>Seu protocolo</h1>
        <p className="texto-suave">Digite o número para ver o andamento.</p>
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

      {recentes.length > 0 && !resultado && (
        <section className="recentes" aria-labelledby="titulo-recentes">
          <h2 id="titulo-recentes">Recentes</h2>
          <ul>
            {recentes.map((item) => (
              <li key={item.protocolo}>
                <button
                  type="button"
                  className="chip"
                  onClick={() => {
                    setValor(item.protocolo)
                    consultar(item.protocolo)
                    setParams({ protocolo: item.protocolo }, { replace: true })
                  }}
                >
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
            <StatusBadge status={resultado.status} />
          </div>

          <p className="resultado__descricao">{status.descricao}</p>

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
            <li className="lista-dados__item">
              <span className="lista-dados__icone tom-azul">
                <MapPin aria-hidden="true" />
              </span>
              <span className="lista-dados__texto">
                <span className="lista-dados__rotulo">Endereço</span>
                <strong className="lista-dados__valor">{resultado.endereco}</strong>
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

          <section className="resultado__historico" aria-labelledby="titulo-historico">
            <h3 id="titulo-historico">Histórico</h3>
            <ol className="linha-tempo">
              {resultado.historico.map((evento, indice) => {
                const atual = indice === resultado.historico.length - 1
                const visualEvento = visualStatus(evento.status)
                return (
                  <li key={`${evento.status}-${evento.em}`} className={atual ? 'is-atual' : undefined}>
                    <span className="linha-tempo__ponto">
                      <visualEvento.Icone aria-hidden="true" />
                    </span>
                    <div className="linha-tempo__conteudo">
                      <strong>{infoStatus(evento.status).rotulo}</strong>
                      <time dateTime={evento.em}>{formatarDataHora(evento.em)}</time>
                      {evento.observacao && <p>{evento.observacao}</p>}
                    </div>
                  </li>
                )
              })}
            </ol>
          </section>

          <Link className="botao botao--secundario resultado__acao" to="/nova-solicitacao">
            <Plus aria-hidden="true" />
            Nova solicitação
            <ArrowRight aria-hidden="true" />
          </Link>
        </article>
      )}
    </div>
  )
}
