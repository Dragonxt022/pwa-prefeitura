import { ArrowLeft, ArrowUpRight, Clock3, Search, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ErrorState from '../components/ErrorState'
import { SkeletonCartoes } from '../components/Loading'
import { Badge } from '../components/StatusBadge'
import { useRecurso } from '../hooks/useRecurso'
import { listarServicos } from '../lib/api'
import { visualServico } from '../lib/visual'

const normalizar = (valor) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

export default function Servicos() {
  const { dados: servicos, carregando, erro, recarregar } = useRecurso(listarServicos, [])
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState('Todos')

  const categorias = useMemo(() => {
    const valores = (servicos ?? []).map((servico) => servico.categoria).filter(Boolean)
    return ['Todos', ...Array.from(new Set(valores))]
  }, [servicos])

  const filtrados = useMemo(() => {
    const termo = normalizar(busca).trim()
    return (servicos ?? []).filter((servico) => {
      const combinaCategoria = categoria === 'Todos' || servico.categoria === categoria
      const combinaBusca =
        !termo ||
        normalizar(`${servico.titulo} ${servico.descricao} ${servico.categoria}`).includes(termo)
      return combinaCategoria && combinaBusca
    })
  }, [busca, categoria, servicos])

  return (
    <div className="pagina">
      <header className="cabecalho-pagina">
        <Link className="voltar-link" to="/">
          <ArrowLeft aria-hidden="true" />
          Início
        </Link>
        <p className="cabecalho-pagina__sobre">Catálogo</p>
        <h1>Todos os serviços</h1>
        <p className="texto-suave">
          Encontre o atendimento certo por nome ou categoria. Novos serviços entram neste catálogo.
        </p>
      </header>

      {erro ? (
        <ErrorState erro={erro} aoTentarNovamente={recarregar} />
      ) : (
        <>
          <section className="cartao catalogo__filtros" aria-label="Filtrar serviços">
            <div className="campo-busca">
              <Search className="campo-busca__icone" aria-hidden="true" />
              <label className="sr-only" htmlFor="busca-catalogo">
                Buscar no catálogo
              </label>
              <input
                id="busca-catalogo"
                type="search"
                placeholder="Buscar serviço ou categoria"
                value={busca}
                onChange={(evento) => setBusca(evento.target.value)}
              />
            </div>

            <div className="filtros" role="group" aria-label="Categorias de serviço">
              {categorias.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`filtro${categoria === item ? ' is-ativo' : ''}`}
                  aria-pressed={categoria === item}
                  onClick={() => setCategoria(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <p className="catalogo__resumo" role="status" aria-live="polite">
              {carregando
                ? 'Carregando serviços…'
                : `${filtrados.length} ${filtrados.length === 1 ? 'serviço encontrado' : 'serviços encontrados'}`}
            </p>
          </section>

          {carregando ? (
            <SkeletonCartoes quantidade={6} />
          ) : filtrados.length === 0 ? (
            <div className="cartao estado-vazio estado-vazio--compacto">
              <span className="estado-vazio__icone" aria-hidden="true">
                <Search />
              </span>
              <h2>Nenhum serviço encontrado</h2>
              <p>Tente outro termo ou selecione a categoria “Todos”.</p>
              <button
                type="button"
                className="botao botao--secundario botao--pequeno"
                onClick={() => {
                  setBusca('')
                  setCategoria('Todos')
                }}
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <ul className="catalogo__lista">
              {filtrados.map((servico) => {
                const { rotulo, Icone, tom } = visualServico(servico.id)
                return (
                  <li key={servico.id}>
                    <article className={`catalogo-item tom-${tom}`}>
                      <span className="catalogo-item__icone">
                        <Icone aria-hidden="true" />
                      </span>
                      <div className="catalogo-item__corpo">
                        <div className="catalogo-item__topo">
                          <h2>{servico.titulo}</h2>
                          {servico.novo && <Badge tom="sucesso">Novo</Badge>}
                        </div>
                        <p>{servico.descricao}</p>
                        <div className="catalogo-item__meta">
                          <span>{servico.categoria}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            <Clock3 aria-hidden="true" />
                            Prazo estimado: {servico.prazoDias} dias
                          </span>
                        </div>
                      </div>
                      <Link
                        className="botao botao--secundario botao--pequeno catalogo-item__acao"
                        to={`/nova-solicitacao?tipo=${servico.id}`}
                        aria-label={`${rotulo} — abrir solicitação`}
                      >
                        Solicitar
                        <ArrowUpRight aria-hidden="true" />
                      </Link>
                    </article>
                  </li>
                )
              })}
            </ul>
          )}

          <p className="catalogo__nota">
            <Sparkles aria-hidden="true" />
            A prefeitura pode incluir novos serviços sem mudar a forma de solicitar.
          </p>
        </>
      )}
    </div>
  )
}
