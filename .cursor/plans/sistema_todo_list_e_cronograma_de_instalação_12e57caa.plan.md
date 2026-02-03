---
name: Sistema Todo List e Cronograma de Instalação
overview: Sistema completo em Vue 3 com build (Vite) e módulos ES6, integrando um painel de todo list para tarefas e um sistema de cronograma de instalação com gestão de equipes, funcionários, materiais e carros. Backend em Node.js/Express com MySQL, totalmente componentizado e responsivo.
todos:
  - id: setup-projeto
    content: Configurar estrutura inicial do projeto (frontend Vue 3 + Vite, backend Node.js + Express, banco MySQL)
    status: completed
  - id: database-schema
    content: Criar schema completo do banco de dados MySQL com todas as tabelas necessárias
    status: completed
  - id: backend-auth
    content: Implementar sistema de autenticação no backend (JWT, middleware, rotas de login/register)
    status: completed
  - id: backend-projetos
    content: Criar API REST para projetos (CRUD completo)
    status: completed
  - id: backend-tarefas
    content: Criar API REST para tarefas com suporte a reordenação (drag & drop)
    status: completed
  - id: backend-todos
    content: Criar API REST para todos (subtarefas dentro de tarefas)
    status: completed
  - id: backend-funcionarios
    content: Criar API REST para funcionários (CRUD completo)
    status: completed
  - id: backend-equipes
    content: Criar API REST para equipes com relacionamento funcionários e tipos de instalação
    status: completed
  - id: backend-materiais
    content: Criar API REST para materiais e carros (CRUD completo)
    status: completed
  - id: backend-cronograma
    content: Criar API REST para cronograma de instalação com integração de equipes, materiais e carros
    status: completed
  - id: frontend-setup
    content: Configurar Vue 3 + Vite, router, store (Pinia), e estrutura de pastas componentizada
    status: completed
  - id: frontend-auth
    content: Criar componentes e views de autenticação (Login, Register)
    status: completed
  - id: frontend-layout
    content: Criar layout principal com Navbar, Sidebar responsivo e sistema de rotas
    status: completed
  - id: frontend-todo-projetos
    content: Implementar área de projetos (lista, criação, edição) com componentes reutilizáveis
    status: completed
  - id: frontend-todo-tarefas
    content: Implementar área de tarefas com drag & drop para reordenação
    status: completed
  - id: frontend-todo-list
    content: Implementar todo list dentro de cada tarefa (criação, edição, marcação de concluído)
    status: completed
  - id: frontend-cronograma
    content: Implementar área de cronograma de instalação com formulários e listas
    status: completed
  - id: frontend-equipes
    content: Implementar gerenciamento de equipes com adição/remoção de funcionários
    status: completed
  - id: frontend-materiais
    content: Implementar cadastro e checklist de materiais/ferramentas
    status: completed
  - id: frontend-drag-drop
    content: Integrar biblioteca de drag & drop (Vue Draggable) e implementar reordenação
    status: completed
  - id: frontend-responsive
    content: Aplicar design responsivo em todos os componentes (mobile, tablet, desktop)
    status: completed
  - id: frontend-melhorias
    content: "Adicionar melhorias: notificações, validações, loading states, tratamento de erros"
    status: completed
---

# Sistema Todo List e Cronograma de Instalação

## Arquitetura Geral

Sistema único integrado com duas áreas principais:

1. **Todo List**: Projetos → Tarefas → Todo List (subtarefas dentro de cada tarefa)
2. **Cronograma de Instalação**: Gestão de equipes, funcionários, materiais, carros e integração com orçamentos

### Stack Tecnológica

- **Frontend**: Vue 3 + Vite + Composition API + ES6 Modules
- **Backend**: Node.js + Express + MySQL
- **Autenticação**: JWT
- **Drag & Drop**: Vue Draggable ou SortableJS
- **UI**: Componentes customizados responsivos

## Estrutura do Projeto

```
todo/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # Componentes reutilizáveis
│   │   │   ├── todo/            # Componentes do Todo List
│   │   │   └── instalacao/      # Componentes do Cronograma
│   │   ├── views/
│   │   │   ├── Login.vue
│   │   │   ├── Dashboard.vue
│   │   │   ├── Projetos.vue
│   │   │   ├── Tarefas.vue
│   │   │   └── CronogramaInstalacao.vue
│   │   ├── router/
│   │   ├── store/               # Pinia ou Vuex
│   │   ├── services/            # API calls
│   │   ├── utils/
│   │   └── App.vue
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── middleware/
│   │   ├── config/
│   │   └── server.js
│   ├── package.json
│   └── .env
└── database/
    └── schema.sql
```

## Banco de Dados MySQL

### Tabelas Principais

