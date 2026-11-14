import { ArrowRight } from 'lucide-react'
import GestaoResumo from './GestaoResumo'

export default function GestaoDashboard({ estatisticas, carregando, aoVerSolicitacoes }) {
  return (
    <div className="gestao-painel__conteudo gestao-dashboard">
      <header className="gestao-secao">
        <p className="gestao-eyebrow">Visão geral</p>
        <h1>Dashboard</h1>
        <p className="texto-suave">
          Indicadores atualizados da fila de atendimento. Use as abas inferiores para navegar entre
          as áreas do painel.
        </p>
        {carregando && (
          <p className="gestao-secao__status" role="status">
            <span className="spinner" aria-hidden="true" />
            Atualizando indicadores…
          </p>
        )}
      </header>

      <GestaoResumo estatisticas={estatisticas} />

      <section className="gestao-atalho" aria-labelledby="titulo-atalho-fila">
        <div className="gestao-atalho__texto">
          <p className="gestao-eyebrow">Fila de atendimento</p>
          <h2 id="titulo-atalho-fila">Acompanhe e atualize as solicitações</h2>
          <p className="texto-suave">
            Filtre por status, serviço ou setor, expanda um card para ver os detalhes e registre a
            atualização do atendimento.
          </p>
        </div>
        <button type="button" className="botao botao--primario" onClick={aoVerSolicitacoes}>
          Ver solicitações
          <ArrowRight aria-hidden="true" />
        </button>
      </section>
    </div>
  )
}
