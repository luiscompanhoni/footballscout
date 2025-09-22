## API Football Endpoints Relevantes

### 1. Leagues (get/leagues)
- **Descrição:** Retorna a lista de ligas e copas disponíveis.
- **Parâmetros:** `id`, `name`, `country`, `code`, `season`, `team`, `type`, `current`, `search`, `last`.
- **Uso:** Essencial para obter os IDs das ligas e seus respectivos nomes, que serão usados para filtrar as estatísticas dos jogadores.

### 2. Players (get/players)
- **Descrição:** Retorna estatísticas de jogadores.
- **Parâmetros:** `id` (ID do jogador), `team` (ID do time), `league` (ID da liga), `season` (ano da temporada), `page` (para paginação).
- **Uso:** Principal endpoint para coletar dados de gols, assistências, e outras estatísticas individuais dos jogadores por liga e temporada.

### 3. Statistics (get/players/statistics)
- **Descrição:** Retorna estatísticas detalhadas de jogadores para uma liga e temporada específicas.
- **Parâmetros:** `league` (ID da liga), `season` (ano da temporada), `team` (ID do time), `player` (ID do jogador).
- **Uso:** Este endpoint parece ser o mais relevante para o nosso sistema SPP, pois permite obter as estatísticas de gols, assistências, jogos jogados, etc., por jogador, em uma liga e temporada específicas. Ele também menciona um campo `rating` que pode ser útil para ponderar o desempenho.

### 4. Seasons (get/leagues/seasons)
- **Descrição:** Retorna a lista de temporadas disponíveis para uma liga.
- **Uso:** Importante para garantir que estamos buscando dados para as temporadas corretas e que a API possui cobertura para elas.

### Autenticação
- A API utiliza chaves de API (`x-rapidapi-key` ou `x-apisports-key`) no cabeçalho das requisições.
- É necessário registrar uma chave no dashboard da API-Football ou RapidAPI.

### Limites de Requisição
- A API possui limites de requisição por dia e por minuto. É crucial gerenciar as chamadas para não exceder esses limites.

### Próximos Passos
- Obter uma chave de API.
- Testar os endpoints relevantes para entender a estrutura dos dados retornados.
- Planejar a arquitetura do backend para armazenar e processar os dados.

