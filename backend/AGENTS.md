# AGENTS.md — Regras do backend Node.js

Estas instruções se aplicam ao projeto backend Node.js. Siga também as regras gerais do `AGENTS.md` da raiz, se ele estiver presente e for aplicável.

## 1. Inspecione antes de alterar
- Leia `package.json`, scripts, estrutura de inicialização, configuração, roteadores, middleware, serviços, persistência e testes.
- Identifique framework e bibliotecas reais (por exemplo, Express, Fastify, ORM ou driver SQL); não presuma que estão instalados.
- Localize endpoints semelhantes e siga padrões consistentes já adotados.
- Identifique como variáveis de ambiente, autenticação, autorização, logs e erros são tratados.

## 2. Estrutura e responsabilidades
Estrutura-alvo:

```text
src/
├── rotas/           # caminhos e associação de middlewares/controladores
├── controladores/   # entrada e saída HTTP
├── servicos/        # regras de negócio e casos de uso
├── repositorios/    # estado, consultas e persistência
├── middlewares/     # autenticação, autorização, erros e limites
├── utils/           # funções puras e helpers
├── dominio/         # catálogo, sementes, normalização e regras puras
├── validadores/     # validação e normalização de entrada
└── apresentadores/  # montagem dos contratos de saída
```

Responsabilidades:
- **Rotas:** declaram caminhos, métodos e middlewares; encaminham para controladores. Não contêm regra de negócio nem acesso ao estado.
- **Controladores:** interpretam `req`, chamam validadores/serviços e formam a resposta HTTP com status, headers e apresentador. Não acessam o estado global diretamente.
- **Serviços:** implementam regras de negócio, autorização de domínio e coordenação de repositórios. Não importam Express, não recebem `req`/`res` e não definem status HTTP.
- **Repositórios:** encapsulam o estado em memória e a persistência JSON. Não tomam decisões de negócio nem montam respostas HTTP. Retornam cópias ou dados próprios para evitar mutação externa.
- **Middlewares:** tratam autenticação, autorização, limites e erros de forma transversal.
- **Utils:** funções puras, sem dependência de HTTP ou persistência.
- **Domínio:** catálogo, sementes, normalização e regras puras que não pertencem a uma camada de infraestrutura.
- **Validadores:** validam e normalizam a entrada antes do serviço.
- **Apresentadores:** montam os contratos públicos/administrativos e removem campos internos.

Não crie todas essas camadas mecanicamente para cada endpoint. Rotas triviais, como `health`, podem permanecer na própria rota; operações de domínio passam por controlador e serviço.

O antigo `store.js` não deve ser recriado. Não mantenha dois estados, dois módulos de persistência ou duas implementações da mesma regra durante a migração. Mova uma responsabilidade por vez e valide a regressão antes de remover o código antigo.

## 3. Rotas, controladores e serviços
- Mantenha arquivos de rotas focados na declaração de endpoints e middleware.
- Evite colocar consultas, regras de negócio extensas e validações repetidas diretamente nas rotas.
- Mantenha controladores objetivos e delegue operações complexas a serviços ou casos de uso.
- Não crie controladores gigantes com operações de domínios diferentes.
- Preserve métodos HTTP, códigos de status e formatos de resposta existentes, salvo quando a mudança exigir e considerar os consumidores.
- Não faça controladores importarem repositórios apenas para contornar uma regra que deveria estar no serviço.
- Serviços devem ser testáveis sem Express e sem cookies.
- Evite dependências circulares entre rotas, controladores, serviços e repositórios; se surgirem, reavalie a direção das dependências.

## 4. Regras de negócio
- Mantenha regras de negócio autoritativas no backend.
- Não duplique regras complexas em vários endpoints.
- Reutilize serviços ou casos de uso quando representarem o mesmo comportamento de negócio.
- Evite abstrações genéricas prematuras e dependências circulares.
- Garanta que operações críticas preservem consistência e integridade dos dados.

