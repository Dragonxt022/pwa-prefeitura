import { cloneElement, isValidElement } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useI18n } from '../../i18n/useI18n.js'
import { codigoDoErro, mensagemAmigavel } from '../../utils/erros'

export function CampoConfig({ id, rotulo, ajuda, erro, children, className = '' }) {
  const idErro = `${id}-erro`
  const idAjuda = `${id}-ajuda`
  const descritoPor = [erro ? idErro : null, ajuda ? idAjuda : null].filter(Boolean).join(' ')
  const controle = isValidElement(children)
    ? cloneElement(children, {
        'aria-invalid': erro ? true : undefined,
        'aria-describedby': descritoPor || undefined,
      })
    : children

  return (
    <div className={`campo${erro ? ' campo--erro' : ''}${className ? ` ${className}` : ''}`}>
      <label htmlFor={id}>{rotulo}</label>
      {controle}
      {erro ? (
        <span className="campo__erro" id={idErro}>
          {erro}
        </span>
      ) : null}
      {ajuda ? (
        <span className="campo__ajuda" id={idAjuda}>
          {ajuda}
        </span>
      ) : null}
    </div>
  )
}

export function SwitchConfig({ id, checked, onChange, titulo, descricao }) {
  return (
    <label className={`config-switch${checked ? ' is-ligado' : ''}`} htmlFor={id}>
      <input
        id={id}
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(evento) => onChange(evento.target.checked)}
      />
      <span className="config-switch__texto">
        <strong>{titulo}</strong>
        {descricao ? <small>{descricao}</small> : null}
      </span>
      <span className="config-switch__estado" aria-hidden="true">
        {checked ? 'ON' : 'OFF'}
      </span>
    </label>
  )
}

export function ListaTextos({
  id,
  rotulo,
  valores,
  onChange,
  placeholder,
  tipo = 'text',
  inputMode,
  autoComplete,
  ajuda,
  adicionarRotulo,
  textoVazio,
  erro,
}) {
  const { t } = useI18n()
  const lista = Array.isArray(valores) ? valores : []

  function atualizar(indice, valor) {
    onChange(lista.map((item, posicao) => (posicao === indice ? valor : item)))
  }

  function remover(indice) {
    onChange(lista.filter((_, posicao) => posicao !== indice))
  }

  function adicionar() {
    onChange([...lista, ''])
  }

  return (
    <fieldset className="campo config-lista-campo">
      <legend>{rotulo}</legend>
      {ajuda ? <p className="campo__ajuda">{ajuda}</p> : null}
      <div className="config-lista-campo__itens">
        {lista.length === 0 ? (
          <p className="config-vazio">{textoVazio || t('comum.nenhum')}</p>
        ) : (
          lista.map((valor, indice) => (
            <div className="config-lista-campo__linha" key={`${id}-${indice}`}>
              <input
                type={tipo}
                inputMode={inputMode}
                autoComplete={autoComplete}
                value={valor}
                placeholder={placeholder}
                aria-label={`${rotulo} ${indice + 1}`}
                onChange={(evento) => atualizar(indice, evento.target.value)}
              />
              <button
                type="button"
                className="botao botao--secundario botao--icone"
                aria-label={`${t('comum.remover')} ${rotulo} ${indice + 1}`}
                onClick={() => remover(indice)}
              >
                <Trash2 aria-hidden="true" />
              </button>
            </div>
          ))
        )}
      </div>
      {erro ? <span className="campo__erro">{erro}</span> : null}
      <button
        type="button"
        className="botao botao--secundario botao--pequeno config-adicionar"
        onClick={adicionar}
      >
        <Plus aria-hidden="true" />
        {adicionarRotulo || t('comum.adicionar')}
      </button>
    </fieldset>
  )
}

export function AlertaConfig({ tipo = 'info', children }) {
  const classe = tipo === 'erro' ? 'alerta--erro' : tipo === 'sucesso' ? 'alerta--sucesso' : 'alerta--info'
  return (
    <div className={`alerta ${classe}`} role={tipo === 'erro' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}

export function ErroOperacao({ erro, prefixo = 'Não foi possível concluir.' }) {
  const { t } = useI18n()
  if (!erro) return null
  return (
    <AlertaConfig tipo="erro">
      <div className="config-erro">
        <strong>{prefixo}</strong>
        <span>{mensagemAmigavel(erro)}</span>
        <code className="config-codigo" title={t('comum.codigoSuporte')}>
          {codigoDoErro(erro)}
        </code>
      </div>
    </AlertaConfig>
  )
}
