# AGENTS.md — Regras do frontend React

Estas instruções se aplicam ao projeto frontend. Siga também as regras gerais do `AGENTS.md` da raiz, se ele estiver presente e for aplicável.

## 1. Inspecione antes de alterar
- Leia `package.json`, scripts, dependências, ponto de entrada, roteador, layouts, estilos e solução de estado.
- Identifique JavaScript ou TypeScript, ferramenta de build e bibliotecas efetivamente instaladas.
- Examine componentes, hooks, serviços e páginas semelhantes antes de criar novas soluções.
- Não presuma que um pacote, alias, endpoint ou tipo existe sem verificar.

## 2. Responsabilidade dos módulos
- Páginas: compõem a tela e conectam os elementos da funcionalidade.
- Componentes: apresentam uma parte visual ou comportamental coesa.
- Hooks: encapsulam lógica de estado ou comportamento quando isso melhora clareza ou reutilização.
- Serviços: concentram operações de comunicação com a API.
- Schemas/validadores: mantêm validações complexas fora do JSX, quando apropriado.
- Tipos: descrevem contratos e dados relevantes.
- Rotas: definem navegação, layouts e proteção de rotas, sem concentrar regras de negócio extensas.

Não coloque páginas inteiras, requisições, validações complexas, regras de negócio e muitos componentes em um único arquivo. Também não crie um arquivo para cada pequena função trivial. Extraia responsabilidades quando houver benefício real.

## 3. Organização
Organize por funcionalidade/domínio quando isso ajudar a manter o sistema. Uma referência possível:

```text
src/
├── app/                 # inicialização, providers e configuração
├── components/          # componentes realmente compartilhados
├── features/
│   └── users/
│       ├── pages/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       ├── schemas/
│       └── types/
├── services/            # infraestrutura compartilhada, se necessária
├── hooks/               # hooks compartilhados
├── utils/
├── types/
└── styles/
```

Essa estrutura é ilustrativa. Não reorganize o projeto inteiro para fazê-lo corresponder ao exemplo. Mantenha a estrutura existente quando for funcional.

## 4. Rotas
- Siga o roteador já instalado; não introduza outro sem justificativa.
- Mantenha a configuração de rotas separada da lógica de negócio e dos componentes extensos.
- Preserve caminhos, redirecionamentos, layouts e comportamentos existentes.
- Centralize mecanismos repetidos de proteção de navegação quando adequado.
- Trate autenticação e autorização como conceitos distintos. A autorização real deve ser aplicada no backend.

## 5. Componentes e JSX
- Prefira componentes coesos, props claras e composição.
- Evite componentes universais com muitas propriedades e condições sem relação.
- Evite declarar componentes React dentro de outros componentes quando isso prejudicar identidade, estado ou desempenho.
- Reutilize componentes existentes antes de criar duplicatas.
- Não extraia todo elemento HTML simples para um componente independente sem necessidade.
- Mantenha a página focada na composição, extraindo lógica extensa quando isso facilitar compreensão e teste.

## 6. Estado e hooks
- Use estado local quando for suficiente; compartilhe estado apenas quando houver necessidade real.
- Siga a solução existente de gerenciamento de estado.
- Não introduza Redux, Zustand, Context adicional ou outra biblioteca sem justificativa.
- Não duplique estado que possa ser derivado de forma segura.
- Não use `useEffect` para cálculos derivados ou para substituir eventos comuns.
- Respeite as regras dos hooks e as dependências de efeitos e callbacks.
- Trate resultados assíncronos obsoletos, limpeza e cancelamento quando aplicável.

## 7. API e dados
- Use os serviços e o cliente HTTP existentes.
- Evite chamadas `fetch`/`axios` dispersas pelos componentes quando puderem ser organizadas num módulo apropriado.
- Verifique o contrato real da API antes de usar endpoints, campos ou formatos.
- Trate carregamento, erro, sucesso e ausência de dados conforme necessário.
- Siga a solução existente para cache e sincronização de dados.
- Não altere contratos do backend por conveniência sem analisar os consumidores e coordenar a mudança.
- Nunca inclua segredos ou credenciais privadas no frontend.

## 8. Formulários e validação
- Separe validações complexas do JSX.
- Siga a biblioteca de formulários/validação existente.
- Trate envio, sucesso, erro e submissões duplicadas quando aplicável.
- Preserve os valores digitados em erros recuperáveis.
- A validação frontend melhora a experiência, mas não substitui a validação do backend.

## 9. Tipos, estilos e acessibilidade
- Respeite JavaScript ou TypeScript conforme o projeto; não migre módulos inteiros sem necessidade.
- Em TypeScript, evite `any` indiscriminado e asserções injustificadas; defina contratos relevantes.
- Preserve a solução de estilos existente e reutilize tokens e componentes.
- Evite alterações globais de visual em tarefas localizadas.
- Use HTML semântico, rótulos acessíveis, foco visível e navegação por teclado.
- Preserve responsividade e os estados visuais importantes.

## 10. Dependências e refatoração
- Verifique se já existe uma solução antes de instalar pacotes.
- Não atualize dependências ou ferramentas sem necessidade.
- Preserve comportamentos, contratos e alterações preexistentes do usuário.
- Não remova código aparentemente não utilizado sem investigar referências e contexto.
- Evite alterações não relacionadas e refatorações massivas durante tarefas pequenas.

## 11. Tamanho e legibilidade
Não há limite universal de linhas. Quando um arquivo se tornar difícil de entender ou concentrar responsabilidades independentes, avalie uma divisão coerente. Não fragmente artificialmente apenas para reduzir o número de linhas.

## 12. Verificações e entrega
- Consulte os scripts reais de `package.json`.
- Execute lint, testes, verificação de tipos e build quando disponíveis e pertinentes.
- Não afirme que executou verificações que não foram executadas.
- Ao finalizar, informe o que mudou, quais arquivos foram afetados e os resultados reais das verificações.
