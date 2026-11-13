import { Lock, Mail, ShieldCheck, Trash2, UserRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useConfiguracoes } from '../contexto/useConfiguracoes'

const VERSAO = '13/11/2026'

function Bloco({ Icone, titulo, children }) {
  return (
    <section className="cartao" aria-labelledby={`privacidade-${titulo}`}>
      <div className="cartao__cabecalho">
        <h2 id={`privacidade-${titulo}`}>
          <Icone aria-hidden="true" />
          {titulo}
        </h2>
      </div>
      {children}
    </section>
  )
}

export default function Privacidade() {
  const { identidade } = useConfiguracoes()
  const nome = identidade.nome || 'Prefeitura Digital'
  const emailContato = identidade.emails?.[0] || null
  const telefoneContato = identidade.telefones?.[0] || null

  return (
    <div className="pagina pagina--estreita">
      <header className="cabecalho-pagina">
        <p className="cabecalho-pagina__sobre">Privacidade</p>
        <h1>Aviso de Privacidade e LGPD</h1>
        <p className="texto-suave">
          Como o {nome} trata os dados pessoais usados no atendimento ao cidadão.
          Versão de {VERSAO}.
        </p>
      </header>

      <div className="pilha">
        <Bloco Icone={UserRound} titulo="Dados coletados">
          <p>Para criar a conta e abrir solicitações, coletamos apenas o necessário:</p>
          <ul className="lista-simples">
            <li>nome completo e e-mail;</li>
            <li>telefone com DDD;</li>
            <li>endereço: CEP, logradouro, número, complemento, bairro, cidade e UF;</li>
            <li>senha, guardada somente como hash scrypt (nunca em texto puro);</li>
            <li>data e versão do consentimento, para comprovar a autorização.</li>
          </ul>
          <p className="texto-suave">
            Não pedimos CPF, documento de identidade, dados bancários ou dados sensíveis. A foto,
            quando anexada a uma solicitação, é usada apenas para o atendimento.
          </p>
        </Bloco>

        <Bloco Icone={ShieldCheck} titulo="Finalidade e base legal">
          <p>
            Os dados são usados para identificar o cidadão, preencher automaticamente as solicitações,
            encaminhar o pedido ao setor responsável, manter contato sobre o atendimento e garantir a
            segurança da conta.
          </p>
          <p>
            O tratamento ocorre com base no consentimento do titular e na execução de políticas
            públicas de atendimento municipal, conforme a Lei nº 13.709/2018 (LGPD). O consentimento
            pode ser revogado a qualquer momento pela exclusão da conta.
          </p>
        </Bloco>

        <Bloco Icone={Mail} titulo="Compartilhamento e serviços externos">
          <p>
            Os dados de contato e endereço são visíveis apenas para os setores responsáveis pelo
            atendimento e para a triagem municipal. Não vendemos dados pessoais nem os usamos para
            publicidade.
          </p>
          <p>
            A consulta de CEP usa o serviço público ViaCEP e envia somente o número do CEP, nunca o
            nome, e-mail ou telefone. A infraestrutura do sistema é hospedada em servidor próprio da
            prefeitura.
          </p>
        </Bloco>

        <Bloco Icone={Lock} titulo="Segurança">
          <p>
            O acesso usa senha individual e sessão em cookie HttpOnly; as senhas são guardadas com
            hash e comparação segura. As rotas de perfil exigem a sessão do próprio cidadão e não
            aceitam identificadores enviados pelo navegador. As respostas com dados pessoais não são
            armazenadas em cache nem no Service Worker do aplicativo.
          </p>
        </Bloco>

        <Bloco Icone={Trash2} titulo="Retenção e direitos do titular">
          <p>
            A conta permanece ativa até que você a exclua. A exclusão apaga nome, e-mail, telefone,
            endereço e senha e encerra todas as sessões. Solicitações já registradas permanecem no
            histórico do atendimento público para cumprir a finalidade do serviço e eventuais
            obrigações legais; o contato e o endereço informados no pedido podem ser anonimizados
            mediante solicitação.
          </p>
          <p>Você pode, a qualquer momento:</p>
          <ul className="lista-simples">
            <li>confirmar a existência de tratamento e acessar seus dados;</li>
            <li>corrigir dados incompletos ou desatualizados;</li>
            <li>baixar uma cópia dos seus dados em formato JSON;</li>
            <li>excluir a conta e revogar o consentimento;</li>
            <li>pedir informação sobre compartilhamento e sobre a retenção.</li>
          </ul>
          <p>
            O acesso, a correção, o download e a exclusão estão disponíveis na página{' '}
            <Link to="/perfil">Perfil</Link>. Para outros pedidos, procure o canal de atendimento
            municipal
            {emailContato ? (
              <>
                {' '}pelo e-mail <a href={`mailto:${emailContato}`}>{emailContato}</a>
              </>
            ) : null}
            {telefoneContato ? <> ou pelo telefone {telefoneContato}</> : null}
            .
          </p>
        </Bloco>

        <p className="texto-suave">
          Este aviso pode ser atualizado. A versão aceita no cadastro fica registrada na conta para
          fins de comprovação.
        </p>
      </div>
    </div>
  )
}
