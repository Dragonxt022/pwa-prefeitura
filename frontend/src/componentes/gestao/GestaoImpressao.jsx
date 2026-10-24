import { formatarDataHora, infoStatus } from '../../utils/format'
import { infoPrazo } from '../../utils/prazos'

export default function GestaoImpressao({ impressao, nomeApp }) {
  return (
    <section className="area-impressao" aria-label={`Impressão: ${impressao.rotulo}`}>
      <header className="impressao__cabecalho">
        <div>
          <strong>{nomeApp}</strong>
          <span>Painel de gestão · {impressao.rotulo}</span>
        </div>
        <span>{formatarDataHora(impressao.criadoEm)}</span>
      </header>
      <p className="impressao__filtros">
        <strong>Filtros:</strong> {impressao.filtros}
      </p>
      <table className="impressao__tabela">
        <thead>
          <tr>
            <th>Protocolo</th>
            <th>Serviço</th>
            <th>Setor</th>
            <th>Endereço</th>
            <th>Status</th>
            <th>Prioridade</th>
            <th>Aberto em</th>
            <th>Prazo</th>
          </tr>
        </thead>
        <tbody>
          {impressao.itens.map((item) => (
            <tr key={item.protocolo}>
              <td>{item.protocolo}</td>
              <td>{item.tipoTitulo}</td>
              <td>{item.setorNome}</td>
              <td>{item.endereco}</td>
              <td>{infoStatus(item.status).rotulo}</td>
              <td>{item.prioridade}</td>
              <td>{formatarDataHora(item.criadoEm)}</td>
              <td>{infoPrazo(item)?.data ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="impressao__rodape">
        <span>Total: {impressao.itens.length}</span>
        <span>Documento gerado pelo painel de gestão.</span>
      </footer>
    </section>
  )
}
