from typing import Dict, List, Optional
from src.models.player import PlayerStatistics
from src.models.league import League
from src.services.api_football import LEAGUE_CONFIG

class SPPCalculator:
    """
    Sistema Ponderado de Performance (SPP) para avaliação de jogadores de futebol.
    
    O sistema atribui pontos baseados em:
    1. Performance individual (gols, assistências, clean sheets)
    2. Multiplicador da liga (baseado na dificuldade/prestígio)
    3. Posição do jogador (diferentes pesos para diferentes posições)
    """
    
    # Multiplicadores por posição
    POSITION_MULTIPLIERS = {
        'Goalkeeper': {
            'goals': 15.0,      # Gols de goleiro valem mais
            'assists': 8.0,
            'clean_sheets': 5.0,
            'saves': 0.5,
            'goals_conceded': -2.0  # Penalização por gols sofridos
        },
        'Defender': {
            'goals': 12.0,      # Gols de defensor valem mais
            'assists': 6.0,
            'clean_sheets': 4.0,
            'tackles': 1.0,
            'interceptions': 0.8,
            'blocks': 0.5
        },
        'Midfielder': {
            'goals': 8.0,
            'assists': 6.0,
            'key_passes': 1.0,
            'tackles': 0.8,
            'interceptions': 0.6,
            'pass_accuracy_bonus': 0.1  # Bônus por alta precisão de passes
        },
        'Attacker': {
            'goals': 6.0,       # Gols de atacante têm peso padrão
            'assists': 4.0,
            'key_passes': 0.8,
            'dribbles': 0.5,
            'shots_on_target': 0.3
        }
    }
    
    # Penalizações
    PENALTIES = {
        'yellow_card': -1.0,
        'red_card': -5.0,
        'penalty_missed': -3.0,
        'own_goal': -8.0
    }
    
    # Bônus especiais
    BONUSES = {
        'penalty_scored': 2.0,
        'captain_bonus': 1.2,  # Multiplicador para capitães
        'high_rating_bonus': 0.5  # Bônus para rating > 8.0
    }
    
    @classmethod
    def calculate_spp_score(cls, stats: PlayerStatistics, league: League) -> float:
        """
        Calcula a pontuação SPP para um jogador
        
        Args:
            stats: Estatísticas do jogador
            league: Liga onde o jogador atua
            
        Returns:
            Pontuação SPP calculada
        """
        if not stats or not league:
            return 0.0
        
        # Determinar posição do jogador
        position_category = cls._get_position_category(stats.games_position)
        position_multipliers = cls.POSITION_MULTIPLIERS.get(position_category, cls.POSITION_MULTIPLIERS['Midfielder'])
        
        # Calcular pontos base
        base_points = 0.0
        
        # Pontos por gols
        base_points += (stats.goals_total if stats.goals_total is not None else 0) * position_multipliers.get("goals", 6.0)
        
        # Pontos por assistências
        base_points += (stats.goals_assists if stats.goals_assists is not None else 0) * position_multipliers.get("assists", 4.0)
        
        # Pontos por clean sheets (para defensores e goleiros)
        if position_category in ["Goalkeeper", "Defender"]:
            clean_sheets = cls._calculate_clean_sheets(stats)
            base_points += clean_sheets * position_multipliers.get("clean_sheets", 4.0)
        
        # Pontos por defesas (goleiros)
        if position_category == "Goalkeeper":
            base_points += (stats.goals_saves if stats.goals_saves is not None else 0) * position_multipliers.get("saves", 0.5)
            
            # Penalização por gols sofridos
            base_points += (stats.goals_conceded if stats.goals_conceded is not None else 0) * position_multipliers.get("goals_conceded", -2.0)
        
        # Pontos por ações defensivas
        base_points += (stats.tackles_total if stats.tackles_total is not None else 0) * position_multipliers.get("tackles", 0.8)
        base_points += (stats.tackles_interceptions if stats.tackles_interceptions is not None else 0) * position_multipliers.get("interceptions", 0.6)
        base_points += (stats.tackles_blocks if stats.tackles_blocks is not None else 0) * position_multipliers.get("blocks", 0.5)
        
        # Pontos por passes chave (meio-campistas e atacantes)
        if position_category in ["Midfielder", "Attacker"]:
            base_points += (stats.passes_key if stats.passes_key is not None else 0) * position_multipliers.get("key_passes", 0.8)
        
        # Pontos por dribles (atacantes)
        if position_category == "Attacker":
            base_points += (stats.dribbles_success if stats.dribbles_success is not None else 0) * position_multipliers.get("dribbles", 0.5)
        
        # Bônus por precisão de passes (meio-campistas)
        if position_category == "Midfielder" and (stats.passes_accuracy if stats.passes_accuracy is not None else 0) > 85:
            accuracy_bonus = ((stats.passes_accuracy if stats.passes_accuracy is not None else 0) - 85) * position_multipliers.get("pass_accuracy_bonus", 0.1)
            base_points += accuracy_bonus
        
        # Aplicar penalizações
        base_points += (stats.cards_yellow if stats.cards_yellow is not None else 0) * cls.PENALTIES["yellow_card"]
        base_points += (stats.cards_red if stats.cards_red is not None else 0) * cls.PENALTIES["red_card"]
        base_points += (stats.penalty_missed if stats.penalty_missed is not None else 0) * cls.PENALTIES["penalty_missed"]
        
        # Aplicar bônus
        base_points += (stats.penalty_scored if stats.penalty_scored is not None else 0) * cls.BONUSES["penalty_scored"]
        
        # Bônus de capitão
        if stats.games_captain:
            base_points *= cls.BONUSES["captain_bonus"]
        
        # Bônus por rating alto
        player_rating = stats.games_rating if stats.games_rating is not None else 0.0
        if player_rating > 8.0:
            base_points += cls.BONUSES["high_rating_bonus"] * (player_rating - 8.0)
        
        # Aplicar multiplicador da liga
        league_multiplier = league.spp_multiplier or 1.0
        final_score = base_points * league_multiplier
        
        # Normalizar por minutos jogados (evitar inflação por poucos jogos)
        player_minutes = stats.games_minutes if stats.games_minutes is not None else 0
        if player_minutes > 0:
            minutes_factor = min(player_minutes / 2700, 1.0)  # 2700 min = 30 jogos completos
            final_score *= minutes_factor
        
        return max(final_score, 0.0)  # Nunca retornar pontuação negativa
    
    @classmethod
    def _get_position_category(cls, position: str) -> str:
        """
        Categoriza a posição do jogador
        
        Args:
            position: Posição do jogador (ex: "Centre-Back", "Attacking Midfield")
            
        Returns:
            Categoria da posição
        """
        if not position:
            return 'Midfielder'
        
        position_lower = position.lower()
        
        if 'goalkeeper' in position_lower or 'keeper' in position_lower:
            return 'Goalkeeper'
        elif any(word in position_lower for word in ['back', 'defender', 'centre-back', 'left-back', 'right-back']):
            return 'Defender'
        elif any(word in position_lower for word in ['forward', 'striker', 'winger', 'attacker']):
            return 'Attacker'
        else:
            return 'Midfielder'
    
    @classmethod
    def _calculate_clean_sheets(cls, stats: PlayerStatistics) -> int:
        """
        Estima o número de clean sheets baseado nas estatísticas disponíveis
        
        Args:
            stats: Estatísticas do jogador
            
        Returns:
            Número estimado de clean sheets
        """
        # Para goleiros, usar gols sofridos para estimar clean sheets
        if stats.games_position and 'goalkeeper' in stats.games_position.lower():
            games_appearences = stats.games_appearences if stats.games_appearences is not None else 0
            goals_conceded = stats.goals_conceded if stats.goals_conceded is not None else 0
            if games_appearences > 0:
                # Estimativa: jogos onde não sofreu gols
                estimated_clean_sheets = max(0, games_appearences - goals_conceded)
                return min(estimated_clean_sheets, games_appearences)
        
        # Para defensores, usar uma estimativa baseada em jogos e rating
        elif stats.games_position and any(word in stats.games_position.lower() for word in ['back', 'defender']):
            games_appearences = stats.games_appearences if stats.games_appearences is not None else 0
            games_rating = stats.games_rating if stats.games_rating is not None else 0.0
            if games_appearences > 0 and games_rating > 0:
                # Estimativa conservadora baseada no rating
                if games_rating > 7.0:
                    return int(games_appearences * 0.4)  # 40% dos jogos
                elif games_rating > 6.5:
                    return int(games_appearences * 0.3)  # 30% dos jogos
                else:
                    return int(games_appearences * 0.2)  # 20% dos jogos
        
        return 0
    
    @classmethod
    def get_league_ranking(cls, league_id: int, season: int = 2023, limit: int = 50) -> List[Dict]:
        """
        Obtém ranking de jogadores de uma liga específica
        
        Args:
            league_id: ID da liga
            season: Temporada
            limit: Número máximo de jogadores
            
        Returns:
            Lista de jogadores ordenados por pontuação SPP
        """
        from src.models.user import db
        from src.models.player import Player, Team
        
        query = db.session.query(
            Player,
            PlayerStatistics,
            League,
            Team
        ).join(
            PlayerStatistics, Player.id == PlayerStatistics.player_id
        ).join(
            League, PlayerStatistics.league_id == League.id
        ).join(
            Team, PlayerStatistics.team_id == Team.id
        ).filter(
            PlayerStatistics.league_id == league_id,
            PlayerStatistics.season == season
        ).order_by(
            PlayerStatistics.spp_score.desc()
        ).limit(limit)
        
        results = query.all()
        
        ranking = []
        for i, (player, stats, league, team) in enumerate(results, 1):
            player_data = player.to_dict()
            player_data['rank'] = i
            player_data['spp_score'] = stats.spp_score
            player_data['statistics'] = stats.to_dict()
            player_data['league'] = league.to_dict()
            player_data['team'] = team.to_dict()
            ranking.append(player_data)
        
        return ranking
    
    @classmethod
    def get_continental_ranking(cls, continent: str, season: int = 2023, limit: int = 100) -> List[Dict]:
        """
        Obtém ranking de jogadores por continente
        
        Args:
            continent: Nome do continente ('Europe', 'South America', etc.)
            season: Temporada
            limit: Número máximo de jogadores
            
        Returns:
            Lista de jogadores ordenados por pontuação SPP
        """
        from src.models.user import db
        from src.models.player import Player, Team
        
        # Filtrar ligas do continente
        continent_leagues = [
            league_id for league_id, config in LEAGUE_CONFIG.items()
            if config.get('continent') == continent
        ]
        
        if not continent_leagues:
            return []
        
        query = db.session.query(
            Player,
            PlayerStatistics,
            League,
            Team
        ).join(
            PlayerStatistics, Player.id == PlayerStatistics.player_id
        ).join(
            League, PlayerStatistics.league_id == League.id
        ).join(
            Team, PlayerStatistics.team_id == Team.id
        ).filter(
            PlayerStatistics.league_id.in_(continent_leagues),
            PlayerStatistics.season == season
        ).order_by(
            PlayerStatistics.spp_score.desc()
        ).limit(limit)
        
        results = query.all()
        
        ranking = []
        for i, (player, stats, league, team) in enumerate(results, 1):
            player_data = player.to_dict()
            player_data['rank'] = i
            player_data['spp_score'] = stats.spp_score
            player_data['statistics'] = stats.to_dict()
            player_data['league'] = league.to_dict()
            player_data['team'] = team.to_dict()
            ranking.append(player_data)
        
        return ranking
    
    @classmethod
    def recalculate_all_scores(cls, season: int = 2023) -> int:
        """
        Recalcula todas as pontuações SPP para uma temporada
        
        Args:
            season: Temporada para recalcular
            
        Returns:
            Número de jogadores atualizados
        """
        from src.models.user import db
        
        # Buscar todas as estatísticas da temporada
        stats_query = db.session.query(PlayerStatistics, League).join(
            League, PlayerStatistics.league_id == League.id
        ).filter(PlayerStatistics.season == season)
        
        updated_count = 0
        
        for stats, league in stats_query:
            try:
                # Recalcular pontuação SPP
                new_score = cls.calculate_spp_score(stats, league)
                
                # Atualizar no banco se houve mudança
                if abs(stats.spp_score - new_score) > 0.01:  # Tolerância para diferenças mínimas
                    stats.spp_score = new_score
                    updated_count += 1
            except Exception as e:
                print(f"Erro ao calcular SPP para o jogador {stats.player_id}: {e}")
        
        db.session.commit()
        return updated_count

