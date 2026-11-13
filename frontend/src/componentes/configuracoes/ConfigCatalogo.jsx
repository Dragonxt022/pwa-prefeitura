import {
  Building2,
  Check,
  LoaderCircle,
  Network,
  Pencil,
  Plus,
  Power,
  RefreshCw,
  Wrench,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../i18n/useI18n.js'
import {
  atualizarSecretariaGestao,
  atualizarServicoGestao,
  atualizarSetorGestao,
  criarSecretariaGestao,
  criarServicoGestao,
  criarSetorGestao,
  obterCatalogoGestao,
} from '../../servicos/api'
import { formatarDataHora } from '../../utils/format'
import { CampoConfig, ErroOperacao, SeloPersistencia, SwitchConfig } from './ConfigCampos'

const ABAS = [
  { id: 'secretarias', titulo: 'catalogo.abaSecretarias', Icone: Building2 },
  { id: 'setores', titulo: 'catalogo.abaSetores', Icone: Network },
  { id: 'servicos', titulo: 'catalogo.abaServicos', Icone: Wrench },
]

const TIPO_DA_SECAO = {
  secretarias: 'secretaria',
  setores: 'setor',
  servicos: 'servico',
}

const ENTIDADE_UI = {
  secretaria: 'catalogo.entidadeSecretaria',
  setor: 'catalogo.entidadeSetor',
  servico: 'catalogo.entidadeServico',
}

const FORM_VAZIO = {
  secretaria: { sigla: '', nome: '', slug: '', ativo: true, teste: false },
  setor: { nome: '', descricao: '', secretariaId: '', ativo: true },
  servico: {
    titulo: '',
    descricao: '',
    categoria: '',
    prazoDias: 10,
    ordem: 0,
    setorId: '',
    destaque: false,
    novo: false,
    ativo: true,
  },
}

const EDITAR = {
  secretaria: atualizarSecretariaGestao,
  setor: atualizarSetorGestao,
  servico: atualizarServicoGestao,
}

const CRIAR = {
  secretaria: criarSecretariaGestao,
  setor: criarSetorGestao,
  servico: criarServicoGestao,
}

function ordenarPorNome(itens) {
  return [...itens].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

function payloadDe(tipo, form) {
  if (tipo === 'secretaria') {
    return {
      sigla: form.sigla,
      nome: form.nome,
      slug: form.slug,
      ativo: Boolean(form.ativo),
      teste: Boolean(form.teste),
    }
  }
  if (tipo === 'setor') {
    return {
      nome: form.nome,
      descricao: form.descricao,
      ...(form.secretariaId ? { secretariaId: form.secretariaId } : {}),
      ativo: Boolean(form.ativo),
    }
  }
  return {
    titulo: form.titulo,
    descricao: form.descricao,
    categoria: form.categoria,
    prazoDias: Number(form.prazoDias) || 10,
    ordem: Number(form.ordem) || 0,
    ...(form.setorId ? { setorId: form.setorId } : {}),
    destaque: Boolean(form.destaque),
    novo: Boolean(form.novo),
    ativo: Boolean(form.ativo),
  }
}

export default function ConfigCatalogo({ onSessaoExpirada }) {
  const { t } = useI18n()
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(null)
  const [secao, setSecao] = useState('secretarias')
  const [editor, setEditor] = useState(null)
  const [form, setForm] = useState(FORM_VAZIO.secretaria)
  const [campos, setCampos] = useState({})
  const [erroForm, setErroForm] = useState(null)
  const [detalheErro, setDetalheErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [alternando, setAlternando] = useState(null)
  const [mensagem, setMensagem] = useState('')

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      setDados(await obterCatalogoGestao())
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

  const secretarias = useMemo(
    () => ordenarPorNome(dados?.secretarias ?? []),
    [dados],
  )
  const setores = useMemo(() => {
    const lista = [...(dados?.setores ?? [])]
    return lista.sort((a, b) => {
      if (a.central !== b.central) return a.central ? -1 : 1
      return a.nome.localeCompare(b.nome, 'pt-BR')
    })
  }, [dados])
  const servicos = useMemo(
    () => [...(dados?.servicos ?? [])].sort((a, b) => a.ordem - b.ordem),
    [dados],
  )
  const nomesSecretarias = useMemo(
    () => new Map(secretarias.map((secretaria) => [secretaria.id, secretaria.nome])),
    [secretarias],
  )
  const nomesSetores = useMemo(
    () => new Map(setores.map((setor) => [setor.id, setor.nome])),
    [setores],
  )

  function contarAtivos(lista) {
    return lista.filter((item) => item.ativo).length
  }

  function abrirNovo(tipo) {
    setEditor({ tipo, registro: null })
    setForm(structuredClone(FORM_VAZIO[tipo]))
    setCampos({})
    setErroForm(null)
    setDetalheErro('')
    setMensagem('')
  }

  function abrirEdicao(tipo, registro) {
    const formRegistro = { ...FORM_VAZIO[tipo], ...registro }
    if (tipo === 'setor') formRegistro.secretariaId = registro.secretariaId ?? ''
    if (tipo === 'servico') formRegistro.setorId = registro.setorId ?? ''
    setEditor({ tipo, registro })
    setForm(formRegistro)
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

  function trocarSecao(id) {
    setSecao(id)
    fecharEditor()
    setMensagem('')
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
      const acao = editor.registro ? EDITAR[editor.tipo] : CRIAR[editor.tipo]
      const dadosForm = payloadDe(editor.tipo, form)
      if (editor.registro) {
        await acao(editor.registro.id, dadosForm)
      } else {
        await acao(dadosForm)
      }
      await carregar()
      setEditor(null)
      setMensagem(t('catalogo.salvo'))
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

  async function alternar(tipo, registro) {
    setAlternando(registro.id)
    setErroForm(null)
    setDetalheErro('')
    setCampos({})
    setMensagem('')
    try {
      await EDITAR[tipo](registro.id, { ativo: !registro.ativo })
      await carregar()
      setMensagem(t(registro.ativo ? 'catalogo.desativado' : 'catalogo.ativado'))
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

  const lista = secao === 'secretarias' ? secretarias : secao === 'setores' ? setores : servicos

  return (
    <div className="config-catalogo">
      <section className="cartao config-secao" aria-labelledby="catalogo-titulo">
        <header className="config-secao__topo">
          <div>
            <span className="config-eyebrow">{t('catalogo.sobre')}</span>
            <h2 id="catalogo-titulo">{t('catalogo.titulo')}</h2>
            <p className="texto-suave">{t('catalogo.descricao')}</p>
          </div>
          <div className="config-catalogo__acoes">
            <SeloPersistencia persistencia={dados?.persistencia} />
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
            <ErroOperacao erro={erro} prefixo={t('catalogo.erroCarregar')} />
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
              <ErroOperacao erro={erroForm} prefixo={detalheErro || t('catalogo.erroSalvar')} />
            ) : null}

            <div className="config-catalogo__resumo">
              <div>
                <strong>{contarAtivos(secretarias)}</strong>
                <span>{t('catalogo.resumoSecretarias', { total: secretarias.length })}</span>
              </div>
              <div>
                <strong>{contarAtivos(setores)}</strong>
                <span>{t('catalogo.resumoSetores', { total: setores.length })}</span>
              </div>
              <div>
                <strong>{contarAtivos(servicos)}</strong>
                <span>{t('catalogo.resumoServicos', { total: servicos.length })}</span>
              </div>
            </div>

            <div className="config-catalogo__abas" role="tablist" aria-label={t('catalogo.titulo')}>
              {ABAS.map(({ id, titulo, Icone }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={secao === id}
                  className={`config-catalogo__aba${secao === id ? ' is-ativa' : ''}`}
                  onClick={() => trocarSecao(id)}
                >
                  <Icone aria-hidden="true" />
                  {t(titulo)}
                </button>
              ))}
            </div>

            <div className="config-catalogo__barra">
              <p className="texto-suave">{t(`catalogo.ajuda${secao[0].toUpperCase()}${secao.slice(1)}`)}</p>
              <button
                type="button"
                className="botao botao--primario botao--pequeno"
                onClick={() => abrirNovo(TIPO_DA_SECAO[secao])}
              >
                <Plus aria-hidden="true" />
                {t(
                  secao === 'secretarias'
                    ? 'catalogo.novaSecretaria'
                    : secao === 'setores'
                      ? 'catalogo.novoSetor'
                      : 'catalogo.novoServico',
                )}
              </button>
            </div>

            {editor ? (
              <form className="config-catalogo__editor" onSubmit={salvar}>
                <div className="config-catalogo__editor-topo">
                  <h3>
                    {t(
                      editor.registro
                        ? 'catalogo.editarTitulo'
                        : 'catalogo.novoTitulo',
                      { tipo: t(ENTIDADE_UI[editor.tipo]) },
                    )}
                  </h3>
                  <button
                    type="button"
                    className="botao botao--secundario botao--pequeno"
                    onClick={fecharEditor}
                  >
                    {t('catalogo.cancelar')}
                  </button>
                </div>

                {editor.tipo === 'secretaria' ? (
                  <>
                    <div className="config-grid">
                      <CampoConfig id="catalogo-sigla" rotulo={t('catalogo.campoSigla')} erro={campos.sigla}>
                        <input
                          id="catalogo-sigla"
                          value={form.sigla}
                          maxLength={32}
                          onChange={(evento) => trocarCampo('sigla', evento.target.value)}
                          required
                        />
                      </CampoConfig>
                      <CampoConfig id="catalogo-nome" rotulo={t('catalogo.campoNome')} erro={campos.nome}>
                        <input
                          id="catalogo-nome"
                          value={form.nome}
                          maxLength={180}
                          onChange={(evento) => trocarCampo('nome', evento.target.value)}
                          required
                        />
                      </CampoConfig>
                      <CampoConfig
                        id="catalogo-slug"
                        rotulo={t('catalogo.campoSlug')}
                        ajuda={t('catalogo.slugAjuda')}
                        erro={campos.slug}
                        className="config-grid__largo"
                      >
                        <input
                          id="catalogo-slug"
                          value={form.slug}
                          maxLength={180}
                          onChange={(evento) => trocarCampo('slug', evento.target.value)}
                          placeholder="secretaria-municipal"
                        />
                      </CampoConfig>
                    </div>
                    <div className="config-catalogo__switches">
                      <SwitchConfig
                        id="catalogo-ativo"
                        checked={form.ativo}
                        onChange={(valor) => trocarCampo('ativo', valor)}
                        titulo={t('catalogo.campoAtivo')}
                        descricao={t('catalogo.campoAtivoAjuda')}
                      />
                      <SwitchConfig
                        id="catalogo-teste"
                        checked={form.teste}
                        onChange={(valor) => trocarCampo('teste', valor)}
                        titulo={t('catalogo.campoTeste')}
                        descricao={t('catalogo.campoTesteAjuda')}
                      />
                    </div>
                  </>
                ) : editor.tipo === 'setor' ? (
                  <>
                    <div className="config-grid">
                      <CampoConfig id="catalogo-setor-nome" rotulo={t('catalogo.campoNome')} erro={campos.nome}>
                        <input
                          id="catalogo-setor-nome"
                          value={form.nome}
                          maxLength={180}
                          onChange={(evento) => trocarCampo('nome', evento.target.value)}
                          required
                        />
                      </CampoConfig>
                      <CampoConfig
                        id="catalogo-setor-secretaria"
                        rotulo={t('catalogo.campoSecretaria')}
                        erro={campos.secretariaId}
                      >
                        <select
                          id="catalogo-setor-secretaria"
                          value={form.secretariaId}
                          onChange={(evento) => trocarCampo('secretariaId', evento.target.value)}
                          required
                        >
                          <option value="">{t('catalogo.escolhaSecretaria')}</option>
                          {secretarias
                            .filter(
                              (secretaria) => secretaria.ativo || secretaria.id === form.secretariaId,
                            )
                            .map((secretaria) => (
                              <option key={secretaria.id} value={secretaria.id}>
                                {secretaria.sigla} · {secretaria.nome}
                                {secretaria.ativo ? '' : ` (${t('comum.inativo')})`}
                              </option>
                            ))}
                        </select>
                      </CampoConfig>
                      <CampoConfig
                        id="catalogo-setor-descricao"
                        rotulo={t('catalogo.campoDescricao')}
                        erro={campos.descricao}
                        className="config-grid__largo"
                      >
                        <textarea
                          id="catalogo-setor-descricao"
                          value={form.descricao}
                          maxLength={255}
                          onChange={(evento) => trocarCampo('descricao', evento.target.value)}
                        />
                      </CampoConfig>
                    </div>
                    <div className="config-catalogo__switches">
                      <SwitchConfig
                        id="catalogo-setor-ativo"
                        checked={form.ativo}
                        onChange={(valor) => trocarCampo('ativo', valor)}
                        titulo={t('catalogo.campoAtivo')}
                        descricao={t('catalogo.campoAtivoAjuda')}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="config-grid">
                      <CampoConfig id="catalogo-servico-titulo" rotulo={t('catalogo.campoTitulo')} erro={campos.titulo}>
                        <input
                          id="catalogo-servico-titulo"
                          value={form.titulo}
                          maxLength={180}
                          onChange={(evento) => trocarCampo('titulo', evento.target.value)}
                          required
                        />
                      </CampoConfig>
                      <CampoConfig id="catalogo-servico-setor" rotulo={t('catalogo.campoSetor')} erro={campos.setorId}>
                        <select
                          id="catalogo-servico-setor"
                          value={form.setorId}
                          onChange={(evento) => trocarCampo('setorId', evento.target.value)}
                          required
                        >
                          <option value="">{t('catalogo.escolhaSetor')}</option>
                          {setores
                            .filter((setor) => setor.ativo || setor.id === form.setorId)
                            .map((setor) => (
                              <option key={setor.id} value={setor.id}>
                                {setor.nome}
                                {setor.ativo ? '' : ` (${t('comum.inativo')})`}
                              </option>
                            ))}
                        </select>
                      </CampoConfig>
                      <CampoConfig
                        id="catalogo-servico-categoria"
                        rotulo={t('catalogo.campoCategoria')}
                        erro={campos.categoria}
                      >
                        <input
                          id="catalogo-servico-categoria"
                          value={form.categoria}
                          maxLength={80}
                          onChange={(evento) => trocarCampo('categoria', evento.target.value)}
                        />
                      </CampoConfig>
                      <CampoConfig
                        id="catalogo-servico-prazo"
                        rotulo={t('catalogo.campoPrazo')}
                        ajuda={t('catalogo.prazoAjuda')}
                        erro={campos.prazoDias}
                      >
                        <input
                          id="catalogo-servico-prazo"
                          type="number"
                          min="1"
                          max="365"
                          value={form.prazoDias}
                          onChange={(evento) => trocarCampo('prazoDias', evento.target.value)}
                        />
                      </CampoConfig>
                      <CampoConfig
                        id="catalogo-servico-ordem"
                        rotulo={t('catalogo.campoOrdem')}
                        ajuda={t('catalogo.ordemAjuda')}
                        erro={campos.ordem}
                      >
                        <input
                          id="catalogo-servico-ordem"
                          type="number"
                          min="0"
                          max="9999"
                          value={form.ordem}
                          onChange={(evento) => trocarCampo('ordem', evento.target.value)}
                        />
                      </CampoConfig>
                      <CampoConfig
                        id="catalogo-servico-descricao"
                        rotulo={t('catalogo.campoDescricao')}
                        erro={campos.descricao}
                        className="config-grid__largo"
                      >
                        <textarea
                          id="catalogo-servico-descricao"
                          value={form.descricao}
                          maxLength={255}
                          onChange={(evento) => trocarCampo('descricao', evento.target.value)}
                        />
                      </CampoConfig>
                    </div>
                    <div className="config-catalogo__switches">
                      <SwitchConfig
                        id="catalogo-servico-ativo"
                        checked={form.ativo}
                        onChange={(valor) => trocarCampo('ativo', valor)}
                        titulo={t('catalogo.campoAtivo')}
                        descricao={t('catalogo.campoAtivoAjuda')}
                      />
                      <SwitchConfig
                        id="catalogo-servico-destaque"
                        checked={form.destaque}
                        onChange={(valor) => trocarCampo('destaque', valor)}
                        titulo={t('catalogo.campoDestaque')}
                        descricao={t('catalogo.campoDestaqueAjuda')}
                      />
                      <SwitchConfig
                        id="catalogo-servico-novo"
                        checked={form.novo}
                        onChange={(valor) => trocarCampo('novo', valor)}
                        titulo={t('catalogo.campoNovo')}
                        descricao={t('catalogo.campoNovoAjuda')}
                      />
                    </div>
                  </>
                )}

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
                    {t('catalogo.cancelar')}
                  </button>
                </div>
              </form>
            ) : null}

            {carregando ? (
              <div className="config-catalogo__estado" role="status">
                <LoaderCircle className="girando" aria-hidden="true" />
                <span>{t('catalogo.carregando')}</span>
              </div>
            ) : lista.length === 0 ? (
              <p className="config-vazio">{t('catalogo.vazio')}</p>
            ) : (
              <ul className="config-catalogo__lista">
                {lista.map((item) => {
                  const ativo = item.ativo
                  const ehTriagem = secao === 'setores' && item.central
                  return (
                    <li
                      key={item.id}
                      className={`config-catalogo__item${ativo ? '' : ' is-inativo'}`}
                    >
                      <div className="config-catalogo__item-texto">
                        <strong>
                          {secao === 'secretarias'
                            ? `${item.sigla} · ${item.nome}`
                            : secao === 'setores'
                              ? item.nome
                              : item.titulo}
                          {ehTriagem ? (
                            <span className="config-catalogo__etiqueta">
                              {t('catalogo.triagemCentral')}
                            </span>
                          ) : null}
                        </strong>
                        <span>
                          {secao === 'secretarias'
                            ? item.slug
                            : secao === 'setores'
                              ? (nomesSecretarias.get(item.secretariaId) ?? t('catalogo.semSecretaria'))
                              : `${item.categoria || t('catalogo.semCategoria')} · ${nomesSetores.get(item.setorId) ?? t('catalogo.semSetor')} · ${t('catalogo.prazoDias', { dias: item.prazoDias })}`}
                        </span>
                        <span className="config-catalogo__vinculos">
                          {secao === 'secretarias'
                            ? t('catalogo.setoresVinculados', {
                                quantidade: setores.filter(
                                  (setor) => setor.secretariaId === item.id,
                                ).length,
                              })
                            : secao === 'setores'
                              ? t('catalogo.servicosVinculados', {
                                  quantidade: item.servicos.length,
                                })
                              : item.descricao || t('catalogo.semDescricao')}
                        </span>
                      </div>
                      <div className="config-catalogo__item-acoes">
                        <span
                          className={`config-catalogo__status${ativo ? ' is-ativo' : ''}`}
                        >
                          {t(ativo ? 'comum.ativo' : 'comum.inativo')}
                        </span>
                        <button
                          type="button"
                          className="botao botao--secundario botao--pequeno"
                          onClick={() => abrirEdicao(TIPO_DA_SECAO[secao], item)}
                        >
                          <Pencil aria-hidden="true" />
                          {t('catalogo.editar')}
                        </button>
                        <button
                          type="button"
                          className="botao botao--secundario botao--pequeno"
                          onClick={() => alternar(TIPO_DA_SECAO[secao], item)}
                          disabled={alternando === item.id || (ehTriagem && ativo)}
                        >
                          {alternando === item.id ? (
                            <LoaderCircle className="girando" aria-hidden="true" />
                          ) : (
                            <Power aria-hidden="true" />
                          )}
                          {t(ativo ? 'catalogo.desativar' : 'catalogo.ativar')}
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

      <section className="cartao config-secao config-catalogo__auditoria" aria-labelledby="catalogo-auditoria">
        <header className="config-secao__topo">
          <div>
            <h2 id="catalogo-auditoria">{t('catalogo.auditoria')}</h2>
            <p className="texto-suave">{t('catalogo.auditoriaDescricao')}</p>
          </div>
        </header>
        {dados?.auditoria?.length ? (
          <ul className="config-catalogo__auditoria-lista">
            {dados.auditoria.map((item) => (
              <li key={`${item.entidade}-${item.id}`}>
                <span>
                  {t(ENTIDADE_UI[item.entidade] ?? 'catalogo.entidadeServico')}
                  {' · '}
                  {t(item.acao === 'criado' ? 'catalogo.auditoriaCriado' : 'catalogo.auditoriaAtualizado')}
                  {' · '}
                  <strong>
                    {item.dadosDepois?.nome || item.dadosDepois?.titulo || item.entidadeId}
                  </strong>
                </span>
                <small>
                  {item.usuarioNome || t('catalogo.sistema')} · {formatarDataHora(item.em)}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="config-vazio">{t('catalogo.auditoriaVazia')}</p>
        )}
      </section>
    </div>
  )
}
