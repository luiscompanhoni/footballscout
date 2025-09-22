from flask import Blueprint, jsonify, request
from src.models.user import db
from src.models.league import League
from src.models.player import Player, Team, PlayerStatistics
from src.services.spp_calculator import SPPCalculator
from src.services.api_football import LEAGUE_CONFIG

spp_bp = Blueprint('spp', __name__)

@spp_bp.route('/rankings/global', methods=['GET'])
def get_global_ranking():
    """Retorna ranking global dos melhores jogadores"""
    try:
        limit = request.args.get('limit', 100, type=int)
        season = request.args.get('season', 2023, type=int)
        
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
            PlayerStatistics.season == season
        ).order_by(
            PlayerStatistics.spp_score.desc()
        ).limit(limit)
        
        results = query.all()
        
        ranking = []
        for i, (player, stats, league, team) in enumerate(results, 1):
            player_data = player.to_dict()
            player_data['rank'] = i
            player_data['spp_score'] = round(stats.spp_score, 2)
            player_data['statistics'] = {
                'goals': stats.goals_total,
                'assists': stats.goals_assists,
                'games': stats.games_appearences,
                'minutes': stats.games_minutes,
                'rating': stats.games_rating,
                'position': stats.games_position
            }
            player_data['league'] = {
                'id': league.id,
                'name': league.name,
                'country': league.country,
                'logo': league.logo
            }
            player_data['team'] = {
                'id': team.id,
                'name': team.name,
                'logo': team.logo
            }
            ranking.append(player_data)
        
        return jsonify({
            'ranking': ranking,
            'total': len(ranking),
            'season': season
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@spp_bp.route('/rankings/league/<int:league_id>', methods=['GET'])
def get_league_ranking(league_id):
    """Retorna ranking de jogadores de uma liga específica"""
    try:
        limit = request.args.get('limit', 50, type=int)
        season = request.args.get('season', 2023, type=int)
        
        # Verificar se a liga existe
        league = League.query.filter_by(id=league_id).first()
        if not league:
            return jsonify({'error': 'Liga não encontrada'}), 404
        
        ranking = SPPCalculator.get_league_ranking(league_id, season, limit)
        
        return jsonify({
            'ranking': ranking,
            'league': league.to_dict(),
            'total': len(ranking),
            'season': season
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@spp_bp.route('/rankings/continent/<continent>', methods=['GET'])
def get_continental_ranking(continent):
    """Retorna ranking de jogadores por continente"""
    try:
        limit = request.args.get('limit', 100, type=int)
        season = request.args.get('season', 2023, type=int)
        
        # Validar continente
        valid_continents = set(config.get('continent') for config in LEAGUE_CONFIG.values())
        if continent not in valid_continents:
            return jsonify({'error': f'Continente inválido. Opções: {list(valid_continents)}'}), 400
        
        ranking = SPPCalculator.get_continental_ranking(continent, season, limit)
        
        # Obter informações das ligas do continente
        continent_leagues = [
            {'id': league_id, **config} for league_id, config in LEAGUE_CONFIG.items()
            if config.get('continent') == continent
        ]
        
        return jsonify({
            'ranking': ranking,
            'continent': continent,
            'leagues': continent_leagues,
            'total': len(ranking),
            'season': season
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@spp_bp.route('/rankings/position/<position>', methods=['GET'])
def get_position_ranking(position):
    """Retorna ranking de jogadores por posição"""
    try:
        limit = request.args.get('limit', 50, type=int)
        season = request.args.get('season', 2023, type=int)
        league_id = request.args.get('league_id', type=int)
        
        # Validar posição
        valid_positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker']
        if position not in valid_positions:
            return jsonify({'error': f'Posição inválida. Opções: {valid_positions}'}), 400
        
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
            PlayerStatistics.season == season
        )
        
        # Filtrar por posição usando a categorização do SPPCalculator
        position_filters = {
            'Goalkeeper': ['Goalkeeper', 'goalkeeper', 'keeper'],
            'Defender': ['back', 'defender', 'centre-back', 'left-back', 'right-back'],
            'Attacker': ['forward', 'striker', 'winger', 'attacker'],
            'Midfielder': []  # Será usado como padrão
        }
        
        if position != 'Midfielder':
            position_keywords = position_filters[position]
            filters = []
            for keyword in position_keywords:
                filters.append(PlayerStatistics.games_position.ilike(f'%{keyword}%'))
            query = query.filter(db.or_(*filters))
        else:
            # Para meio-campistas, excluir as outras posições
            exclude_keywords = []
            for pos, keywords in position_filters.items():
                if pos != 'Midfielder':
                    exclude_keywords.extend(keywords)
            
            exclude_filters = []
            for keyword in exclude_keywords:
                exclude_filters.append(~PlayerStatistics.games_position.ilike(f'%{keyword}%'))
            query = query.filter(db.and_(*exclude_filters))
        
        # Filtrar por liga se especificado
        if league_id:
            query = query.filter(PlayerStatistics.league_id == league_id)
        
        query = query.order_by(PlayerStatistics.spp_score.desc()).limit(limit)
        results = query.all()
        
        ranking = []
        for i, (player, stats, league, team) in enumerate(results, 1):
            player_data = player.to_dict()
            player_data['rank'] = i
            player_data['spp_score'] = round(stats.spp_score, 2)
            player_data['statistics'] = {
                'goals': stats.goals_total,
                'assists': stats.goals_assists,
                'games': stats.games_appearences,
                'minutes': stats.games_minutes,
                'rating': stats.games_rating,
                'position': stats.games_position
            }
            player_data['league'] = {
                'id': league.id,
                'name': league.name,
                'country': league.country,
                'logo': league.logo
            }
            player_data['team'] = {
                'id': team.id,
                'name': team.name,
                'logo': team.logo
            }
            ranking.append(player_data)
        
        return jsonify({
            'ranking': ranking,
            'position': position,
            'total': len(ranking),
            'season': season
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@spp_bp.route('/player/<int:player_id>/spp', methods=['GET'])
def get_player_spp(player_id):
    """Retorna detalhes da pontuação SPP de um jogador específico"""
    try:
        season = request.args.get('season', 2023, type=int)
        
        # Buscar jogador e suas estatísticas
        result = db.session.query(
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
            Player.id == player_id,
            PlayerStatistics.season == season
        ).first()
        
        if not result:
            return jsonify({'error': 'Jogador não encontrado'}), 404
        
        player, stats, league, team = result
        
        # Calcular breakdown da pontuação SPP
        position_category = SPPCalculator._get_position_category(stats.games_position)
        position_multipliers = SPPCalculator.POSITION_MULTIPLIERS.get(
            position_category, 
            SPPCalculator.POSITION_MULTIPLIERS['Midfielder']
        )
        
        breakdown = {
            'goals': {
                'count': stats.goals_total or 0,
                'points_per': position_multipliers.get('goals', 6.0),
                'total_points': (stats.goals_total or 0) * position_multipliers.get('goals', 6.0)
            },
            'assists': {
                'count': stats.goals_assists or 0,
                'points_per': position_multipliers.get('assists', 4.0),
                'total_points': (stats.goals_assists or 0) * position_multipliers.get('assists', 4.0)
            },
            'penalties': {
                'yellow_cards': stats.cards_yellow or 0,
                'red_cards': stats.cards_red or 0,
                'penalty_points': ((stats.cards_yellow or 0) * SPPCalculator.PENALTIES['yellow_card']) + 
                                ((stats.cards_red or 0) * SPPCalculator.PENALTIES['red_card'])
            },
            'league_multiplier': league.spp_multiplier or 1.0,
            'position_category': position_category
        }
        
        player_data = player.to_dict()
        player_data['spp_score'] = round(stats.spp_score, 2)
        player_data['spp_breakdown'] = breakdown
        player_data['statistics'] = stats.to_dict()
        player_data['league'] = league.to_dict()
        player_data['team'] = team.to_dict()
        
        return jsonify(player_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@spp_bp.route('/recalculate', methods=['POST'])
def recalculate_spp_scores():
    """Recalcula todas as pontuações SPP"""
    try:
        season = request.json.get('season', 2023) if request.json else 2023
        
        updated_count = SPPCalculator.recalculate_all_scores(season)
        
        return jsonify({
            'message': f'Pontuações SPP recalculadas com sucesso',
            'updated_players': updated_count,
            'season': season
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@spp_bp.route('/stats/overview', methods=['GET'])
def get_stats_overview():
    """Retorna estatísticas gerais do sistema"""
    try:
        season = request.args.get('season', 2023, type=int)
        
        # Contar jogadores por liga
        leagues_stats = db.session.query(
            League.id,
            League.name,
            League.country,
            db.func.count(PlayerStatistics.player_id).label('player_count'),
            db.func.avg(PlayerStatistics.spp_score).label('avg_spp'),
            db.func.max(PlayerStatistics.spp_score).label('max_spp')
        ).join(
            PlayerStatistics, League.id == PlayerStatistics.league_id
        ).filter(
            PlayerStatistics.season == season
        ).group_by(
            League.id, League.name, League.country
        ).all()
        
        # Estatísticas por posição
        position_stats = db.session.query(
            PlayerStatistics.games_position,
            db.func.count(PlayerStatistics.player_id).label('count'),
            db.func.avg(PlayerStatistics.spp_score).label('avg_spp')
        ).filter(
            PlayerStatistics.season == season,
            PlayerStatistics.games_position.isnot(None)
        ).group_by(
            PlayerStatistics.games_position
        ).all()
        
        # Top 10 jogadores
        top_players = db.session.query(
            Player.name,
            PlayerStatistics.spp_score,
            League.name.label('league_name'),
            Team.name.label('team_name')
        ).join(
            PlayerStatistics, Player.id == PlayerStatistics.player_id
        ).join(
            League, PlayerStatistics.league_id == League.id
        ).join(
            Team, PlayerStatistics.team_id == Team.id
        ).filter(
            PlayerStatistics.season == season
        ).order_by(
            PlayerStatistics.spp_score.desc()
        ).limit(10).all()
        
        return jsonify({
            'season': season,
            'leagues': [
                {
                    'id': league_id,
                    'name': name,
                    'country': country,
                    'player_count': player_count,
                    'avg_spp': round(float(avg_spp), 2) if avg_spp else 0,
                    'max_spp': round(float(max_spp), 2) if max_spp else 0
                }
                for league_id, name, country, player_count, avg_spp, max_spp in leagues_stats
            ],
            'positions': [
                {
                    'position': position,
                    'count': count,
                    'avg_spp': round(float(avg_spp), 2) if avg_spp else 0
                }
                for position, count, avg_spp in position_stats
            ],
            'top_players': [
                {
                    'name': name,
                    'spp_score': round(float(spp_score), 2),
                    'league': league_name,
                    'team': team_name
                }
                for name, spp_score, league_name, team_name in top_players
            ]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

