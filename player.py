from flask_sqlalchemy import SQLAlchemy
from src.models.user import db

class Player(db.Model):
    __tablename__ = 'players'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    firstname = db.Column(db.String(50))
    lastname = db.Column(db.String(50))
    age = db.Column(db.Integer)
    birth_date = db.Column(db.String(20))
    birth_place = db.Column(db.String(100))
    birth_country = db.Column(db.String(50))
    nationality = db.Column(db.String(50))
    height = db.Column(db.String(10))
    weight = db.Column(db.String(10))
    injured = db.Column(db.Boolean, default=False)
    photo = db.Column(db.String(255))
    
    # Relacionamentos
    league_id = db.Column(db.Integer, db.ForeignKey('leagues.id'))
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'))
    
    # Estatísticas da temporada atual
    statistics = db.relationship('PlayerStatistics', backref='player', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'firstname': self.firstname,
            'lastname': self.lastname,
            'age': self.age,
            'birth_date': self.birth_date,
            'birth_place': self.birth_place,
            'birth_country': self.birth_country,
            'nationality': self.nationality,
            'height': self.height,
            'weight': self.weight,
            'injured': self.injured,
            'photo': self.photo,
            'league_id': self.league_id,
            'team_id': self.team_id
        }

class Team(db.Model):
    __tablename__ = 'teams'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(10))
    country = db.Column(db.String(50))
    founded = db.Column(db.Integer)
    national = db.Column(db.Boolean, default=False)
    logo = db.Column(db.String(255))
    
    # Relacionamento com jogadores
    players = db.relationship('Player', backref='team', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'country': self.country,
            'founded': self.founded,
            'national': self.national,
            'logo': self.logo
        }

class PlayerStatistics(db.Model):
    __tablename__ = 'player_statistics'
    
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('players.id'), nullable=False)
    season = db.Column(db.Integer, nullable=False)
    league_id = db.Column(db.Integer, db.ForeignKey('leagues.id'), nullable=False)
    team_id = db.Column(db.Integer, db.ForeignKey('teams.id'), nullable=False)
    
    # Estatísticas de jogos
    games_appearences = db.Column(db.Integer, default=0)
    games_lineups = db.Column(db.Integer, default=0)
    games_minutes = db.Column(db.Integer, default=0)
    games_number = db.Column(db.Integer)  # Número da camisa
    games_position = db.Column(db.String(20))
    games_rating = db.Column(db.Float)
    games_captain = db.Column(db.Boolean, default=False)
    
    # Estatísticas de gols
    goals_total = db.Column(db.Integer, default=0)
    goals_conceded = db.Column(db.Integer, default=0)
    goals_assists = db.Column(db.Integer, default=0)
    goals_saves = db.Column(db.Integer, default=0)
    
    # Estatísticas de passes
    passes_total = db.Column(db.Integer, default=0)
    passes_key = db.Column(db.Integer, default=0)
    passes_accuracy = db.Column(db.Integer, default=0)
    
    # Estatísticas de tackles
    tackles_total = db.Column(db.Integer, default=0)
    tackles_blocks = db.Column(db.Integer, default=0)
    tackles_interceptions = db.Column(db.Integer, default=0)
    
    # Estatísticas de duelos
    duels_total = db.Column(db.Integer, default=0)
    duels_won = db.Column(db.Integer, default=0)
    
    # Estatísticas de dribles
    dribbles_attempts = db.Column(db.Integer, default=0)
    dribbles_success = db.Column(db.Integer, default=0)
    dribbles_past = db.Column(db.Integer, default=0)
    
    # Estatísticas de faltas
    fouls_drawn = db.Column(db.Integer, default=0)
    fouls_committed = db.Column(db.Integer, default=0)
    
    # Cartões
    cards_yellow = db.Column(db.Integer, default=0)
    cards_yellowred = db.Column(db.Integer, default=0)
    cards_red = db.Column(db.Integer, default=0)
    
    # Penaltis
    penalty_won = db.Column(db.Integer, default=0)
    penalty_commited = db.Column(db.Integer, default=0)
    penalty_scored = db.Column(db.Integer, default=0)
    penalty_missed = db.Column(db.Integer, default=0)
    penalty_saved = db.Column(db.Integer, default=0)
    
    # Pontuação SPP calculada
    spp_score = db.Column(db.Float, default=0.0)
    last_updated = db.Column(db.DateTime, default=db.func.current_timestamp())
    
    def to_dict(self):
        return {
            'id': self.id,
            'player_id': self.player_id,
            'season': self.season,
            'league_id': self.league_id,
            'team_id': self.team_id,
            'games_appearences': self.games_appearences,
            'games_lineups': self.games_lineups,
            'games_minutes': self.games_minutes,
            'games_number': self.games_number,
            'games_position': self.games_position,
            'games_rating': self.games_rating,
            'games_captain': self.games_captain,
            'goals_total': self.goals_total,
            'goals_conceded': self.goals_conceded,
            'goals_assists': self.goals_assists,
            'goals_saves': self.goals_saves,
            'passes_total': self.passes_total,
            'passes_key': self.passes_key,
            'passes_accuracy': self.passes_accuracy,
            'tackles_total': self.tackles_total,
            'tackles_blocks': self.tackles_blocks,
            'tackles_interceptions': self.tackles_interceptions,
            'duels_total': self.duels_total,
            'duels_won': self.duels_won,
            'dribbles_attempts': self.dribbles_attempts,
            'dribbles_success': self.dribbles_success,
            'dribbles_past': self.dribbles_past,
            'fouls_drawn': self.fouls_drawn,
            'fouls_committed': self.fouls_committed,
            'cards_yellow': self.cards_yellow,
            'cards_yellowred': self.cards_yellowred,
            'cards_red': self.cards_red,
            'penalty_won': self.penalty_won,
            'penalty_commited': self.penalty_commited,
            'penalty_scored': self.penalty_scored,
            'penalty_missed': self.penalty_missed,
            'penalty_saved': self.penalty_saved,
            'spp_score': self.spp_score,
            'last_updated': self.last_updated.isoformat() if self.last_updated else None
        }

