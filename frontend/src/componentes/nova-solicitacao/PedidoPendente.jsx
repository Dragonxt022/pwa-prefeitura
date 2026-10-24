import { ArrowRight, Info, MapPin, WifiOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { visualServico } from '../../utils/visual'

export default function PedidoPendente({ pendente, servicoSelecionado, aoNovaSolicitacao }) {
  const servico = visualServico(pendente.tipo)
  const IconeServico = servico.Icone

  return (
    <div className="pagina pagina--estreita">
      <div className="cartao cartao--confirmacao cartao--pendente">
        <span className="selo selo--pendente">
          <WifiOff aria-hidden="true" />
          Guardado no aparelho
        </span>
        <h1>Pedido salvo</h1>
        <p className="texto-suave">
          Sem conexão agora. Vamos enviar automaticamente quando a internet voltar.
        </p>

        <ul className="lista-dados">
          <li className="lista-dados__item">
            <span className={`lista-dados__icone tom-${servico.tom}`}>
              <IconeServico aria-hidden="true" />
            </span>
            <span className="lista-dados__texto">
              <span className="lista-dados__rotulo">Serviço</span>
              <strong className="lista-dados__valor">
                {servicoSelecionado?.titulo ?? servico.rotulo}
              </strong>
            </span>
          </li>
          <li className="lista-dados__item">
            <span className="lista-dados__icone tom-azul">
              <MapPin aria-hidden="true" />
            </span>
            <span className="lista-dados__texto">
              <span className="lista-dados__rotulo">Endereço</span>
              <strong className="lista-dados__valor">{pendente.endereco}</strong>
            </span>
          </li>
        </ul>

        <p className="alerta alerta--info">
          <Info aria-hidden="true" />
          <span>O protocolo será gerado no envio. Acompanhe a fila em “Meus pedidos”.</span>
        </p>

        <div className="acoes acoes--centro">
          <Link className="botao botao--primario" to="/acompanhar">
            Meus pedidos
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
