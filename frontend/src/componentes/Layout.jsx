import {
  BellRing,
  Check,
  ExternalLink,
  Home,
  Mail,
  Phone,
  Plus,
  Search,
  UploadCloud,
  UserRound,
  WifiOff,
} from 'lucide-react'
import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import logoColorido from '../assets/logo-icone-colorido.png'
import logoBranco from '../assets/logo-icone-branco.png'
import { useConfiguracoes } from '../contexto/useConfiguracoes.js'
import { useAtualizacoes } from '../hooks/useAtualizacoes'
import { useFilaSolicitacoes } from '../hooks/useFilaSolicitacoes'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { ROTULOS_REDES } from '../utils/identidade'
import { useI18n } from '../i18n/useI18n.js'

const ITENS = [
  { para: '/', rotulo: 'Início', Icone: Home, fim: true },
  { para: '/nova-solicitacao', rotulo: 'Solicitar', Icone: Plus },
  { para: '/acompanhar', rotulo: 'Acompanhar', Icone: Search },
  { para: '/perfil', rotulo: 'Perfil', Icone: UserRound },
]

function rotuloComBadge(rotulo, badge) {
  if (!badge) return undefined
  return `${rotulo}, ${badge} ${badge === 1 ? 'atualização' : 'atualizações'}`
}

export default function Layout() {
  const online = useOnlineStatus()
  const { pathname } = useLocation()
  const { naoLidas } = useAtualizacoes()
  const { pendentes, envioRecente } = useFilaSolicitacoes()
  const { identidade, rodape } = useConfiguracoes()
  const { t } = useI18n()
  const nomeApp = identidade.nome || 'Prefeitura Digital'
  const logo = identidade.logo || null
  const contatos = [
    ...(identidade.emails ?? []).map((email) => ({
      tipo: 'email',
      valor: email,
      href: `mailto:${email}`,
      Icone: Mail,
    })),
    ...(identidade.telefones ?? []).map((telefone) => ({
      tipo: 'telefone',
      valor: telefone,
      href: `tel:${telefone.replace(/[^\d+]/g, '')}`,
      Icone: Phone,
    })),
  ]
  const redes = identidade.redesSociais ?? []

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  const itens = ITENS.map((item) =>
    item.para === '/acompanhar' ? { ...item, badge: naoLidas } : item,
  )

  return (
    <div className="app">
      <a className="pular-para-conteudo" href="#conteudo">
        {t('app.pularConteudo')}
      </a>

      <header className="cabecalho">
        <div className="cabecalho__interno">
          <NavLink to="/" className="marca" aria-label={`${nomeApp}, página inicial`}>
            <span className="marca__simbolo" aria-hidden="true">
              {logo ? (
                <img src={logo} alt="" />
              ) : (
                <picture>
                  <source srcSet={logoBranco} media="(prefers-color-scheme: dark)" />
                  <img src={logoColorido} alt="" />
                </picture>
              )}
            </span>
            <span className="marca__nome">{nomeApp}</span>
            <span className="marca__selo">demo</span>
          </NavLink>

          <nav className="nav-desktop" aria-label="Navegação principal">
            {itens.map(({ para, rotulo, Icone, fim, badge }) => (
              <NavLink
                key={para}
                to={para}
                end={fim}
                className={({ isActive }) => `nav-desktop__link${isActive ? ' is-ativo' : ''}`}
                aria-label={rotuloComBadge(rotulo, badge)}
              >
                <span className="nav-desktop__icone">
                  <Icone aria-hidden="true" />
                  {badge > 0 && <span className="nav-desktop__badge" aria-hidden="true" />}
                </span>
                <span>{rotulo}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {!online && (
        <div className="faixa-offline" role="status">
          <WifiOff aria-hidden="true" />
          <span>Sem conexão — usando dados salvos.</span>
        </div>
      )}

      {pendentes > 0 && (
        <div className="faixa-fila" role="status">
          <UploadCloud aria-hidden="true" />
          <span>
            {pendentes === 1
              ? '1 pedido aguardando conexão para ser enviado.'
              : `${pendentes} pedidos aguardando conexão para serem enviados.`}
          </span>
        </div>
      )}

      {envioRecente && (
        <div
          key={`${envioRecente.protocolo}-${envioRecente.em}`}
          className="faixa-envio faixa-envio--temporaria"
          role="status"
        >
          <Check aria-hidden="true" />
          <span>Pedido enviado: {envioRecente.protocolo}</span>
          <Link to={`/acompanhar?protocolo=${envioRecente.protocolo}`}>Acompanhar</Link>
        </div>
      )}

      <main id="conteudo" className="conteudo" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className="rodape">
        <div className="rodape__identidade">
          <span className="rodape__ponto" aria-hidden="true" />
          <span>{rodape}</span>
        </div>

        {(contatos.length > 0 || redes.length > 0) && (
          <div className="rodape__dados">
            {contatos.map(({ tipo, valor, href, Icone }) => (
              <a key={`${tipo}-${valor}`} href={href} className="rodape__contato">
                <Icone aria-hidden="true" />
                <span>{valor}</span>
              </a>
            ))}
            {redes.map((rede) => (
              <a
                key={rede.id}
                href={rede.url}
                className="rodape__rede"
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`${rede.rotulo || ROTULOS_REDES[rede.rede] || rede.rede} (abre em nova aba)`}
              >
                <ExternalLink aria-hidden="true" />
                <span>{rede.rotulo || ROTULOS_REDES[rede.rede] || rede.rede}</span>
              </a>
            ))}
          </div>
        )}

        <div className="rodape__links">
          <Link to="/servicos">{t('app.catalogo')}</Link>
          <Link to="/gestao">{t('app.gestao')}</Link>
          {naoLidas > 0 && (
            <span className="rodape__aviso">
              <BellRing aria-hidden="true" />
              {naoLidas === 1
                ? t('app.atualizacao')
                : t('app.atualizacoes', { quantidade: naoLidas })}
            </span>
          )}
        </div>
      </footer>

      <nav className="nav-mobile" aria-label="Navegação principal">
        {itens.map(({ para, rotulo, Icone, fim, badge }) => (
          <NavLink
            key={para}
            to={para}
            end={fim}
            className={({ isActive }) => `nav-mobile__link${isActive ? ' is-ativo' : ''}`}
            aria-label={rotuloComBadge(rotulo, badge)}
          >
            <span className="nav-mobile__icone">
              <Icone aria-hidden="true" />
              {badge > 0 && (
                <span className="nav-mobile__badge" aria-hidden="true">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </span>
            <span>{rotulo}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
