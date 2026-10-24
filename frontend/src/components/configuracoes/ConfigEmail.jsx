import {
  Eye,
  EyeOff,
  LoaderCircle,
  MailCheck,
  Save,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import { useI18n } from '../../i18n/index.jsx'
import { formatarDataHora } from '../../lib/format'
import { CampoConfig, ErroOperacao, ListaTextos, SwitchConfig } from './ConfigCampos'

function clonarEmail(valor = {}) {
  return {
    ...valor,
    smtp: {
      ...(valor.smtp ?? {}),
      senha: '',
      removerSenha: false,
    },
    destinatarios: [...(valor.destinatarios ?? [])],
    eventos: Object.fromEntries(
      Object.entries(valor.eventos ?? {}).map(([chave, evento]) => [chave, { ...evento }]),
    ),
  }
}

const CHAVE_STATUS_NOTIFICACAO = {
  enviado: 'email.enviado',
  erro: 'email.erroEnvio',
  ignorado: 'email.ignorado',
}

export default function ConfigEmail({ config, opcoes, onSalvar, onTestarEmail }) {
  const { t } = useI18n()
  // A página passa a configuração completa para manter o histórico visível.
  const emailConfig = config?.email ?? config
  const [form, setForm] = useState(() => clonarEmail(emailConfig))
  const [erros, setErros] = useState({})
  const [erroGeral, setErroGeral] = useState(null)
  const [salvando, setSalvando] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [destinatarioTeste, setDestinatarioTeste] = useState('')
  const [testando, setTestando] = useState(false)
  const [teste, setTeste] = useState(null)

  function atualizar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
  }

  function atualizarSmtp(campo, valor) {
    setForm((atual) => ({ ...atual, smtp: { ...atual.smtp, [campo]: valor } }))
  }

  function atualizarEvento(id, ativo) {
    setForm((atual) => ({
      ...atual,
      eventos: {
        ...atual.eventos,
        [id]: { ...(atual.eventos?.[id] ?? {}), ativo },
      },
    }))
  }

  function alternarRemoverSenha(remover) {
    setForm((atual) => ({
      ...atual,
      smtp: {
        ...atual.smtp,
        removerSenha: remover,
        senha: remover ? '' : atual.smtp.senha,
      },
    }))
  }

  async function salvar(evento) {
    evento.preventDefault()
    setSalvando(true)
    setErros({})
    setErroGeral(null)
    try {
      await onSalvar('email', form)
    } catch (falha) {
      setErros(falha.campos ?? {})
      setErroGeral(falha)
    } finally {
      setSalvando(false)
    }
  }

  async function testarEnvio() {
    const alvo = destinatarioTeste.trim() || form.destinatarios[0] || ''
    setTeste(null)
    if (!alvo) {
      setTeste({
        enviado: false,
        codigo: 'smtp_destinatario_invalido',
        erro: t('email.testeSemDestinatario'),
      })
      return
    }

    setTestando(true)
    try {
      const resultado = await onTestarEmail(alvo)
      setTeste({ ...resultado, destinatario: alvo })
    } catch (falha) {
      setTeste({
        enviado: false,
        codigo: falha?.codigo,
        erro: falha?.message || t('email.testeFalhouTitulo'),
      })
    } finally {
      setTestando(false)
    }
  }

  const notificacoes = config.notificacoes ?? []
  const eventos = opcoes?.eventosNotificacao ?? []
  const rotuloEvento = (id) =>
    eventos.find((evento) => evento.id === id)?.rotulo ?? id

  return (
    <form className="config-form" onSubmit={salvar} noValidate>
      <section className="config-secao cartao" aria-labelledby="email-smtp">
        <div className="config-secao__topo">
          <div>
            <p className="config-eyebrow">{t('email.sobre')}</p>
            <h2 id="email-smtp">{t('email.servidor')}</h2>
            <p className="texto-suave">{t('email.descricao')}</p>
          </div>
        </div>

        <ErroOperacao erro={erroGeral} prefixo={t('config.erroSalvar')} />

        <SwitchConfig
          id="email-ativo"
          checked={form.ativo}
          onChange={(valor) => atualizar('ativo', valor)}
          titulo={t('email.ativo')}
          descricao={t('email.ativoAjuda')}
        />

        <div className="config-grid">
          <CampoConfig
            id="email-host"
            rotulo={t('email.host')}
            erro={erros.host}
            className="config-grid__largo"
          >
            <input
              id="email-host"
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="smtp.prefeitura.gov.br"
              value={form.smtp.host}
              onChange={(evento) => atualizarSmtp('host', evento.target.value)}
            />
          </CampoConfig>
          <CampoConfig id="email-porta" rotulo={t('email.porta')} erro={erros.porta}>
            <input
              id="email-porta"
              type="number"
              min={1}
              max={65535}
              inputMode="numeric"
              value={form.smtp.porta}
              onChange={(evento) => atualizarSmtp('porta', evento.target.value)}
            />
          </CampoConfig>
          <CampoConfig id="email-usuario" rotulo={t('email.usuario')} erro={erros.usuario}>
            <input
              id="email-usuario"
              type="text"
              autoComplete="username"
              value={form.smtp.usuario}
              onChange={(evento) => atualizarSmtp('usuario', evento.target.value)}
            />
          </CampoConfig>
          <CampoConfig
            id="email-senha"
            rotulo={t('email.senha')}
            erro={erros.senha}
            ajuda={form.smtp.temSenha && !form.smtp.removerSenha ? t('email.senhaMantida') : undefined}
          >
            <div className="config-senha">
              <input
                id="email-senha"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="new-password"
                value={form.smtp.senha}
                disabled={form.smtp.removerSenha}
                onChange={(evento) => atualizarSmtp('senha', evento.target.value)}
              />
              <button
                type="button"
                className="botao botao--secundario botao--icone"
                onClick={() => setMostrarSenha((valor) => !valor)}
                aria-label={mostrarSenha ? t('comum.ocultarSenha') : t('comum.mostrarSenha')}
                title={mostrarSenha ? t('comum.ocultarSenha') : t('comum.mostrarSenha')}
              >
                {mostrarSenha ? (
                  <EyeOff aria-hidden="true" />
                ) : (
                  <Eye aria-hidden="true" />
                )}
              </button>
            </div>
          </CampoConfig>
        </div>

        <label className="checkbox checkbox--linha config-checkbox">
          <input
            type="checkbox"
            checked={form.smtp.seguro}
            onChange={(evento) => atualizarSmtp('seguro', evento.target.checked)}
          />
          <span>{t('email.seguro')}</span>
        </label>

        {form.smtp.temSenha && (
          <label className="checkbox checkbox--linha config-checkbox">
            <input
              type="checkbox"
              checked={form.smtp.removerSenha}
              onChange={(evento) => alternarRemoverSenha(evento.target.checked)}
            />
            <span>
              {t('email.removerSenha')}
              {form.smtp.removerSenha ? (
                <small className="campo__ajuda">{t('email.senhaRemoverAjuda')}</small>
              ) : null}
            </span>
          </label>
        )}
      </section>

      <section className="config-secao cartao" aria-labelledby="email-remetente">
        <div className="config-secao__topo">
          <div>
            <h2 id="email-remetente">{t('email.remetenteSecao')}</h2>
            <p className="texto-suave">{t('email.remetenteDescricao')}</p>
          </div>
        </div>

        <div className="config-grid">
          <CampoConfig
            id="email-remetente-nome"
            rotulo={t('email.remetenteNome')}
            ajuda={t('email.remetenteNomeAjuda')}
          >
            <input
              id="email-remetente-nome"
              type="text"
              maxLength={120}
              value={form.smtp.remetenteNome}
              onChange={(evento) => atualizarSmtp('remetenteNome', evento.target.value)}
            />
          </CampoConfig>
          <CampoConfig
            id="email-remetente-email"
            rotulo={t('email.remetenteEmail')}
            erro={erros.remetenteEmail}
          >
            <input
              id="email-remetente-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="nao-responda@prefeitura.gov.br"
              value={form.smtp.remetenteEmail}
              onChange={(evento) => atualizarSmtp('remetenteEmail', evento.target.value)}
            />
          </CampoConfig>
          <CampoConfig
            id="email-responder-para"
            rotulo={t('email.responderPara')}
            erro={erros.responderPara}
            ajuda={t('email.responderParaAjuda')}
          >
            <input
              id="email-responder-para"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={form.smtp.responderPara}
              onChange={(evento) => atualizarSmtp('responderPara', evento.target.value)}
            />
          </CampoConfig>
        </div>

        <ListaTextos
          id="email-destinatarios"
          rotulo={t('email.destinatarios')}
          valores={form.destinatarios}
          onChange={(valores) => atualizar('destinatarios', valores)}
          placeholder="equipe@prefeitura.gov.br"
          tipo="email"
          inputMode="email"
          autoComplete="email"
          ajuda={t('email.destinatariosAjuda')}
          adicionarRotulo={t('email.adicionarDestinatario')}
          textoVazio={t('email.destinatariosVazio')}
          erro={erros.destinatarios}
        />
      </section>

      <section className="config-secao cartao" aria-labelledby="email-eventos">
        <div className="config-secao__topo">
          <div>
            <h2 id="email-eventos">{t('email.eventos')}</h2>
            <p className="texto-suave">{t('email.eventosAjuda')}</p>
          </div>
        </div>
        <div className="config-eventos">
          {eventos.map((evento) => (
            <SwitchConfig
              key={evento.id}
              id={`email-evento-${evento.id}`}
              checked={form.eventos?.[evento.id]?.ativo}
              onChange={(valor) => atualizarEvento(evento.id, valor)}
              titulo={evento.rotulo}
              descricao={evento.descricao}
            />
          ))}
        </div>
      </section>

      <section className="config-secao cartao" aria-labelledby="email-teste">
        <div className="config-secao__topo">
          <div>
            <h2 id="email-teste">{t('email.teste')}</h2>
            <p className="texto-suave">{t('email.testeAjuda')}</p>
          </div>
          <MailCheck className="config-secao__icone" aria-hidden="true" />
        </div>

        <div className="config-teste__linha">
          <CampoConfig
            id="email-teste-destinatario"
            rotulo={t('email.destinatarioTeste')}
            className="config-teste__campo"
          >
            <input
              id="email-teste-destinatario"
              type="email"
              inputMode="email"
              value={destinatarioTeste}
              placeholder={form.destinatarios[0] || 'equipe@prefeitura.gov.br'}
              onChange={(evento) => setDestinatarioTeste(evento.target.value)}
            />
          </CampoConfig>
          <button
            type="button"
            className="botao botao--secundario"
            onClick={testarEnvio}
            disabled={testando}
          >
            {testando ? (
              <LoaderCircle className="girando" aria-hidden="true" />
            ) : (
              <Send aria-hidden="true" />
            )}
            {testando ? t('email.testando') : t('email.enviarTeste')}
          </button>
        </div>

        {teste && (
          <div className={`config-teste ${teste.enviado ? 'is-ok' : 'is-erro'}`} role="status">
            <strong>{t('email.testeResultado')}</strong>
            {teste.enviado ? (
              <p>
                <ShieldCheck aria-hidden="true" />{' '}
                {t('email.testeEnviado', { email: teste.destinatario })}
              </p>
            ) : (
              <ErroOperacao
                erro={{ message: teste.erro, codigo: teste.codigo }}
                prefixo={t('email.testeFalhouTitulo')}
              />
            )}
          </div>
        )}

        <div className="config-historico">
          <div className="config-secao__topo">
            <div>
              <h3>{t('email.historico')}</h3>
              <p className="texto-suave">{t('email.historicoAjuda')}</p>
            </div>
          </div>
          {notificacoes.length === 0 ? (
            <p className="config-vazio">{t('email.historicoVazio')}</p>
          ) : (
            <div className="config-tabela__rolagem">
              <table className="config-tabela">
                <caption className="sr-only">{t('email.historico')}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t('email.evento')}</th>
                    <th scope="col">{t('email.status')}</th>
                    <th scope="col">{t('email.destinatariosColuna')}</th>
                    <th scope="col">{t('email.historicoCodigo')}</th>
                    <th scope="col">{t('email.data')}</th>
                  </tr>
                </thead>
                <tbody>
                  {notificacoes.map((notificacao) => (
                    <tr key={notificacao.id}>
                      <td>{rotuloEvento(notificacao.evento)}</td>
                      <td>
                        <span className={`config-status is-${notificacao.status}`}>
                          {t(CHAVE_STATUS_NOTIFICACAO[notificacao.status] ?? 'email.erroEnvio')}
                        </span>
                      </td>
                      <td>{(notificacao.destinatarios ?? []).join(', ')}</td>
                      <td>
                        {notificacao.codigo ? <code>{notificacao.codigo}</code> : '—'}
                        {notificacao.erro ? (
                          <span className="config-tabela__detalhe">{notificacao.erro}</span>
                        ) : null}
                      </td>
                      <td>{formatarDataHora(notificacao.em)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
