import { Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { StatusBadge } from '../StatusBadge'

export default function PedidosSemelhantes({ semelhantes, consultando }) {
  return (
    <>
      {semelhantes.length > 0 && (
        <div className="alerta alerta--info duplicidade" role="status">
          <Info aria-hidden="true" />
          <div>
            <strong>Já existe um pedido parecido</strong>
            <p>Se for o mesmo problema, acompanhe o protocolo existente.</p>
            <ul>
              {semelhantes.map((item) => (
                <li key={item.protocolo}>
                  <Link to={`/acompanhar?protocolo=${item.protocolo}`}>{item.protocolo}</Link>
                  <StatusBadge status={item.status} />
                  <span>
                    {Number.isFinite(item.distanciaMetros)
                      ? `A cerca de ${item.distanciaMetros} m`
                      : 'Pedido existente'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {consultando && semelhantes.length === 0 && (
        <p className="campo__ajuda" role="status">
          Verificando pedidos parecidos…
        </p>
      )}
    </>
  )
}
