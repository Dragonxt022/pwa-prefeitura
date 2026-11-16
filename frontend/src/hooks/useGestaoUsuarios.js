import { useCallback, useState } from 'react'
import {
  atualizarUsuarioGestao,
  criarUsuarioGestao,
  listarSetoresGestao,
  listarUsuariosGestao,
} from '../servicos/api'
import { FORM_USUARIO_INICIAL } from '../utils/gestao'

function setorPadrao(setores) {
  return setores.find((setor) => !setor.central)?.id ?? ''
}

function formDoUsuario(usuario) {
  return {
    nome: usuario.nome,
    email: usuario.email,
    senha: '',
    papel: usuario.papel,
    setorId: usuario.papel === 'setor' ? (usuario.setorId ?? '') : '',
  }
}

export function useGestaoUsuarios({ setores, setSetores, definirErro, definirMensagem }) {
  const [mostrarUsuarios, setMostrarUsuarios] = useState(false)
  const [usuarios, setUsuarios] = useState([])
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false)
  const [formularioAberto, setFormularioAberto] = useState(false)
  const [usuarioEmEdicao, setUsuarioEmEdicao] = useState(null)
  const [formUsuario, setFormUsuario] = useState(FORM_USUARIO_INICIAL)
  const [salvandoUsuario, setSalvandoUsuario] = useState(false)

  const limpar = useCallback(() => {
    setMostrarUsuarios(false)
    setUsuarios([])
    setCarregandoUsuarios(false)
    setFormularioAberto(false)
    setUsuarioEmEdicao(null)
    setFormUsuario(FORM_USUARIO_INICIAL)
    setSalvandoUsuario(false)
  }, [])

  const carregarUsuarios = useCallback(async () => {
    setCarregandoUsuarios(true)
    definirErro(null)
    try {
      const [listaUsuarios, listaSetores] = await Promise.all([
        listarUsuariosGestao(),
        listarSetoresGestao(),
      ])
      setUsuarios(listaUsuarios)
      setSetores(listaSetores)
      setFormUsuario((atual) => ({
        ...atual,
        setorId: atual.setorId || setorPadrao(listaSetores),
      }))
    } catch (falha) {
      definirErro(falha)
    } finally {
      setCarregandoUsuarios(false)
    }
  }, [definirErro, setSetores])

  const abrir = useCallback(() => {
    setMostrarUsuarios(true)
    void carregarUsuarios()
  }, [carregarUsuarios])

  const fechar = useCallback(() => {
    setMostrarUsuarios(false)
  }, [])

  const abrirNovo = useCallback(() => {
    definirErro(null)
    definirMensagem('')
    setUsuarioEmEdicao(null)
    setFormUsuario({ ...FORM_USUARIO_INICIAL, setorId: setorPadrao(setores) })
    setFormularioAberto(true)
  }, [definirErro, definirMensagem, setores])

  const abrirEdicao = useCallback(
    (usuario) => {
      definirErro(null)
      definirMensagem('')
      setUsuarioEmEdicao(usuario)
      setFormUsuario(formDoUsuario(usuario))
      setFormularioAberto(true)
    },
    [definirErro, definirMensagem],
  )

  const fecharFormulario = useCallback(() => {
    setFormularioAberto(false)
    setUsuarioEmEdicao(null)
  }, [])

  function atualizarCampo(campo, valor) {
    setFormUsuario((atual) => ({ ...atual, [campo]: valor }))
  }

  function alterarPapel(papel) {
    setFormUsuario((atual) => ({
      ...atual,
      papel,
      setorId:
        papel === 'setor'
          ? atual.setorId || setores.find((setor) => !setor.central)?.id || ''
          : '',
    }))
  }

  async function salvarUsuario(evento) {
    evento.preventDefault()
    setSalvandoUsuario(true)
    definirErro(null)
    definirMensagem('')
    try {
      if (usuarioEmEdicao) {
        const dados = {
          nome: formUsuario.nome,
          email: formUsuario.email,
          papel: formUsuario.papel,
        }
        if (formUsuario.papel === 'setor') dados.setorId = formUsuario.setorId
        if (formUsuario.senha) dados.senha = formUsuario.senha
        await atualizarUsuarioGestao(usuarioEmEdicao.id, dados)
        definirMensagem('Dados do usuário atualizados.')
      } else {
        await criarUsuarioGestao({
          nome: formUsuario.nome,
          email: formUsuario.email,
          senha: formUsuario.senha,
          papel: formUsuario.papel,
          setorId: formUsuario.papel === 'setor' ? formUsuario.setorId : undefined,
        })
        definirMensagem('Usuário criado. Ele já pode entrar com o e-mail e a senha cadastrados.')
      }
      await carregarUsuarios()
      return true
    } catch (falha) {
      definirErro(falha)
      return false
    } finally {
      setSalvandoUsuario(false)
    }
  }

  async function alternarUsuario(usuarioAtual) {
    definirErro(null)
    try {
      await atualizarUsuarioGestao(usuarioAtual.id, { ativo: !usuarioAtual.ativo })
      await carregarUsuarios()
      definirMensagem(
        usuarioAtual.ativo
          ? 'Usuário desativado. A sessão dele deixará de ser aceita nas próximas requisições.'
          : 'Usuário reativado.',
      )
    } catch (falha) {
      definirErro(falha)
    }
  }

  return {
    mostrarUsuarios,
    usuarios,
    carregandoUsuarios,
    formularioAberto,
    usuarioEmEdicao,
    formUsuario,
    salvandoUsuario,
    limpar,
    abrir,
    fechar,
    abrirNovo,
    abrirEdicao,
    fecharFormulario,
    atualizarCampo,
    alterarPapel,
    salvarUsuario,
    alternarUsuario,
  }
}
