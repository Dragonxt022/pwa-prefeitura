import { Printer } from 'lucide-react'

export default function GestaoAcoes({
  totalVisivel,
  totalSelecionado,
  todosVisiveisSelecionados,
  aoAlternarTodos,
  aoImprimirSelecionados,
  aoImprimirFiltro,
}) {
  return (
    <div className="gestao-acoes" aria-label="Impressão">
      <label className="checkbox">
        <input
          type="checkbox"
          checked={todosVisiveisSelecionados}
          onChange={aoAlternarTodos}
          disabled={totalVisivel === 0}
        />
        <span>Selecionar todos da lista</span>
      </label>
      <button
        type="button"
        className="botao botao--secundario botao--pequeno"
        onClick={aoImprimirSelecionados}
        disabled={totalSelecionado === 0}
      >
        <Printer aria-hidden="true" />
        Imprimir selecionados ({totalSelecionado})
      </button>
      <button
        type="button"
        className="botao botao--secundario botao--pequeno"
        onClick={aoImprimirFiltro}
        disabled={totalVisivel === 0}
      >
        <Printer aria-hidden="true" />
        Imprimir filtro ({totalVisivel})
      </button>
    </div>
  )
}
