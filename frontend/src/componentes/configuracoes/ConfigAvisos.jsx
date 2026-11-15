import {
  CalendarClock,
  Check,
  Eye,
  LoaderCircle,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../i18n/useI18n.js'
import {
  atualizarAvisoGestao,
  criarAvisoGestao,
  excluirAvisoGestao,
  obterAvisosGestao,
} from '../../servicos/api'
import { formatarDataHora } from '../../utils/format'
import { visualAviso } from '../../utils/visual'
import { CampoConfig, ErroOperacao, SeloPersistencia, SwitchConfig } from './ConfigCampos'
import SeletorVisual from './SeletorVisual'

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
  if (!valor) return null
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? null : data.toISOString()
}

function formVazio() {
  return {
    titulo: '',
    resumo: '',
    conteudo: '',
    categoria: '',
    icone: '',
    cor: '',
    prioridade: 'normal',
    publicadoEm: paraInputDataHora(),
    expiraEm: '',
    desativarAoExpirar: true,
    ativo: true,
  }
}

function payloadDe(form) {
  return {
    titulo: form.titulo,
    resumo: form.resumo,
    conteudo: form.conteudo,
    categoria: form.categoria,
    icone: form.icone || null,
    cor: form.cor || null,
    prioridade: form.prioridade,
    publicadoEm: deInputDataHora(form.publicadoEm),
    expiraEm: deInputDataHora(form.expiraEm),
    desativarAoExpirar: Boolean(form.desativarAoExpirar),
    ativo: Boolean(form.ativo),
  }
}

function estaExpirado(aviso, agora) {
  if (!aviso?.expiraEm || aviso.desativarAoExpirar === false) return false
  const expiraEm = new Date(aviso.expiraEm)
  return !Number.isNaN(expiraEm.getTime()) && expiraEm.getTime() <= agora
}

