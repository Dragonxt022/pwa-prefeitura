import {
  LoaderCircle,
  Lock,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { consultarCep } from '../../servicos/cep'
import { formatarCep } from '../../utils/solicitacao'

const VAZIO = {
  nome: '',
  email: '',
  senha: '',
  telefone: '',
  cep: '',
  logradouro: '',
  numero: '',
  complemento: '',
  bairro: '',
  cidade: '',
  uf: '',
  consentimento: false,
}

function somenteDigitos(valor) {
  return String(valor ?? '').replace(/\D/g, '')
}

function formatarTelefone(valor) {
  const digitos = somenteDigitos(valor).slice(0, 11)
  if (digitos.length <= 2) return digitos
  const ddd = digitos.slice(0, 2)
  const resto = digitos.slice(2)
  const corte = resto.length > 8 ? 5 : 4
  return `(${ddd}) ${resto.slice(0, corte)}-${resto.slice(corte)}`
}

function validar(form, { cadastro }) {
  const erros = {}
  if (form.nome.trim().length < 3) erros.nome = 'Informe seu nome completo.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    erros.email = 'Informe um e-mail válido.'
  }
  if (cadastro && form.senha.length < 8) {
    erros.senha = 'A senha precisa ter pelo menos 8 caracteres.'
  }
  if (!cadastro && form.senha && form.senha.length < 8) {
    erros.senha = 'A nova senha precisa ter pelo menos 8 caracteres.'
  }
  const telefone = somenteDigitos(form.telefone)
  if (telefone.length < 10 || telefone.length > 11) {
    erros.telefone = 'Informe o telefone com DDD.'
  }
  if (somenteDigitos(form.cep).length !== 8) erros.cep = 'Informe um CEP com 8 dígitos.'
  if (form.logradouro.trim().length < 3) erros.logradouro = 'Informe o logradouro.'
  if (!form.numero.trim()) erros.numero = 'Informe o número.'
  if (form.bairro.trim().length < 2) erros.bairro = 'Informe o bairro.'
  if (form.cidade.trim().length < 2) erros.cidade = 'Informe a cidade.'
  if (!/^[A-Za-z]{2}$/.test(form.uf.trim())) erros.uf = 'Use a sigla do estado com 2 letras.'
  if (cadastro && !form.consentimento) {
    erros.consentimento = 'Aceite o Aviso de Privacidade para continuar.'
  }
  return erros
}

