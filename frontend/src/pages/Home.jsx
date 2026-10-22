import { ArrowUpRight, Clock3, Plus, Search, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import { IlustracaoCidade } from '../components/Ilustracoes'
import { EstadoVazioBusca, SkeletonCartoes } from '../components/Loading'
import { Badge } from '../components/StatusBadge'
import { useRecurso } from '../hooks/useRecurso'
import { listarAvisos, listarServicos } from '../lib/api'
import { formatarData, infoPrioridade } from '../lib/format'
import { visualAviso, visualServico } from '../lib/visual'

export default function Home() {
  const [busca, setBusca] = useState('')
  const { dados, carregando, erro, recarregar } = useRecurso(
    () => Promise.all([listarAvisos(), listarServicos()]),
    [],
  )

  const [avisos, servicos] = useMemo(() => {
    const [listaAvisos, listaServicos] = dados ?? [[], []]
    return [listaAvisos, listaServicos]
  }, [dados])

  const servicosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return servicos
    return servicos.filter((servico) =>
      `${servico.titulo} ${servico.descricao} ${servico.categoria}`.toLowerCase().includes(termo),
    )
  }, [busca, servicos])

  return (
    <div className="pagina">
      <section className="hero" aria-labelledby="titulo-principal">
        <div className="hero__conteudo">
          <p className="hero__sobre">
            <Sparkles aria-hidden="true" />
            Atendimento digital
          </p>
          <h1 id="titulo-principal">Como podemos ajudar?</h1>
          <p className="hero__texto">Solicite um serviço ou acompanhe seu protocolo.</p>
          <div className="hero__acoes">
            <Link className="botao botao--primario" to="/nova-solicitacao">
              <Plus aria-hidden="true" />
              Nova solicitação
            </Link>
            <Link className="botao botao--secundario" to="/acompanhar">
              <Search aria-hidden="true" />
              Acompanhar
            </Link>
          </div>
        </div>
        <IlustracaoCidade className="hero__arte" />
      </section>

      {erro ? (
        <ErrorState erro={erro} aoTentarNovamente={recarregar} />
      ) : (
        <>
          <section className="secao" aria-labelledby="titulo-servicos">
            <div className="secao__cabecalho">
              <h2 id="titulo-servicos">Serviços</h2>
              {!carregando && <span className="secao__contagem">{servicosFiltrados.length}</span>}
            </div>

            <div className="campo-busca">
              <Search className="campo-busca__icone" aria-hidden="true" />
              <label className="sr-only" htmlFor="busca-servico">
                Buscar serviço
              </label>
              <input
                id="busca-servico"
                type="search"
                placeholder="Buscar serviço"
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
              />
            </div>

            {carregando ? (
              <SkeletonCartoes quantidade={6} />
            ) : servicosFiltrados.length === 0 ? (
              <EstadoVazioBusca termo={busca} />
            ) : (
              <ul className="grade-servicos">
                {servicosFiltrados.map((servico) => {
                  const { rotulo, Icone, tom } = visualServico(servico.id)
                  return (
                    <li key={servico.id}>
                      <Link
                        className={`servico-card tom-${tom}`}
                        to={`/nova-solicitacao?tipo=${servico.id}`}
                        aria-label={`${servico.titulo} — abrir solicitação`}
                      >
                        <span className="servico-card__topo">
                          <span className="servico-card__icone">
                            <Icone aria-hidden="true" />
                          </span>
                          <ArrowUpRight className="servico-card__seta" aria-hidden="true" />
                        </span>
                        <span className="servico-card__titulo">{rotulo}</span>
                        <span className="servico-card__prazo">
                          <Clock3 aria-hidden="true" />
                          {servico.prazoDias} dias
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="secao" aria-labelledby="titulo-avisos">
            <div className="secao__cabecalho">
              <h2 id="titulo-avisos">Avisos</h2>
              {!carregando && <span className="secao__contagem">{avisos.length}</span>}
            </div>

            {carregando ? (
              <SkeletonCartoes quantidade={2} />
            ) : (
              <ul className="lista-avisos">
                {avisos.map((aviso) => {
                  const { Icone, tom } = visualAviso(aviso.categoria)
                  const prioridade = infoPrioridade(aviso.prioridade)
                  return (
                    <li key={aviso.id} className={`aviso tom-${tom}`}>
                      <span className="aviso__icone">
                        <Icone aria-hidden="true" />
                      </span>
                      <div className="aviso__corpo">
                        <div className="aviso__topo">
                          <Badge tom={prioridade.tom}>{prioridade.rotulo}</Badge>
                          <span>{aviso.categoria}</span>
                          <span aria-hidden="true">·</span>
                          <time dateTime={aviso.publicadoEm}>{formatarData(aviso.publicadoEm)}</time>
                        </div>
                        <h3>{aviso.titulo}</h3>
                        <p className="aviso__resumo">{aviso.resumo}</p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}
