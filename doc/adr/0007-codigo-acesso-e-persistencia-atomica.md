# ADR 0007 — Código de acesso e persistência atômica

- **Status:** Aceito
- **Data:** 24/10/2026
- **Decisores:** Dev back, Dev front, PO
- **Substitui parcialmente:** [ADR 0006](0006-persistencia-e-privacidade.md)

## Contexto

O protocolo sozinho permitia consultar qualquer pedido e o cache de status guardava dados pessoais no
Service Worker. Também era possível perder o arquivo JSON inteiro em uma escrita interrompida ou trocar
silenciosamente o estado local por sementes quando o JSON estava inválido.

## Decisão

### Código de acesso

- O navegador gera um código de 12 caracteres no formato `ABCD-EFGH-JKLM`, com alfabeto de 32 símbolos
  sem `I`, `O`, `0` e `1`, usando `crypto.getRandomValues`.
- O código é enviado no cabeçalho `x-codigo-acesso`, nunca na URL. A criação recebe o código no corpo,
  porque ainda não existe protocolo.
- O backend persiste apenas `codigoAcessoHash` (SHA-256) e compara em tempo constante.
- Detalhe, status, avaliação e reenvio idempotente exigem o código. Protocolo inexistente, código
  ausente e código incorreto recebem o mesmo `404 codigo_acesso_invalido`.
- O código é salvo uma vez no pedido local e na fila offline. Caches antigos são removidos.
- Semelhantes não devolvem protocolo, endereço, descrição, datas ou contato.
- Seed demonstrativa `PREF-2026-000001..000003` usa `DEMA-ACES-S226`; os demais registros legados sem
  hash ficam inacessíveis em vez de expostos.

### Persistência

- Gravar em arquivo temporário, aplicar `fsync`, renomear atomicamente e manter `estado.json.bak` com a
  última versão válida.
- Se o principal estiver corrompido ou com schema incompleto, recuperar do backup; se ambos estiverem
  inválidos, falhar na inicialização em vez de usar sementes silenciosamente.
- Validar o formato mínimo dos campos antes de escolher principal ou backup e migrar o código demo em
  arquivos antigos.
- O estado passa à versão 4 para distinguir registros com hash; arquivos versão 3 são lidos e migrados
  na próxima gravação.

### Cache

- O cache público passa a ser `api-public-v3`.
- Nenhuma rota `/api/solicitacoes` entra no Service Worker; `api-get-v1` e `api-public-v2` são apagados
  no boot.

## Consequências

**Positivas:** acesso por protocolo deixa de ser um oráculo de existência; o segredo não fica em URL,
payload público, log ou cache; o JSON sobrevive a escritas interrompidas e a corrupção tem recuperação
explícita. A fila offline mantém a idempotência.

**Negativas:** quem perder o código e os dados do aparelho perde o acesso; o código é um segredo local
sem autenticação de titularidade; o hash SHA-256 é adequado para um token de alta entropia, mas não
substitui autenticação de cidadão em produção; a gravação atômica ainda não oferece concorrência
transacional entre múltiplos processos.

## Quando revisar

- Ao introduzir login/verificação de titularidade do cidadão.
- Ao migrar para banco transacional ou múltiplas instâncias.
- Se o código precisar ser recuperado por e-mail/SMS ou vinculado a uma conta.
