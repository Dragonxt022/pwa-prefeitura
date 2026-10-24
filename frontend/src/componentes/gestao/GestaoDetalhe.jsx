import { Check, Clock3, LoaderCircle, Send, Star, X } from 'lucide-react'
import { Badge, StatusBadge } from '../StatusBadge'
import { formatarDataHora, infoStatus } from '../../utils/format'
import { PRIORIDADES, STATUS_OPCOES, urlDoMapa } from '../../utils/gestao'
import { infoPrazo } from '../../utils/prazos'

function Estrelas({ nota }) {
  return (
    <span className="avaliacao__resumo" aria-label={`Nota ${nota} de 5`}>
      {[1, 2, 3, 4, 5].map((valor) => (
        <Star
          key={valor}
          aria-hidden="true"
          fill={valor <= nota ? 'currentColor' : 'none'}
          className={valor <= nota ? 'is-preenchida' : undefined}
        />
      ))}
    </span>
  )
}

export default function GestaoDetalhe({
  selecionada,
  detalheRef,
  formStatus,
  salvandoStatus,
  aoFechar,
  aoAbrirTransferencia,
  aoSalvarAtualizacao,
  aoAtualizarFormStatus,
}) {
  return (
    <aside className="gestao-detalhe" aria-labelledby="titulo-detalhe">
      <div className="gestao-detalhe__topo">
        <div>
          <p className="cabecalho-pagina__sobre">Solicitação</p>
          <h2 id="titulo-detalhe" ref={detalheRef} tabIndex={-1}>
            {selecionada.protocolo}
          </h2>
        </div>
        <button
          type="button"
          className="botao botao--secundario botao--icone"
          onClick={aoFechar}
          aria-label="Fechar detalhe"
          title="Fechar detalhe"
        >
          <X aria-hidden="true" />
        </button>
      </div>

      <div className="gestao-detalhe__status">
        <StatusBadge status={selecionada.status} />
        {selecionada.transferida && (
          <Badge tom="info">
            <Send aria-hidden="true" />
            Transferida
          </Badge>
        )}
        {selecionada.slaVencido && (
          <Badge tom="erro">
            <Clock3 aria-hidden="true" />
            Fora do prazo
          </Badge>
        )}
        {selecionada.avaliacao?.nota && <Estrelas nota={selecionada.avaliacao.nota} />}
      </div>

      <dl className="gestao-detalhe__dados">
        <div>
          <dt>Serviço</dt>
          <dd>{selecionada.tipoTitulo}</dd>
        </div>
        <div>
          <dt>Setor responsável</dt>
          <dd>{selecionada.setorNome}</dd>
        </div>
        <div>
          <dt>Endereço</dt>
          <dd>{selecionada.endereco}</dd>
        </div>
        <div>
          <dt>Aberto em</dt>
          <dd>{formatarDataHora(selecionada.criadoEm)}</dd>
        </div>
        <div>
          <dt>Prazo</dt>
          <dd>{infoPrazo(selecionada)?.data ?? '—'}</dd>
        </div>
        {selecionada.contato && (
          <div>
            <dt>Contato informado</dt>
            <dd>{selecionada.contato}</dd>
          </div>
        )}
        {selecionada.localizacao && (
          <div>
            <dt>Localização</dt>
            <dd>
              <a href={urlDoMapa(selecionada.localizacao)} target="_blank" rel="noreferrer">
                Abrir no mapa (online)
              </a>
            </dd>
          </div>
        )}
      </dl>

      {selecionada.triagem && (
        <div className="gestao-triagem">
          <div>
            <strong>Sugestão de triagem</strong>
            <span>
              {selecionada.triagem.setorNome ?? selecionada.triagem.setorId} ·{' '}
              {Math.round((selecionada.triagem.confianca ?? 0) * 100)}% de confiança
            </span>
          </div>
          <Badge tom={selecionada.triagem.automatica ? 'info' : 'neutro'}>
            {selecionada.triagem.automatica ? 'Aplicada automaticamente' : 'Sugestão manual'}
          </Badge>
          {selecionada.triagem.justificativa && <p>{selecionada.triagem.justificativa}</p>}
        </div>
      )}

      <section className="gestao-detalhe__descricao" aria-labelledby="titulo-descricao">
        <h3 id="titulo-descricao">Descrição</h3>
        <p>{selecionada.descricao}</p>
      </section>

      {selecionada.foto && (
        <figure className="gestao-detalhe__foto">
          <img src={selecionada.foto} alt="Foto enviada pelo cidadão" />
          <figcaption>Foto anexada pelo cidadão.</figcaption>
        </figure>
      )}

      <div className="gestao-detalhe__acoes">
        <button
          type="button"
          className="botao botao--secundario botao--pequeno"
          onClick={() => aoAbrirTransferencia(selecionada)}
        >
          <Send aria-hidden="true" />
          Transferir / reclassificar
        </button>
      </div>

      <section className="gestao-detalhe__historico" aria-labelledby="titulo-historico-gestao">
        <h3 id="titulo-historico-gestao">Histórico</h3>
        <ol className="linha-tempo">
          {selecionada.historico.map((evento, indice) => (
            <li
              key={`${evento.status}-${evento.em}-${indice}`}
              className={indice === selecionada.historico.length - 1 ? 'is-atual' : undefined}
            >
              <span className="linha-tempo__ponto">
                {evento.tipo === 'transferencia' ? (
                  <Send aria-hidden="true" />
                ) : (
                  <Clock3 aria-hidden="true" />
                )}
              </span>
              <div className="linha-tempo__conteudo">
                <strong>
                  {evento.tipo === 'transferencia'
                    ? 'Transferência'
                    : infoStatus(evento.status).rotulo}
                </strong>
                <time dateTime={evento.em}>{formatarDataHora(evento.em)}</time>
                {evento.observacao && <p>{evento.observacao}</p>}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <form className="gestao-status" onSubmit={aoSalvarAtualizacao}>
        <h3>Atualizar atendimento</h3>
        <div className="gestao-status__linha">
          <div className="campo">
            <label htmlFor="status-gestao">Status</label>
            <select
              id="status-gestao"
              value={formStatus.status}
              onChange={(evento) => aoAtualizarFormStatus('status', evento.target.value)}
            >
              {STATUS_OPCOES.map((status) => (
                <option key={status} value={status}>
                  {infoStatus(status).rotulo}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="prioridade-gestao">Prioridade</label>
            <select
              id="prioridade-gestao"
              value={formStatus.prioridade}
              onChange={(evento) => aoAtualizarFormStatus('prioridade', evento.target.value)}
            >
              {PRIORIDADES.map((prioridade) => (
                <option key={prioridade.valor} value={prioridade.valor}>
                  {prioridade.rotulo}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="campo">
          <label htmlFor="observacao-gestao">
            Observação para o histórico <span className="campo__opcional">(opcional)</span>
          </label>
          <textarea
            id="observacao-gestao"
            rows={3}
            maxLength={500}
            value={formStatus.observacao}
            onChange={(evento) => aoAtualizarFormStatus('observacao', evento.target.value)}
            placeholder="Ex.: equipe designada para vistoria na quinta-feira."
          />
        </div>
        <button type="submit" className="botao botao--primario" disabled={salvandoStatus}>
          {salvandoStatus ? (
            <LoaderCircle className="girando" aria-hidden="true" />
          ) : (
            <Check aria-hidden="true" />
          )}
          {salvandoStatus ? 'Salvando…' : 'Salvar atualização'}
        </button>
      </form>
    </aside>
  )
}
