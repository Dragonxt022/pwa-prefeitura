import { LoaderCircle, Send, TriangleAlert, X } from 'lucide-react'

export default function GestaoTransferencia({
  solicitacao,
  formTransferencia,
  setoresParaTransferencia,
  servicos,
  salvandoTransferencia,
  erro,
  aoFechar,
  aoAlterarTipo,
  aoAtualizarCampo,
  aoSalvar,
}) {
  return (
    <div className="modal-fundo" role="presentation">
      <section
        className="modal cartao"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-transferencia"
      >
        <div className="modal__topo">
          <div>
            <p className="cabecalho-pagina__sobre">Encaminhamento</p>
            <h2 id="titulo-transferencia">Transferir solicitação</h2>
            <p className="texto-suave">{solicitacao.protocolo}</p>
          </div>
          <button
            type="button"
            className="botao botao--secundario botao--icone"
            onClick={aoFechar}
            aria-label="Fechar transferência"
            title="Fechar transferência"
          >
            <X aria-hidden="true" />
          </button>
        </div>

        <form className="modal__form" onSubmit={aoSalvar}>
          <div className="campo">
            <label htmlFor="transferencia-setor">Setor de destino</label>
            <select
              id="transferencia-setor"
              value={formTransferencia.setorDestinoId}
              onChange={(evento) => aoAtualizarCampo('setorDestinoId', evento.target.value)}
              required
              autoFocus
            >
              <option value="">Escolha o setor</option>
              {setoresParaTransferencia.map((setor) => (
                <option key={setor.id} value={setor.id}>
                  {setor.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="transferencia-tipo">
              Serviço / categoria <span className="campo__opcional">(reclassificar se necessário)</span>
            </label>
            <select
              id="transferencia-tipo"
              value={formTransferencia.tipoDestino}
              onChange={(evento) => aoAlterarTipo(evento.target.value)}
            >
              {servicos.map((servico) => (
                <option key={servico.id} value={servico.id}>
                  {servico.titulo}
                </option>
              ))}
            </select>
            <p className="campo__ajuda">
              O prazo original é preservado. Marque a opção abaixo somente se a reclassificação
              exigir um novo prazo legal.
            </p>
          </div>

          <div className="campo">
            <label htmlFor="transferencia-motivo">Motivo da transferência</label>
            <textarea
              id="transferencia-motivo"
              rows={3}
              maxLength={500}
              value={formTransferencia.motivo}
              onChange={(evento) => aoAtualizarCampo('motivo', evento.target.value)}
              placeholder="Explique por que o pedido está sendo encaminhado."
              required
            />
          </div>

          <label className="checkbox checkbox--linha">
            <input
              type="checkbox"
              checked={formTransferencia.recalcularSla}
              onChange={(evento) => aoAtualizarCampo('recalcularSla', evento.target.checked)}
            />
            <span>Recalcular o SLA pelo novo serviço (ação excepcional)</span>
          </label>

          {erro && (
            <p className="alerta alerta--erro" role="alert">
              <TriangleAlert aria-hidden="true" />
              <span>{erro.message}</span>
            </p>
          )}

          <div className="modal__acoes">
            <button type="button" className="botao botao--secundario" onClick={aoFechar}>
              Cancelar
            </button>
            <button type="submit" className="botao botao--primario" disabled={salvandoTransferencia}>
              {salvandoTransferencia ? (
                <LoaderCircle className="girando" aria-hidden="true" />
              ) : (
                <Send aria-hidden="true" />
              )}
              {salvandoTransferencia ? 'Transferindo…' : 'Confirmar transferência'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
