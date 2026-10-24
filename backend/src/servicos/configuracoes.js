/**
 * Serviço de configurações administrativas.
 *
 * Coordena leitura, validação das seções, persistência via repositório e teste
 * de qualidade da IA. Segredos SMTP/IA permanecem neste backend e só são
 * expostos como indicadores pelos apresentadores.
 */
import { CODIGOS_ERRO, mensagemDoErro } from '../../../shared/codigos-erro.js'
import { provedorIA } from '../dominio/configuracoes.js'
import { listarSetores } from '../dominio/catalogo.js'
import * as repositorioConfiguracoes from '../repositorios/configuracoes.js'
import {
  prepararEmail,
  prepararIA,
  prepararIdentidade,
} from '../validadores/configuracoes.js'
import { testarModelo } from './ia.js'

const PREPARADORES = {
  identidade: prepararIdentidade,
  email: prepararEmail,
  ia: prepararIA,
}

export function obterConfiguracoes() {
  return repositorioConfiguracoes.obter()
}

export function triagemAutomaticaAtiva() {
  return Boolean(repositorioConfiguracoes.obter().ia.aplicarAutomaticamente)
}

/**
 * Valida e salva uma seção. Retorna `null` para seção desconhecida e
 * `{ campos }` quando a entrada precisa de correção.
 */
export function atualizarConfiguracao(secao, entrada, usuario) {
  const preparar = PREPARADORES[secao]
  if (!preparar) return null

  const atual = repositorioConfiguracoes.obter()
  const preparado = preparar(entrada, atual[secao])
  if (preparado.campos) return { campos: preparado.campos }

  return {
    dados: repositorioConfiguracoes.salvarSecao(secao, preparado.dados, usuario),
  }
}

export async function testarConfiguracaoIA(entrada) {
  const atual = repositorioConfiguracoes.obter()
  const preparado = prepararIA(entrada, atual.ia)
  if (preparado.campos) return { campos: preparado.campos }

  const provedor = provedorIA(preparado.dados.provedor)
  if (provedor.requerChave && !preparado.dados.apiKey) {
    return {
      resultado: {
        ok: false,
        codigo: CODIGOS_ERRO.IA_SEM_CHAVE,
        esperado: 'meio_ambiente',
        obtido: null,
        mensagem: mensagemDoErro(CODIGOS_ERRO.IA_SEM_CHAVE),
        erro: 'Chave de API ausente.',
        provedor: provedor.id,
        latenciaMs: 0,
      },
    }
  }

  return { resultado: await testarModelo(preparado.dados, listarSetores()) }
}
