# CRM Boa Forma

Sistema completo de gestão para academias, estúdios e personal trainers. O CRM Boa Forma oferece ferramentas para gerenciamento de leads, alunos, treinos, avaliações físicas e financeiro.

## Funcionalidades Principais

- **Dashboard**: Visão geral de métricas, atividades recentes e atalhos rápidos.
- **Gestão de Leads**: Pipeline de vendas, cadastro de leads e acompanhamento.
- **Gestão de Alunos**: Controle de matrículas, avaliações físicas e histórico.
- **Treinos e Exercícios**: Montagem de fichas de treino e banco de exercícios.
- **Financeiro**: Controle de planos, mensalidades e relatórios.
- **Automação**: Ferramentas para automatizar processos e comunicações.
- **App do Aluno**: Área exclusiva para alunos visualizarem treinos e progresso.

## Tecnologias Utilizadas

O projeto foi desenvolvido utilizando uma stack moderna e robusta:

- **Frontend**: React com TypeScript e Vite.
- **UI Components**: Shadcn/ui e Tailwind CSS para estilização.
- **Gerenciamento de Estado**: TanStack Query (React Query) para server state.
- **Backend/Baas**: Integração com Supabase.
- **Navegação**: React Router DOM.
- **Formulários**: React Hook Form e Zod para validação.

## Como Executar o Projeto

Pré-requisitos: Node.js (versão 18 ou superior) e npm instalados.

1. **Instale as dependências**

   ```bash
   npm install
   ```

2. **Inicie o servidor de desenvolvimento**

   ```bash
   npm run dev
   ```

   O aplicativo estará disponível em `http://localhost:8080`.

3. **Build para Produção**

   Para gerar a versão otimizada para produção:

   ```bash
   npm run build
   ```

## Estrutura do Projeto

- `src/components`: Componentes reutilizáveis da interface.
- `src/pages`: Páginas da aplicação mapeadas nas rotas.
- `src/hooks`: Custom hooks para lógica compartilhada.
- `src/lib`: Utilitários e configurações de bibliotecas.
- `src/integrations`: Integrações com serviços externos (ex: Supabase).

## Licença

Este projeto é proprietário e confidencial.
