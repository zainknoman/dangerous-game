from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Level
from routes.users import users_bp
from routes.levels import levels_bp
from config import Config

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)
jwt = JWTManager(app)
CORS(app)

app.register_blueprint(users_bp, url_prefix='/api')
app.register_blueprint(levels_bp, url_prefix='/api')

@app.route('/')
def hello():
    return jsonify({'message': 'DG-FIRE Backend Ready'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)

