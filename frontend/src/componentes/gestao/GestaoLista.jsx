import {
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  MapPin,
  Star,
} from 'lucide-react'
import { useState } from 'react'
import { Badge, StatusBadge } from '../StatusBadge'
import { formatarDataHora, infoStatus } from '../../utils/format'
import { STATUS_OPCOES } from '../../utils/gestao'
import { infoPrazo } from '../../utils/prazos'

const TOM_STATUS = {
  info: 'azul',
  atencao: 'ambar',
  execucao: 'roxo',
  sucesso: 'verde',
  erro: 'coral',
}

export default function GestaoLista({
  dados,
  carregando,
  selecionada,
  selecionados,
  servicosPorId,
  modoSelecao,
  alterandoStatus,
  aoAbrirDetalhe,
  aoAlternarSelecionado,
  aoAlterarStatus,
}) {
  const [expandido, setExpandido] = useState(null)

  function alternar(protocolo) {
    setExpandido((atual) => (atual === protocolo ? null : protocolo))
  }

  return (
    <section className="gestao-lista" aria-labelledby="titulo-fila">
      <div className="gestao-lista__cabecalho">
        <div>
          <p className="gestao-eyebrow">Operação</p>
          <h2 id="titulo-fila">Fila de atendimento</h2>
          <p className="texto-suave">
            {modoSelecao
              ? 'Toque nos cards para selecionar os protocolos que deseja imprimir.'
              : 'Toque em um card para ver os detalhes da solicitação.'}
          </p>
        </div>
        <span className="secao__contagem" aria-label={`${dados.total} solicitações`}>
          {dados.total}
        </span>
      </div>

      {carregando && dados.dados.length === 0 ? (
        <p className="carregando" role="status">
          <span className="spinner" aria-hidden="true" />
          Carregando solicitações…
        </p>
      ) : dados.dados.length === 0 ? (
        <div className="cartao estado-vazio estado-vazio--compacto">
          <h2>Nenhuma solicitação encontrada</h2>
          <p>Ajuste os filtros ou aguarde novas entradas.</p>
        </div>
      ) : (
        <ul className="gestao-itens">
          {dados.dados.map((item) => {
            const prazo = infoPrazo(item)
            const servico = servicosPorId[item.tipo]
            const aberto = expandido === item.protocolo
            const selecionado = selecionados.includes(item.protocolo)
            const emAtraso = item.slaVencido && !prazo?.encerrado
            const idDetalhes = `detalhes-${item.protocolo}`
            const atualizando = alterandoStatus === item.protocolo
            const atributosResumo = modoSelecao
              ? {
                  'aria-pressed': selecionado,
                  'aria-label': `${selecionado ? 'Desmarcar' : 'Selecionar'} ${item.protocolo} para impressão`,
                }
              : {
                  'aria-expanded': aberto,
                  'aria-controls': idDetalhes,
                }

            return (
              <li key={item.protocolo}>
                <article
                  className={`gestao-item solicitacao-card${
                    item.slaVencido ? ' is-atrasado' : ''
                  }${selecionada?.protocolo === item.protocolo ? ' is-selecionado' : ''}${
                    aberto && !modoSelecao ? ' is-aberto' : ''
                  }${modoSelecao ? ' is-modo-selecao' : ''}${
                    modoSelecao && selecionado ? ' is-marcado' : ''
                  }`}
                >
                  <button
                    type="button"
                    className="solicitacao-card__resumo"
                    onClick={() =>
                      modoSelecao ? aoAlternarSelecionado(item.protocolo) : alternar(item.protocolo)
                    }
                    {...atributosResumo}
                  >
                    <span className="solicitacao-card__identificacao">
                      <code>{item.protocolo}</code>
                      {emAtraso ? (
                        <Badge tom="atencao">Atrasada</Badge>
                      ) : (
                        <StatusBadge status={item.status} />
                      )}
                    </span>
                    <span className="solicitacao-card__servico">
                      {servico?.titulo ?? item.tipoTitulo ?? 'Serviço'}
                    </span>
                    {modoSelecao ? (
                      <span
                        className={`solicitacao-card__marcador solicitacao-card__marcador--lado${
                          selecionado ? ' is-marcado' : ''
                        }`}
                        aria-hidden="true"
                      >
                        {selecionado && <Check />}
                      </span>
                    ) : (
                      <span className="solicitacao-card__chevron" aria-hidden="true">
                        <ChevronDown />
                      </span>
                    )}
                  </button>

                  {aberto && !modoSelecao && (
                    <div className="solicitacao-card__detalhes" id={idDetalhes}>
                      <dl className="solicitacao-card__dados">
                        <div>
                          <dt>Situação do atendimento</dt>
                          <dd>
                            <StatusBadge status={item.status} />
                            {emAtraso && <span className="texto-atrasado"> · Fora do prazo</span>}
                          </dd>
                        </div>
                        <div>
                          <dt>
                            <MapPin aria-hidden="true" />
                            Endereço
                          </dt>
                          <dd>{item.endereco}</dd>
                        </div>
                        <div>
                          <dt>
                            <Building2 aria-hidden="true" />
                            Setor responsável
                          </dt>
                          <dd>{item.setorNome}</dd>
                        </div>
                        <div>
                          <dt>
                            <CalendarDays aria-hidden="true" />
                            Data de abertura
                          </dt>
                          <dd>{formatarDataHora(item.criadoEm)}</dd>
                        </div>
                        <div>
                          <dt>
                            <Clock3 aria-hidden="true" />
                            Prazo
                          </dt>
                          <dd>
                            {prazo?.data ?? '—'}
                            {prazo && (
                              <span className={prazo.vencido ? 'texto-atrasado' : 'texto-suave'}>
                                {' '}
                                · {prazo.rotulo}
                              </span>
                            )}
                          </dd>
                        </div>
                      </dl>

                      <div className="solicitacao-card__selos">
                        {item.transferida && <Badge tom="info">Transferida</Badge>}
                        {item.prioridade === 'alta' && (
                          <Badge tom="erro">Prioridade alta</Badge>
                        )}
                        {item.avaliacao?.nota && (
                          <span className="solicitacao-card__nota">
                            <Star aria-hidden="true" fill="currentColor" />
                            {item.avaliacao.nota} de 5
                          </span>
                        )}
                      </div>

                      <div className="solicitacao-card__status-rapido">
                        <span className="solicitacao-card__status-titulo">Alterar status</span>
                        <div
                          className="solicitacao-card__status-opcoes"
                          role="group"
                          aria-label={`Alterar status de ${item.protocolo}`}
                          aria-busy={atualizando}
                        >
                          {STATUS_OPCOES.map((status) => {
                            const info = infoStatus(status)
                            const ativo = item.status === status
                            return (
                              <button
                                key={status}
                                type="button"
                                className={`status-chip tom-${TOM_STATUS[info.tom] ?? 'azul'}${
                                  ativo ? ' is-ativo' : ''
                                }`}
                                aria-pressed={ativo}
                                disabled={Boolean(alterandoStatus) || ativo}
                                onClick={() => aoAlterarStatus(item, status)}
                              >
                                {info.rotulo}
                              </button>
                            )
                          })}
                        </div>
                        {atualizando && (
                          <p className="campo__ajuda" role="status">
                            Atualizando status…
                          </p>
                        )}
                      </div>

                      <div className="solicitacao-card__acoes">
                        <button
                          type="button"
                          className="botao botao--primario botao--pequeno"
                          onClick={() => aoAbrirDetalhe(item)}
                        >
                          Abrir atendimento
                          <ArrowRight aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  )}
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
