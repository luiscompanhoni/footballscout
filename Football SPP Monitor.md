# Football SPP Monitor

Sistema dinâmico para monitoramento de performance de jogadores de futebol usando a API Football, implementando o Sistema Ponderado de Performance (SPP) com rankings global, por ligas e continentes.

## 📋 Visão Geral

O Football SPP Monitor é uma aplicação web completa que permite:

- **Monitoramento em tempo real** de jogadores das principais ligas mundiais
- **Sistema de pontuação SPP** que normaliza performance entre diferentes ligas e posições
- **Rankings dinâmicos** por categoria (global, continental, liga, posição)
- **Interface moderna** com React e design responsivo
- **API robusta** com Flask para integração com dados externos

## 🏆 Sistema SPP (Sistema Ponderado de Performance)

### Metodologia

O SPP é um sistema de pontuação que considera:

1. **Performance Individual**
   - Gols (peso varia por posição)
   - Assistências
   - Ações defensivas (tackles, interceptações, bloqueios)
   - Clean sheets (para defensores e goleiros)
   - Precisão de passes (para meio-campistas)

2. **Multiplicadores por Liga**
   - Premier League: 1.0x (referência)
   - La Liga: 0.95x
   - Serie A: 0.9x
   - Bundesliga: 0.85x
   - Ligue 1: 0.8x
   - Brasileirão: 0.8x

3. **Ajustes por Posição**
   - **Atacantes**: Foco em gols e assistências
   - **Meio-campistas**: Valoriza passes chave e versatilidade
   - **Defensores**: Prioriza ações defensivas e clean sheets
   - **Goleiros**: Enfatiza defesas e clean sheets

4. **Penalizações e Bônus**
   - Cartões amarelos: -1.0 ponto
   - Cartões vermelhos: -5.0 pontos
   - Pênaltis perdidos: -3.0 pontos
   - Bônus de capitão: +20%
   - Bônus por rating alto: variável

## 🚀 Tecnologias Utilizadas

### Backend
- **Flask** - Framework web Python
- **SQLAlchemy** - ORM para banco de dados
- **Flask-CORS** - Suporte a CORS
- **Requests** - Cliente HTTP para API Football
- **SQLite** - Banco de dados

### Frontend
- **React** - Biblioteca JavaScript
- **React Router** - Roteamento
- **Tailwind CSS** - Framework CSS
- **Shadcn/UI** - Componentes UI
- **Lucide React** - Ícones
- **Recharts** - Gráficos (preparado para uso)

### APIs Externas
- **API Football** - Dados de jogadores e estatísticas

## 📁 Estrutura do Projeto

```
football-spp-monitor/
├── src/
│   ├── models/           # Modelos de dados
│   │   ├── league.py
│   │   ├── player.py
│   │   └── user.py
│   ├── routes/           # Rotas da API
│   │   ├── api_routes.py
│   │   ├── spp_routes.py
│   │   └── user.py
│   ├── services/         # Serviços de negócio
│   │   ├── api_football.py
│   │   └── spp_calculator.py
│   ├── static/           # Arquivos estáticos
│   ├── database/         # Banco de dados
│   └── main.py          # Aplicação principal
├── venv/                # Ambiente virtual Python
└── requirements.txt     # Dependências Python

football-spp-frontend/
├── src/
│   ├── components/      # Componentes React
│   │   ├── ui/         # Componentes base
│   │   ├── Dashboard.jsx
│   │   ├── GlobalRanking.jsx
│   │   ├── LeagueRanking.jsx
│   │   ├── ContinentalRanking.jsx
│   │   ├── PlayerProfile.jsx
│   │   ├── Header.jsx
│   │   └── Sidebar.jsx
│   ├── hooks/          # Hooks personalizados
│   │   └── useApi.js
│   ├── services/       # Serviços
│   │   └── api.js
│   ├── assets/         # Recursos estáticos
│   └── App.jsx        # Componente principal
├── public/             # Arquivos públicos
└── package.json       # Dependências Node.js
```

## ⚙️ Configuração e Instalação

### Pré-requisitos
- Python 3.11+
- Node.js 18+
- Conta na API Football (opcional para dados reais)

