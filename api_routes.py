from flask import Blueprint, jsonify, request
from src.models.user import db
from src.models.league import League
from src.models.player import Player, Team, PlayerStatistics
from src.services.api_football import APIFootballService, LEAGUE_CONFIG
import os

api_bp = Blueprint('api', __name__)

# Inicializar o serviço da API Football
try:
    api_service = APIFootballService()
except ValueError as e:
    print(f"Aviso: {e}")
    api_service = None

@api_bp.route('/status', methods=['GET'])
def get_api_status():
    """Retorna o status da API Football e informações da conta"""
    if not api_service:
        return jsonify({'error': 'API Football não configurada'}), 500
    
    try:
        status = api_service.get_api_status()
        return jsonify(status)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/leagues', methods=['GET'])
def get_leagues():
    """Retorna lista de ligas monitoradas"""
    try:
        leagues = League.query.all()
        return jsonify([league.to_dict() for league in leagues])
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/leagues/sync', methods=['POST'])
def sync_leagues():
    """Sincroniza ligas da API Football com o banco local"""
    if not api_service:
        return jsonify({'error': 'API Football não configurada'}), 500
    
    try:
        synced_count = 0
        
        for league_id, config in LEAGUE_CONFIG.items():
            # Buscar liga na API
            leagues_data = api_service.get_leagues()
            
            # Encontrar a liga específica
            league_data = None
            for league in leagues_data:
                if league['league']['id'] == league_id:
                    league_data = league
                    break
            
            if not league_data:
                continue
            
            # Verificar se já existe no banco
            existing_league = League.query.filter_by(id=league_id).first()
            
            if existing_league:
                # Atualizar dados existentes
                existing_league.name = league_data['league']['name']
                existing_league.country = config['country']
                existing_league.logo = league_data['league']['logo']
                existing_league.type = league_data['league']['type']
                existing_league.spp_multiplier = config['multiplier']
            else:
                # Criar nova liga
                new_league = League(
                    id=league_id,
                    name=league_data['league']['name'],
                    country=config['country'],
                    logo=league_data['league']['logo'],
                    type=league_data['league']['type'],
                    spp_multiplier=config['multiplier']
                )
                db.session.add(new_league)
            
            synced_count += 1
        
        db.session.commit()
        return jsonify({'message': f'{synced_count} ligas sincronizadas com sucesso'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@api_bp.route('/players/top', methods=['GET'])
def get_top_players():
    """Retorna ranking dos melhores jogadores por pontuação SPP"""
    try:
        limit = request.args.get('limit', 50, type=int)
        league_id = request.args.get('league_id', type=int)
        continent = request.args.get('continent', type=str)
        
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
        ).order_by(
            PlayerStatistics.spp_score.desc()
        )
        
        # Filtros opcionais
        if league_id:
            query = query.filter(PlayerStatistics.league_id == league_id)
        
        if continent:
            # Filtrar por continente baseado na configuração das ligas
            continent_leagues = [
                lid for lid, config in LEAGUE_CONFIG.items() 
                if config.get('continent') == continent
            ]
            query = query.filter(PlayerStatistics.league_id.in_(continent_leagues))
        
        results = query.limit(limit).all()
        
        players_data = []
        for player, stats, league, team in results:
            player_dict = player.to_dict()
            player_dict['statistics'] = stats.to_dict()
            player_dict['league'] = league.to_dict()
            player_dict['team'] = team.to_dict()
            players_data.append(player_dict)
        
        return jsonify(players_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api_bp.route('/players/sync', methods=['POST'])
def sync_players():
    """Sincroniza jogadores e estatísticas de uma liga específica"""
    if not api_service:
        return jsonify({'error': 'API Football não configurada'}), 500
    
    try:
        league_id = request.json.get('league_id')
        season = request.json.get('season', 2023)
        
        if not league_id:
            return jsonify({'error': 'league_id é obrigatório'}), 400
        
        # Verificar se a liga existe
        league = League.query.filter_by(id=league_id).first()
        if not league:
            return jsonify({'error': 'Liga não encontrada'}), 404
        
        synced_players = 0
        page = 1
        
        while True:
            # Buscar jogadores da API
            players_data = api_service.get_players_statistics(league_id, season, page=page)
            
            if not players_data:
                break
            
            for player_data in players_data:
                player_info = player_data['player']
                statistics = player_data['statistics'][0] if player_data['statistics'] else {}
                
                # Sincronizar time
                team_info = statistics.get('team', {})
                if team_info:
                    team = Team.query.filter_by(id=team_info['id']).first()
                    if not team:
                        team = Team(
                            id=team_info['id'],
                            name=team_info['name'],
                            logo=team_info['logo']
                        )
                        db.session.add(team)
                
                # Sincronizar jogador
                player = Player.query.filter_by(id=player_info['id']).first()
                if not player:
                    player = Player(
                        id=player_info['id'],
                        name=player_info['name'],
                        firstname=player_info.get('firstname'),
                        lastname=player_info.get('lastname'),
                        age=player_info.get('age'),
                        birth_date=player_info.get('birth', {}).get('date'),
                        birth_place=player_info.get('birth', {}).get('place'),
                        birth_country=player_info.get('birth', {}).get('country'),
                        nationality=player_info.get('nationality'),
                        height=player_info.get('height'),
                        weight=player_info.get('weight'),
                        photo=player_info.get('photo'),
                        league_id=league_id,
                        team_id=team_info.get('id') if team_info else None
                    )
                    db.session.add(player)
                
                # Sincronizar estatísticas
                if statistics:
                    print(f"Processing stats for player {player_info['id']}")
                    existing_stats = PlayerStatistics.query.filter_by(
                        player_id=player_info['id'],
                        season=season,
                        league_id=league_id
                    ).first()
                    
                    if existing_stats:
                        # Atualizar estatísticas existentes
                        _update_player_statistics(existing_stats, statistics)
                    else:
                        # Criar novas estatísticas
                        new_stats = _create_player_statistics(player_info['id'], season, league_id, statistics)
                        db.session.add(new_stats)
                
                synced_players += 1
            
            page += 1
            if len(players_data) < 20:  # API retorna 20 por página
                break
        
        db.session.commit()
        return jsonify({'message': f'{synced_players} jogadores sincronizados com sucesso'})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def _create_player_statistics(player_id: int, season: int, league_id: int, stats_data: dict) -> PlayerStatistics:
    """Cria um novo registro de estatísticas de jogador"""
    games = stats_data.get('games', {})
    goals = stats_data.get('goals', {})
    passes = stats_data.get('passes', {})
    tackles = stats_data.get('tackles', {})
    duels = stats_data.get('duels', {})
    dribbles = stats_data.get('dribbles', {})
    fouls = stats_data.get('fouls', {})
    cards = stats_data.get('cards', {})
    penalty = stats_data.get('penalty', {})
    
    return PlayerStatistics(
        player_id=player_id,
        season=season,
        league_id=league_id,
        team_id=stats_data.get('team', {}).get('id'),
        games_appearences=games.get('appearences', 0),
        games_lineups=games.get('lineups', 0),
        games_minutes=games.get('minutes', 0),
        games_number=games.get('number'),
        games_position=games.get('position'),
        games_rating=float(games.get('rating', 0)) if games.get('rating') else None,
        games_captain=games.get('captain', False),
        goals_total=goals.get('total', 0),
        goals_conceded=goals.get('conceded', 0),
        goals_assists=goals.get('assists', 0),
        goals_saves=goals.get('saves', 0),
        passes_total=passes.get('total', 0),
        passes_key=passes.get('key', 0),
        passes_accuracy=passes.get('accuracy', 0),
        tackles_total=tackles.get('total', 0),
        tackles_blocks=tackles.get('blocks', 0),
        tackles_interceptions=tackles.get('interceptions', 0),
        duels_total=duels.get('total', 0),
        duels_won=duels.get('won', 0),
        dribbles_attempts=dribbles.get('attempts', 0),
        dribbles_success=dribbles.get('success', 0),
        dribbles_past=dribbles.get('past', 0),
        fouls_drawn=fouls.get('drawn', 0),
        fouls_committed=fouls.get('committed', 0),
        cards_yellow=cards.get('yellow', 0),
        cards_yellowred=cards.get('yellowred', 0),
        cards_red=cards.get('red', 0),
        penalty_won=penalty.get('won', 0),
        penalty_commited=penalty.get('commited', 0),
        penalty_scored=penalty.get('scored', 0),
        penalty_missed=penalty.get('missed', 0),
        penalty_saved=penalty.get('saved', 0)
    )

def _update_player_statistics(stats: PlayerStatistics, stats_data: dict):
    """Atualiza estatísticas existentes de um jogador"""
    games = stats_data.get('games', {})
    goals = stats_data.get('goals', {})
    passes = stats_data.get('passes', {})
    tackles = stats_data.get('tackles', {})
    duels = stats_data.get('duels', {})
    dribbles = stats_data.get('dribbles', {})
    fouls = stats_data.get('fouls', {})
    cards = stats_data.get('cards', {})
    penalty = stats_data.get('penalty', {})
    
    stats.games_appearences = games.get('appearences', 0)
    stats.games_lineups = games.get('lineups', 0)
    stats.games_minutes = games.get('minutes', 0)
    stats.games_number = games.get('number')
    stats.games_position = games.get('position')
    stats.games_rating = float(games.get('rating', 0)) if games.get('rating') else None
    stats.games_captain = games.get('captain', False)
    stats.goals_total = goals.get('total', 0)
    stats.goals_conceded = goals.get('conceded', 0)
    stats.goals_assists = goals.get('assists', 0)
    stats.goals_saves = goals.get('saves', 0)
    stats.passes_total = passes.get('total', 0)
    stats.passes_key = passes.get('key', 0)
    stats.passes_accuracy = passes.get('accuracy', 0)
    stats.tackles_total = tackles.get('total', 0)
    stats.tackles_blocks = tackles.get('blocks', 0)
    stats.tackles_interceptions = tackles.get('interceptions', 0)
    stats.duels_total = duels.get('total', 0)
    stats.duels_won = duels.get('won', 0)
    stats.dribbles_attempts = dribbles.get('attempts', 0)
    stats.dribbles_success = dribbles.get('success', 0)
    stats.dribbles_past = dribbles.get('past', 0)
    stats.fouls_drawn = fouls.get('drawn', 0)
    stats.fouls_committed = fouls.get('committed', 0)
    stats.cards_yellow = cards.get('yellow', 0)
    stats.cards_yellowred = cards.get('yellowred', 0)
    stats.cards_red = cards.get('red', 0)
    stats.penalty_won = penalty.get('won', 0)
    stats.penalty_commited = penalty.get('commited', 0)
    stats.penalty_scored = penalty.get('scored', 0)
    stats.penalty_missed = penalty.get('missed', 0)
    stats.penalty_saved = penalty.get('saved', 0)

