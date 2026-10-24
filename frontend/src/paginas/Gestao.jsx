import { Check, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useEffect } from 'react'
import logoColorido from '../assets/logo-icone-colorido.png'
import { Badge } from '../componentes/StatusBadge'
import GestaoAcoes from '../componentes/gestao/GestaoAcoes'
import GestaoDetalhe from '../componentes/gestao/GestaoDetalhe'
import GestaoFiltros from '../componentes/gestao/GestaoFiltros'
import GestaoImpressao from '../componentes/gestao/GestaoImpressao'
import GestaoLista from '../componentes/gestao/GestaoLista'
import GestaoLogin from '../componentes/gestao/GestaoLogin'
import GestaoResumo from '../componentes/gestao/GestaoResumo'
import GestaoTopo from '../componentes/gestao/GestaoTopo'
import GestaoTransferencia from '../componentes/gestao/GestaoTransferencia'
import GestaoUsuarios from '../componentes/gestao/GestaoUsuarios'
import { useConfiguracoes } from '../contexto/Configuracoes.jsx'
import { useGestaoFila } from '../hooks/useGestaoFila'
import { useGestaoImpressao } from '../hooks/useGestaoImpressao'
import { useGestaoSessao } from '../hooks/useGestaoSessao'
import { useGestaoTransferencia } from '../hooks/useGestaoTransferencia'
import { useGestaoUsuarios } from '../hooks/useGestaoUsuarios'
import { useI18n } from '../i18n/index.jsx'

