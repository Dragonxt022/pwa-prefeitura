import { Check, ClipboardList, Clock3, Star } from 'lucide-react'

function Estatistica({ rotulo, valor, tom = 'azul', Icone, alerta = false }) {
  return (
    <div className={`gestao-stat tom-${tom}${alerta ? ' gestao-stat--alerta' : ''}`}>
      <span className="gestao-stat__icone" aria-hidden="true">
        <Icone />
      </span>
      <div className="gestao-stat__texto">
        <dt className="gestao-stat__rotulo">{rotulo}</dt>
        <dd className="gestao-stat__valor">{valor}</dd>
      </div>
    </div>
  )
}

export default function GestaoResumo({ estatisticas }) {
  return (
    <dl className="gestao-stats" aria-label="Resumo da fila">
      <Estatistica
        rotulo="Abertas"
        valor={estatisticas.abertas}
        tom="azul"
        Icone={ClipboardList}
      />
      <Estatistica
        rotulo="Atrasadas"
        valor={estatisticas.atrasadas}
        tom="coral"
        Icone={Clock3}
        alerta={estatisticas.atrasadas > 0}
      />
      <Estatistica
        rotulo="Concluídas"
        valor={estatisticas.concluidas}
        tom="verde"
        Icone={Check}
      />
      <Estatistica
        rotulo="Avaliação média"
        valor={estatisticas.mediaAvaliacao ? estatisticas.mediaAvaliacao.toFixed(1) : '—'}
        tom="ambar"
        Icone={Star}
      />
    </dl>
  )
}
