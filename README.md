# Sistema Todo List e Cronograma de Instalação

Sistema completo para gerenciamento de projetos, tarefas, todo lists e cronograma de instalação com gestão de equipes, funcionários, materiais e carros.

## Tecnologias

### Frontend
- Vue 3 (Composition API)
- Vite
- Vue Router
- Pinia
- Vue Draggable
- Vue Toastification
- Axios

### Backend
- Node.js
- Express
- MySQL2
- JWT (jsonwebtoken)
- bcryptjs

## Estrutura do Projeto

```
todo/
├── frontend/          # Aplicação Vue.js
│   └── src/
│       ├── components/    # Componentes Vue
│       ├── views/         # Páginas/Views
│       ├── services/      # Serviços de API
│       ├── store/         # Pinia stores
│       └── router/         # Rotas
├── backend/           # API Node.js/Express
│   └── src/
│       ├── controllers/   # Controllers
│       ├── routes/        # Rotas da API
│       ├── middleware/    # Middlewares
│       └── config/        # Configurações
└── database/          # Schema SQL
    └── schema.sql
```

## Instalação

### Pré-requisitos
- Node.js (v20.19.0 ou superior)
- MySQL
- npm ou yarn

### 1. Configurar o Banco de Dados

```bash
# Acesse o MySQL
mysql -u root -p

# Execute o schema
source database/schema.sql
```

Ou importe o arquivo `database/schema.sql` no seu cliente MySQL.

**Se você já tem um banco de dados existente**, execute também o script de atualização:

```bash
source database/update_database.sql
```

Isso adicionará os novos campos e tabelas necessários para o sistema de admin e orçamentos.

### 2. Configurar o Backend

```bash
cd backend
npm install
```

Crie um arquivo `.env` na pasta `backend/`:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_NAME=todo_instalacao
JWT_SECRET=seu_secret_jwt_aqui_mude_em_producao
```

### 3. Configurar o Frontend

```bash
# Na raiz do projeto
npm install
```

Crie um arquivo `.env` na raiz do projeto (opcional):

```env
VITE_API_URL=http://localhost:3000/api
```

## Executando o Projeto

### Backend

```bash
cd backend
npm run dev
```

O backend estará rodando em `http://localhost:3000`

### Frontend

```bash
# Na raiz do projeto
npm run dev
```

O frontend estará rodando em `http://localhost:5173`

### Rodar em Rede Local

Para acessar o projeto de outros dispositivos na mesma rede:

1. **Descubra o IP da sua máquina:**
   ```bash
   npm run get-ip
   ```

2. **Inicie o backend e frontend normalmente:**
   ```bash
   # Terminal 1 - Backend
   npm run backend
   
   # Terminal 2 - Frontend
   npm run dev
   ```

3. **Acesse de outros dispositivos:**
   - Frontend: `http://[SEU_IP]:5173`
   - Backend: `http://[SEU_IP]:3000`

📖 **Guia completo:** Veja [REDE.md](./REDE.md) para instruções detalhadas e solução de problemas.

## Funcionalidades

### Todo List
- ✅ Gerenciamento de projetos
- ✅ Tarefas dentro de projetos
- ✅ Todo list (subtarefas) dentro de cada tarefa
- ✅ Drag & drop para reordenar tarefas
- ✅ Marcar todos como concluídos

### Cronograma de Instalação
- ✅ Criar cronogramas vinculados a orçamentos
- ✅ Montar equipes por tipo de instalação
- ✅ Adicionar funcionários às equipes
- ✅ Cadastrar materiais e ferramentas
- ✅ Cadastrar carros
- ✅ Checklist de materiais antes da instalação
- ✅ Visualizar cronogramas por data/equipe

### Sistema de Orçamentos
- ✅ Criar orçamentos com múltiplos itens
- ✅ Configurar preços por cm² para materiais (módulo impressão)
- ✅ Cálculo automático de valores
- ✅ Gerenciar status de orçamentos
- ✅ Vincular orçamentos a cronogramas

### Sistema Admin
- ✅ Controle de acesso por permissões
- ✅ Painel de configurações (apenas admin)
- ✅ Configuração de preços de materiais

