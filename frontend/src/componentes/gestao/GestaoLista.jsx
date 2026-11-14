import {
  ArrowRight,
  Building2,
  CalendarDays,
  ChevronDown,
  Clock3,
  MapPin,
  Star,
} from 'lucide-react'
import { useState } from 'react'
import { Badge, StatusBadge } from '../StatusBadge'
import { formatarDataHora } from '../../utils/format'
import { infoPrazo } from '../../utils/prazos'

export default function GestaoLista({
  dados,
  carregando,
  selecionada,
  selecionados,
  servicosPorId,
  aoAbrirDetalhe,
  aoAlternarSelecionado,
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
          <p className="texto-suave">Toque em um card para ver os detalhes da solicitação.</p>
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

            return (
              <li key={item.protocolo}>
                <article
                  className={`gestao-item solicitacao-card${item.slaVencido ? ' is-atrasado' : ''}${
                    selecionada?.protocolo === item.protocolo ? ' is-selecionado' : ''
                  }${aberto ? ' is-aberto' : ''}`}
                >
                  <button
                    type="button"
                    className="solicitacao-card__resumo"
                    aria-expanded={aberto}
                    aria-controls={idDetalhes}
                    onClick={() => alternar(item.protocolo)}
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
                    <span className="solicitacao-card__chevron" aria-hidden="true">
                      <ChevronDown />
                    </span>
                  </button>

                  {aberto && (
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

                      <div className="solicitacao-card__acoes">
                        <label className="checkbox">
                          <input
                            type="checkbox"
                            checked={selecionado}
                            onChange={() => aoAlternarSelecionado(item.protocolo)}
                          />
                          <span>Selecionar para impressão</span>
                        </label>
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