export default function ConfigAvisos({ onSessaoExpirada, modoPagina = false }) {
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
  const [abaLista, setAbaLista] = useState('publicados')
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(null)
  const [excluindoId, setExcluindoId] = useState(null)

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

  useEffect(() => {
    function atualizarSeVisivel() {
      if (document.visibilityState === 'visible') void carregar()
    }
    window.addEventListener('focus', atualizarSeVisivel)
    document.addEventListener('visibilitychange', atualizarSeVisivel)
    return () => {
      window.removeEventListener('focus', atualizarSeVisivel)
      document.removeEventListener('visibilitychange', atualizarSeVisivel)
    }
  }, [carregar])

  const avisos = useMemo(() => {
    const lista = [...(dados?.avisos ?? [])]
    return lista.sort((a, b) => new Date(b.publicadoEm) - new Date(a.publicadoEm))
  }, [dados])

  const ativos = referencia
    ? avisos.filter(
        (aviso) =>
          aviso.ativo &&
          new Date(aviso.publicadoEm).getTime() <= referencia &&
          !estaExpirado(aviso, referencia),
      ).length
    : 0
  const agendados = referencia
    ? avisos.filter((aviso) => new Date(aviso.publicadoEm).getTime() > referencia).length
    : 0
  const expirados = referencia
    ? avisos.filter((aviso) => estaExpirado(aviso, referencia)).length
    : 0
  const publicados = referencia
    ? avisos.filter((aviso) => !estaExpirado(aviso, referencia))
    : avisos
  const expiradosLista = referencia
    ? avisos.filter((aviso) => estaExpirado(aviso, referencia))
    : []
  const abaListaEfetiva =
    abaLista === 'expirados' && expiradosLista.length > 0 ? 'expirados' : 'publicados'
  const listaVisivel = abaListaEfetiva === 'expirados' ? expiradosLista : publicados

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
      conteudo: registro.conteudo || registro.resumo,
      categoria: registro.categoria,
      icone: registro.icone || '',
      cor: registro.cor || '',
      prioridade: registro.prioridade || 'normal',
      publicadoEm: paraInputDataHora(registro.publicadoEm),
      expiraEm: registro.expiraEm ? paraInputDataHora(registro.expiraEm) : '',
      desativarAoExpirar: registro.desativarAoExpirar !== false,
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

  async function excluir(registro) {
    setExcluindoId(registro.id)
    setErroForm(null)
    setDetalheErro('')
    setCampos({})
    setMensagem('')
    try {
      await excluirAvisoGestao(registro.id)
      setConfirmandoExclusao(null)
      await carregar()
      setMensagem(t('avisos.excluido'))
    } catch (falha) {
      if (falha?.status === 401) {
        onSessaoExpirada?.()
        return
      }
      setDetalheErro(Object.values(falha?.campos ?? {})[0] ?? '')
      setErroForm(falha)
    } finally {
      setExcluindoId(null)
    }
  }

  return (
    <div className="config-avisos">
      <section
        className="cartao config-secao"
        aria-labelledby={modoPagina ? undefined : 'avisos-titulo'}
        aria-label={modoPagina ? 'Avisos da cidade' : undefined}
      >
        <header
          className={`config-secao__topo${modoPagina ? ' config-secao__topo--acoes' : ''}`}
        >
          {!modoPagina && (
            <div>
              <span className="config-eyebrow">{t('avisos.sobre')}</span>
              <h2 id="avisos-titulo">{t('avisos.titulo')}</h2>
              <p className="texto-suave">{t('avisos.descricao')}</p>
            </div>
          )}
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
              <div>
                <strong>{expirados}</strong>
                <span>{t('avisos.resumoExpirados')}</span>
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
                    id="aviso-expira"
                    rotulo={t('avisos.campoExpiraEm')}
                    ajuda={t('avisos.expiraAjuda')}
                    erro={campos.expiraEm}
                  >
                    <input
                      id="aviso-expira"
                      type="datetime-local"
                      value={form.expiraEm}
                      onChange={(evento) => trocarCampo('expiraEm', evento.target.value)}
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
                  <CampoConfig
                    id="aviso-conteudo"
                    rotulo={t('avisos.campoConteudo')}
                    ajuda={t('avisos.conteudoAjuda')}
                    erro={campos.conteudo}
                    className="config-grid__largo"
                  >
                    <textarea
                      id="aviso-conteudo"
                      value={form.conteudo}
                      maxLength={4000}
                      rows={8}
                      onChange={(evento) => trocarCampo('conteudo', evento.target.value)}
                      required
                    />
                  </CampoConfig>
                  <div className="config-grid__largo">
                    <SeletorVisual
                      id="aviso-visual"
                      tipo="aviso"
                      categoria={form.categoria}
                      icone={form.icone}
                      cor={form.cor}
                      rotuloPreview={form.titulo || t('visual.aviso')}
                      erro={campos.icone || campos.cor}
                      onChange={({ icone, cor }) =>
                        setForm((atual) => ({ ...atual, icone, cor }))
                      }
                    />
                  </div>
                </div>

                <div className="config-catalogo__switches">
                  <SwitchConfig
                    id="aviso-ativo"
                    checked={form.ativo}
                    onChange={(valor) => trocarCampo('ativo', valor)}
                    titulo={t('avisos.campoAtivo')}
                    descricao={t('avisos.campoAtivoAjuda')}
                  />
                  <SwitchConfig
                    id="aviso-desativar-expirado"
                    checked={form.desativarAoExpirar}
                    onChange={(valor) => trocarCampo('desativarAoExpirar', valor)}
                    titulo={t('avisos.campoDesativarAoExpirar')}
                    descricao={t('avisos.campoDesativarAoExpirarAjuda')}
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
              <>
                <div className="config-filtros-lista" role="tablist" aria-label="Filtrar avisos">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={abaListaEfetiva === 'publicados'}
                    className={`config-filtros-lista__aba${
                      abaListaEfetiva === 'publicados' ? ' is-ativa' : ''
                    }`}
                    onClick={() => setAbaLista('publicados')}
                  >
                    Publicados ({publicados.length})
                  </button>
                  {expiradosLista.length > 0 && (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={abaListaEfetiva === 'expirados'}
                      className={`config-filtros-lista__aba${
                        abaListaEfetiva === 'expirados' ? ' is-ativa' : ''
                      }`}
                      onClick={() => setAbaLista('expirados')}
                    >
                      Expirados ({expiradosLista.length})
                    </button>
                  )}
                </div>

                {listaVisivel.length === 0 ? (
                  <p className="config-vazio">
                    {abaListaEfetiva === 'expirados'
                      ? 'Nenhum aviso expirado.'
                      : 'Nenhum aviso publicado.'}
                  </p>
                ) : (
                  <ul className="config-catalogo__lista">
                    {listaVisivel.map((aviso) => {
                      const agendado = referencia
                        ? new Date(aviso.publicadoEm).getTime() > referencia
                        : false
                      const expirado = referencia ? estaExpirado(aviso, referencia) : false
                      const { Icone, tom } = visualAviso(aviso)
                      return (
                        <li
                          key={aviso.id}
                          className={`config-catalogo__item${aviso.ativo ? '' : ' is-inativo'}${
                            expirado ? ' is-expirado' : ''
                          }`}
                        >
                          <div className="config-catalogo__item-principal">
                            <span className={`config-catalogo__item-icone tom-${tom}`}>
                              <Icone aria-hidden="true" />
                            </span>
                            <div className="config-catalogo__item-texto">
                              <strong>
                                {aviso.titulo}
                                {agendado ? (
                                  <span className="config-catalogo__etiqueta">
                                    {t('avisos.agendado')}
                                  </span>
                                ) : null}
                                {expirado ? (
                                  <span className="config-catalogo__etiqueta config-catalogo__etiqueta--expirado">
                                    {t('avisos.expirado')}
                                  </span>
                                ) : null}
                              </strong>
                              <span>
                                {aviso.categoria}
                                {' · '}
                                {t(ROTULO_PRIORIDADE[aviso.prioridade] ?? 'avisos.prioridadeNormal')}
                                {' · '}
                                {formatarDataHora(aviso.publicadoEm)}
                                {aviso.expiraEm
                                  ? ` · ${t('avisos.expiraEmCurto', {
                                      data: formatarDataHora(aviso.expiraEm),
                                    })}`
                                  : ''}
                              </span>
                              <span className="config-catalogo__vinculos">{aviso.resumo}</span>
                              <span className="config-catalogo__views">
                                <Eye aria-hidden="true" />
                                {t('avisos.visualizacoes', {
                                  quantidade: aviso.visualizacoes ?? 0,
                                })}
                              </span>
                            </div>
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
                            {!expirado && (
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
                            )}
                            {expirado && (
                              <span className="config-catalogo__dica">
                                <CalendarClock aria-hidden="true" />
                                Edite a expiração para republicar.
                              </span>
                            )}
                            {confirmandoExclusao === aviso.id ? (
                              <div className="config-catalogo__confirmar" role="group">
                                <span>Excluir este aviso definitivamente?</span>
                                <button
                                  type="button"
                                  className="botao botao--perigo botao--pequeno"
                                  onClick={() => excluir(aviso)}
                                  disabled={excluindoId === aviso.id}
                                >
                                  {excluindoId === aviso.id ? (
                                    <LoaderCircle className="girando" aria-hidden="true" />
                                  ) : (
                                    <Trash2 aria-hidden="true" />
                                  )}
                                  Excluir
                                </button>
                                <button
                                  type="button"
                                  className="botao botao--secundario botao--pequeno"
                                  onClick={() => setConfirmandoExclusao(null)}
                                  disabled={excluindoId === aviso.id}
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="botao botao--perigo botao--pequeno"
                                onClick={() => setConfirmandoExclusao(aviso.id)}
                              >
                                <Trash2 aria-hidden="true" />
                                {t('avisos.excluir')}
                              </button>
                            )}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </>
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