### Gestão
- ✅ CRUD completo de funcionários
- ✅ CRUD completo de equipes
- ✅ CRUD completo de materiais
- ✅ CRUD completo de carros
- ✅ CRUD completo de tipos de instalação

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/me` - Dados do usuário logado

### Projetos
- `GET /api/projetos` - Listar projetos
- `POST /api/projetos` - Criar projeto
- `PUT /api/projetos/:id` - Atualizar projeto
- `DELETE /api/projetos/:id` - Excluir projeto

### Tarefas
- `GET /api/projetos/:projetoId/tarefas` - Listar tarefas
- `POST /api/projetos/:projetoId/tarefas` - Criar tarefa
- `PUT /api/tarefas/:id` - Atualizar tarefa
- `DELETE /api/tarefas/:id` - Excluir tarefa
- `PUT /api/tarefas/reordenar` - Reordenar tarefas

### Todos
- `GET /api/tarefas/:tarefaId/todos` - Listar todos
- `POST /api/tarefas/:tarefaId/todos` - Criar todo
- `PUT /api/todos/:id` - Atualizar todo
- `DELETE /api/todos/:id` - Excluir todo

### Funcionários
- `GET /api/funcionarios` - Listar funcionários
- `POST /api/funcionarios` - Criar funcionário
- `PUT /api/funcionarios/:id` - Atualizar funcionário
- `DELETE /api/funcionarios/:id` - Excluir funcionário

### Equipes
- `GET /api/equipes` - Listar equipes
- `POST /api/equipes` - Criar equipe
- `PUT /api/equipes/:id` - Atualizar equipe
- `DELETE /api/equipes/:id` - Excluir equipe
- `POST /api/equipes/:id/funcionarios` - Adicionar funcionário
- `DELETE /api/equipes/:id/funcionarios/:funcionarioId` - Remover funcionário

### Materiais
- `GET /api/materiais` - Listar materiais
- `POST /api/materiais` - Criar material
- `PUT /api/materiais/:id` - Atualizar material
- `DELETE /api/materiais/:id` - Excluir material

### Carros
- `GET /api/carros` - Listar carros
- `POST /api/carros` - Criar carro
- `PUT /api/carros/:id` - Atualizar carro
- `DELETE /api/carros/:id` - Excluir carro

### Cronograma
- `GET /api/cronogramas` - Listar cronogramas
- `POST /api/cronogramas` - Criar cronograma
- `PUT /api/cronogramas/:id` - Atualizar cronograma
- `DELETE /api/cronogramas/:id` - Excluir cronograma
- `GET /api/cronogramas/orcamentos` - Listar orçamentos
- `GET /api/cronogramas/tipos-instalacao` - Listar tipos de instalação

### Orçamentos
- `GET /api/orcamentos` - Listar orçamentos
- `GET /api/orcamentos/:id` - Buscar orçamento
- `POST /api/orcamentos` - Criar orçamento
- `PUT /api/orcamentos/:id` - Atualizar orçamento
- `DELETE /api/orcamentos/:id` - Excluir orçamento
- `POST /api/orcamentos/:id/calcular-total` - Recalcular total

### Configurações de Preços (Admin)
- `GET /api/material-precos` - Listar configurações
- `GET /api/material-precos/material/:materialId` - Buscar preço de material
- `POST /api/material-precos` - Criar configuração (admin)
- `PUT /api/material-precos/:id` - Atualizar configuração (admin)
- `DELETE /api/material-precos/:id` - Excluir configuração (admin)

### Admin
- `POST /api/auth/promote` - Promover usuário a admin (apenas admin)

## Design Responsivo

O sistema é totalmente responsivo com suporte para:
- Mobile (< 768px)
- Tablet (768px - 1024px)
- Desktop (> 1024px)

## Melhorias Implementadas

- ✅ Notificações toast para ações
- ✅ Confirmação de exclusão
- ✅ Validação de formulários
- ✅ Loading states
- ✅ Tratamento de erros
- ✅ Filtros e busca
- ✅ Dashboard com estatísticas
- ✅ Sistema de permissões (admin/user)
- ✅ Cálculo automático de valores em orçamentos
- ✅ Módulo de impressão por cm²

## Como Criar um Usuário Admin

Após executar o script de atualização do banco, você pode promover um usuário a admin de duas formas:

### 1. Via SQL direto:
```sql
UPDATE users SET is_admin = TRUE WHERE email = 'seu_email@exemplo.com';
```

### 2. Via API (se já tiver um admin):
```bash
POST /api/auth/promote
{
  "userId": 1
}
```

## Licença

Este projeto é privado.
