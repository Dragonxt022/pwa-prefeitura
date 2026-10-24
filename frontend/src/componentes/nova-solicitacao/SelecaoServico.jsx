import { Clock3, Search } from 'lucide-react'
import { visualServico } from '../../utils/visual'

export default function SelecaoServico({
  servicos,
  servicosFiltrados,
  buscaServico,
  aoBuscarServico,
  tipoSelecionado,
  erroTipo,
  aoSelecionarServico,
}) {
  return (
    <fieldset
      className={`campo campo--servicos${erroTipo ? ' campo--erro' : ''}`}
      aria-describedby={erroTipo ? 'erro-tipo ajuda-servicos' : 'ajuda-servicos'}
    >
      <legend>Serviço</legend>
      <div className="campo-busca campo-busca--form">
        <Search className="campo-busca__icone" aria-hidden="true" />
        <label className="sr-only" htmlFor="busca-servico-form">
          Buscar serviço
        </label>
        <input
          id="busca-servico-form"
          type="search"
          placeholder="Busque pelo nome ou assunto"
          value={buscaServico}
          onChange={(evento) => aoBuscarServico(evento.target.value)}
          aria-controls="lista-servicos"
          aria-describedby="ajuda-servicos"
        />
      </div>
      <p className="campo__ajuda" id="ajuda-servicos">
        {servicos.length} serviços disponíveis. A busca não altera o serviço escolhido.
      </p>
      <div className="escolha-servicos" id="lista-servicos">
        {servicosFiltrados.map((servico) => {
          const { Icone, tom } = visualServico(servico.id)
          const selecionado = tipoSelecionado === servico.id
          return (
            <label
              key={servico.id}
              className={`escolha-servico tom-${tom}${selecionado ? ' is-selecionado' : ''}`}
            >
              <input
                type="radio"
                name="tipo"
                value={servico.id}
                checked={selecionado}
                onChange={() => aoSelecionarServico(servico.id)}
                className="sr-only"
              />
              <span className="escolha-servico__icone">
                <Icone aria-hidden="true" />
              </span>
              <span className="escolha-servico__rotulo">{servico.titulo}</span>
              <span className="escolha-servico__categoria">{servico.categoria}</span>
              <span className="escolha-servico__prazo">
                <Clock3 aria-hidden="true" />
                {servico.prazoDias} dias
              </span>
            </label>
          )
        })}
      </div>
      {servicosFiltrados.length === 0 && (
        <p className="campo__ajuda" role="status">
          Nenhum serviço encontrado. Tente outro termo.
        </p>
      )}
      {erroTipo && (
        <p className="campo__erro" id="erro-tipo">
          {erroTipo}
        </p>
      )}
    </fieldset>
  )
}
