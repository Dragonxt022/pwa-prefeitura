import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import { IconeBusca, IconeSeta } from '../components/Icones'
import { SkeletonCartoes } from '../components/Loading'
import { Badge } from '../components/StatusBadge'
import { useRecurso } from '../hooks/useRecurso'
import { listarAvisos, listarServicos } from '../lib/api'
import { formatarData, infoPrioridade } from '../lib/format'

export default function Home() {
  const [busca, setBusca] = useState('')
  const { dados, carregando, erro, recarregar } = useRecurso(
    () => Promise.all([listarAvisos(), listarServicos()]),
    [],
  )

  const [dadosServicos, servicos] = useMemo(() => {
    const [listaAvisos, listaServicos] = dados ?? [[], []]
    return [listaAvisos, listaServicos]
  }, [dados])

  const avisos = dadosServicos

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
        <p className="hero__sobre">Atendimento ao cidadão</p>
        <h1 id="titulo-principal">O que você precisa resolver hoje?</h1>
        <p className="hero__texto">
          Abra uma solicitação, acompanhe um protocolo ou consulte os avisos da cidade.
        </p>
        <div className="hero__acoes">
          <Link className="botao botao--primario" to="/nova-solicitacao">
            Abrir solicitação
          </Link>
          <Link className="botao botao--fantasma" to="/acompanhar">
            Acompanhar protocolo
          </Link>
        </div>
      </section>

      {erro ? (
        <ErrorState erro={erro} aoTentarNovamente={recarregar} />
      ) : (
        <>
          <section className="secao" aria-labelledby="titulo-avisos">
            <div className="secao__cabecalho">
              <h2 id="titulo-avisos">Avisos da cidade</h2>
              {!carregando && <span className="secao__contagem">{avisos.length} publicações</span>}
            </div>

            {carregando ? (
              <SkeletonCartoes quantidade={2} />
            ) : (
              <ul className="lista-avisos">
                {avisos.map((aviso) => {
                  const prioridade = infoPrioridade(aviso.prioridade)
                  return (
                    <li key={aviso.id} className="cartao aviso">
                      <div className="aviso__topo">
                        <Badge tom={prioridade.tom}>{prioridade.rotulo}</Badge>
                        <span className="texto-suave aviso__meta">
                          {aviso.categoria} · {formatarData(aviso.publicadoEm)}
                        </span>
                      </div>
                      <h3>{aviso.titulo}</h3>
                      <p>{aviso.resumo}</p>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          <section className="secao" aria-labelledby="titulo-servicos">
            <div className="secao__cabecalho">
              <h2 id="titulo-servicos">Serviços disponíveis</h2>
              {!carregando && <span className="secao__contagem">{servicosFiltrados.length} de {servicos.length}</span>}
            </div>

            <div className="campo-busca">
              <IconeBusca className="campo-busca__icone" />
              <label className="sr-only" htmlFor="busca-servico">
                Buscar serviço
              </label>
              <input
                id="busca-servico"
                type="search"
                placeholder="Buscar por serviço, categoria ou problema"
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
              />
            </div>

            {carregando ? (
              <SkeletonCartoes quantidade={4} />
            ) : servicosFiltrados.length === 0 ? (
              <p className="vazio">Nenhum serviço encontrado para “{busca}”.</p>
            ) : (
              <ul className="grade grade--servicos">
                {servicosFiltrados.map((servico) => (
                  <li key={servico.id}>
                    <Link className="cartao cartao--link servico" to={`/nova-solicitacao?tipo=${servico.id}`}>
                      <span className="servico__categoria">{servico.categoria}</span>
                      <h3>{servico.titulo}</h3>
                      <p>{servico.descricao}</p>
                      <span className="servico__rodape">
                        <span>Prazo estimado: {servico.prazoDias} dias</span>
                        <IconeSeta className="servico__seta" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="painel-cta" aria-labelledby="titulo-cta">
            <div>
              <h2 id="titulo-cta">Já abriu uma solicitação?</h2>
              <p>Acompanhe o andamento usando o número do protocolo.</p>
            </div>
            <Link className="botao botao--claro" to="/acompanhar">
              Consultar protocolo
            </Link>
          </section>
        </>
      )}
    </div>
  )
}
