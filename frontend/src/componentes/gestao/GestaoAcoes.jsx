import { CheckSquare, Printer, X } from 'lucide-react'

export default function GestaoAcoes({
  modoSelecao,
  totalVisivel,
  totalSelecionado,
  todosVisiveisSelecionados,
  aoAlternarTodos,
  aoEntrarSelecao,
  aoSairSelecao,
  aoImprimirSelecionados,
  aoImprimirFiltro,
}) {
  return (
    <div className="gestao-acoes" aria-label="Ações da fila">
      {modoSelecao ? (
        <>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={todosVisiveisSelecionados}
              onChange={aoAlternarTodos}
              disabled={totalVisivel === 0}
            />
            <span>Selecionar todos</span>
          </label>
          <button
            type="button"
            className="botao botao--primario botao--pequeno"
            onClick={aoImprimirSelecionados}
            disabled={totalSelecionado === 0}
          >
            <Printer aria-hidden="true" />
            Imprimir selecionados ({totalSelecionado})
          </button>
          <button
            type="button"
            className="botao botao--secundario botao--pequeno"
            onClick={aoSairSelecao}
          >
            <X aria-hidden="true" />
            Sair da seleção
          </button>
        </>
      ) : (
        <button
          type="button"
          className="botao botao--secundario botao--pequeno"
          onClick={aoEntrarSelecao}
          disabled={totalVisivel === 0}
        >
          <CheckSquare aria-hidden="true" />
          Selecionar para imprimir
        </button>
      )}

      <button
        type="button"
        className="botao botao--secundario botao--pequeno"
        onClick={aoImprimirFiltro}
        disabled={totalVisivel === 0}
      >
        <Printer aria-hidden="true" />
        Imprimir resultado ({totalVisivel})
      </button>
    </div>
  )
}
