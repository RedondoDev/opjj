from flask import Flask, render_template, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask import request, redirect
from flask_mail import Mail, Message
from dotenv import load_dotenv
import os

from pip._vendor import requests

load_dotenv("variables.env")

API_KEY = os.getenv("API_KEY")

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USE_SSL'] = False
app.config['MAIL_USERNAME'] = os.getenv("MAIL")
app.config['MAIL_PASSWORD'] = os.getenv("PASS")

db = SQLAlchemy(app)
mail = Mail(app)


class Commentary(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, default=datetime.now)
    email = db.Column(db.String(50))
    name = db.Column(db.String(50))
    comment = db.Column(db.String(500))

    def __repr__(self):
        return f"<Commentary {self.id} - {self.date} - {self.email} - {self.name} - {self.comment}>"


with app.app_context():
    db.create_all()


@app.route('/api/fetch_puuid', methods=['GET'])
def fetch_puuid():
    region = request.args.get('region').strip()
    game_name = request.args.get('gameName').strip()
    tag_line = request.args.get('tagLine').strip()
    url = f"https://{region}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/{game_name}/{tag_line}?api_key={API_KEY}"
    headers = {
        "X-Riot-Token": API_KEY
    }
    response = requests.get(url, headers=headers)
    return jsonify(response.json()), response.status_code

@app.route('/api/fetch_summoner', methods=['GET'])
def fetch_summoner():
    subregion = request.args.get('subregion')
    puuid = request.args.get('puuid')
    url = f"https://{subregion}.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/{puuid}?api_key={API_KEY}"
    headers = {
        "X-Riot-Token": API_KEY
    }
    response = requests.get(url, headers=headers)
    return jsonify(response.json()), response.status_code


@app.route('/api/fetch_soloq_stats', methods=['GET'])
def fetch_soloq_stats():
    region = request.args.get('region').strip()
    summoner_id = request.args.get('summonerId').strip()
    url = f"https://{region}.api.riotgames.com/lol/league/v4/entries/by-summoner/{summoner_id}?api_key={API_KEY}"
    headers = {
        "X-Riot-Token": API_KEY
    }
    response = requests.get(url, headers=headers)
    return jsonify(response.json()), response.status_code

@app.route('/about_me/comment', methods=['POST'])
def save_comment():
    name = request.form.get('name')
    email = request.form.get('email')
    comment = request.form.get('comment')
    new_comment = Commentary(name=name, email=email, comment=comment, date=datetime.now())
    db.session.add(new_comment)
    db.session.commit()

    msg = Message(
        subject="op.jj form: " + name,
        sender=email,
        recipients=[os.getenv("MAIL")],
        body=email + "\n\n" + comment,
        reply_to=email
    )
    mail.send(msg)
    return redirect('/about_me')


@app.route('/')
def show_home():
    return render_template('home.html')


@app.route('/stats')
def show_stats():
    return render_template('stats.html', API_KEY=os.getenv("API_KEY"))


@app.route('/about_me')
def show_about_me():
    return render_template('about_me.html')


if __name__ == '__main__':
    app.run(debug=True)
