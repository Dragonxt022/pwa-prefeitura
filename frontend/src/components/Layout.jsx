import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { IconeBusca, IconeInicio, IconeNova, IconePerfil } from './Icones'

const ITENS = [
  { para: '/', rotulo: 'Início', Icone: IconeInicio, fim: true },
  { para: '/nova-solicitacao', rotulo: 'Solicitar', Icone: IconeNova },
  { para: '/acompanhar', rotulo: 'Acompanhar', Icone: IconeBusca },
  { para: '/perfil', rotulo: 'Perfil', Icone: IconePerfil },
]

export default function Layout() {
  const online = useOnlineStatus()
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="app">
      <a className="pular-para-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>

      <header className="cabecalho">
        <div className="cabecalho__interno">
          <NavLink to="/" className="marca" aria-label="Prefeitura Digital, página inicial">
            <span className="marca__simbolo" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M3 10 12 3.5 21 10" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5.5 9v10.5h13V9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 19.5V14h4v5.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="marca__texto">
              <strong>Prefeitura Digital</strong>
              <small>Piloto de atendimento</small>
            </span>
          </NavLink>

          <nav className="nav-desktop" aria-label="Navegação principal">
            {ITENS.map(({ para, rotulo, fim }) => (
              <NavLink
                key={para}
                to={para}
                end={fim}
                className={({ isActive }) => `nav-desktop__link${isActive ? ' is-ativo' : ''}`}
              >
                {rotulo}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {!online && (
        <div className="faixa-offline" role="status">
          Você está offline. As telas já visitadas continuam disponíveis; envios serão bloqueados.
        </div>
      )}

      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="rodape">
        <p>
          Ambiente de demonstração com <strong>dados fictícios</strong>. Não envie informações pessoais
          reais neste piloto.
        </p>
        <p className="rodape__versao">Prefeitura Digital · v0.1.0 · PWA offline-first</p>
      </footer>

      <nav className="nav-mobile" aria-label="Navegação principal">
        {ITENS.map(({ para, rotulo, Icone, fim }) => (
          <NavLink
            key={para}
            to={para}
            end={fim}
            className={({ isActive }) => `nav-mobile__link${isActive ? ' is-ativo' : ''}`}
          >
            <Icone className="nav-mobile__icone" />
            <span>{rotulo}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
