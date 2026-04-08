# GerObras — Sistema de Gerenciamento de Obras

Sistema completo para gerenciamento de múltiplas obras, com painel web administrativo, portal do cliente e aplicativo mobile.

---

## Stack Tecnológica

| Camada     | Tecnologia                                                |
|------------|-----------------------------------------------------------|
| **Backend**  | Node.js · Express · PostgreSQL · Prisma ORM · JWT       |
| **Web**      | React 18 · Vite · TailwindCSS · TanStack Query · Recharts |
| **Mobile**   | React Native · Expo · Expo Router · TanStack Query       |
| **Upload**   | Cloudinary (prod) / Local (dev)                          |
| **Push**     | Firebase Cloud Messaging (FCM)                           |
| **Email**    | Nodemailer (SMTP)                                        |
| **Relatórios** | PDFKit (PDF) · ExcelJS (Excel)                         |

---

## Estrutura do Projeto

```
construction-management/
├── backend/          # API RESTful
│   ├── prisma/
│   │   ├── schema.prisma     # Modelo de dados completo
│   │   └── seed.js           # Dados iniciais para demo
│   └── src/
│       ├── index.js           # Entry point / Express app
│       ├── middleware/
│       │   └── auth.js        # JWT + controle de perfis
│       ├── routes/
│       │   ├── auth.js        # Login, registro, recuperação de senha
│       │   ├── obras.js       # CRUD de obras + dashboard
│       │   ├── orcamentos.js  # Orçamentos, aprovação, despesas
│       │   ├── etapas.js      # Cronograma e progresso
│       │   ├── equipe.js      # Profissionais, alocação, horas
│       │   ├── materiais.js   # Estoque e compras
│       │   ├── diario.js      # Feed de atualizações + upload
│       │   ├── relatorios.js  # PDF, Excel, financeiro
│       │   ├── notificacoes.js # Notificações in-app
│       │   └── cliente.js     # Rotas específicas do cliente
│       └── services/
│           ├── email.js        # Nodemailer
│           ├── notifications.js # FCM + notificações
│           └── upload.js       # Cloudinary / local
│
├── web/              # Painel Web
│   └── src/
│       ├── App.jsx             # Roteamento e proteção de rotas
│       ├── contexts/
│       │   └── AuthContext.jsx # Autenticação global
│       ├── services/
│       │   └── api.js          # Axios + endpoints tipados
│       ├── components/
│       │   ├── AdminLayout.jsx  # Layout com sidebar
│       │   ├── ClienteLayout.jsx # Layout do portal cliente
│       │   └── NotificationBell.jsx
│       └── pages/
│           ├── admin/           # Dashboard, Obras, Orçamentos...
│           └── cliente/         # Portal do cliente
│
└── mobile/           # Aplicativo Mobile (iOS + Android)
    └── app/
        ├── (auth)/login.js      # Tela de login
        ├── (admin)/             # Tabs do gestor
        │   ├── dashboard.js
        │   ├── obras.js
        │   ├── diario.js        # Upload de fotos pela câmera
        │   ├── relatorios.js    # Compartilhamento nativo
        │   └── perfil.js
        └── (cliente)/           # Tabs do cliente
            ├── obras.js
            ├── orcamentos.js    # Aprovação com modal
            ├── diario.js
            └── perfil.js
```

---

## Modelo de Dados

```
Usuario (ADMIN | CLIENTE)
  └── Obra (1 cliente → N obras)
        ├── Etapa (cronograma + % conclusão)
        ├── Orcamento (PENDENTE | APROVADO | REPROVADO)
        │     └── ItemOrcamento
        ├── Despesa (MAO_DE_OBRA | MATERIAIS | EQUIPAMENTOS | OUTROS)
        ├── ProfissionalObra ──► Profissional
        │     └── RegistroHoras
        ├── Material
        │     └── ComprasMaterial
        └── DiarioEntrada (fotos[])
```

---

## Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn
- (Opcional) Conta Cloudinary para upload de imagens
- (Opcional) Projeto Firebase para push notifications

---

### 1. Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com seus valores

# Criar banco e rodar migrações
npm run db:migrate

# Gerar o Prisma Client
npm run db:generate

# Popular com dados de demonstração
npm run db:seed

# Iniciar em desenvolvimento
npm run dev
```

O servidor estará disponível em: `http://localhost:3001`

