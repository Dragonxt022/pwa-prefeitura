import { LoaderCircle, UserPlus, X } from 'lucide-react'
import { PAPEIS_UI } from '../../utils/gestao'

export default function GestaoUsuarios({
  setores,
  formUsuario,
  usuarios,
  carregandoUsuarios,
  salvandoUsuario,
  aoFechar,
  aoCriar,
  aoAlternar,
  aoMudarCampo,
  aoMudarPapel,
}) {
  return (
    <section className="gestao-usuarios cartao" aria-labelledby="titulo-usuarios">
      <div className="secao__cabecalho">
        <div>
          <h2 id="titulo-usuarios">Usuários e setores</h2>
          <p className="texto-suave">
            Cada usuário de setor acessa somente a fila da própria secretaria.
          </p>
        </div>
        <button
          type="button"
          className="botao botao--secundario botao--icone"
          onClick={aoFechar}
          aria-label="Fechar usuários"
          title="Fechar usuários"
        >
          <X aria-hidden="true" />
        </button>
      </div>

      <form className="gestao-usuarios__form" onSubmit={aoCriar}>
        <div className="campo">
          <label htmlFor="usuario-nome">Nome</label>
          <input
            id="usuario-nome"
            value={formUsuario.nome}
            onChange={(evento) => aoMudarCampo('nome', evento.target.value)}
            required
          />
        </div>
        <div className="campo">
          <label htmlFor="usuario-email">E-mail</label>
          <input
            id="usuario-email"
            type="email"
            value={formUsuario.email}
            onChange={(evento) => aoMudarCampo('email', evento.target.value)}
            required
          />
        </div>
        <div className="campo">
          <label htmlFor="usuario-senha">Senha inicial</label>
          <input
            id="usuario-senha"
            type="password"
            minLength={8}
            value={formUsuario.senha}
            onChange={(evento) => aoMudarCampo('senha', evento.target.value)}
            required
          />
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
          </div>
        )}
        <button type="submit" className="botao botao--primario" disabled={salvandoUsuario}>
          {salvandoUsuario ? (
            <LoaderCircle className="girando" aria-hidden="true" />
          ) : (
            <UserPlus aria-hidden="true" />
          )}
          {salvandoUsuario ? 'Criando…' : 'Criar usuário'}
        </button>
      </form>

      {carregandoUsuarios ? (
        <p className="carregando" role="status">
          <span className="spinner" aria-hidden="true" />
          Carregando usuários…
        </p>
      ) : (
        <ul className="gestao-usuarios__lista">
          {usuarios.map((usuarioListado) => (
            <li key={usuarioListado.id} className="gestao-usuario-item">
              <div>
                <strong>{usuarioListado.nome}</strong>
                <span>
                  {usuarioListado.email} · {PAPEIS_UI[usuarioListado.papel]}
                  {usuarioListado.setor?.nome ? ` · ${usuarioListado.setor.nome}` : ''}
                </span>
              </div>
              <button
                type="button"
                className="botao botao--secundario botao--pequeno"
                onClick={() => aoAlternar(usuarioListado)}
              >
                {usuarioListado.ativo ? 'Desativar' : 'Reativar'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
