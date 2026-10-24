import { ArrowLeft, LogOut, RefreshCw, Settings2, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PAPEIS_UI } from '../../utils/gestao'

export default function GestaoTopo({
  nomeApp,
  logoMarca,
  usuario,
  podeGerenciarUsuarios,
  mostrarUsuarios,
  carregando,
  rotuloConfiguracoes,
  aoAlternarUsuarios,
  aoAtualizar,
  aoSair,
}) {
  return (
    <header className="gestao-topo">
      <Link className="gestao-topo__marca" to="/">
        <img src={logoMarca} alt="" />
        <span>
          <strong>{nomeApp}</strong>
          <small>Painel de gestão</small>
        </span>
      </Link>
      <div className="gestao-topo__usuario">
        <span className="gestao-topo__pessoa">
          <strong>{usuario.nome}</strong>
          <small>
            {PAPEIS_UI[usuario.papel] ?? usuario.papel}
            {usuario.setor?.nome ? ` · ${usuario.setor.nome}` : ''}
          </small>
        </span>
        <div className="gestao-topo__acoes">
          {podeGerenciarUsuarios && (
            <button
              type="button"
              className="botao botao--secundario botao--pequeno"
              onClick={aoAlternarUsuarios}
            >
              <Users aria-hidden="true" />
              {mostrarUsuarios ? 'Fechar usuários' : 'Usuários'}
            </button>
          )}
          {podeGerenciarUsuarios && (
            <Link className="botao botao--secundario botao--pequeno" to="/gestao/configuracoes">
              <Settings2 aria-hidden="true" />
              {rotuloConfiguracoes}
            </Link>
          )}
          <Link className="botao botao--secundario botao--pequeno" to="/">
            <ArrowLeft aria-hidden="true" />
            Ver app
          </Link>
          <button
            type="button"
            className="botao botao--secundario botao--pequeno"
            onClick={aoAtualizar}
            disabled={carregando}
          >
            <RefreshCw className={carregando ? 'girando' : undefined} aria-hidden="true" />
            Atualizar
          </button>
          <button type="button" className="botao botao--secundario botao--pequeno" onClick={aoSair}>
            <LogOut aria-hidden="true" />
            Sair
          </button>
        </div>
      </div>
    </header>
  )
}
