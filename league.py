from flask_sqlalchemy import SQLAlchemy
from src.models.user import db

class League(db.Model):
    __tablename__ = 'leagues'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    country = db.Column(db.String(50), nullable=False)
    logo = db.Column(db.String(255))
    type = db.Column(db.String(20))  # league or cup
    current_season = db.Column(db.Integer)
    spp_multiplier = db.Column(db.Float, default=1.0)  # Multiplicador SPP para a liga
    
    # Relacionamento com jogadores
    players = db.relationship('Player', backref='league', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'country': self.country,
            'logo': self.logo,
            'type': self.type,
            'current_season': self.current_season,
            'spp_multiplier': self.spp_multiplier
        }