**Variáveis de ambiente obrigatórias:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/obras_db"
JWT_SECRET="sua_chave_secreta_muito_longa"
```

**Variáveis opcionais (habilitam funcionalidades extras):**
```env
# Email (recuperação de senha)
SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS

# Upload de imagens (sem isso, usa armazenamento local)
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

# Push notifications
FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL
```

---

### 2. Web

```bash
cd web

# Instalar dependências
npm install

# Configurar (opcional - usa proxy do Vite em dev)
echo "VITE_API_URL=http://localhost:3001/api" > .env

# Iniciar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

O painel estará disponível em: `http://localhost:5173`

**Credenciais de demonstração:**
- Admin: `admin@gerobras.com` / `admin123`
- Cliente: `cliente@gerobras.com` / `cliente123`

---

### 3. Mobile

```bash
cd mobile

# Instalar dependências
npm install

# Configurar
cp .env.example .env
# Edite EXPO_PUBLIC_API_URL com o IP do seu backend

# Instalar Expo CLI (se não tiver)
npm install -g expo-cli

# Iniciar
npm start

# Para dispositivo físico, use o IP da sua máquina:
# EXPO_PUBLIC_API_URL=http://192.168.1.xxx:3001/api
```

**Para Android/iOS em dispositivo físico:**
1. Instale o app **Expo Go** no celular
2. Escaneie o QR code exibido no terminal

**Para emuladores:**
```bash
npm run android   # Emulador Android
npm run ios       # Simulador iOS (apenas macOS)
```

---

## Funcionalidades Implementadas

### Backend API
| Módulo | Endpoints |
|--------|-----------|
| Auth | POST /login, /register, /esqueci-senha, /redefinir-senha |
| Obras | GET/POST/PUT/DELETE /obras + dashboard |
| Orçamentos | CRUD + aprovação pelo cliente + lançamento de despesas |
| Etapas | CRUD + atualização de progresso |
| Equipe | Profissionais + alocação + registro de horas |
| Materiais | CRUD + registro de compras |
| Diário | CRUD + upload de múltiplas fotos |
| Relatórios | JSON + PDF + Excel por obra + financeiro anual |
| Notificações | In-app + push via FCM |
| Cliente | Rotas restritas ao perfil do cliente |

### Web Admin
- Dashboard com gráficos de evolução de gastos
- CRUD completo de obras, etapas, equipe, materiais
- Lançamento de orçamentos e despesas
- Diário de obra com upload de fotos
- Relatórios com export para PDF e Excel
- Gerenciamento de clientes
- Notificações em tempo real (polling 30s)

### Web Cliente
- Visualização das suas obras com progresso e orçamento
- Feed de atualizações com fotos
- Aprovação/reprovação de orçamentos com justificativa
- Histórico de orçamentos

### Mobile
- Login para admin e cliente com FCM registration
- Admin: dashboard, lista de obras, diário com câmera, relatórios com compartilhamento nativo
- Cliente: obras, orçamentos com modal de aprovação, diário
- Modo offline básico via cache do TanStack Query
- Pull-to-refresh em todas as listas

---

## Alertas Automáticos de Orçamento

Configuráveis via `.env`:
```env
ALERT_PERCENTAGE_WARN=80      # Alerta quando gasto atingir 80%
ALERT_PERCENTAGE_CRITICAL=100  # Alerta crítico ao estourar o orçamento
```

Os alertas disparam notificações push + in-app para todos os admins automaticamente ao lançar uma despesa.

---

## Segurança

- Senhas com bcrypt (salt 12)
- JWT com expiração configurável
- Rate limiting: 100 req/15min por IP
- Helmet.js para headers de segurança
- CORS configurado por domínio
- Validação de todos os inputs com express-validator
- Autorização por perfil em todas as rotas
- Clientes isolados: acessam apenas suas próprias obras

---

## Próximas etapas sugeridas

- [ ] Tela de detalhes de obra no mobile (admin + cliente)
- [ ] Etapas e equipe no mobile
- [ ] Relatório de progresso com linha do tempo visual
- [ ] Sincronização offline com MMKV e queue de mutations
- [ ] Autenticação com Google/Apple Sign In
- [ ] Multi-tenant para múltiplas empresas de construção
- [ ] Módulo de contratos e NF
