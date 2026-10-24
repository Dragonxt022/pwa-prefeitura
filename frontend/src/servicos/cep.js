export async function consultarCep(cep, { signal } = {}) {
  const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!resposta.ok) throw new Error('Falha na consulta')
  return resposta.json()
}
