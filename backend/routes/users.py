from flask import Blueprint, request, jsonify
from models import db, User
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash

users_bp = Blueprint('users', __name__)

@users_bp.route('/register', methods=['POST'])
def register():
    data = request.json
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': 'User exists'}), 400

    hashed = generate_password_hash(data['password'])
    user = User(username=data['username'], password_hash=hashed)
    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'User created'})

@users_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(username=data['username']).first()

    if user and check_password_hash(user.password_hash, data['password']):
        token = create_access_token(identity=user.id)
        return jsonify({'token': token})
    
    return jsonify({'error': 'Invalid credentials'}), 401