1. **users** - Autenticação
2. **projetos** - Lista de projetos
3. **tarefas** - Tarefas dentro de projetos (com ordem)
4. **todos** - Subtarefas dentro de cada tarefa
5. **funcionarios** - Cadastro de funcionários
6. **equipes** - Equipes de instalação
7. **equipe_funcionarios** - Relação equipe-funcionário
8. **tipos_instalacao** - Tipos de instalação
9. **equipe_tipo_instalacao** - Relação equipe-tipo
10. **materiais** - Cadastro de materiais/ferramentas
11. **carros** - Cadastro de veículos
12. **cronograma_instalacao** - Cronogramas de instalação
13. **cronograma_equipe** - Equipes do cronograma
14. **cronograma_material** - Materiais do cronograma
15. **cronograma_carro** - Carros do cronograma
16. **orcamentos** - Orçamentos (integração)

## Componentes Frontend

### Área Todo List

- `ProjetoList.vue` - Lista de projetos
- `ProjetoCard.vue` - Card de projeto
- `TarefaList.vue` - Lista de tarefas (drag & drop)
- `TarefaCard.vue` - Card de tarefa
- `TodoList.vue` - Lista de todos dentro da tarefa
- `TodoItem.vue` - Item individual do todo

### Área Cronograma

- `CronogramaList.vue` - Lista de cronogramas
- `CronogramaForm.vue` - Formulário de cronograma
- `EquipeManager.vue` - Gerenciador de equipes
- `EquipeForm.vue` - Formulário de equipe
- `FuncionarioList.vue` - Lista de funcionários
- `FuncionarioForm.vue` - Formulário de funcionário
- `MaterialList.vue` - Lista de materiais
- `MaterialForm.vue` - Formulário de material
- `CarroList.vue` - Lista de carros
- `CarroForm.vue` - Formulário de carro
- `ChecklistMaterial.vue` - Checklist de materiais para instalação

### Componentes Comuns

- `Navbar.vue` - Navegação principal
- `Sidebar.vue` - Menu lateral
- `Modal.vue` - Modal reutilizável
- `Button.vue` - Botão customizado
- `Input.vue` - Input customizado
- `Loading.vue` - Indicador de carregamento

## Funcionalidades Principais

### Todo List

- ✅ Criar/editar/excluir projetos
- ✅ Criar/editar/excluir tarefas dentro de projetos
- ✅ Criar/editar/excluir todos dentro de tarefas
- ✅ Drag & drop para reordenar tarefas
- ✅ Marcar todos como concluídos
- ✅ Filtros e busca

### Cronograma de Instalação

- ✅ Criar cronogramas vinculados a orçamentos
- ✅ Montar equipes por tipo de instalação
- ✅ Adicionar funcionários às equipes
- ✅ Cadastrar materiais e ferramentas
- ✅ Cadastrar carros
- ✅ Checklist de materiais antes da instalação
- ✅ Visualizar cronogramas por data/equipe

### Gestão

- ✅ CRUD completo de funcionários
- ✅ CRUD completo de equipes
- ✅ CRUD completo de materiais
- ✅ CRUD completo de carros
- ✅ CRUD completo de tipos de instalação

## API Endpoints Backend

### Autenticação

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`

### Projetos

- `GET /api/projetos`
- `POST /api/projetos`
- `PUT /api/projetos/:id`
- `DELETE /api/projetos/:id`

### Tarefas

- `GET /api/projetos/:projetoId/tarefas`
- `POST /api/projetos/:projetoId/tarefas`
- `PUT /api/tarefas/:id`
- `DELETE /api/tarefas/:id`
- `PUT /api/tarefas/reordenar` - Atualizar ordem (drag & drop)

### Todos

- `GET /api/tarefas/:tarefaId/todos`
- `POST /api/tarefas/:tarefaId/todos`
- `PUT /api/todos/:id`
- `DELETE /api/todos/:id`

### Funcionários

- `GET /api/funcionarios`
- `POST /api/funcionarios`
- `PUT /api/funcionarios/:id`
- `DELETE /api/funcionarios/:id`

### Equipes

- `GET /api/equipes`
- `POST /api/equipes`
- `PUT /api/equipes/:id`
- `DELETE /api/equipes/:id`
- `POST /api/equipes/:id/funcionarios`
- `DELETE /api/equipes/:id/funcionarios/:funcionarioId`

### Materiais

- `GET /api/materiais`
- `POST /api/materiais`
- `PUT /api/materiais/:id`
- `DELETE /api/materiais/:id`

### Carros

- `GET /api/carros`
- `POST /api/carros`
- `PUT /api/carros/:id`
- `DELETE /api/carros/:id`

### Cronograma

- `GET /api/cronogramas`
- `POST /api/cronogramas`
- `PUT /api/cronogramas/:id`
- `DELETE /api/cronogramas/:id`
- `GET /api/orcamentos` - Listar orçamentos para vincular

## Design Responsivo

- Mobile-first approach
- Breakpoints: mobile (< 768px), tablet (768px - 1024px), desktop (> 1024px)
- Sidebar colapsável em mobile
- Cards adaptáveis
- Drag & drop funcional em touch devices

## Melhorias Adicionais

- ✅ Notificações toast para ações
- ✅ Confirmação de exclusão
- ✅ Validação de formulários
- ✅ Loading states
- ✅ Tratamento de erros
- ✅ Filtros e busca avançada
- ✅ Exportação de dados (opcional)
- ✅ Dashboard com estatísticas