### Backend (Flask)

1. **Navegue para o diretório do backend:**
   ```bash
   cd football-spp-monitor
   ```

2. **Ative o ambiente virtual:**
   ```bash
   source venv/bin/activate
   ```

3. **Configure a API Football (opcional):**
   ```bash
   export API_FOOTBALL_KEY="sua_chave_aqui"
   ```

4. **Inicie o servidor:**
   ```bash
   python -m flask --app src/main.py run --host=0.0.0.0 --port=5000 --debug
   ```

### Frontend (React)

1. **Navegue para o diretório do frontend:**
   ```bash
   cd football-spp-frontend
   ```

2. **Instale as dependências:**
   ```bash
   pnpm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   pnpm run dev --host
   ```

4. **Acesse a aplicação:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 🔗 Endpoints da API

### Informações Gerais
- `GET /api/status` - Status da API Football
- `GET /api/leagues` - Lista de ligas monitoradas
- `POST /api/leagues/sync` - Sincronizar ligas

### Jogadores
- `GET /api/players/top` - Top jogadores
- `POST /api/players/sync` - Sincronizar jogadores de uma liga

### Rankings SPP
- `GET /api/spp/rankings/global` - Ranking global
- `GET /api/spp/rankings/league/{id}` - Ranking por liga
- `GET /api/spp/rankings/continent/{continent}` - Ranking continental
- `GET /api/spp/rankings/position/{position}` - Ranking por posição
- `GET /api/spp/player/{id}/spp` - Detalhes SPP de um jogador
- `POST /api/spp/recalculate` - Recalcular pontuações SPP
- `GET /api/spp/stats/overview` - Estatísticas gerais

## 🎯 Funcionalidades Principais

### Dashboard
- Visão geral do sistema
- Estatísticas gerais (total de jogadores, ligas, etc.)
- Top 5 jogadores
- Ações rápidas para navegação

### Rankings
- **Global**: Melhores jogadores do mundo
- **Continental**: Europa, América do Sul, América do Norte
- **Por Liga**: Premier League, La Liga, Serie A, etc.
- **Por Posição**: Atacantes, Meio-campistas, Defensores, Goleiros

### Perfil do Jogador
- Informações pessoais e profissionais
- Estatísticas detalhadas da temporada
- Breakdown da pontuação SPP
- Histórico de performance

### Filtros e Busca
- Busca por nome de jogador ou time
- Filtros por posição, liga, temporada
- Ordenação por diferentes critérios

## 🔧 Configurações Avançadas

### Multiplicadores de Liga
Os multiplicadores podem ser ajustados no arquivo `src/services/api_football.py`:

```python
LEAGUE_CONFIG = {
    39: {'name': 'Premier League', 'multiplier': 1.0, 'continent': 'Europe'},
    140: {'name': 'La Liga', 'multiplier': 0.95, 'continent': 'Europe'},
    # ... outros
}
```

### Pesos por Posição
Ajuste os pesos no arquivo `src/services/spp_calculator.py`:

```python
POSITION_MULTIPLIERS = {
    'Attacker': {
        'goals': 6.0,
        'assists': 4.0,
        # ... outros
    }
}
```

## 🚀 Deploy

### Backend
O backend Flask pode ser deployado usando o serviço de deploy integrado:

```bash
# Deploy automático (quando disponível)
manus-deploy-backend football-spp-monitor
```

### Frontend
O frontend React pode ser buildado e deployado:

```bash
# Build para produção
pnpm run build

# Deploy automático (quando disponível)
manus-deploy-frontend dist/
```

## 📊 Dados de Exemplo

O sistema funciona com dados simulados por padrão, incluindo:
- Vinícius Júnior (Real Madrid) - 923.4 SPP
- Kylian Mbappé (PSG) - 648.2 SPP
- Harry Kane (Bayern Munich) - 584.1 SPP
- Erling Haaland (Manchester City) - 567.8 SPP

Para dados reais, configure a API Football key.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação
2. Consulte os logs do servidor
3. Abra uma issue no repositório

---

**Desenvolvido com ⚽ para análise esportiva avançada**

