import { ClipboardList, LayoutDashboard, Megaphone, UsersRound } from 'lucide-react'

const ABAS_BASE = [
  { id: 'dashboard', rotulo: 'Dashboard', Icone: LayoutDashboard },
  { id: 'solicitacoes', rotulo: 'Solicitações', Icone: ClipboardList },
  { id: 'avisos', rotulo: 'Avisos', Icone: Megaphone, somenteAdmin: true },
  { id: 'usuarios', rotulo: 'Usuários', Icone: UsersRound, somenteAdmin: true },
]

function abasDisponiveis(podeGerenciarUsuarios) {
  return ABAS_BASE.filter((aba) => !aba.somenteAdmin || podeGerenciarUsuarios)
}

export default function GestaoAbas({ ativa, podeGerenciarUsuarios, aoSelecionar }) {
  const abas = abasDisponiveis(podeGerenciarUsuarios)

  function navegarPorTeclado(evento, indice) {
    const teclas = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (!teclas.includes(evento.key)) return
    evento.preventDefault()
    let destino = indice
    if (evento.key === 'ArrowLeft') destino = (indice - 1 + abas.length) % abas.length
    if (evento.key === 'ArrowRight') destino = (indice + 1) % abas.length
    if (evento.key === 'Home') destino = 0
    if (evento.key === 'End') destino = abas.length - 1
    const proxima = abas[destino]
    aoSelecionar(proxima.id)
    document.getElementById(`aba-${proxima.id}`)?.focus()
  }

  return (
    <nav className="gestao-abas" aria-label="Seções do painel de gestão">
      <div className="gestao-abas__interno" role="tablist" aria-orientation="horizontal">
        {abas.map(({ id, rotulo, Icone }, indice) => {
          const selecionada = ativa === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`aba-${id}`}
              aria-selected={selecionada}
              aria-controls={`painel-${id}`}
              tabIndex={selecionada ? 0 : -1}
              className={`gestao-aba${selecionada ? ' is-ativa' : ''}`}
              onClick={() => aoSelecionar(id)}
              onKeyDown={(evento) => navegarPorTeclado(evento, indice)}
            >
              <span className="gestao-aba__icone">
                <Icone aria-hidden="true" />
              </span>
              <span>{rotulo}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
