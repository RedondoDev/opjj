from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from flask import request, redirect

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///app.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


class Commentary(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.DateTime, default=datetime.now)
    name = db.Column(db.String(50))
    comment = db.Column(db.String(500))

    def __repr__(self):
        return f"<Commentary {self.id} - {self.date} - {self.name} - {self.comment}>"


with app.app_context():
    db.create_all()


@app.route('/about_me/comment', methods=['POST'])
def save_comment():
    name = request.form.get('name')
    comment = request.form.get('comment')
    new_comment = Commentary(name=name, comment=comment, date=datetime.now())
    db.session.add(new_comment)
    db.session.commit()
    return redirect('/about_me')


@app.route('/')
def show_home():
    return render_template('home.html')


@app.route('/stats')
def show_stats():
    return render_template('home.html')


@app.route('/about_me')
def show_about_me():
    return render_template('about_me.html')


if __name__ == '__main__':
    app.run(debug=True)
