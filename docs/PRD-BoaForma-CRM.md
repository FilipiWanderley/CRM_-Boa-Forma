# 🚀 CRM/ERP Boa Forma: PRD Completo (12 Módulos)

> Documento de Requisitos do Produto - Sistema de Gestão para Academias

---

## 1. Núcleo de Relacionamento (Vendas e Retenção)

### Módulo 1: CRM & Pipeline
Funil de vendas dinâmico (Lead → Visita → Ativo) com histórico completo de interações.

### Módulo 6: Automação BÁSICA
Disparos automáticos de boas-vindas e alertas de vencimento de plano.

### Módulo 9: CRM Avançado (Anti-Churn)
O "cérebro" do sistema. Dispara alertas de inatividade (se o aluno faltar X dias) e pesquisas de satisfação NPS automáticas.

---

## 2. Entrega do Serviço (Operacional e Treino)

### Módulo 7: Treino Avançado & Avaliação Física
Interface do professor com banco de vídeos/GIFs e gráficos de evolução para provar resultados ao aluno.

### Módulo 3: Acesso e Autoatendimento
Integração com catracas e totem para check-in rápido e autonomia.

### Módulo 8: Agendamento de Aulas
Gestão de vagas para aulas coletivas (Yoga, Natação, etc.) com lista de espera.

---

## 3. Ecossistema Digital (Interfaces)

### Módulo 4: App do Aluno
Central de motivação com ficha de treino, financeiro e agendamentos.

### Módulo 9 (Web): Portal do Aluno
Versão web utilizando tags semânticas HTML5 (como `<nav>` para navegação e `<main>` para conteúdo) para acessibilidade e SEO.

### Módulo 10: E-Commerce
Venda online de planos e produtos integrada ao sistema.

---

## 4. Gestão e Controle (Back-office)

### Módulo 2: Atendimento e Operacional
Gestão da recepção e processos administrativos diários.

### Módulo 11: Financeiro Avançado
Fluxo de caixa, contas a pagar/receber, emissão de NFS-e e régua de cobrança ativa.

### Módulo 10 (BI): Indicadores & Relatórios
Dashboards com KPIs reais: Taxa de Churn, LTV (Lifetime Value) e MRR (Receita Recorrente Mensal).

### Módulo 12: Estrutura Multi-Unidade
Arquitetura SaaS pronta para replicar o modelo para outras unidades ou academias.

---

## 📊 Status de Implementação

| Módulo | Nome | Status | Progresso |
|--------|------|--------|-----------|
| 1 | CRM & Pipeline | ✅ Completo | 100% |
| 2 | Atendimento e Operacional | ✅ Completo | 95% |
| 3 | Acesso e Autoatendimento | ⚠️ Parcial | 60% |
| 4 | App do Aluno | ✅ Completo | 95% |
| 6 | Automação BÁSICA | ✅ Completo | 90% |
| 7 | Treino Avançado & Avaliação | ✅ Completo | 90% |
| 8 | Agendamento de Aulas | ⚠️ Parcial | 70% |
| 9 | CRM Avançado (Anti-Churn) | ⚠️ Parcial | 40% |
| 9 (Web) | Portal do Aluno | ✅ Completo | 90% |
| 10 | E-Commerce | ⚠️ Parcial | 30% |
| 10 (BI) | Indicadores & Relatórios | ⚠️ Parcial | 60% |
| 11 | Financeiro Avançado | ⚠️ Parcial | 50% |
| 12 | Multi-Unidade | ✅ Completo | 95% |

---

## ✅ O que já está implementado

### Módulo 1: CRM & Pipeline (100%)
- [x] Funil de vendas visual (Kanban)
- [x] Cadastro completo de leads
- [x] Histórico de interações
- [x] Atribuição de responsáveis
- [x] Status: Lead → Visita Agendada → Negociação → Ativo → Inativo → Cancelado
- [x] Importação de leads via CSV

### Módulo 2: Atendimento e Operacional (95%)
- [x] Dashboard da recepção
- [x] Busca rápida de alunos
- [x] Gestão de tarefas
- [x] Registro de check-ins
- [x] Visualização de agenda

### Módulo 4: App do Aluno (95%)
- [x] Visualização de treinos
- [x] Execução de treino com timer
- [x] Histórico de treinos
- [x] Visualização financeira
- [x] QR Code para check-in
- [x] Histórico de check-ins
- [x] Gráficos de evolução de carga
- [x] Configurações de tema

### Módulo 6: Automação BÁSICA (90%)
- [x] Regras de automação configuráveis
- [x] Disparo de boas-vindas
- [x] Alertas de vencimento
- [x] Alertas de aniversário
- [x] Logs de automação
- [ ] Integração real com email/WhatsApp

