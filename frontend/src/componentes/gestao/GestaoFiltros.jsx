import { Search } from 'lucide-react'
import { infoStatus } from '../../utils/format'
import { STATUS_OPCOES } from '../../utils/gestao'

export default function GestaoFiltros({
  filtros,
  servicos,
  setores,
  podeVerTodos,
  aoAtualizarFiltro,
  aoLimpar,
}) {
  return (
    <section className="gestao-filtros" aria-label="Filtrar solicitações">
      <div className="campo-busca">
        <Search className="campo-busca__icone" aria-hidden="true" />
        <label className="sr-only" htmlFor="busca-gestao">
          Buscar protocolo, endereço ou descrição
        </label>
        <input
          id="busca-gestao"
          type="search"
          placeholder="Buscar protocolo, setor ou endereço"
          value={filtros.busca}
          onChange={(evento) => aoAtualizarFiltro('busca', evento.target.value)}
        />
      </div>
      <label className="sr-only" htmlFor="filtro-status">
        Filtrar por status
      </label>
      <select
        id="filtro-status"
        value={filtros.status}
        onChange={(evento) => aoAtualizarFiltro('status', evento.target.value)}
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
        onChange={(evento) => aoAtualizarFiltro('tipo', evento.target.value)}
      >
        <option value="">Todos os serviços</option>
        {servicos.map((servico) => (
          <option key={servico.id} value={servico.id}>
            {servico.titulo}
          </option>
        ))}
      </select>
      {podeVerTodos && (
        <>
          <label className="sr-only" htmlFor="filtro-setor">
            Filtrar por setor
          </label>
          <select
            id="filtro-setor"
            value={filtros.setor}
            onChange={(evento) => aoAtualizarFiltro('setor', evento.target.value)}
          >
            <option value="">Todos os setores</option>
            {setores.map((setor) => (
              <option key={setor.id} value={setor.id}>
                {setor.nome}
              </option>
            ))}
          </select>
        </>
      )}
      <button type="button" className="botao botao--secundario botao--pequeno" onClick={aoLimpar}>
        Limpar
      </button>
    </section>
  )
}
