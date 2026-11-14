import { Ban, Check, RotateCcw } from 'lucide-react'
import {
  ICONES_VISUAIS,
  TONS_VISUAIS,
} from '../../../../shared/catalogo-visual.js'
import { useI18n } from '../../i18n/useI18n.js'
import { iconeVisual, visualAviso, visualServico } from '../../utils/visual'

/**
 * Escolha de ícone e tom do cartão no aplicativo.
 *
 * Os valores vazios representam o padrão automático: o frontend usa o
 * fallback por categoria (avisos) ou por identificador (serviços).
 */
export default function SeletorVisual({
  id,
  icone,
  cor,
  onChange,
  tipo = 'aviso',
  categoria = '',
  identificador = '',
  rotuloPreview,
  erro,
}) {
  const { t } = useI18n()
  const visual =
    tipo === 'servico'
      ? visualServico({ id: identificador, icone, cor })
      : visualAviso({ categoria, icone, cor })
  const { Icone } = visual
  const tom = TONS_VISUAIS.find((item) => item.id === cor)
  const tituloPreview = rotuloPreview || t(tipo === 'servico' ? 'visual.servico' : 'visual.aviso')

  return (
    <fieldset className={`campo seletor-visual${erro ? ' campo--erro' : ''}`} id={id}>
      <legend>{t('visual.titulo')}</legend>
      <p className="campo__ajuda">{t('visual.ajuda')}</p>

      <div className={`seletor-visual__previa tom-${visual.tom}`}>
        <span className="seletor-visual__previa-icone">
          <Icone aria-hidden="true" />
        </span>
        <span className="seletor-visual__previa-texto">
          <small>{t('visual.previa')}</small>
          <strong>{tituloPreview}</strong>
          <span>{tom ? t('visual.tomEscolhido', { tom: tom.rotulo }) : t('visual.automatico')}</span>
        </span>
        <span className="seletor-visual__previa-marca" aria-hidden="true">
          <Check />
        </span>
      </div>

      <div className="seletor-visual__grupo">
        <span className="seletor-visual__rotulo">{t('visual.icone')}</span>
        <div className="seletor-visual__opcoes seletor-visual__opcoes--icones" role="group">
          <button
            type="button"
            className={`seletor-visual__icone${icone ? '' : ' is-ativo'}`}
            aria-pressed={!icone}
            aria-label={t('visual.iconeAutomatico')}
            title={t('visual.iconeAutomatico')}
            onClick={() => onChange({ icone: '', cor })}
          >
            <RotateCcw aria-hidden="true" />
          </button>
          {ICONES_VISUAIS.map((opcao) => {
            const IconeOpcao = iconeVisual(opcao.id)
            if (!IconeOpcao) return null
            return (
              <button
                key={opcao.id}
                type="button"
                className={`seletor-visual__icone${icone === opcao.id ? ' is-ativo' : ''}`}
                aria-pressed={icone === opcao.id}
                aria-label={opcao.rotulo}
                title={opcao.rotulo}
                onClick={() => onChange({ icone: opcao.id, cor })}
              >
                <IconeOpcao aria-hidden="true" />
              </button>
            )
          })}
        </div>
      </div>

      <div className="seletor-visual__grupo">
        <span className="seletor-visual__rotulo">{t('visual.cor')}</span>
        <div className="seletor-visual__opcoes" role="group">
          <button
            type="button"
            className={`seletor-visual__cor-auto${cor ? '' : ' is-ativo'}`}
            aria-pressed={!cor}
            aria-label={t('visual.corAutomatica')}
            title={t('visual.corAutomatica')}
            onClick={() => onChange({ icone, cor: '' })}
          >
            <Ban aria-hidden="true" />
          </button>
          {TONS_VISUAIS.map((opcao) => (
            <button
              key={opcao.id}
              type="button"
              className={`seletor-visual__cor tom-${opcao.id}${cor === opcao.id ? ' is-ativo' : ''}`}
              aria-pressed={cor === opcao.id}
              aria-label={opcao.rotulo}
              title={opcao.rotulo}
              onClick={() => onChange({ icone, cor: opcao.id })}
            >
              <span aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      {icone || cor ? (
        <button
          type="button"
          className="botao botao--secundario botao--pequeno seletor-visual__limpar"
          onClick={() => onChange({ icone: '', cor: '' })}
        >
          <RotateCcw aria-hidden="true" />
          {t('visual.usarAutomatico')}
        </button>
      ) : null}

      {erro ? <span className="campo__erro">{erro}</span> : null}
    </fieldset>
  )
}
