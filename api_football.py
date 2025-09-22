import requests
import time
from typing import Dict, List, Optional
import os

class APIFootballService:
    def __init__(self, api_key: str = None, base_url: str = None):
        """
        Inicializa o serviço da API Football
        
        Args:
            api_key: Chave da API (se não fornecida, busca da variável de ambiente)
            base_url: URL base da API (padrão: API-Sports)
        """
        self.api_key = api_key or os.getenv("API_FOOTBALL_KEY", "c8bb846369588ffd9c461ade376ed205")
        self.base_url = base_url or 'https://v3.football.api-sports.io'
        
        if not self.api_key:
            raise ValueError("API key é obrigatória. Configure a variável de ambiente API_FOOTBALL_KEY ou passe como parâmetro.")
        
        self.headers = {
            'x-apisports-key': self.api_key,
            'Content-Type': 'application/json'
        }
        
        # Rate limiting
        self.last_request_time = 0
        self.min_request_interval = 1  # 1 segundo entre requisições
        
    def _make_request(self, endpoint: str, params: Dict = None) -> Dict:
        """
        Faz uma requisição para a API com rate limiting
        
        Args:
            endpoint: Endpoint da API (ex: '/leagues')
            params: Parâmetros da query string
            
        Returns:
            Resposta da API em formato dict
        """
        # Rate limiting
        current_time = time.time()
        time_since_last_request = current_time - self.last_request_time
        if time_since_last_request < self.min_request_interval:
            time.sleep(self.min_request_interval - time_since_last_request)
        
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = requests.get(url, headers=self.headers, params=params or {})
            self.last_request_time = time.time()
            
            if response.status_code == 200:
                return response.json()
            elif response.status_code == 204:
                return {'response': []}  # No content
            else:
                print(f"Erro na API: {response.status_code} - {response.text}")
                return {'response': []}
                
        except requests.exceptions.RequestException as e:
            print(f"Erro na requisição: {e}")
            return {'response': []}
    
    def get_leagues(self, country: str = None, season: int = None, current: bool = True) -> List[Dict]:
        """
        Obtém lista de ligas
        
        Args:
            country: País da liga (ex: 'England', 'Spain')
            season: Temporada (ex: 2023)
            current: Apenas ligas ativas
            
        Returns:
            Lista de ligas
        """
        params = {}
        if country:
            params['country'] = country
        if season:
            params['season'] = season
        if current:
            params['current'] = 'true'
            
        result = self._make_request('/leagues', params)
        return result.get('response', [])
    
    def get_teams(self, league_id: int, season: int) -> List[Dict]:
        """
        Obtém times de uma liga específica
        
        Args:
            league_id: ID da liga
            season: Temporada
            
        Returns:
            Lista de times
        """
        params = {
            'league': league_id,
            'season': season
        }
        
        result = self._make_request('/teams', params)
        return result.get('response', [])
    
    def get_players_statistics(self, league_id: int, season: int, team_id: int = None, page: int = 1) -> List[Dict]:
        """
        Obtém estatísticas de jogadores
        
        Args:
            league_id: ID da liga
            season: Temporada
            team_id: ID do time (opcional)
            page: Página para paginação
            
        Returns:
            Lista de estatísticas de jogadores
        """
        params = {
            'league': league_id,
            'season': season,
            'page': page
        }
        
        if team_id:
            params['team'] = team_id
            
        result = self._make_request('/players', params)
        return result.get('response', [])
    
    def get_top_scorers(self, league_id: int, season: int) -> List[Dict]:
        """
        Obtém artilheiros de uma liga
        
        Args:
            league_id: ID da liga
            season: Temporada
            
        Returns:
            Lista de artilheiros
        """
        params = {
            'league': league_id,
            'season': season
        }
        
        result = self._make_request('/players/topscorers', params)
        return result.get('response', [])
    
    def get_top_assists(self, league_id: int, season: int) -> List[Dict]:
        """
        Obtém jogadores com mais assistências
        
        Args:
            league_id: ID da liga
            season: Temporada
            
        Returns:
            Lista de jogadores com mais assistências
        """
        params = {
            'league': league_id,
            'season': season
        }
        
        result = self._make_request('/players/topassists', params)
        return result.get('response', [])
    
    def get_seasons(self) -> List[int]:
        """
        Obtém lista de temporadas disponíveis
        
        Returns:
            Lista de anos das temporadas
        """
        result = self._make_request('/leagues/seasons')
        return result.get('response', [])
    
    def get_api_status(self) -> Dict:
        """
        Obtém status da API e informações da conta
        
        Returns:
            Informações sobre limites e uso da API
        """
        result = self._make_request('/status')
        return result.get('response', {})

# Configuração das principais ligas e seus multiplicadores SPP
LEAGUE_CONFIG = {
    # Premier League (Inglaterra)
    39: {'name': 'Premier League', 'country': 'England', 'multiplier': 1.0, 'continent': 'Europe'},
    
    # La Liga (Espanha)
    140: {'name': 'La Liga', 'country': 'Spain', 'multiplier': 0.95, 'continent': 'Europe'},
    
    # Serie A (Itália)
    135: {'name': 'Serie A', 'country': 'Italy', 'multiplier': 0.9, 'continent': 'Europe'},
    
    # Bundesliga (Alemanha)
    78: {'name': 'Bundesliga', 'country': 'Germany', 'multiplier': 0.85, 'continent': 'Europe'},
    
    # Ligue 1 (França)
    61: {'name': 'Ligue 1', 'country': 'France', 'multiplier': 0.8, 'continent': 'Europe'},
    
    # Brasileirão
    71: {'name': 'Brasileirão', 'country': 'Brazil', 'multiplier': 0.8, 'continent': 'South America'},
    
    # Champions League
    2: {'name': 'Champions League', 'country': 'World', 'multiplier': 2.0, 'continent': 'Europe'},
    
    # Europa League
    3: {'name': 'Europa League', 'country': 'World', 'multiplier': 1.5, 'continent': 'Europe'},
    
    # Libertadores
    13: {'name': 'Copa Libertadores', 'country': 'South America', 'multiplier': 1.8, 'continent': 'South America'},
}

