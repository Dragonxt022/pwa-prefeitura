# AGENTS.md — Regras gerais do sistema

Estas regras se aplicam ao sistema completo, composto por frontend React e backend Node.js. As regras específicas de cada camada estão em `frontend/AGENTS.md` e `backend/AGENTS.md`, quando essas pastas existirem neste workspace.

## 1. Identifique a camada antes de agir
- Antes de editar, determine se a tarefa pertence ao frontend, ao backend ou exige alterações coordenadas nas duas camadas.
- Leia os `AGENTS.md` aplicáveis, os `package.json`, a estrutura do projeto e os arquivos relacionados.
- Não presuma que frontend e backend compartilham o mesmo repositório, processo de execução, dependências ou configuração.
- Se estiver trabalhando apenas dentro de um dos projetos separados, respeite as instruções locais disponíveis e não invente acesso aos arquivos do outro projeto.

## 2. Limites entre frontend e backend
- O frontend é responsável pela interface, experiência do usuário, estado de apresentação e consumo dos contratos da API.
- O backend é responsável por regras de negócio autoritativas, validação confiável, autenticação, autorização, persistência e integridade dos dados.
- O frontend pode validar dados para melhorar a experiência, mas o backend deve validar novamente toda entrada relevante.
- Ocultar telas ou botões no frontend não substitui autorização no backend.
- Não replique regras de negócio complexas no frontend como fonte de verdade.
- Não acesse o banco de dados diretamente pelo frontend nem exponha credenciais privadas no bundle.

## 3. Contratos da API
- Antes de alterar endpoints, métodos HTTP, parâmetros, payloads, respostas, códigos de status ou autenticação, localize e verifique o contrato existente.
- Não invente endpoints, campos ou comportamentos.
- Uma mudança incompatível deve ser coordenada com os consumidores afetados e documentada.
- Se o frontend e o backend estiverem em repositórios separados e o outro não estiver disponível, não afirme que verificou seus arquivos. Registre a limitação e trabalhe com contratos/documentação disponíveis.
- Prefira contratos explícitos e estáveis. Reutilize documentação, tipos compartilhados ou especificações OpenAPI se o projeto já as possuir; não introduza uma nova ferramenta sem necessidade.

## 4. Escopo e segurança das alterações
- Inspecione o estado do repositório e preserve alterações preexistentes do usuário.
- Altere apenas o necessário para cumprir o requisito.
- Não reformate, renomeie ou reestruture grandes áreas sem necessidade.
- Não remova controles de segurança nem desative testes, lint ou verificações para esconder falhas.
- Não inclua segredos, tokens privados, senhas ou credenciais em código, logs ou documentação.

## 5. Validação e entrega
- Consulte os scripts reais de cada projeto antes de executar comandos.
- Execute verificações relevantes disponíveis: lint, testes, verificação de tipos e build.
- Diferencie claramente o que foi executado, o que passou, o que falhou e o que não pôde ser executado.
- Ao concluir, informe arquivos alterados, responsabilidades, verificações e pendências.
- Não declare uma integração frontend/backend completamente validada se apenas uma das camadas foi testada.

## 6. Princípio arquitetural
Cada módulo deve ter responsabilidade clara. Evite tanto arquivos gigantes que misturem camadas quanto fragmentação artificial em muitos arquivos pequenos. A arquitetura deve acompanhar as necessidades reais do sistema e os padrões válidos já existentes.
