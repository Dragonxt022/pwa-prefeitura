import {
  ArrowLeft,
  Building2,
  LoaderCircle,
  Pencil,
  ShieldCheck,
  TriangleAlert,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Badge } from '../StatusBadge'
import { PAPEIS_UI } from '../../utils/gestao'
import { mensagemAmigavel } from '../../utils/erros'

function iniciais(nome) {
  return String(nome ?? '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte.charAt(0).toUpperCase())
    .join('')
}

export default function GestaoUsuarios({
  setores,
  formularioAberto,
  usuarioEmEdicao,
  formUsuario,
  usuarios,
  carregandoUsuarios,
  salvandoUsuario,
  erro,
  aoVoltar,
  aoAbrirNovo,
  aoEditar,
  aoFecharFormulario,
  aoSalvar,
  aoAlternar,
  aoMudarCampo,
  aoMudarPapel,
}) {
  const modalRef = useRef(null)
  const gatilhoRef = useRef(null)
  const primeiroCampoRef = useRef(null)

  useEffect(() => {
    if (!formularioAberto) return undefined

    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function aoTeclar(evento) {
      if (evento.key === 'Escape') {
        evento.preventDefault()
        aoFecharFormulario()
        window.requestAnimationFrame(() => gatilhoRef.current?.focus())
        return
      }
      if (evento.key !== 'Tab') return

      const focaveis = modalRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focaveis?.length) return
      const primeiro = focaveis[0]
      const ultimo = focaveis[focaveis.length - 1]

      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault()
        ultimo.focus()
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault()
        primeiro.focus()
      }
    }

    document.addEventListener('keydown', aoTeclar)
    return () => {
      document.body.style.overflow = overflowAnterior
      document.removeEventListener('keydown', aoTeclar)
    }
  }, [aoFecharFormulario, formularioAberto])

  useEffect(() => {
    if (formularioAberto) primeiroCampoRef.current?.focus()
  }, [formularioAberto])

  function fecharFormulario() {
    aoFecharFormulario()
    window.requestAnimationFrame(() => gatilhoRef.current?.focus())
  }

  async function enviarFormulario(evento) {
    const salvo = await aoSalvar(evento)
    if (salvo) {
      aoFecharFormulario()
      window.requestAnimationFrame(() => gatilhoRef.current?.focus())
    }
  }

  return (
    <div className="gestao-painel__conteudo gestao-usuarios">
      <header className="gestao-secao">
        <button type="button" className="gestao-voltar" onClick={aoVoltar}>
          <ArrowLeft aria-hidden="true" />
          Voltar ao dashboard
        </button>
        <div className="gestao-secao__linha">
          <div>
            <p className="gestao-eyebrow">Administração</p>
            <h1>Usuários</h1>
            <p className="texto-suave">
              Cada usuário de setor acessa somente a fila da própria secretaria. Cadastre, edite
              e ative ou desative contas quando necessário.
            </p>
          </div>
          <button
            ref={gatilhoRef}
            type="button"
            className="botao botao--primario"
            onClick={aoAbrirNovo}
          >
            <UserPlus aria-hidden="true" />
            Novo usuário
          </button>
        </div>
      </header>

      <section className="gestao-usuarios__secao" aria-labelledby="titulo-lista-usuarios">
        <div className="gestao-usuarios__topo">
          <div>
            <h2 id="titulo-lista-usuarios">Equipe cadastrada</h2>
            <p className="texto-suave">Contas que acessam o painel de gestão.</p>
          </div>
          <span className="secao__contagem" aria-label={`${usuarios.length} usuários`}>
            {usuarios.length}
          </span>
        </div>

        {carregandoUsuarios ? (
          <p className="carregando" role="status">
            <span className="spinner" aria-hidden="true" />
            Carregando usuários…
          </p>
        ) : usuarios.length === 0 ? (
          <div className="gestao-usuarios__vazio">
            <UsersRound aria-hidden="true" />
            <div>
              <h3>Nenhum usuário cadastrado</h3>
              <p className="texto-suave">Use “Novo usuário” para criar o primeiro acesso.</p>
            </div>
          </div>
        ) : (
          <ul className="gestao-usuarios__lista">
            {usuarios.map((usuarioListado) => (
              <li
                key={usuarioListado.id}
                className={`gestao-usuario-item${usuarioListado.ativo ? '' : ' is-inativo'}`}
              >
                <span className="gestao-usuario-item__avatar" aria-hidden="true">
                  {iniciais(usuarioListado.nome)}
                </span>
                <div className="gestao-usuario-item__info">
                  <div className="gestao-usuario-item__nome">
                    <strong>{usuarioListado.nome}</strong>
                    <Badge tom={usuarioListado.ativo ? 'sucesso' : 'neutro'}>
                      {usuarioListado.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <span>{usuarioListado.email}</span>
                  <span>
                    {PAPEIS_UI[usuarioListado.papel] ?? usuarioListado.papel}
                    {usuarioListado.setor?.nome ? ` · ${usuarioListado.setor.nome}` : ''}
                  </span>
                </div>
                <div className="gestao-usuario-item__acoes">
                  <button
                    type="button"
                    className="botao botao--secundario botao--pequeno"
                    onClick={() => aoEditar(usuarioListado)}
                    aria-label={`Editar ${usuarioListado.nome}`}
                  >
                    <Pencil aria-hidden="true" />
                    Editar
                  </button>
                  <button
                    type="button"
                    className="botao botao--secundario botao--pequeno"
                    onClick={() => aoAlternar(usuarioListado)}
                  >
                    {usuarioListado.ativo ? 'Desativar' : 'Reativar'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {formularioAberto && (
        <div
          className="gestao-modal__fundo"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) fecharFormulario()
          }}
        >
          <section
            ref={modalRef}
            className="gestao-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-formulario-usuario"
          >
            <header className="gestao-modal__topo">
              <button
                type="button"
                className="botao botao--secundario botao--icone"
                onClick={fecharFormulario}
                aria-label={
                  usuarioEmEdicao
                    ? 'Fechar edição de usuário'
                    : 'Fechar formulário de novo usuário'
                }
                title="Fechar"
              >
                <X aria-hidden="true" />
              </button>
              <div>
                <p className="gestao-eyebrow">Equipe</p>
                <h2 id="titulo-formulario-usuario">
                  {usuarioEmEdicao ? 'Editar usuário' : 'Novo usuário'}
                </h2>
              </div>
            </header>

            <form className="gestao-modal__form" onSubmit={enviarFormulario}>
              <div className="gestao-modal__corpo">
                <p className="texto-suave">
                  {usuarioEmEdicao
                    ? 'Atualize os dados de acesso. Deixe a senha em branco para manter a atual.'
                    : 'Defina o papel e, para usuários de setor, a secretaria responsável pela fila.'}
                </p>

                {erro && (
                  <p className="alerta alerta--erro" role="alert">
                    <TriangleAlert aria-hidden="true" />
                    <span>{mensagemAmigavel(erro)}</span>
                  </p>
                )}

                <div className="campo">
                  <label htmlFor="usuario-nome">Nome completo</label>
                  <input
                    ref={primeiroCampoRef}
                    id="usuario-nome"
                    autoComplete="name"
                    value={formUsuario.nome}
                    onChange={(evento) => aoMudarCampo('nome', evento.target.value)}
                    required
                  />
                </div>

                <div className="campo">
                  <label htmlFor="usuario-email">E-mail de acesso</label>
                  <input
                    id="usuario-email"
                    type="email"
                    autoComplete="email"
                    value={formUsuario.email}
                    onChange={(evento) => aoMudarCampo('email', evento.target.value)}
                    aria-describedby="usuario-email-ajuda"
                    required
                  />
                  <p className="campo__ajuda" id="usuario-email-ajuda">
                    O usuário entrará no painel com este e-mail.
                  </p>
                </div>

                <div className="campo">
                  <label htmlFor="usuario-senha">
                    {usuarioEmEdicao ? 'Nova senha (opcional)' : 'Senha inicial'}
                  </label>
                  <input
                    id="usuario-senha"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    value={formUsuario.senha}
                    onChange={(evento) => aoMudarCampo('senha', evento.target.value)}
                    aria-describedby="usuario-senha-ajuda"
                    required={!usuarioEmEdicao}
                  />
                  <p className="campo__ajuda" id="usuario-senha-ajuda">
                    {usuarioEmEdicao
                      ? 'Mínimo de 8 caracteres. Deixe em branco para manter a senha atual.'
                      : 'Mínimo de 8 caracteres. Oriente o usuário a trocar a senha depois.'}
                  </p>
                </div>

                <div className="campo">
                  <label htmlFor="usuario-papel">Papel</label>
                  <select
                    id="usuario-papel"
                    value={formUsuario.papel}
                    onChange={(evento) => aoMudarPapel(evento.target.value)}
                  >
                    <option value="setor">Setor</option>
                    <option value="triagem">Triagem / Protocolo</option>
                    <option value="admin">Administrador geral</option>
                  </select>
                </div>

                {formUsuario.papel === 'setor' && (
                  <div className="campo">
                    <label htmlFor="usuario-setor">Setor</label>
                    <select
                      id="usuario-setor"
                      value={formUsuario.setorId}
                      onChange={(evento) => aoMudarCampo('setorId', evento.target.value)}
                      required
                    >
                      <option value="">Escolha o setor</option>
                      {setores
                        .filter((setor) => !setor.central)
                        .map((setor) => (
                          <option key={setor.id} value={setor.id}>
                            {setor.nome}
                          </option>
                        ))}
                    </select>
                    <p className="campo__ajuda">
                      <Building2 aria-hidden="true" />
                      O usuário verá apenas as solicitações encaminhadas para este setor.
                    </p>
                  </div>
                )}

                <p className="gestao-modal__nota">
                  <ShieldCheck aria-hidden="true" />
                  Apenas administradores podem criar, editar e desativar usuários.
                </p>
              </div>

              <footer className="gestao-modal__rodape">
                <button type="button" className="botao botao--secundario" onClick={fecharFormulario}>
                  Cancelar
                </button>
                <button type="submit" className="botao botao--primario" disabled={salvandoUsuario}>
                  {salvandoUsuario ? (
                    <LoaderCircle className="girando" aria-hidden="true" />
                  ) : usuarioEmEdicao ? (
                    <Pencil aria-hidden="true" />
                  ) : (
                    <UserPlus aria-hidden="true" />
                  )}
                  {salvandoUsuario
                    ? usuarioEmEdicao
                      ? 'Salvando…'
                      : 'Criando…'
                    : usuarioEmEdicao
                      ? 'Salvar alterações'
                      : 'Criar usuário'}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
