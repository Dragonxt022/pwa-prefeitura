import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  Copy,
  KeyRound,
  LocateFixed,
  MapPin,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { IlustracaoSucesso } from '../Ilustracoes'
import { formatarDataHora } from '../../utils/format'
import { infoPrazo } from '../../utils/prazos'
import { visualServico } from '../../utils/visual'

export default function ConfirmacaoProtocolo({
  protocolo,
  copiado,
  codigoCopiado,
  aoCopiar,
  aoCopiarCodigo,
  aoNovaSolicitacao,
}) {
  const servico = visualServico(protocolo.tipo)
  const IconeServico = servico.Icone
  const prazo = infoPrazo(protocolo)

  return (
    <div className="pagina pagina--estreita">
      <div className="cartao cartao--confirmacao">
        <IlustracaoSucesso className="confirmacao__arte" />
        <span className="selo selo--sucesso">
          <Check aria-hidden="true" />
          Protocolo criado
        </span>
        <h1>Pronto!</h1>
        <p className="texto-suave">
          Guarde o número e o código de acesso. Os dois são necessários para acompanhar.
        </p>

        <div className="protocolo-caixa">
          <code>{protocolo.protocolo}</code>
          <button
            type="button"
            className="botao botao--secundario botao--icone"
            onClick={aoCopiar}
            aria-label={copiado ? 'Protocolo copiado' : 'Copiar protocolo'}
            title={copiado ? 'Protocolo copiado' : 'Copiar protocolo'}
          >
            {copiado ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
          </button>
        </div>
        <span className="protocolo-caixa__status" role="status">
          {copiado ? 'Copiado' : ''}
        </span>

        {protocolo.codigoAcesso && (
          <>
            <div className="protocolo-caixa protocolo-caixa--codigo">
              <span className="protocolo-caixa__texto">
                <span className="protocolo-caixa__rotulo">
                  <KeyRound aria-hidden="true" />
                  Código de acesso
                </span>
                <code>{protocolo.codigoAcesso}</code>
              </span>
              <button
                type="button"
                className="botao botao--secundario botao--icone"
                onClick={aoCopiarCodigo}
                aria-label={codigoCopiado ? 'Código copiado' : 'Copiar código de acesso'}
                title={codigoCopiado ? 'Código copiado' : 'Copiar código de acesso'}
              >
                {codigoCopiado ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              </button>
            </div>
            <span className="protocolo-caixa__status" role="status">
              {codigoCopiado ? 'Código copiado' : ''}
            </span>
            <p className="campo__ajuda">
              Guarde o código em local seguro. Ele não pode ser recuperado se os dados deste
              aparelho forem apagados.
            </p>
          </>
        )}

        <ul className="lista-dados">
          <li className="lista-dados__item">
            <span className={`lista-dados__icone tom-${servico.tom}`}>
              <IconeServico aria-hidden="true" />
            </span>
            <span className="lista-dados__texto">
              <span className="lista-dados__rotulo">Serviço</span>
              <strong className="lista-dados__valor">{protocolo.tipoTitulo}</strong>
            </span>
          </li>
          <li className="lista-dados__item">
            <span className="lista-dados__icone tom-azul">
              <MapPin aria-hidden="true" />
            </span>
            <span className="lista-dados__texto">
              <span className="lista-dados__rotulo">Endereço</span>
              <strong className="lista-dados__valor">{protocolo.endereco}</strong>
            </span>
          </li>
          <li className="lista-dados__item">
            <span className="lista-dados__icone tom-azul">
              <CalendarDays aria-hidden="true" />
            </span>
            <span className="lista-dados__texto">
              <span className="lista-dados__rotulo">Registrado em</span>
              <strong className="lista-dados__valor">{formatarDataHora(protocolo.criadoEm)}</strong>
            </span>
          </li>
          {prazo && (
            <li className="lista-dados__item">
              <span className="lista-dados__icone tom-verde">
                <Clock3 aria-hidden="true" />
              </span>
              <span className="lista-dados__texto">
                <span className="lista-dados__rotulo">Prazo estimado</span>
                <strong className="lista-dados__valor">
                  {prazo.data} · {prazo.rotulo}
                </strong>
              </span>
            </li>
          )}
          {protocolo.localizacao && (
            <li className="lista-dados__item">
              <span className="lista-dados__icone tom-azul">
                <LocateFixed aria-hidden="true" />
              </span>
              <span className="lista-dados__texto">
                <span className="lista-dados__rotulo">Localização</span>
                <strong className="lista-dados__valor">Anexada ao pedido</strong>
              </span>
            </li>
          )}
        </ul>

        <div className="acoes acoes--centro">
          <Link className="botao botao--primario" to={`/acompanhar?protocolo=${protocolo.protocolo}`}>
            Acompanhar
            <ArrowRight aria-hidden="true" />
          </Link>
          <button type="button" className="botao botao--secundario" onClick={aoNovaSolicitacao}>
            Nova solicitação
          </button>
        </div>
      </div>
    </div>
  )
}
