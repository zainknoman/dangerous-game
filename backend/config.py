import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dg-fire-super-secret-key-change-me'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///dgfire.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-super-secret-dgfire-2024-change-me'

