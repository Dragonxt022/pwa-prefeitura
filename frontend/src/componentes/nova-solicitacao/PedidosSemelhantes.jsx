import { Info } from 'lucide-react'
import { StatusBadge } from '../StatusBadge'

export default function PedidosSemelhantes({ semelhantes, consultando }) {
  return (
    <>
      {semelhantes.length > 0 && (
        <div className="alerta alerta--info duplicidade" role="status">
          <Info aria-hidden="true" />
          <div>
            <strong>Já existe um pedido parecido</strong>
            <p>Se for o mesmo problema, use o protocolo que você já recebeu.</p>
            <ul>
              {semelhantes.map((item, indice) => (
                <li key={`${item.tipo}-${indice}`}>
                  <strong>{item.tipoTitulo ?? 'Pedido existente'}</strong>
                  <StatusBadge status={item.status} />
                  <span>
                    {Number.isFinite(item.distanciaMetros)
                      ? `A cerca de ${item.distanciaMetros} m`
                      : 'Pedido existente na região'}
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
