# CRM Boa Forma

Sistema completo de gestão para academias, estúdios e personal trainers. O CRM Boa Forma oferece um conjunto robusto de ferramentas para gerenciamento de leads, alunos, treinos, avaliações físicas e financeiro, focado em otimizar a operação e melhorar a retenção de clientes.

## 🚀 Tecnologias Utilizadas

O projeto foi desenvolvido utilizando uma stack moderna, performática e escalável:

### Core
- **React 18**: Biblioteca JavaScript para construção de interfaces.
- **TypeScript 5**: Superset tipado do JavaScript para maior segurança e produtividade.
- **Vite 5**: Build tool de próxima geração, extremamente rápida.
- **PWA (Progressive Web App)**: Suporte para instalação como aplicativo nativo (`vite-plugin-pwa`).

### Estilização e UI
- **Tailwind CSS 3**: Framework CSS utility-first.
- **Shadcn/ui & Radix UI**: Componentes de interface acessíveis e customizáveis.
- **Lucide React**: Biblioteca de ícones moderna.
- **Recharts**: Biblioteca para construção de gráficos e dashboards.

### Gerenciamento de Estado e Dados
- **TanStack Query (React Query) v5**: Gerenciamento de estado assíncrono e cache de dados.
- **React Router DOM v6**: Roteamento client-side.

### Formulários e Validação
- **React Hook Form**: Gerenciamento de formulários performático.
- **Zod**: Schema validation para TypeScript.

### Backend e Integrações
- **Supabase**: Backend-as-a-Service (BaaS) que fornece:
  - Banco de dados PostgreSQL.
  - Autenticação e Autorização (RLS).
  - Storage para arquivos.
  - Edge Functions.

### Utilitários
- **date-fns**: Manipulação de datas.
- **xlsx**: Exportação de dados para Excel.
- **jspdf**: Geração de documentos PDF.

---

## 🏗️ Arquitetura do Projeto

O projeto segue uma arquitetura modular baseada em funcionalidades (Feature-Sliced Design simplificado), onde os componentes e lógicas são agrupados pelo domínio do negócio.

### Estrutura de Pastas

```
CRM/
├── public/              # Arquivos estáticos (favicons, robots.txt)
├── src/
│   ├── assets/          # Imagens e recursos estáticos do projeto
│   ├── components/      # Componentes React organizados por domínio
│   │   ├── aluno/       # Funcionalidades do aluno (Treinos, Check-in)
│   │   ├── assessments/ # Avaliações físicas e anamnese
│   │   ├── financial/   # Gestão financeira (Planos, Faturas)
│   │   ├── leads/       # Gestão de leads e pipeline
│   │   ├── ui/          # Componentes de UI genéricos (Botões, Inputs)
│   │   └── ...          # Outros módulos (chat, classes, goals, etc.)
│   ├── hooks/           # Custom Hooks para lógica de negócios e data fetching
│   ├── integrations/    # Configuração de serviços externos (Supabase)
│   ├── lib/             # Utilitários globais e helpers (formatação, cálculos)
│   ├── pages/           # Páginas da aplicação (Roteamento)
│   ├── App.tsx          # Componente raiz e configuração de rotas
│   └── main.tsx         # Ponto de entrada da aplicação
├── supabase/            # Arquivos relacionados ao backend
│   ├── functions/       # Edge Functions
│   └── migrations/      # Migrações do banco de dados SQL
└── ...arquivos de configuração (vite.config.ts, tailwind.config.ts, etc.)
```

### Padrões Adotados

- **Componentes**: Componentes funcionais com Hooks.
- **Data Fetching**: Custom hooks encapsulando o `useQuery` e `useMutation` do TanStack Query (ex: `useLeads`, `useFinancial`).
- **Path Alias**: Uso de `@/` para importar arquivos a partir da pasta `src/`.

---

## ✨ Funcionalidades Principais

### 📊 Dashboards
Visões personalizadas para diferentes perfis de usuário:
- **Gestor**: Visão macro do negócio, financeiro e conversão.
- **Professor**: Agenda de aulas, alunos e avaliações.
- **Recepção**: Check-ins rápidos, aniversariantes e tarefas.
- **Aluno**: Progresso, treinos e histórico.

### 🤝 Gestão de Leads (CRM)
- Pipeline de vendas visual (Kanban).
- Histórico de interações.
- Importação/Exportação de leads.
- Ações rápidas de contato (WhatsApp).

### 🏋️ Gestão Técnica
- **Treinos**: Montagem de fichas, banco de exercícios e histórico de execuções.
- **Aulas Coletivas**: Grade de horários, gestão de capacidade e check-ins.
### Avaliações
- Avaliação física completa, anamnese e gráficos de evolução.

---

## 🔑 Acesso Administrativo (Primeiro Acesso)

Como o sistema utiliza autenticação segura via Supabase, não existem contas de administrador "padrão" hardcoded. Para criar o primeiro acesso administrativo:

1. Acesse a aplicação e faça o **Cadastro** de um novo usuário.
2. No painel do Supabase (SQL Editor), execute o script `PROMOTE_TO_ADMIN.sql` que está na raiz do projeto.
   - Lembre-se de substituir o email no script pelo email que você acabou de cadastrar.
3. Atualize a página e você terá acesso total como **Gestor**.

### 💰 Financeiro
- Gestão de Planos e Matrículas.
- Controle de Mensalidades e Faturas.
  - Relatórios de inadimplência.

---

## 🚀 Como fazer Deploy na Vercel

Este projeto está pronto para ser hospedado na Vercel. Siga os passos abaixo:

1.  Faça um **Fork** ou envie este código para o seu repositório GitHub.
2.  Crie uma conta na [Vercel](https://vercel.com) (pode usar sua conta GitHub).
3.  No painel da Vercel, clique em **"Add New..."** -> **"Project"**.
4.  Importe o repositório do projeto.
5.  Na configuração do projeto (**Configure Project**), expanda a seção **Environment Variables** e adicione as variáveis do Supabase (as mesmas do arquivo `.env` ou `.env.example`):
    - `VITE_SUPABASE_URL`: Sua URL do Supabase.
    - `VITE_SUPABASE_PUBLISHABLE_KEY`: Sua chave pública (anon) do Supabase.
6.  Clique em **Deploy**.
7.  A Vercel irá construir o projeto e gerar uma URL para acesso público.

**Nota:** O arquivo `vercel.json` incluído na raiz já configura as regras de reescrita (rewrites) necessárias para o roteamento do React (SPA) funcionar corretamente.
- Relatórios de inadimplência.

### 🤖 Automação e Engajamento
- Regras de automação para tarefas e comunicações.
- Sistema de Chat interno.
- Pesquisas de NPS (Net Promoter Score).

---

## 🛠️ Como Executar Localmente

### Pré-requisitos
- Node.js (v18+)
- npm ou bun

### Passo a Passo

1. **Clone o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd CRM
   ```

2. **Instale as dependências**
   ```bash
   npm install
   # ou
   bun install
   ```

3. **Configure as Variáveis de Ambiente**
   Crie um arquivo `.env` na raiz do projeto com as credenciais do Supabase:
   ```env
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima
   ```

4. **Execute o servidor de desenvolvimento**
   ```bash
   npm run dev
   ```
   Acesse `http://localhost:8080` no seu navegador.

### Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento.
- `npm run build`: Gera o build de produção.
- `npm run lint`: Executa a verificação de código (ESLint).
- `npm run preview`: Visualiza o build de produção localmente.

---

## 📄 Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados.
