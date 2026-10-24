function Estatistica({ rotulo, valor, tom = 'azul', alerta = false }) {
  return (
    <div className={`gestao-stat tom-${tom}${alerta ? ' gestao-stat--alerta' : ''}`}>
      <span className="gestao-stat__rotulo">{rotulo}</span>
      <strong>{valor}</strong>
    </div>
  )
}

export default function GestaoResumo({ estatisticas }) {
  return (
    <div className="gestao-stats" aria-label="Resumo da fila">
      <Estatistica rotulo="Abertas" valor={estatisticas.abertas} tom="azul" />
      <Estatistica
        rotulo="Atrasadas"
        valor={estatisticas.atrasadas}
        tom="coral"
        alerta={estatisticas.atrasadas > 0}
      />
      <Estatistica rotulo="Concluídas" valor={estatisticas.concluidas} tom="verde" />
      <Estatistica
        rotulo="Avaliação média"
        valor={estatisticas.mediaAvaliacao ? estatisticas.mediaAvaliacao.toFixed(1) : '—'}
        tom="ambar"
      />
    </div>
  )
}
