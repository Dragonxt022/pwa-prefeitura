# Moderação de imagens enviadas pelo cidadão

## O que já existe

- Aviso explícito no formulário pedindo que o cidadão não envie nudez, violência ou
  conteúdo ilegal.
- O servidor valida o tipo real do arquivo pelos bytes de assinatura (JPEG, PNG e
  WebP), além do limite de tamanho e da remoção de metadados feita no navegador.
- A prévia da imagem no painel fica oculta por padrão. O operador precisa clicar em
  **Ver imagem** para abrir o conteúdo.
- O botão **Sinalizar como imprópria** grava `foto_sensivel = 1` no banco, registra
  o evento no histórico e deixa de devolver a imagem nas APIs pública e
  administrativa. A sinalização pode ser revertida por um administrador.
- A imagem original permanece no banco para auditoria enquanto a política de
  retenção não definir o prazo de descarte.

## Limite atual

A verificação de conteúdo é humana. O sistema **não detecta automaticamente**
nudez, violência ou outro conteúdo impróprio. Para bloquear antes de qualquer
pessoa visualizar, é necessário integrar um provedor de moderação por visão
computacional.

## Opções de integração

- Google Cloud Vision SafeSearch (`adult`, `violence`, `racy`).
- AWS Rekognition Content Moderation.
- Azure AI Content Safety.
- OpenAI Images / visão com uma política de moderação própria.

Fluxo recomendado:

```text
upload -> validação técnica -> quarentena
   -> moderação automática (API externa)
   -> aprovada: libera para o painel
   -> suspeita: oculta, marca para revisão humana e notifica a equipe
   -> bloqueada: descarta a imagem, mantém apenas o hash e o resultado da moderação
```

## Recomendações operacionais

1. Definir no aviso de privacidade e nos termos de uso que imagens podem ser
   analisadas e removidas.
2. Nunca liberar a imagem automaticamente para todos os operadores: usar
   quarentena ou prévia protegida.
3. Registrar quem visualizou, sinalizou ou reverteu uma moderação.
4. Definir prazo de retenção e rotina de descarte da imagem original.
5. Ter um canal de denúncia e um responsável pelo tratamento de conteúdo sensível.
6. Não usar a imagem para treinar modelos sem consentimento específico.
