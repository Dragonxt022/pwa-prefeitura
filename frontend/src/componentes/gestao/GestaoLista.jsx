import { BarChart3, Building2, ChevronRight, MapPin, Send, Star } from 'lucide-react'
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
  return (
    <section className="gestao-lista" aria-labelledby="titulo-fila">
      <div className="secao__cabecalho">
        <h2 id="titulo-fila">Fila de atendimento</h2>
        <span className="secao__contagem">{dados.total}</span>
      </div>

      {carregando && dados.dados.length === 0 ? (
        <p className="carregando" role="status">
          <span className="spinner" aria-hidden="true" />
          Carregando solicitações…
        </p>
      ) : dados.dados.length === 0 ? (
        <div className="cartao estado-vazio estado-vazio--compacto">
          <BarChart3 aria-hidden="true" />
          <h2>Nenhuma solicitação encontrada</h2>
          <p>Ajuste os filtros ou aguarde novas entradas.</p>
        </div>
      ) : (
        <ul className="gestao-itens">
          {dados.dados.map((item) => {
            const prazo = infoPrazo(item)
            const servico = servicosPorId[item.tipo]
            return (
              <li key={item.protocolo}>
                <article
                  className={`gestao-item${item.slaVencido ? ' is-atrasado' : ''}${
                    selecionada?.protocolo === item.protocolo ? ' is-selecionado' : ''
                  }`}
                >
                  <label className="gestao-item__selecao">
                    <input
                      type="checkbox"
                      checked={selecionados.includes(item.protocolo)}
                      onChange={() => aoAlternarSelecionado(item.protocolo)}
                      aria-label={`Selecionar ${item.protocolo} para impressão`}
                    />
                  </label>
                  <div className="gestao-item__principal">
                    <div className="gestao-item__linha">
                      <code>{item.protocolo}</code>
                      <StatusBadge status={item.status} />
                      {item.transferida && (
                        <Badge tom="info">
                          <Send aria-hidden="true" />
                          Transferida
                        </Badge>
                      )}
                      {item.prioridade === 'alta' && <Badge tom="erro">Prioridade alta</Badge>}
                    </div>
                    <h3>{servico?.titulo ?? item.tipoTitulo ?? 'Serviço'}</h3>
                    <p>
                      <MapPin aria-hidden="true" />
                      {item.endereco}
                    </p>
                    <span className="gestao-item__meta">
                      <span className="gestao-item__setor">
                        <Building2 aria-hidden="true" />
                        {item.setorNome}
                      </span>
                      {' · '}
                      Aberto em {formatarDataHora(item.criadoEm)}
                      {prazo && (
                        <span className={prazo.vencido ? 'texto-atrasado' : undefined}>
                          {' '}
                          · {prazo.rotulo}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="gestao-item__lado">
                    {item.avaliacao?.nota && (
                      <span className="gestao-item__nota">
                        <Star aria-hidden="true" fill="currentColor" />
                        {item.avaliacao.nota}
                      </span>
                    )}
                    <button
                      type="button"
                      className="botao botao--secundario botao--pequeno"
                      onClick={() => aoAbrirDetalhe(item)}
                    >
                      Abrir
                      <ChevronRight aria-hidden="true" />
                    </button>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
