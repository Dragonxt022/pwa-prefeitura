/**
 * Orquestra a classificação automática: modelo externo quando habilitado,
 * regras locais como fallback. A triagem manual nunca depende deste resultado.
 */
import { setores } from '../dominio/catalogo.js'
import { classificarSolicitacao, MODELO_TRIAGEM } from '../dominio/triagem.js'
import { classificarComModelo } from './ia.js'
import { obterConfiguracoes } from './configuracoes.js'

export async function sugerirClassificacao(dados) {
  const ia = obterConfiguracoes().ia
  if (!ia.ativo || ia.provedor === 'regras') {
    return classificarSolicitacao({ ...dados, setores })
  }

  try {
    return await classificarComModelo({
      config: ia,
      solicitacao: dados,
      setores,
    })
  } catch (erro) {
    return {
      ...classificarSolicitacao({ ...dados, setores }),
      origem: 'regras-fallback',
      modelo: MODELO_TRIAGEM,
      fallback: true,
      erroModelo: String(erro?.message || 'Falha ao consultar o modelo.').slice(0, 300),
    }
  }
}
