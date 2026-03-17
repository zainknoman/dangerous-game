from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Level
import json

levels_bp = Blueprint('levels', __name__)

@levels_bp.route('/levels', methods=['GET'])
def get_levels():
    levels = Level.query.all()
    return jsonify([{'id': l.id, 'name': l.name} for l in levels])

@levels_bp.route('/levels', methods=['POST'])
@jwt_required()
def save_level():
    user_id = get_jwt_identity()
    data = request.json
    level = Level(name=data['name'], data=json.dumps(data), user_id=user_id)
    db.session.add(level)
    db.session.commit()
    return jsonify({'message': 'Saved', 'id': level.id})

@levels_bp.route('/levels/<int:level_id>', methods=['GET'])
def get_level(level_id):
    level = Level.query.get_or_404(level_id)
    data = json.loads(level.data)
    return jsonify(data)