### Módulo 7: Treino Avançado & Avaliação (90%)
- [x] Banco de exercícios com descrições
- [x] Montagem de fichas personalizadas
- [x] Avaliação física completa (medidas, dobras cutâneas)
- [x] Gráficos de evolução
- [x] Múltiplos protocolos de gordura corporal
- [ ] Banco de vídeos/GIFs (campo existe, precisa conteúdo)

### Módulo 12: Multi-Unidade (95%)
- [x] Arquitetura multi-tenant
- [x] RLS por unidade
- [x] Gestão de unidades
- [x] Usuários vinculados a unidades
- [x] Personalização por unidade (cor, logo, fonte, favicon)
- [x] Tema escuro personalizado por unidade

---

## ⚠️ O que está parcialmente implementado

### Módulo 3: Acesso e Autoatendimento (60%)
- [x] Check-in via QR Code
- [x] Histórico de acessos
- [x] Regras de acesso (tolerância de atraso)
- [ ] Integração com catracas físicas (API)
- [ ] Totem de autoatendimento
- [ ] Biometria/facial

### Módulo 8: Agendamento de Aulas (70%)
- [x] Agendamento básico
- [x] Disponibilidade de professores
- [x] Bloqueio de horários
- [x] Calendário visual
- [ ] Aulas coletivas com vagas limitadas
- [ ] Lista de espera automática
- [ ] Confirmação de presença

### Módulo 9: CRM Avançado Anti-Churn (40%)
- [x] Configuração de dias de inatividade
- [x] Alerta básico de inatividade
- [ ] Dashboard de risco de churn
- [ ] Pesquisa NPS automática
- [ ] Score de engajamento do aluno
- [ ] Campanhas de reativação automatizadas

### Módulo 10: E-Commerce (30%)
- [x] Página de loja (estrutura básica)
- [ ] Catálogo de produtos
- [ ] Carrinho de compras
- [ ] Gateway de pagamento integrado
- [ ] Venda de planos online
- [ ] Gestão de estoque

### Módulo 10 (BI): Indicadores & Relatórios (60%)
- [x] Dashboard com estatísticas básicas
- [x] Relatórios de conversão
- [x] Relatórios do professor
- [ ] Taxa de Churn calculada
- [ ] LTV (Lifetime Value)
- [ ] MRR (Receita Recorrente Mensal)
- [ ] Cohort analysis
- [ ] Exportação avançada

### Módulo 11: Financeiro Avançado (50%)
- [x] Gestão de planos e preços
- [x] Assinaturas e faturas
- [x] Registro de pagamentos
- [x] Métodos de pagamento
- [x] Contratos digitais
- [ ] Fluxo de caixa completo
- [ ] Contas a pagar (fornecedores)
- [ ] Emissão de NFS-e
- [ ] Régua de cobrança ativa (SMS, email)
- [ ] Integração com gateway (Stripe, PagSeguro)
- [ ] Boleto/PIX automático

---

## ❌ O que ainda precisa ser implementado

### Prioridade Alta 🔴

1. **Integração com Gateway de Pagamento**
   - Stripe, PagSeguro ou Mercado Pago
   - Cobrança recorrente automática
   - Boleto e PIX

2. **Métricas Avançadas (BI)**
   - Dashboard com Churn Rate, LTV, MRR
   - Gráficos de cohort
   - Previsão de receita

3. **Sistema Anti-Churn Completo**
   - Pesquisa NPS automática
   - Score de engajamento
   - Alertas inteligentes

### Prioridade Média 🟡

4. **Aulas Coletivas**
   - Gestão de vagas
   - Lista de espera
   - Check-in de aulas

5. **Integração WhatsApp/Email**
   - Envio real de mensagens automáticas
   - Templates personalizáveis

6. **E-Commerce Completo**
   - Venda de planos online
   - Produtos e suplementos

### Prioridade Baixa 🟢

7. **Integrações Hardware**
   - API para catracas
   - Totem de autoatendimento

8. **NFS-e**
   - Integração com prefeituras

9. **Contas a Pagar**
   - Gestão de fornecedores
   - Fluxo de caixa completo

---

## 📈 Roadmap Sugerido

### Fase 1 (Próximo Sprint)
- [ ] Integrar Stripe para pagamentos
- [ ] Implementar métricas de Churn/LTV/MRR
- [ ] Adicionar pesquisa NPS

### Fase 2
- [ ] Sistema de aulas coletivas
- [ ] Integração WhatsApp Business
- [ ] E-commerce básico

### Fase 3
- [ ] Fluxo de caixa completo
- [ ] Integrações com hardware
- [ ] NFS-e

---

*Última atualização: Janeiro 2026*
