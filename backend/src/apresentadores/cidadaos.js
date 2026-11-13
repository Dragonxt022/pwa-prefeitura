/** Contrato público do cidadão. Nunca inclui hash de senha nem dados internos. */
export function cidadaoPublico(cidadao) {
  if (!cidadao) return null
  return {
    id: cidadao.id,
    nome: cidadao.nome,
    email: cidadao.email,
    telefone: cidadao.telefone,
    cep: cidadao.cep,
    logradouro: cidadao.logradouro,
    numero: cidadao.numero,
    complemento: cidadao.complemento,
    bairro: cidadao.bairro,
    cidade: cidadao.cidade,
    uf: cidadao.uf,
    criadoEm: cidadao.criadoEm,
    atualizadoEm: cidadao.atualizadoEm,
    privacidadeVersao: cidadao.consentimentoVersao,
  }
}
