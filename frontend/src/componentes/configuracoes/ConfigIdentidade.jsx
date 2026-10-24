import { ImagePlus, LoaderCircle, Plus, Save, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import logoPadrao from '../../assets/logo-icone-colorido.png'
import { useI18n } from '../../i18n/index.jsx'
import { CODIGOS_ERRO } from '../../utils/erros'
import { prepararMarca } from '../../utils/imagem'
import { montarRodape, ROTULOS_REDES } from '../../utils/identidade'
import { CampoConfig, ErroOperacao, ListaTextos } from './ConfigCampos'

const ANO_ATUAL = new Date().getFullYear()

function clonarIdentidade(valor = {}) {
  return {
    ...valor,
    telefones: [...(valor.telefones ?? [])],
    emails: [...(valor.emails ?? [])],
    redesSociais: (valor.redesSociais ?? []).map((rede) => ({ ...rede })),
    rodape: {
      texto: '© {{anos}} {{nome}}. {{direitos}}',
      anoCriacao: ANO_ATUAL,
      direitos: '',
      ...(valor.rodape ?? {}),
    },
  }
}

function corSegura(valor) {
  return /^#[0-9a-f]{6}$/i.test(String(valor ?? '')) ? valor : '#1351B4'
}

export default function ConfigIdentidade({ config, opcoes, onSalvar }) {
  const { t } = useI18n()
  const [form, setForm] = useState(() => clonarIdentidade(config))
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState(null)
  const [imagemErro, setImagemErro] = useState('')
  const [processandoImagem, setProcessandoImagem] = useState('')
  const [salvando, setSalvando] = useState(false)
  const logoRef = useRef(null)
  const iconeRef = useRef(null)

  function atualizar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  function atualizarRodape(campo, valor) {
    setForm((atual) => ({ ...atual, rodape: { ...atual.rodape, [campo]: valor } }))
  }

  function atualizarRede(indice, campo, valor) {
    setForm((atual) => ({
      ...atual,
      redesSociais: atual.redesSociais.map((rede, posicao) =>
        posicao === indice ? { ...rede, [campo]: valor } : rede,
      ),
    }))
  }

  function adicionarRede() {
    setForm((atual) => ({
      ...atual,
      redesSociais: [
        ...atual.redesSociais,
        { id: `rede-${Date.now()}`, rede: 'instagram', rotulo: '', url: '' },
      ],
    }))
  }

  function removerRede(indice) {
    setForm((atual) => ({
      ...atual,
      redesSociais: atual.redesSociais.filter((_, posicao) => posicao !== indice),
    }))
  }

  async function escolherImagem(campo, arquivo) {
    if (!arquivo) return
    setImagemErro('')
    setProcessandoImagem(campo)
    try {
      const { dataUrl } = await prepararMarca(arquivo, {
        ladoMaximo: campo === 'logo' ? 640 : 512,
      })
      atualizar(campo, dataUrl)
    } catch (falha) {
      setImagemErro(falha.message || t('identidade.imagemErro'))
    } finally {
      setProcessandoImagem('')
      if (campo === 'logo' && logoRef.current) logoRef.current.value = ''
      if (campo === 'icone' && iconeRef.current) iconeRef.current.value = ''
    }
  }

  function limparImagem(campo) {
    setImagemErro('')
    atualizar(campo, null)
  }

  async function salvar(evento) {
    evento.preventDefault()
    setSalvando(true)
    setErros({})
    setErroGeral(null)
    try {
      await onSalvar('identidade', form)
    } catch (falha) {
      setErros(falha.campos ?? {})
      setErroGeral(falha)
    } finally {
      setSalvando(false)
    }
  }

  const variaveis = [
    ['nome', t('identidade.variavelNome')],
    ['anoAtual', t('identidade.variavelAnoAtual')],
    ['anoCriacao', t('identidade.variavelAnoCriacao')],
    ['anos', t('identidade.variavelAnos')],
    ['direitos', t('identidade.variavelDireitos')],
  ]
  const anoAtual = opcoes?.anoAtual ?? ANO_ATUAL

  return (
    <form className="config-form" onSubmit={salvar} noValidate>
      <section className="config-secao cartao" aria-labelledby="identidade-dados">
        <div className="config-secao__topo">
          <div>
            <p className="config-eyebrow">{t('identidade.sobre')}</p>
            <h2 id="identidade-dados">{t('identidade.titulo')}</h2>
            <p className="texto-suave">{t('identidade.descricao')}</p>
          </div>
        </div>

        <ErroOperacao erro={erroGeral} prefixo={t('config.erroSalvar')} />

        <div className="config-grid">
          <CampoConfig
            id="identidade-nome"
            rotulo={t('identidade.nome')}
            ajuda={t('identidade.nomeAjuda')}
            erro={erros.nome}
            className="config-grid__largo"
          >
            <input
              id="identidade-nome"
              type="text"
              maxLength={80}
              value={form.nome}
              onChange={(evento) => atualizar('nome', evento.target.value)}
              required
            />
          </CampoConfig>
        </div>

        <div className="config-imagens">
          <div className="config-imagem">
            <div
              className={`config-imagem__preview${form.logo ? '' : ' is-padrao'}`}
              role="img"
              aria-label={t('identidade.previewLogo')}
            >
              <img src={form.logo || logoPadrao} alt="" />
            </div>
            <div className="config-imagem__conteudo">
              <strong>{t('identidade.logo')}</strong>
              <p className="campo__ajuda">{t('identidade.logoAjuda')}</p>
              <div className="config-imagem__acoes">
                <label className="botao botao--secundario botao--pequeno" htmlFor="identidade-logo">
                  {processandoImagem === 'logo' ? (
                    <LoaderCircle className="girando" aria-hidden="true" />
                  ) : (
                    <ImagePlus aria-hidden="true" />
                  )}
                  {processandoImagem === 'logo'
                    ? t('config.imagemProcessando')
                    : form.logo
                      ? t('comum.trocar')
                      : t('comum.arquivo')}
                </label>
                <input
                  ref={logoRef}
                  id="identidade-logo"
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  disabled={salvando || Boolean(processandoImagem)}
                  onChange={(evento) => escolherImagem('logo', evento.target.files?.[0])}
                />
                {form.logo ? (
                  <button
                    type="button"
                    className="botao botao--secundario botao--pequeno"
                    onClick={() => limparImagem('logo')}
                  >
                    <Trash2 aria-hidden="true" />
                    {t('comum.removerImagem')}
                  </button>
                ) : (
                  <span className="config-imagem__padrao">{t('identidade.imagemPadrao')}</span>
                )}
              </div>
              {erros.logo ? <span className="campo__erro">{erros.logo}</span> : null}
            </div>
          </div>

          <div className="config-imagem">
            <div
              className={`config-imagem__preview config-imagem__preview--icone${form.icone ? '' : ' is-padrao'}`}
              role="img"
              aria-label={t('identidade.previewIcone')}
            >
              <img src={form.icone || logoPadrao} alt="" />
            </div>
            <div className="config-imagem__conteudo">
              <strong>{t('identidade.icone')}</strong>
              <p className="campo__ajuda">{t('identidade.iconeAjuda')}</p>
              <div className="config-imagem__acoes">
                <label className="botao botao--secundario botao--pequeno" htmlFor="identidade-icone">
                  {processandoImagem === 'icone' ? (
                    <LoaderCircle className="girando" aria-hidden="true" />
                  ) : (
                    <ImagePlus aria-hidden="true" />
                  )}
                  {processandoImagem === 'icone'
                    ? t('config.imagemProcessando')
                    : form.icone
                      ? t('comum.trocar')
                      : t('comum.arquivo')}
                </label>
                <input
                  ref={iconeRef}
                  id="identidade-icone"
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  disabled={salvando || Boolean(processandoImagem)}
                  onChange={(evento) => escolherImagem('icone', evento.target.files?.[0])}
                />
                {form.icone ? (
                  <button
                    type="button"
                    className="botao botao--secundario botao--pequeno"
                    onClick={() => limparImagem('icone')}
                  >
                    <Trash2 aria-hidden="true" />
                    {t('comum.removerImagem')}
                  </button>
                ) : (
                  <span className="config-imagem__padrao">{t('identidade.imagemPadrao')}</span>
                )}
              </div>
              {erros.icone ? <span className="campo__erro">{erros.icone}</span> : null}
            </div>
          </div>
        </div>

        {imagemErro && (
          <ErroOperacao
            erro={{ message: imagemErro, codigo: CODIGOS_ERRO.IMAGEM_INVALIDA }}
            prefixo={t('identidade.imagemErro')}
          />
        )}
      </section>

      <section className="config-secao cartao" aria-labelledby="identidade-cores">
        <div className="config-secao__topo">
          <div>
            <h2 id="identidade-cores">{t('identidade.cores')}</h2>
            <p className="texto-suave">{t('identidade.coresAjuda')}</p>
          </div>
        </div>
        <div className="config-cores">
          {[
            ['corPrimaria', 'identidade.corPrimaria'],
            ['corSecundaria', 'identidade.corSecundaria'],
            ['corDestaque', 'identidade.corDestaque'],
          ].map(([campo, chave]) => (
            <div className={`config-cor${erros[campo] ? ' campo--erro' : ''}`} key={campo}>
              <input
                id={`identidade-${campo}`}
                type="color"
                value={corSegura(form[campo])}
                aria-label={t(chave)}
                onChange={(evento) => atualizar(campo, evento.target.value.toUpperCase())}
              />
              <div className="config-cor__texto">
                <label htmlFor={`identidade-${campo}`}>{t(chave)}</label>
                <input
                  type="text"
                  value={form[campo]}
                  maxLength={7}
                  spellCheck={false}
                  aria-label={t(chave)}
                  onChange={(evento) => atualizar(campo, evento.target.value.toUpperCase())}
                />
              </div>
              {erros[campo] ? <span className="campo__erro">{erros[campo]}</span> : null}
            </div>
          ))}
        </div>
      </section>

      <section className="config-secao cartao" aria-labelledby="identidade-contatos">
        <div className="config-secao__topo">
          <div>
            <h2 id="identidade-contatos">{t('identidade.contatos')}</h2>
            <p className="texto-suave">{t('identidade.contatosAjuda')}</p>
          </div>
        </div>
        <div className="config-grid">
          <ListaTextos
            id="identidade-telefones"
            rotulo={t('identidade.telefones')}
            valores={form.telefones}
            onChange={(valores) => atualizar('telefones', valores)}
            placeholder="(00) 00000-0000"
            tipo="tel"
            inputMode="tel"
            autoComplete="tel"
            adicionarRotulo={t('identidade.adicionarTelefone')}
            textoVazio={t('identidade.telefonesVazio')}
            erro={erros.telefones}
          />
          <ListaTextos
            id="identidade-emails"
            rotulo={t('identidade.emails')}
            valores={form.emails}
            onChange={(valores) => atualizar('emails', valores)}
            placeholder="contato@prefeitura.gov.br"
            tipo="email"
            inputMode="email"
            autoComplete="email"
            adicionarRotulo={t('identidade.adicionarEmail')}
            textoVazio={t('identidade.emailsVazio')}
            erro={erros.emails}
          />
        </div>
      </section>

      <section className="config-secao cartao" aria-labelledby="identidade-redes">
        <div className="config-secao__topo">
          <div>
            <h2 id="identidade-redes">{t('identidade.redes')}</h2>
            <p className="texto-suave">{t('identidade.redesAjuda')}</p>
          </div>
        </div>

        <div className="config-redes">
          {form.redesSociais.length === 0 ? (
            <p className="config-vazio">{t('identidade.semRedes')}</p>
          ) : (
            form.redesSociais.map((rede, indice) => (
              <div className="config-rede" key={rede.id || indice}>
                <CampoConfig
                  id={`identidade-rede-${indice}`}
                  rotulo={`${t('identidade.rede')} ${indice + 1}`}
                >
                  <select
                    id={`identidade-rede-${indice}`}
                    value={rede.rede}
                    onChange={(evento) => atualizarRede(indice, 'rede', evento.target.value)}
                  >
                    {(opcoes?.redesSociais ?? []).map((opcao) => (
                      <option key={opcao.id} value={opcao.id}>
                        {opcao.rotulo}
                      </option>
                    ))}
                  </select>
                </CampoConfig>

                {rede.rede === 'outro' && (
                  <CampoConfig
                    id={`identidade-rede-${indice}-rotulo`}
                    rotulo={t('identidade.redeOutro')}
                  >
                    <input
                      id={`identidade-rede-${indice}-rotulo`}
                      type="text"
                      maxLength={60}
                      value={rede.rotulo || ''}
                      onChange={(evento) => atualizarRede(indice, 'rotulo', evento.target.value)}
                    />
                  </CampoConfig>
                )}

                <CampoConfig
                  id={`identidade-rede-${indice}-url`}
                  rotulo={t('identidade.url')}
                  className="config-rede__url"
                >
                  <input
                    id={`identidade-rede-${indice}-url`}
                    type="url"
                    inputMode="url"
                    value={rede.url}
                    placeholder="https://"
                    onChange={(evento) => atualizarRede(indice, 'url', evento.target.value)}
                  />
                </CampoConfig>

                <button
                  type="button"
                  className="botao botao--secundario botao--icone config-rede__remover"
                  onClick={() => removerRede(indice)}
                  aria-label={`${t('comum.remover')} ${ROTULOS_REDES[rede.rede] || rede.rede} ${indice + 1}`}
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            ))
          )}
        </div>
        {erros.redesSociais ? <span className="campo__erro">{erros.redesSociais}</span> : null}
        <button
          type="button"
          className="botao botao--secundario botao--pequeno config-adicionar"
          onClick={adicionarRede}
        >
          <Plus aria-hidden="true" />
          {t('identidade.adicionarRede')}
        </button>
      </section>

      <section className="config-secao cartao" aria-labelledby="identidade-rodape">
        <div className="config-secao__topo">
          <div>
            <h2 id="identidade-rodape">{t('identidade.rodape')}</h2>
            <p className="texto-suave">{t('identidade.rodapeAjuda')}</p>
          </div>
        </div>

        <div className="config-grid">
          <CampoConfig
            id="identidade-rodape-texto"
            rotulo={t('identidade.rodapeTexto')}
            erro={erros.rodape}
            className="config-grid__largo"
          >
            <textarea
              id="identidade-rodape-texto"
              rows={2}
              maxLength={500}
              value={form.rodape.texto}
              onChange={(evento) => atualizarRodape('texto', evento.target.value)}
            />
          </CampoConfig>
          <CampoConfig
            id="identidade-rodape-ano"
            rotulo={t('identidade.anoCriacao')}
            erro={erros.anoCriacao}
          >
            <input
              id="identidade-rodape-ano"
              type="number"
              min={1900}
              max={anoAtual + 1}
              value={form.rodape.anoCriacao}
              onChange={(evento) => atualizarRodape('anoCriacao', evento.target.value)}
            />
          </CampoConfig>
          <CampoConfig
            id="identidade-rodape-direitos"
            rotulo={t('identidade.direitos')}
            erro={erros.direitos}
          >
            <input
              id="identidade-rodape-direitos"
              type="text"
              maxLength={160}
              value={form.rodape.direitos}
              onChange={(evento) => atualizarRodape('direitos', evento.target.value)}
            />
          </CampoConfig>
        </div>

        <div className="config-variaveis">
          <strong>{t('comum.variaveis')}</strong>
          <div>
            {variaveis.map(([codigo, descricao]) => (
              <span className="config-variavel" key={codigo} title={descricao}>
                <code>{`{{${codigo}}}`}</code>
                <small>{descricao}</small>
              </span>
            ))}
          </div>
        </div>

        <div className="config-preview-rodape">
          <span>{t('identidade.previaRodape')}</span>
          <p>{montarRodape(form)}</p>
        </div>
      </section>

      <div className="config-acoes">
        {Object.keys(erros).length > 0 && (
          <span className="config-acoes__aviso">{t('config.camposInvalidos')}</span>
        )}
        <button type="submit" className="botao botao--primario" disabled={salvando || Boolean(processandoImagem)}>
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
