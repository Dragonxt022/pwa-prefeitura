import {
  ExternalLink,
  LogOut,
  Menu,
  RefreshCw,
  Settings2,
  UserRound,
  X,
} from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PAPEIS_UI } from '../../utils/gestao'

export default function GestaoTopo({
  nomeApp,
  logoMarca,
  usuario,
  podeGerenciarUsuarios,
  carregando,
  rotuloConfiguracoes,
  aoAtualizar,
  aoSair,
}) {
  const [menuAberto, setMenuAberto] = useState(false)
  const menuRef = useRef(null)
  const gatilhoRef = useRef(null)
  const menuId = useId()

  useEffect(() => {
    if (!menuAberto) return undefined

    function fecharAoClicarFora(evento) {
      if (!menuRef.current?.contains(evento.target)) setMenuAberto(false)
    }

    function fecharAoTeclar(evento) {
      if (evento.key !== 'Escape') return
      setMenuAberto(false)
      gatilhoRef.current?.focus()
    }

    document.addEventListener('pointerdown', fecharAoClicarFora)
    document.addEventListener('keydown', fecharAoTeclar)
    return () => {
      document.removeEventListener('pointerdown', fecharAoClicarFora)
      document.removeEventListener('keydown', fecharAoTeclar)
    }
  }, [menuAberto])

  function fecharMenu() {
    setMenuAberto(false)
  }

  function atualizarAgora() {
    fecharMenu()
    aoAtualizar()
  }

  async function sairAgora() {
    fecharMenu()
    await aoSair()
  }

  return (
    <header className="gestao-topo">
      <div className="gestao-topo__interno">
        <Link className="gestao-topo__marca" to="/" aria-label={`${nomeApp}, ir para o app do cidadão`}>
          <img src={logoMarca} alt="" />
          <span className="gestao-topo__texto">
            <strong>{nomeApp}</strong>
            <small>{usuario.nome}</small>
          </span>
        </Link>

        <div className="gestao-topo__menu" ref={menuRef}>
          <button
            ref={gatilhoRef}
            type="button"
            className="gestao-topo__gatilho"
            aria-label={menuAberto ? 'Fechar menu da conta' : 'Abrir menu da conta'}
            aria-expanded={menuAberto}
            aria-controls={menuAberto ? menuId : undefined}
            onClick={() => setMenuAberto((aberto) => !aberto)}
          >
            {menuAberto ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>

          {menuAberto && (
            <div className="gestao-menu" id={menuId}>
              <div className="gestao-menu__conta">
                <span className="gestao-menu__avatar" aria-hidden="true">
                  <UserRound />
                </span>
                <span className="gestao-menu__identidade">
                  <strong>{usuario.nome}</strong>
                  <small>
                    {PAPEIS_UI[usuario.papel] ?? usuario.papel}
                    {usuario.setor?.nome ? ` · ${usuario.setor.nome}` : ''}
                  </small>
                </span>
              </div>

              <div className="gestao-menu__grupo">
                {podeGerenciarUsuarios && (
                  <Link
                    className="gestao-menu__item"
                    to="/gestao/configuracoes"
                    onClick={fecharMenu}
                  >
                    <Settings2 aria-hidden="true" />
                    <span>{rotuloConfiguracoes}</span>
                  </Link>
                )}
                <button
                  type="button"
                  className="gestao-menu__item"
                  onClick={atualizarAgora}
                  disabled={carregando}
                >
                  <RefreshCw className={carregando ? 'girando' : undefined} aria-hidden="true" />
                  <span>{carregando ? 'Atualizando…' : 'Atualizar dados'}</span>
                </button>
                <Link className="gestao-menu__item" to="/" onClick={fecharMenu}>
                  <ExternalLink aria-hidden="true" />
                  <span>Ver app do cidadão</span>
                </Link>
              </div>

              <div className="gestao-menu__grupo gestao-menu__grupo--sair">
                <button type="button" className="gestao-menu__item" onClick={sairAgora}>
                  <LogOut aria-hidden="true" />
                  <span>Sair da conta</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
