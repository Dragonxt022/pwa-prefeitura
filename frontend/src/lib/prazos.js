import { formatarData } from './format'

const DIA = 86_400_000
export const STATUS_ENCERRADOS = ['concluida', 'indeferida']

export function infoPrazo(solicitacao) {
  if (!solicitacao?.slaEm) return null

  const limite = new Date(solicitacao.slaEm).getTime()
  if (Number.isNaN(limite)) return null

  const encerrado = STATUS_ENCERRADOS.includes(solicitacao.status)
  const diferenca = limite - Date.now()
  const dias = Math.ceil(diferenca / DIA)
  const vencido = !encerrado && diferenca < 0

  return {
    data: formatarData(solicitacao.slaEm),
    dias,
    vencido,
    encerrado,
    rotulo: encerrado
      ? 'Prazo encerrado'
      : vencido
        ? `Atrasado há ${Math.max(1, Math.abs(Math.floor(diferenca / DIA)))} dia(s)`
        : dias <= 0
          ? 'Vence hoje'
          : `Vence em ${dias} dia(s)`,
  }
}
