import {
  Cpu,
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Save,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '../../i18n/useI18n.js'
import { CampoConfig, ErroOperacao, SwitchConfig } from './ConfigCampos'

function clonarIA(valor = {}) {
  return {
    ...valor,
    apiKey: '',
    removerApiKey: false,
  }
}

export default function ConfigIA({ config, opcoes, onSalvar, onTestarIA }) {
  const { t } = useI18n()
  const [form, setForm] = useState(() => clonarIA(config))
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [mostrarChave, setMostrarChave] = useState(false)
  const [testando, setTestando] = useState(false)
  const [teste, setTeste] = useState(null)

  const provedores = opcoes?.provedoresIA ?? []
  const provedorAtual = provedores.find((provedor) => provedor.id === form.provedor)
  const ehRegras = form.provedor === 'regras'
  const requerChave = Boolean(provedorAtual?.requerChave)

  function atualizar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  function trocarProvedor(id) {
    const anterior = provedores.find((provedor) => provedor.id === form.provedor)
    const proximo = provedores.find((provedor) => provedor.id === id)
    setForm((atual) => {
      const baseUrlVazia = !atual.baseUrl?.trim()
      const modeloVazio = !atual.modelo?.trim()
      return {
        ...atual,
        provedor: id,
        ativo: id === 'regras' ? false : atual.ativo,
        baseUrl:
          id === 'regras'
            ? ''
            : baseUrlVazia || atual.baseUrl === anterior?.baseUrl
              ? proximo?.baseUrl ?? ''
              : atual.baseUrl,
        modelo:
          id === 'regras'
            ? ''
            : modeloVazio || atual.modelo === anterior?.modelo
              ? proximo?.modelo ?? ''
              : atual.modelo,
      }
    })
    setTeste(null)
    setErros((atuais) => {
      const proximos = { ...atuais }
      delete proximos.provedor
      delete proximos.modelo
      delete proximos.baseUrl
      return proximos
    })
  }

  async function salvar(evento) {
    evento.preventDefault()
    setSalvando(true)
    setErros({})
    setErroGeral(null)
    try {
      await onSalvar('ia', form)
    } catch (falha) {
      setErros(falha.campos ?? {})
      setErroGeral(falha)
    } finally {
      setSalvando(false)
    }
  }

  async function testar() {
    setTestando(true)
    setTeste(null)
    try {
      const resultado = await onTestarIA(form)
      setTeste(resultado)
    } catch (falha) {
      setTeste({
        ok: false,
        codigo: falha?.codigo,
        mensagem: t('ia.erroTeste'),
        erro: falha?.message || t('ia.erroTeste'),
      })
    } finally {
      setTestando(false)
    }
  }

  return (
    <form className="config-form" onSubmit={salvar} noValidate>
      <section className="config-secao cartao" aria-labelledby="ia-provedor">
        <div className="config-secao__topo">
          <div>
            <p className="config-eyebrow">{t('ia.sobre')}</p>
            <h2 id="ia-provedor">{t('ia.titulo')}</h2>
            <p className="texto-suave">{t('ia.descricao')}</p>
          </div>
          <Cpu className="config-secao__icone" aria-hidden="true" />
        </div>

        <ErroOperacao erro={erroGeral} prefixo={t('config.erroSalvar')} />

        <SwitchConfig
          id="ia-ativo"
          checked={form.ativo}
          onChange={(valor) => atualizar('ativo', valor)}
          titulo={t('ia.ativo')}
          descricao={t('ia.ativoAjuda')}
        />
        {ehRegras && (
          <p className="config-nota">
            <ShieldCheck aria-hidden="true" />
            {t('ia.semCusto')}
          </p>
        )}
        <SwitchConfig
          id="ia-aplicar-auto"
          checked={form.aplicarAutomaticamente}
          onChange={(valor) => atualizar('aplicarAutomaticamente', valor)}
          titulo={t('ia.aplicarAuto')}
          descricao={t('ia.aplicarAutoAjuda')}
        />

        <div className="config-grid">
          <CampoConfig
            id="ia-provedor-select"
            rotulo={t('ia.provedor')}
            erro={erros.provedor}
            ajuda={provedorAtual?.ajuda}
          >
            <select
              id="ia-provedor-select"
              value={form.provedor}
              onChange={(evento) => trocarProvedor(evento.target.value)}
            >
              {provedores.map((provedor) => (
                <option key={provedor.id} value={provedor.id}>
                  {provedor.rotulo}
                </option>
              ))}
            </select>
          </CampoConfig>

          <CampoConfig
            id="ia-modelo"
            rotulo={t('ia.modelo')}
            erro={erros.modelo}
            ajuda={ehRegras ? t('ia.modeloRegras') : t('ia.modeloAjuda')}
          >
            <input
              id="ia-modelo"
              type="text"
              spellCheck={false}
              disabled={ehRegras}
              value={form.modelo}
              onChange={(evento) => atualizar('modelo', evento.target.value)}
            />
          </CampoConfig>

          <CampoConfig
            id="ia-base-url"
            rotulo={t('ia.baseUrl')}
            erro={erros.baseUrl}
            ajuda={ehRegras ? t('ia.provedorRegras') : t('ia.baseUrlAjuda')}
            className="config-grid__largo"
          >
            <input
              id="ia-base-url"
              type="url"
              inputMode="url"
              spellCheck={false}
              disabled={ehRegras}
              value={form.baseUrl}
              onChange={(evento) => atualizar('baseUrl', evento.target.value)}
            />
          </CampoConfig>

          <CampoConfig
            id="ia-api-key"
            rotulo={t('ia.apiKey')}
            erro={erros.apiKey}
            ajuda={
              ehRegras
                ? t('ia.apiKeyNaoAplicavel')
                : form.temApiKey && !form.removerApiKey
                  ? t('ia.apiKeyMantida')
                  : t('ia.apiKeyAjuda')
            }
          >
            <div className="config-senha">
              <input
                id="ia-api-key"
                type={mostrarChave ? 'text' : 'password'}
                autoComplete="new-password"
                spellCheck={false}
                disabled={ehRegras || form.removerApiKey}
                value={form.apiKey}
                onChange={(evento) => atualizar('apiKey', evento.target.value)}
              />
              <button
                type="button"
                className="botao botao--secundario botao--icone"
                onClick={() => setMostrarChave((valor) => !valor)}
                aria-label={mostrarChave ? t('ia.ocultarChave') : t('ia.mostrarChave')}
                title={mostrarChave ? t('ia.ocultarChave') : t('ia.mostrarChave')}
              >
                {mostrarChave ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </div>
          </CampoConfig>

          <CampoConfig
            id="ia-temperatura"
            rotulo={t('ia.temperatura')}
            ajuda={t('ia.temperaturaAjuda')}
            erro={erros.temperatura}
          >
            <div className="config-range">
              <input
                id="ia-temperatura"
                type="range"
                min={0}
                max={1.5}
                step={0.05}
                value={form.temperatura}
                onChange={(evento) => atualizar('temperatura', Number(evento.target.value))}
              />
              <output htmlFor="ia-temperatura">{Number(form.temperatura).toFixed(2)}</output>
            </div>
          </CampoConfig>

          <CampoConfig
            id="ia-timeout"
            rotulo={t('ia.timeout')}
            erro={erros.timeoutMs}
            ajuda={t('ia.timeoutAjuda')}
          >
            <input
              id="ia-timeout"
              type="number"
              min={3000}
              max={30000}
              step={500}
              inputMode="numeric"
              value={form.timeoutMs}
              onChange={(evento) => atualizar('timeoutMs', evento.target.value)}
            />
          </CampoConfig>
        </div>

        <div className="config-provedor-status">
          <span className={`config-status ${requerChave ? 'is-erro' : 'is-enviado'}`}>
            {requerChave ? t('ia.requerChave') : t('ia.naoRequerChave')}
          </span>
          {form.temApiKey ? (
            <span className="config-nota">
              <LockKeyhole aria-hidden="true" />
              {t('ia.privacidade')}
            </span>
          ) : null}
        </div>

        {form.temApiKey && (
          <label className="checkbox checkbox--linha config-checkbox">
            <input
              type="checkbox"
              checked={form.removerApiKey}
              onChange={(evento) => {
                const remover = evento.target.checked
                setForm((atual) => ({
                  ...atual,
                  removerApiKey: remover,
                  apiKey: remover ? '' : atual.apiKey,
                }))
              }}
            />
            <span>{t('ia.removerApiKey')}</span>
          </label>
        )}
      </section>

      <section className="config-secao cartao" aria-labelledby="ia-teste">
        <div className="config-secao__topo">
          <div>
            <h2 id="ia-teste">{t('ia.testar')}</h2>
            <p className="texto-suave">{t('ia.testeAjuda')}</p>
          </div>
          <Sparkles className="config-secao__icone" aria-hidden="true" />
        </div>
        <p className="campo__ajuda">{t('ia.provedorAjuda')}</p>

        <button
          type="button"
          className="botao botao--secundario"
          onClick={testar}
          disabled={testando}
        >
          {testando ? (
            <LoaderCircle className="girando" aria-hidden="true" />
          ) : (
            <Sparkles aria-hidden="true" />
          )}
          {testando ? t('ia.testando') : t('ia.testar')}
        </button>

        {teste && (
          <div className={`config-teste ${teste.ok ? 'is-ok' : 'is-erro'}`} role="status">
            <div className="config-teste__topo">
              <strong>{t('ia.testeTitulo')}</strong>
              <span className={`config-status ${teste.ok ? 'is-enviado' : 'is-erro'}`}>
                {teste.ok ? t('ia.testeOk') : t('ia.testeFalhou')}
              </span>
            </div>
            <dl className="config-teste__dados">
              <div>
                <dt>{t('ia.testeEsperado')}</dt>
                <dd>
                  {teste.esperado === 'meio_ambiente'
                    ? t('ia.setorMeioAmbiente')
                    : teste.esperado || '—'}
                </dd>
              </div>
              <div>
                <dt>{t('ia.testeObtido')}</dt>
                <dd>{teste.setorNome || teste.obtido || '—'}</dd>
              </div>
              <div>
                <dt>{t('ia.testeConfianca')}</dt>
                <dd>
                  {Number.isFinite(teste.confianca)
                    ? `${Math.round(teste.confianca * 100)}%`
                    : '—'}
                </dd>
              </div>
              <div>
                <dt>{t('ia.testeLatencia')}</dt>
                <dd>{Number.isFinite(teste.latenciaMs) ? `${teste.latenciaMs} ms` : '—'}</dd>
              </div>
            </dl>
            {teste.mensagem && <p>{teste.mensagem}</p>}
            {teste.justificativa && (
              <blockquote className="config-teste__justificativa">
                {teste.justificativa}
              </blockquote>
            )}
            {!teste.ok && teste.erro && (
              <ErroOperacao
                erro={{ message: teste.erro, codigo: teste.codigo }}
                prefixo={t('ia.erroTeste')}
              />
            )}
          </div>
        )}
      </section>

      <div className="config-acoes">
        {Object.keys(erros).length > 0 && (
          <span className="config-acoes__aviso">{t('config.camposInvalidos')}</span>
        )}
        <button type="submit" className="botao botao--primario" disabled={salvando}>
          {salvando ? (
            <LoaderCircle className="girando" aria-hidden="true" />
          ) : (
            <Save aria-hidden="true" />
          )}
          {salvando ? t('comum.salvando') : t('comum.salvar')}
        </button>
      </div>
    </form>
  )
}
