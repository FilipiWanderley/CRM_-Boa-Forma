# Guia de Migração para Hostinger VPS

Este documento contém todas as instruções necessárias para hospedar o CRM Boa Forma em uma VPS da Hostinger (ou qualquer outro servidor Linux com Docker).

## 1. Preparação do Ambiente (VPS)

Acesse sua VPS via SSH e instale o Docker e Docker Compose, caso ainda não tenha feito.

```bash
# Atualize o sistema
sudo apt update && sudo apt upgrade -y

# Instale o Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicione seu usuário ao grupo docker (para não precisar usar sudo sempre)
sudo usermod -aG docker $USER
newgrp docker
```

## 2. Configuração do Supabase (Self-Hosted)

Você precisará rodar uma instância do Supabase na sua VPS. A maneira mais fácil é usando o Docker Compose oficial.

1. Clone o repositório do Supabase:
   ```bash
   git clone --depth 1 https://github.com/supabase/supabase
   cd supabase/docker
   cp .env.example .env
   ```

2. Edite o arquivo `.env` gerado e defina senhas fortes para:
   - `POSTGRES_PASSWORD`
   - `JWT_SECRET`
   - `ANON_KEY` (gerada automaticamente, mas você pode definir)
   - `SERVICE_ROLE_KEY` (gerada automaticamente, mas você pode definir)
   - `DASHBOARD_USERNAME` e `DASHBOARD_PASSWORD`

3. Inicie os serviços:
   ```bash
   docker compose up -d
   ```

   Após iniciar, você terá:
   - API Gateway (Kong): porta 8000
   - Dashboard (Studio): porta 3000
   - Banco de dados: porta 5432

## 3. Configuração do Frontend (CRM Boa Forma)

No servidor onde o frontend será hospedado (pode ser a mesma VPS ou um serviço como Vercel/Netlify/Hostinger Static Hosting), você precisará configurar as variáveis de ambiente.

Crie um arquivo `.env` na raiz do projeto (ou configure no painel de controle da hospedagem) com os seguintes valores:

```env
# URL da sua API Supabase (ex: http://seu-ip-vps:8000)
VITE_SUPABASE_URL="http://IP_DA_SUA_VPS:8000"

# Chave anônima (anon key) que você pegou no painel do Supabase ou definiu no .env do Docker
VITE_SUPABASE_PUBLISHABLE_KEY="sua-anon-key-aqui"

# ID do Projeto (para self-hosted pode ser qualquer string, mas mantenha consistente)
VITE_SUPABASE_PROJECT_ID="crm-boa-forma"
```

## 4. Build e Deploy do Frontend

1. Na sua máquina local ou pipeline de CI/CD, gere o build de produção:
   ```bash
   npm ci
   npm run build
   ```

2. O conteúdo da pasta `dist` gerada deve ser copiado para o servidor web da sua VPS (ex: Nginx, Apache ou pasta `public_html` da Hostinger).

## 5. Migração do Banco de Dados

Para levar seus dados atuais para o novo Supabase self-hosted:

1. Faça um dump do banco atual (no Supabase Cloud):
   - Vá em Database -> Backups -> Download
   - Ou use a CLI: `supabase db dump --db-url "sua-url-conexao" > backup.sql`

2. Restaure no novo banco:
   ```bash
   psql -h IP_DA_SUA_VPS -p 5432 -U postgres -f backup.sql
   ```

## Notas Importantes

- **Segurança**: Certifique-se de configurar SSL (HTTPS) para sua VPS usando Let's Encrypt e um proxy reverso (como Nginx ou Traefik) na frente do Supabase e do Frontend. O navegador pode bloquear requisições de um site HTTPS para uma API HTTP.
- **CORS**: Configure as origens permitidas no painel do Supabase Studio para incluir o domínio do seu frontend.

---
**Suporte**: Em caso de dúvidas, consulte a documentação oficial do [Supabase Self-Hosting](https://supabase.com/docs/guides/self-hosting).