export default function PerfilFormulario({
  modo = 'cadastro',
  inicial = VAZIO,
  errosServidor = {},
  erroGeral = null,
  enviando = false,
  aoEnviar,
  aoCancelar,
}) {
  const cadastro = modo === 'cadastro'
  const [form, setForm] = useState({ ...VAZIO, ...inicial })
  const [erros, setErros] = useState({})
  const [buscandoCep, setBuscandoCep] = useState(false)
  const [mensagemCep, setMensagemCep] = useState('')

  const listaErros = { ...erros, ...errosServidor }

  function alterar(campo, valor) {
    setForm((atual) => ({ ...atual, [campo]: valor }))
    setErros((atuais) => {
      if (!(campo in atuais)) return atuais
      const { [campo]: _removido, ...resto } = atuais
      return resto
    })
  }

  async function buscarCep() {
    const digitos = somenteDigitos(form.cep)
    if (digitos.length !== 8) {
      setMensagemCep('Informe um CEP com 8 dígitos.')
      return
    }
    setBuscandoCep(true)
    setMensagemCep('')
    try {
      const dados = await consultarCep(digitos)
      if (dados.erro) {
        setMensagemCep('CEP não encontrado. Confira os números.')
        return
      }
      setForm((atual) => ({
        ...atual,
        logradouro: dados.logradouro || atual.logradouro,
        bairro: dados.bairro || atual.bairro,
        cidade: dados.localidade || atual.cidade,
        uf: (dados.uf || atual.uf).toUpperCase(),
      }))
      setMensagemCep('Endereço localizado. Complete o número e o complemento.')
    } catch {
      setMensagemCep('Não foi possível consultar o CEP. Preencha manualmente.')
    } finally {
      setBuscandoCep(false)
    }
  }

  function enviar(evento) {
    evento.preventDefault()
    const proximos = validar(form, { cadastro })
    setErros(proximos)
    if (Object.keys(proximos).length > 0) return

    aoEnviar({
      nome: form.nome.trim(),
      email: form.email.trim().toLowerCase(),
      ...(form.senha ? { senha: form.senha } : {}),
      telefone: somenteDigitos(form.telefone),
      cep: somenteDigitos(form.cep),
      logradouro: form.logradouro.trim(),
      numero: form.numero.trim(),
      complemento: form.complemento.trim(),
      bairro: form.bairro.trim(),
      cidade: form.cidade.trim(),
      uf: form.uf.trim().toUpperCase(),
      ...(cadastro ? { consentimento: form.consentimento, lembrar: true } : {}),
    })
  }

  return (
    <form className="perfil-formulario" onSubmit={enviar} noValidate>
      {erroGeral && (
        <p className="alerta alerta--erro" role="alert">
          {erroGeral}
        </p>
      )}

      <div className="campo">
        <label htmlFor="perfil-nome">Nome completo</label>
        <div className="campo__controle">
          <UserRound aria-hidden="true" />
          <input
            id="perfil-nome"
            type="text"
            autoComplete="name"
            maxLength={120}
            value={form.nome}
            onChange={(evento) => alterar('nome', evento.target.value)}
            aria-invalid={Boolean(listaErros.nome)}
            aria-describedby={listaErros.nome ? 'erro-perfil-nome' : undefined}
          />
        </div>
        {listaErros.nome && <p className="campo__erro" id="erro-perfil-nome">{listaErros.nome}</p>}
      </div>

      <div className="perfil-formulario__grade">
        <div className="campo">
          <label htmlFor="perfil-email">E-mail</label>
          <div className="campo__controle">
            <Mail aria-hidden="true" />
            <input
              id="perfil-email"
              type="email"
              autoComplete="email"
              maxLength={180}
              value={form.email}
              onChange={(evento) => alterar('email', evento.target.value)}
              aria-invalid={Boolean(listaErros.email)}
              aria-describedby={listaErros.email ? 'erro-perfil-email' : undefined}
            />
          </div>
          {listaErros.email && <p className="campo__erro" id="erro-perfil-email">{listaErros.email}</p>}
        </div>

        <div className="campo">
          <label htmlFor="perfil-telefone">Telefone com DDD</label>
          <div className="campo__controle">
            <Phone aria-hidden="true" />
            <input
              id="perfil-telefone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              maxLength={15}
              value={form.telefone}
              onChange={(evento) => alterar('telefone', formatarTelefone(evento.target.value))}
              aria-invalid={Boolean(listaErros.telefone)}
              aria-describedby={listaErros.telefone ? 'erro-perfil-telefone' : undefined}
            />
          </div>
          {listaErros.telefone && (
            <p className="campo__erro" id="erro-perfil-telefone">{listaErros.telefone}</p>
          )}
        </div>
      </div>

      <div className="campo">
        <label htmlFor="perfil-senha">
          {cadastro ? 'Senha' : 'Nova senha'}
          {!cadastro && <span className="campo__opcional"> (deixe em branco para manter)</span>}
        </label>
        <div className="campo__controle">
          <Lock aria-hidden="true" />
          <input
            id="perfil-senha"
            type="password"
            autoComplete={cadastro ? 'new-password' : 'new-password'}
            minLength={8}
            maxLength={72}
            value={form.senha}
            onChange={(evento) => alterar('senha', evento.target.value)}
            aria-invalid={Boolean(listaErros.senha)}
            aria-describedby={listaErros.senha ? 'erro-perfil-senha' : 'ajuda-perfil-senha'}
          />
        </div>
        <p className="campo__ajuda" id="ajuda-perfil-senha">
          Mínimo de 8 caracteres. A senha é guardada apenas como hash.
        </p>
        {listaErros.senha && <p className="campo__erro" id="erro-perfil-senha">{listaErros.senha}</p>}
      </div>

      <fieldset className="perfil-formulario__secao">
        <legend>
          <MapPin aria-hidden="true" />
          Endereço
        </legend>

        <div className="perfil-formulario__grade">
          <div className="campo">
            <label htmlFor="perfil-cep">CEP</label>
            <div className="campo__controle campo__controle--cep">
              <input
                id="perfil-cep"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={9}
                value={form.cep}
                onChange={(evento) => {
                  alterar('cep', formatarCep(evento.target.value))
                  setMensagemCep('')
                }}
                aria-invalid={Boolean(listaErros.cep)}
                aria-describedby={listaErros.cep ? 'erro-perfil-cep' : undefined}
              />
              <button
                type="button"
                className="botao botao--secundario botao--pequeno"
                onClick={buscarCep}
                disabled={buscandoCep}
              >
                {buscandoCep ? (
                  <LoaderCircle className="girando" aria-hidden="true" />
                ) : (
                  <Search aria-hidden="true" />
                )}
                {buscandoCep ? 'Buscando' : 'Buscar'}
              </button>
            </div>
            {mensagemCep && (
              <p className="campo__ajuda campo__ajuda--status" role="status">
                {mensagemCep}
              </p>
            )}
            {listaErros.cep && <p className="campo__erro" id="erro-perfil-cep">{listaErros.cep}</p>}
          </div>

          <div className="campo">
            <label htmlFor="perfil-numero">Número</label>
            <input
              id="perfil-numero"
              type="text"
              maxLength={20}
              value={form.numero}
              onChange={(evento) => alterar('numero', evento.target.value)}
              aria-invalid={Boolean(listaErros.numero)}
            />
            {listaErros.numero && <p className="campo__erro">{listaErros.numero}</p>}
          </div>

          <div className="campo campo--largo">
            <label htmlFor="perfil-logradouro">Logradouro</label>
            <input
              id="perfil-logradouro"
              type="text"
              autoComplete="address-line1"
              maxLength={180}
              value={form.logradouro}
              onChange={(evento) => alterar('logradouro', evento.target.value)}
              aria-invalid={Boolean(listaErros.logradouro)}
            />
            {listaErros.logradouro && <p className="campo__erro">{listaErros.logradouro}</p>}
          </div>

          <div className="campo">
            <label htmlFor="perfil-complemento">
              Complemento <span className="campo__opcional">(opcional)</span>
            </label>
            <input
              id="perfil-complemento"
              type="text"
              maxLength={80}
              value={form.complemento}
              onChange={(evento) => alterar('complemento', evento.target.value)}
            />
          </div>

          <div className="campo">
            <label htmlFor="perfil-bairro">Bairro</label>
            <input
              id="perfil-bairro"
              type="text"
              maxLength={120}
              value={form.bairro}
              onChange={(evento) => alterar('bairro', evento.target.value)}
              aria-invalid={Boolean(listaErros.bairro)}
            />
            {listaErros.bairro && <p className="campo__erro">{listaErros.bairro}</p>}
          </div>

          <div className="campo">
            <label htmlFor="perfil-cidade">Cidade</label>
            <input
              id="perfil-cidade"
              type="text"
              autoComplete="address-level2"
              maxLength={120}
              value={form.cidade}
              onChange={(evento) => alterar('cidade', evento.target.value)}
              aria-invalid={Boolean(listaErros.cidade)}
            />
            {listaErros.cidade && <p className="campo__erro">{listaErros.cidade}</p>}
          </div>

          <div className="campo">
            <label htmlFor="perfil-uf">UF</label>
            <input
              id="perfil-uf"
              type="text"
              autoComplete="address-level1"
              maxLength={2}
              value={form.uf}
              onChange={(evento) => alterar('uf', evento.target.value.toUpperCase())}
              aria-invalid={Boolean(listaErros.uf)}
            />
            {listaErros.uf && <p className="campo__erro">{listaErros.uf}</p>}
          </div>
        </div>
      </fieldset>

      {cadastro && (
        <label className="perfil-consentimento">
          <input
            type="checkbox"
            checked={form.consentimento}
            onChange={(evento) => alterar('consentimento', evento.target.checked)}
            aria-invalid={Boolean(listaErros.consentimento)}
          />
          <span>
            Li e aceito o{' '}
            <a href="/privacidade" target="_blank" rel="noreferrer">
              Aviso de Privacidade
            </a>{' '}
            e autorizo o uso dos meus dados para abrir e acompanhar solicitações.
          </span>
        </label>
      )}
      {listaErros.consentimento && (
        <p className="campo__erro" role="alert">{listaErros.consentimento}</p>
      )}

      <p className="formulario__nota">
        <ShieldCheck aria-hidden="true" />
        Coletamos apenas nome, e-mail, telefone e endereço. Não pedimos CPF nem documento.
      </p>

      <div className="formulario__acoes">
        {aoCancelar && (
          <button type="button" className="botao botao--secundario" onClick={aoCancelar} disabled={enviando}>
            Cancelar
          </button>
        )}
        <button type="submit" className="botao botao--primario" disabled={enviando}>
          {enviando ? (
            <>
              <LoaderCircle className="girando" aria-hidden="true" />
              Salvando
            </>
          ) : cadastro ? (
            'Criar minha conta'
          ) : (
            'Salvar alterações'
          )}
        </button>
      </div>
    </form>
  )
}
