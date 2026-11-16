import { CheckCircle2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import PerfilAcesso from '../perfil/PerfilAcesso'

export default function ContaSolicitacao({ cidadao }) {
  if (!cidadao) return <PerfilAcesso />

  return (
    <section className="conta-solicitacao cartao" aria-labelledby="titulo-conta-solicitacao">
      <div className="conta-solicitacao__topo">
        <span className="icone-tile tom-verde">
          <CheckCircle2 aria-hidden="true" />
        </span>
        <div>
          <h2 id="titulo-conta-solicitacao">Você está conectado</h2>
          <p className="texto-suave">
            {cidadao.nome} · {cidadao.email}
          </p>
        </div>
      </div>
      <p className="texto-suave">
        Seu telefone e endereço serão aproveitados para preencher a solicitação, e este pedido
        ficará disponível em “Meus pedidos”.
      </p>
      <Link className="link-botao" to="/perfil">
        Revisar dados da conta
      </Link>
    </section>
  )
}
