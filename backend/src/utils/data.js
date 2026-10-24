/** Utilitários de data compartilhados pelas regras de SLA. */

export function adicionarDias(iso, dias) {
  const data = new Date(iso)
  data.setDate(data.getDate() + dias)
  return data.toISOString()
}