export default function Gestao() {
  const { identidade } = useConfiguracoes()
  const { t } = useI18n()
  const sessao = useGestaoSessao()
  const fila = useGestaoFila({
    usuario: sessao.usuario,
    aoSessaoExpirada: sessao.expirar,
  })
  const usuarios = useGestaoUsuarios({
    setores: fila.setores,
    setSetores: fila.setSetores,
    definirErro: fila.definirErro,
    definirMensagem: fila.definirMensagem,
  })
  const transferencia = useGestaoTransferencia({
    usuario: sessao.usuario,
    setores: fila.setores,
    filtros: fila.filtros,
    carregar: fila.carregar,
    definirSelecionada: fila.definirSelecionada,
    definirErro: fila.definirErro,
    definirMensagem: fila.definirMensagem,
  })
  const impressao = useGestaoImpressao({
    filtros: fila.filtros,
    servicos: fila.servicos,
    setores: fila.setores,
    definirErro: fila.definirErro,
  })

  const usuario = sessao.usuario
  const nomeApp = identidade.nome || 'Prefeitura Digital'
  const logoMarca = identidade.logo || logoColorido
  const limparFila = fila.limpar
  const limparUsuarios = usuarios.limpar
  const limparTransferencia = transferencia.limpar
  const limparImpressao = impressao.limpar

  useEffect(() => {
    if (usuario) return
    limparFila()
    limparUsuarios()
    limparTransferencia()
    limparImpressao()
  }, [limparFila, limparImpressao, limparTransferencia, limparUsuarios, usuario])

  function entrar(evento) {
    limparFila()
    limparUsuarios()
    limparTransferencia()
    limparImpressao()
    return sessao.entrar(evento)
  }

  async function sair() {
    await sessao.sair()
    limparFila()
    limparUsuarios()
    limparTransferencia()
    limparImpressao()
  }

  function alternarUsuarios() {
    if (usuarios.mostrarUsuarios) usuarios.fechar()
    else usuarios.abrir()
  }

  function atualizarFila() {
    void fila.carregar(fila.filtros)
  }

  function imprimirSelecionados() {
    impressao.imprimir(fila.itensSelecionados, 'Solicitações selecionadas')
  }

  function imprimirFiltro() {
    impressao.imprimir(fila.dados.dados, 'Resultado do filtro')
  }

  if (!usuario) {
    return (
      <GestaoLogin
        logoMarca={logoMarca}
        nomeApp={nomeApp}
        email={sessao.email}
        senha={sessao.senha}
        lembrar={sessao.lembrar}
        erroLogin={sessao.erroLogin}
        entrando={sessao.entrando}
        verificandoSessao={sessao.verificandoSessao}
        aoMudarEmail={sessao.setEmail}
        aoMudarSenha={sessao.setSenha}
        aoMudarLembrar={sessao.setLembrar}
        aoEntrar={entrar}
      />
    )
  }

  return (
    <div className="gestao">
      <a className="pular-para-conteudo" href="#gestao-conteudo">
        Pular para o conteúdo
      </a>
      <GestaoTopo
        nomeApp={nomeApp}
        logoMarca={logoMarca}
        usuario={usuario}
        podeGerenciarUsuarios={fila.podeGerenciarUsuarios}
        mostrarUsuarios={usuarios.mostrarUsuarios}
        carregando={fila.carregando}
        rotuloConfiguracoes={t('admin.configuracoes')}
        aoAlternarUsuarios={alternarUsuarios}
        aoAtualizar={atualizarFila}
        aoSair={sair}
      />

      <main id="gestao-conteudo" className="gestao-conteudo" tabIndex={-1}>
        <div className="gestao-titulo">
          <div>
            <p className="cabecalho-pagina__sobre">Operação</p>
            <h1>Solicitações</h1>
            <p className="texto-suave">
              {fila.podeVerTodos
                ? 'Fila central e setores em um só lugar.'
                : `Fila do setor ${usuario.setor?.nome ?? 'atribuído'}. Você vê apenas as solicitações encaminhadas para sua equipe.`}
            </p>
          </div>
          <div className="gestao-titulo__selos">
            <span className="gestao-titulo__selo">
              <ShieldCheck aria-hidden="true" />
              Acesso protegido
            </span>
            <Badge tom={sessao.triagemAutomatica ? 'info' : 'neutro'}>
              {sessao.triagemAutomatica ? 'Triagem automática ativa' : 'Triagem manual'}
            </Badge>
          </div>
        </div>

        <GestaoResumo estatisticas={fila.estatisticas} />

        {usuarios.mostrarUsuarios && fila.podeGerenciarUsuarios && (
          <GestaoUsuarios
            setores={fila.setores}
            formUsuario={usuarios.formUsuario}
            usuarios={usuarios.usuarios}
            carregandoUsuarios={usuarios.carregandoUsuarios}
            salvandoUsuario={usuarios.salvandoUsuario}
            aoFechar={usuarios.fechar}
            aoCriar={usuarios.criarUsuario}
            aoAlternar={usuarios.alternarUsuario}
            aoMudarCampo={usuarios.atualizarCampo}
            aoMudarPapel={usuarios.alterarPapel}
          />
        )}

        <GestaoFiltros
          filtros={fila.filtros}
          servicos={fila.servicos}
          setores={fila.setores}
          podeVerTodos={fila.podeVerTodos}
          aoAtualizarFiltro={fila.atualizarFiltro}
          aoLimpar={fila.limparFiltros}
        />

        <GestaoAcoes
          totalVisivel={fila.dados.dados.length}
          totalSelecionado={fila.itensSelecionados.length}
          todosVisiveisSelecionados={fila.todosVisiveisSelecionados}
          aoAlternarTodos={fila.alternarTodosVisiveis}
          aoImprimirSelecionados={imprimirSelecionados}
          aoImprimirFiltro={imprimirFiltro}
        />

        {fila.erro && (
          <p className="alerta alerta--erro" role="alert">
            <TriangleAlert aria-hidden="true" />
            <span>{fila.erro.message}</span>
          </p>
        )}
        {fila.mensagem && (
          <p className="alerta alerta--sucesso" role="status">
            <Check aria-hidden="true" />
            <span>{fila.mensagem}</span>
          </p>
        )}

        <div className={`gestao-grid${fila.selecionada ? ' tem-detalhe' : ''}`}>
          <GestaoLista
            dados={fila.dados}
            carregando={fila.carregando}
            selecionada={fila.selecionada}
            selecionados={fila.selecionados}
            servicosPorId={fila.servicosPorId}
            aoAbrirDetalhe={fila.abrirDetalhe}
            aoAlternarSelecionado={fila.alternarSelecionado}
          />

          {fila.selecionada && (
            <GestaoDetalhe
              selecionada={fila.selecionada}
              detalheRef={fila.detalheRef}
              formStatus={fila.formStatus}
              salvandoStatus={fila.salvandoStatus}
              aoFechar={fila.fecharDetalhe}
              aoAbrirTransferencia={transferencia.abrir}
              aoSalvarAtualizacao={fila.salvarAtualizacao}
              aoAtualizarFormStatus={fila.atualizarFormStatus}
            />
          )}
        </div>
      </main>

      {transferencia.aberto && (
        <GestaoTransferencia
          solicitacao={transferencia.solicitacao}
          formTransferencia={transferencia.formTransferencia}
          setoresParaTransferencia={transferencia.setoresParaTransferencia}
          servicos={fila.servicos}
          salvandoTransferencia={transferencia.salvandoTransferencia}
          erro={fila.erro}
          aoFechar={transferencia.fechar}
          aoAlterarTipo={transferencia.alterarTipo}
          aoAtualizarCampo={transferencia.atualizarCampo}
          aoSalvar={transferencia.salvar}
        />
      )}

      {impressao.impressao && (
        <GestaoImpressao impressao={impressao.impressao} nomeApp={nomeApp} />
      )}
    </div>
  )
}
