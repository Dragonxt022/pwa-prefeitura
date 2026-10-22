import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import { StatusBadge } from '../components/StatusBadge'
import { consultarSolicitacao } from '../lib/api'
import { listarConsultas, registrarConsulta } from '../lib/consultas'
import { formatarDataHora, infoStatus, normalizarProtocolo } from '../lib/format'

function Detalhe({ rotulo, valor }) {
  return (
    <div>
      <dt>{rotulo}</dt>
      <dd>{valor}</dd>
    </div>
  )
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

  const consultadoRef = useRef('')
  const campoRef = useRef(null)

  const consultar = useCallback(async (protocolo) => {
    const limpo = normalizarProtocolo(protocolo)
    setAviso('')
    setErro(null)
    setResultado(null)

    if (!limpo) {
      setAviso('Informe o número do protocolo para continuar.')
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
  const naoEncontrado = erro?.codigo === 'nao_encontrado'

  return (
    <div className="pagina pagina--estreita">
      <header className="cabecalho-pagina">
        <p className="cabecalho-pagina__sobre">Acompanhamento</p>
        <h1>Consultar protocolo</h1>
        <p className="texto-suave">
          Digite o número recebido ao abrir a solicitação. Formato: PREF-2026-000001.
        </p>
      </header>

      <form className="cartao consulta" onSubmit={aoEnviar} noValidate>
        <div className={`campo${aviso ? ' campo--erro' : ''}`}>
          <label htmlFor="protocolo">Número do protocolo</label>
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
          {aviso && <p className="campo__erro" id="erro-protocolo">{aviso}</p>}
        </div>

        <button type="submit" className="botao botao--primario" disabled={carregando}>
          {carregando ? 'Consultando…' : 'Consultar'}
        </button>
      </form>

      {recentes.length > 0 && !resultado && (
        <section className="recentes" aria-labelledby="titulo-recentes">
          <h2 id="titulo-recentes">Consultas recentes</h2>
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
                  {item.protocolo}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {carregando && (
        <p className="carregando" role="status">
          <span className="spinner" aria-hidden="true" />
          Consultando protocolo…
        </p>
      )}

      {naoEncontrado && (
        <div className="cartao estado-vazio" role="status">
          <h2>Protocolo não encontrado</h2>
          <p>
            Confira se os dígitos estão corretos. Protocolos do piloto seguem o padrão
            <code> PREF-AAAA-000000</code>.
          </p>
          <p className="texto-suave">
            Se você abriu a solicitação agora, o número aparece na tela de confirmação e fica salvo
            neste dispositivo.
          </p>
        </div>
      )}

      {erro && !naoEncontrado && <ErrorState erro={erro} aoTentarNovamente={() => consultar(valor)} />}

      {resultado && (
        <article className="cartao resultado" aria-labelledby="titulo-resultado">
          <div className="resultado__topo">
            <div>
              <p className="texto-suave">Protocolo</p>
              <h2 id="titulo-resultado" className="protocolo-numero">
                {resultado.protocolo}
              </h2>
            </div>
            <StatusBadge status={resultado.status} />
          </div>

          <p className={`alerta alerta--${status.tom}`}>{status.descricao}</p>

          <dl className="detalhes">
            <Detalhe rotulo="Serviço" valor={resultado.tipoTitulo} />
            <Detalhe rotulo="Endereço" valor={resultado.endereco} />
            <Detalhe rotulo="Aberto em" valor={formatarDataHora(resultado.criadoEm)} />
            <Detalhe rotulo="Última atualização" valor={formatarDataHora(resultado.atualizadoEm)} />
          </dl>

          <section aria-labelledby="titulo-historico">
            <h3 id="titulo-historico">Histórico</h3>
            <ol className="linha-tempo">
              {resultado.historico.map((evento, indice) => {
                const atual = indice === resultado.historico.length - 1
                return (
                  <li key={`${evento.status}-${evento.em}`} className={atual ? 'is-atual' : undefined}>
                    <span className="linha-tempo__ponto" aria-hidden="true" />
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

          <div className="acoes">
            <Link className="botao botao--secundario" to="/nova-solicitacao">
              Abrir nova solicitação
            </Link>
          </div>
        </article>
      )}
    </div>
  )
}
