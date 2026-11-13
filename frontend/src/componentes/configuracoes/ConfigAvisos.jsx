import {
  Check,
  LoaderCircle,
  Pencil,
  Plus,
  Power,
  RefreshCw,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../i18n/useI18n.js'
import {
  atualizarAvisoGestao,
  criarAvisoGestao,
  obterAvisosGestao,
} from '../../servicos/api'
import { formatarDataHora } from '../../utils/format'
import { CampoConfig, ErroOperacao, SeloPersistencia, SwitchConfig } from './ConfigCampos'

const PRIORIDADES = [
  { id: 'alta', chave: 'avisos.prioridadeAlta' },
  { id: 'normal', chave: 'avisos.prioridadeNormal' },
  { id: 'baixa', chave: 'avisos.prioridadeBaixa' },
]

const ROTULO_PRIORIDADE = Object.fromEntries(
  PRIORIDADES.map((prioridade) => [prioridade.id, prioridade.chave]),
)

/** Converte um ISO em valor aceito pelo input datetime-local (hora local). */
function paraInputDataHora(iso) {
  const data = iso ? new Date(iso) : new Date()
  if (Number.isNaN(data.getTime())) return ''
  const local = new Date(data.getTime() - data.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function deInputDataHora(valor) {
  if (!valor) return undefined
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? undefined : data.toISOString()
}

function formVazio() {
  return {
    titulo: '',
    resumo: '',
    categoria: '',
    prioridade: 'normal',
    publicadoEm: paraInputDataHora(),
    ativo: true,
  }
}

function payloadDe(form) {
  return {
    titulo: form.titulo,
    resumo: form.resumo,
    categoria: form.categoria,
    prioridade: form.prioridade,
    publicadoEm: deInputDataHora(form.publicadoEm),
    ativo: Boolean(form.ativo),
  }
}

export default function ConfigAvisos({ onSessaoExpirada }) {
  const { t } = useI18n()
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [editor, setEditor] = useState(null)
  const [form, setForm] = useState(formVazio)
  const [campos, setCampos] = useState({})
  const [erroForm, setErroForm] = useState(null)
  const [detalheErro, setDetalheErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [alternando, setAlternando] = useState(null)
  const [mensagem, setMensagem] = useState('')
  const [referencia, setReferencia] = useState(0)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      setDados(await obterAvisosGestao())
      setReferencia(Date.now())
    } catch (falha) {
      if (falha?.status === 401) {
        onSessaoExpirada?.()
        return
      }
      setErro(falha)
    } finally {
      setCarregando(false)
    }
  }, [onSessaoExpirada])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void carregar()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [carregar])

  const avisos = useMemo(() => {
    const lista = [...(dados?.avisos ?? [])]
    return lista.sort((a, b) => new Date(b.publicadoEm) - new Date(a.publicadoEm))
  }, [dados])

  const ativos = avisos.filter((aviso) => aviso.ativo).length
  const agendados = referencia
    ? avisos.filter((aviso) => new Date(aviso.publicadoEm).getTime() > referencia).length
    : 0

  function abrirNovo() {
    setEditor({ registro: null })
    setForm(formVazio())
    setCampos({})
    setErroForm(null)
    setDetalheErro('')
    setMensagem('')
  }

  function abrirEdicao(registro) {
    setEditor({ registro })
    setForm({
      titulo: registro.titulo,
      resumo: registro.resumo,
      categoria: registro.categoria,
      prioridade: registro.prioridade || 'normal',
      publicadoEm: paraInputDataHora(registro.publicadoEm),
      ativo: registro.ativo,
    })
    setCampos({})
    setErroForm(null)
    setDetalheErro('')
    setMensagem('')
  }

  function fecharEditor() {
    setEditor(null)
    setCampos({})
    setErroForm(null)
    setDetalheErro('')
  }

  function trocarCampo(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  async function salvar(evento) {
    evento.preventDefault()
    if (!editor) return
    setSalvando(true)
    setErroForm(null)
    setDetalheErro('')
    setCampos({})
    setMensagem('')
    try {
      const payload = payloadDe(form)
      if (editor.registro) {
        await atualizarAvisoGestao(editor.registro.id, payload)
      } else {
        await criarAvisoGestao(payload)
      }
      await carregar()
      setEditor(null)
      setMensagem(t('avisos.salvo'))
    } catch (falha) {
      if (falha?.status === 401) {
        onSessaoExpirada?.()
        return
      }
      setCampos(falha?.campos ?? {})
      setDetalheErro(Object.values(falha?.campos ?? {})[0] ?? '')
      setErroForm(falha)
    } finally {
      setSalvando(false)
    }
  }

  async function alternar(registro) {
    setAlternando(registro.id)
    setErroForm(null)
    setDetalheErro('')
    setCampos({})
    setMensagem('')
    try {
      await atualizarAvisoGestao(registro.id, { ativo: !registro.ativo })
      await carregar()
      setMensagem(t(registro.ativo ? 'avisos.desativado' : 'avisos.ativado'))
    } catch (falha) {
      if (falha?.status === 401) {
        onSessaoExpirada?.()
        return
      }
      setDetalheErro(Object.values(falha?.campos ?? {})[0] ?? '')
      setErroForm(falha)
    } finally {
      setAlternando(null)
    }
  }

  return (
    <div className="config-avisos">
      <section className="cartao config-secao" aria-labelledby="avisos-titulo">
        <header className="config-secao__topo">
          <div>
            <span className="config-eyebrow">{t('avisos.sobre')}</span>
            <h2 id="avisos-titulo">{t('avisos.titulo')}</h2>
            <p className="texto-suave">{t('avisos.descricao')}</p>
          </div>
          <div className="config-catalogo__acoes">
            <SeloPersistencia persistencia={dados?.persistencia} prefixo="avisos" />
            <button
              type="button"
              className="botao botao--secundario botao--pequeno"
              onClick={carregar}
              disabled={carregando}
            >
              <RefreshCw className={carregando ? 'girando' : undefined} aria-hidden="true" />
              {t('comum.atualizar')}
            </button>
          </div>
        </header>

        {erro ? (
          <div className="config-catalogo__estado">
            <ErroOperacao erro={erro} prefixo={t('avisos.erroCarregar')} />
            <button type="button" className="botao botao--secundario" onClick={carregar}>
              <RefreshCw aria-hidden="true" />
              {t('comum.tentarNovamente')}
            </button>
          </div>
        ) : (
          <>
            {mensagem ? (
              <p className="alerta alerta--sucesso" role="status">
                <Check aria-hidden="true" />
                <span>{mensagem}</span>
              </p>
            ) : null}

            {erroForm ? (
              <ErroOperacao erro={erroForm} prefixo={detalheErro || t('avisos.erroSalvar')} />
            ) : null}

            <div className="config-catalogo__resumo">
              <div>
                <strong>{ativos}</strong>
                <span>{t('avisos.resumo', { total: avisos.length })}</span>
              </div>
              <div>
                <strong>{agendados}</strong>
                <span>{t('avisos.resumoAgendados')}</span>
              </div>
            </div>

            <div className="config-catalogo__barra">
              <p className="texto-suave">{t('avisos.ajuda')}</p>
              <button
                type="button"
                className="botao botao--primario botao--pequeno"
                onClick={abrirNovo}
              >
                <Plus aria-hidden="true" />
                {t('avisos.novo')}
              </button>
            </div>

            {editor ? (
              <form className="config-catalogo__editor" onSubmit={salvar}>
                <div className="config-catalogo__editor-topo">
                  <h3>
                    {t(editor.registro ? 'avisos.editarTitulo' : 'avisos.novoTitulo')}
                  </h3>
                  <button
                    type="button"
                    className="botao botao--secundario botao--pequeno"
                    onClick={fecharEditor}
                  >
                    {t('avisos.cancelar')}
                  </button>
                </div>

                <div className="config-grid">
                  <CampoConfig
                    id="aviso-titulo"
                    rotulo={t('avisos.campoTitulo')}
                    erro={campos.titulo}
                    className="config-grid__largo"
                  >
                    <input
                      id="aviso-titulo"
                      value={form.titulo}
                      maxLength={160}
                      onChange={(evento) => trocarCampo('titulo', evento.target.value)}
                      required
                    />
                  </CampoConfig>
                  <CampoConfig
                    id="aviso-categoria"
                    rotulo={t('avisos.campoCategoria')}
                    ajuda={t('avisos.categoriaAjuda')}
                    erro={campos.categoria}
                  >
                    <input
                      id="aviso-categoria"
                      value={form.categoria}
                      maxLength={60}
                      onChange={(evento) => trocarCampo('categoria', evento.target.value)}
                      required
                    />
                  </CampoConfig>
                  <CampoConfig
                    id="aviso-prioridade"
                    rotulo={t('avisos.campoPrioridade')}
                    erro={campos.prioridade}
                  >
                    <select
                      id="aviso-prioridade"
                      value={form.prioridade}
                      onChange={(evento) => trocarCampo('prioridade', evento.target.value)}
                    >
                      {PRIORIDADES.map((prioridade) => (
                        <option key={prioridade.id} value={prioridade.id}>
                          {t(prioridade.chave)}
                        </option>
                      ))}
                    </select>
                  </CampoConfig>
                  <CampoConfig
                    id="aviso-publicado"
                    rotulo={t('avisos.campoPublicadoEm')}
                    ajuda={t('avisos.publicadoAjuda')}
                    erro={campos.publicadoEm}
                  >
                    <input
                      id="aviso-publicado"
                      type="datetime-local"
                      value={form.publicadoEm}
                      onChange={(evento) => trocarCampo('publicadoEm', evento.target.value)}
                      required
                    />
                  </CampoConfig>
                  <CampoConfig
                    id="aviso-resumo"
                    rotulo={t('avisos.campoResumo')}
                    ajuda={t('avisos.resumoAjuda')}
                    erro={campos.resumo}
                    className="config-grid__largo"
                  >
                    <textarea
                      id="aviso-resumo"
                      value={form.resumo}
                      maxLength={300}
                      rows={3}
                      onChange={(evento) => trocarCampo('resumo', evento.target.value)}
                      required
                    />
                  </CampoConfig>
                </div>

                <div className="config-catalogo__switches">
                  <SwitchConfig
                    id="aviso-ativo"
                    checked={form.ativo}
                    onChange={(valor) => trocarCampo('ativo', valor)}
                    titulo={t('avisos.campoAtivo')}
                    descricao={t('avisos.campoAtivoAjuda')}
                  />
                </div>

                <div className="config-catalogo__editor-acoes">
                  <button type="submit" className="botao botao--primario" disabled={salvando}>
                    {salvando ? (
                      <LoaderCircle className="girando" aria-hidden="true" />
                    ) : (
                      <Check aria-hidden="true" />
                    )}
                    {t(salvando ? 'comum.salvando' : 'comum.salvar')}
                  </button>
                  <button
                    type="button"
                    className="botao botao--secundario"
                    onClick={fecharEditor}
                    disabled={salvando}
                  >
                    {t('avisos.cancelar')}
                  </button>
                </div>
              </form>
            ) : null}

            {carregando ? (
              <div className="config-catalogo__estado" role="status">
                <LoaderCircle className="girando" aria-hidden="true" />
                <span>{t('avisos.carregando')}</span>
              </div>
            ) : avisos.length === 0 ? (
              <p className="config-vazio">{t('avisos.vazio')}</p>
            ) : (
              <ul className="config-catalogo__lista">
                {avisos.map((aviso) => {
                  const agendado = referencia
                    ? new Date(aviso.publicadoEm).getTime() > referencia
                    : false
                  return (
                    <li
                      key={aviso.id}
                      className={`config-catalogo__item${aviso.ativo ? '' : ' is-inativo'}`}
                    >
                      <div className="config-catalogo__item-texto">
                        <strong>
                          {aviso.titulo}
                          {agendado ? (
                            <span className="config-catalogo__etiqueta">
                              {t('avisos.agendado')}
                            </span>
                          ) : null}
                        </strong>
                        <span>
                          {aviso.categoria}
                          {' · '}
                          {t(ROTULO_PRIORIDADE[aviso.prioridade] ?? 'avisos.prioridadeNormal')}
                          {' · '}
                          {formatarDataHora(aviso.publicadoEm)}
                        </span>
                        <span className="config-catalogo__vinculos">{aviso.resumo}</span>
                      </div>
                      <div className="config-catalogo__item-acoes">
                        <span
                          className={`config-catalogo__status${aviso.ativo ? ' is-ativo' : ''}`}
                        >
                          {t(aviso.ativo ? 'comum.ativo' : 'comum.inativo')}
                        </span>
                        <button
                          type="button"
                          className="botao botao--secundario botao--pequeno"
                          onClick={() => abrirEdicao(aviso)}
                        >
                          <Pencil aria-hidden="true" />
                          {t('avisos.editar')}
                        </button>
                        <button
                          type="button"
                          className="botao botao--secundario botao--pequeno"
                          onClick={() => alternar(aviso)}
                          disabled={alternando === aviso.id}
                        >
                          {alternando === aviso.id ? (
                            <LoaderCircle className="girando" aria-hidden="true" />
                          ) : (
                            <Power aria-hidden="true" />
                          )}
                          {t(aviso.ativo ? 'avisos.desativar' : 'avisos.ativar')}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </>
        )}
      </section>

      <section
        className="cartao config-secao config-catalogo__auditoria"
        aria-labelledby="avisos-auditoria"
      >
        <header className="config-secao__topo">
          <div>
            <h2 id="avisos-auditoria">{t('avisos.auditoria')}</h2>
            <p className="texto-suave">{t('avisos.auditoriaDescricao')}</p>
          </div>
        </header>
        {dados?.auditoria?.length ? (
          <ul className="config-catalogo__auditoria-lista">
            {dados.auditoria.map((item) => (
              <li key={`aviso-${item.id}`}>
                <span>
                  {t(
                    item.acao === 'criado'
                      ? 'avisos.auditoriaCriado'
                      : 'avisos.auditoriaAtualizado',
                  )}
                  {' · '}
                  <strong>{item.dadosDepois?.titulo || item.avisoId}</strong>
                </span>
                <small>
                  {item.usuarioNome || t('avisos.sistema')} · {formatarDataHora(item.em)}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="config-vazio">{t('avisos.auditoriaVazia')}</p>
        )}
      </section>
    </div>
  )
}