## 5. Validação e segurança
- Valide e normalize dados recebidos do cliente no servidor.
- Não confie em IDs, papéis, permissões, preços, totais ou outros valores fornecidos pelo frontend sem verificação.
- Aplique autenticação e autorização em cada operação protegida, de acordo com o modelo de acesso.
- Evite SQL injection usando consultas parametrizadas ou os mecanismos seguros do ORM.
- Proteja contra exposição indevida de dados e atribuição em massa.
- Não exponha stack traces, segredos ou detalhes internos em respostas de produção.
- Utilize hash apropriado para senhas e nunca registre credenciais ou tokens em logs.
- Configure CORS, cookies, sessões, CSRF e limites de requisição de acordo com o mecanismo de autenticação e os riscos do sistema.
- Não enfraqueça controles de segurança para fazer um teste passar.

## 6. Banco de dados e persistência
- Use a camada de acesso a dados já adotada.
- Não misture consultas de persistência com a construção de respostas HTTP em todos os endpoints.
- Preserve transações e integridade referencial quando a operação exigir atomicidade.
- Não altere schema, migrações, índices ou dados de produção sem entender o impacto.
- Não execute comandos destrutivos ou migrações irreversíveis sem autorização explícita e plano apropriado.
- Evite consultas repetidas e problemas de desempenho conhecidos, como N+1, quando relevantes.
- Não exponha diretamente entidades internas do banco se isso quebrar o contrato público da API ou revelar campos privados.

## 7. Erros, logs e operações assíncronas
- Siga o tratamento centralizado de erros existente, se houver.
- Diferencie erros de validação, autenticação, autorização, conflitos, ausência de recursos e falhas inesperadas.
- Não esconda exceções silenciosamente nem responda sucesso quando uma operação falhar.
- Evite duplicar blocos de tratamento de erro em todos os endpoints.
- Use logs úteis, sem registrar senhas, tokens ou dados sensíveis desnecessários.
- Trate corretamente promessas rejeitadas e operações assíncronas conforme o framework e a versão utilizados.

## 8. Contratos e integração com o frontend
- Antes de mudar um endpoint, verifique seus consumidores e a documentação disponível.
- Preserve formatos de payload, respostas, códigos HTTP e comportamento de autenticação quando possível.
- Se uma alteração incompatível for necessária, identifique todos os consumidores afetados e coordene a atualização.
- Não presuma que o frontend está disponível no mesmo repositório.
- Se não puder inspecionar o frontend, informe essa limitação e documente as mudanças no contrato.
- Não considere uma mudança de API integrada até validar a compatibilidade com os consumidores disponíveis.

## 9. Configuração e dependências
- Use variáveis de ambiente para configuração e segredos; valide configurações obrigatórias na inicialização quando adequado.
- Não coloque segredos no código-fonte ou em arquivos versionados.
- Verifique dependências existentes antes de instalar novas.
- Não atualize Node.js, framework, ORM ou dependências sem avaliar compatibilidade e impacto.
- Preserve scripts, configuração e convenções do projeto.
- Não execute comandos de manutenção ou migração potencialmente perigosos sem entender o ambiente e obter autorização quando necessária.

## 10. Testes e validação
- Consulte os scripts reais de `package.json`.
- Teste validações, regras de negócio, permissões e fluxos críticos.
- Execute testes, lint, verificação de tipos e build quando disponíveis.
- Para endpoints, verifique respostas de sucesso e falhas relevantes, incluindo entradas inválidas e acesso não autorizado.
- Não use banco ou serviços reais de produção em testes sem autorização e salvaguardas.
- Não afirme que testes passaram se não foram executados ou se falharam.

## 11. Escopo e entrega
- Preserve alterações preexistentes do usuário.
- Faça mudanças coesas e limitadas ao requisito.
- Não reescreva módulos inteiros se uma correção localizada for suficiente.
- Não apague funcionalidades ou migrações sem investigar dependências e impacto.
- Ao concluir, informe arquivos alterados, mudanças de comportamento/API, verificações executadas e pendências.

## Regra final
Antes de adicionar lógica a uma rota, controller ou serviço, determine a camada correta para aquela responsabilidade. Mantenha endpoints previsíveis, regras de negócio testáveis, acesso a dados seguro e contratos de API explícitos, sem criar camadas artificiais.
