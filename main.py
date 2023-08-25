from flask import *
from flask_socketio import SocketIO, emit, join_room
import json, hashlib, sqlite3, time


def check_user(username, passwd, k, update=False, data={}):
    _ = False
    while not (_):
        try:
            con = sqlite3.connect("database.db")
            cur = con.cursor()
            cur.execute("SELECT * FROM userinfo")
            if cur.arraysize < 2:
                cur.executemany(
                    "INSERT INTO userinfo(username, passwd, infos, messages) VALUES(?, ?, ?, ?)",
                    [("database", "azertyuiop",
                      json.dumps({"creation_date": time.ctime()}), "")])
            cur.execute("SELECT * FROM userinfo")
            size = cur.arraysize
            while size > 0:
                db = cur.fetchmany(512)
                for info in db:
                    size -= 1
                    if info[0] == username:
                        if passwd == "noPasswdButCookies":
                            if (json.loads(info[2])['cookies']
                                    == k) and not (update):
                                cur.close()
                                con.close()
                                return (info[2], info[3])
                        if update:
                            d = json.loads(info[3])
                            for key in data:
                                if d.get(key) == None:
                                    d[key] = data[key]
                                else:
                                    d[key] = d[key] + data[key]
                            requete_mise_a_jour = "UPDATE userinfo SET username = ?, passwd = ?, infos = ?, messages = ? WHERE messages = ?"
                            cur.execute(requete_mise_a_jour,
                                        (info[0], info[1], info[2],
                                         json.dumps(d), info[3]))
                            con.commit()
                            cur.close()
                            con.close()
                            return ""
                        if info[1] == passwd:
                            cur.close()
                            con.close()
                            return (info[2], info[3])
                        else:
                            cur.close()
                            con.close()
                            return "bad password"
            cur.executemany(
                "INSERT INTO userinfo(username, passwd, infos, messages) VALUES(?, ?, ?, ?)",
                [(username, passwd,
                  json.dumps({
                      "creation_date": time.ctime(),
                      "cookies": k
                  }), json.dumps({
                      "general;": [],
                      "generale;": []
                  }))])
            con.commit()
            cur.close()
            con.close()
            return (json.dumps({
                "creation_date": time.ctime(),
                "cookies": k
            }), json.dumps({
                "general;": [],
                "generale;": []
            }))
        except Exception as e:
            print(e)


def initDB():
    con = sqlite3.connect("database.db")
    cur = con.cursor()
    cur.execute(
        "CREATE TABLE IF NOT EXISTS userinfo(username, passwd, infos, messages)"
    )
    cur.executemany(
        "INSERT INTO userinfo(username, passwd, infos, messages) VALUES(?, ?, ?, ?)",
        [("database", "azertyuiop", json.dumps({"creation_date": time.ctime()
                                                }), "")])
    con.commit()
    cur.close()
    con.close()


initDB()

app = Flask(__name__)
app.config['SECRET_KEY'] = 'fhdvidushdujxjddfkidfjojcvndhfxnvkdnvid'
app.config['tab'] = {'usid': {123456789: {'tmp-img': ""}}}
socketio = SocketIO(app)


@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'GET':
        cookie_value = request.cookies.get('uid')
        if cookie_value:
            return redirect("/chat")
        return send_file("html_css_js/login.html")
    else:
        username = request.form.get('username')
        passwd = request.form.get('password')
        if (username != None) and (passwd != None):
            k = hashlib.sha1(passwd.encode() +
                             str(time.time()).encode()).hexdigest()
            h = hashlib.sha256(passwd.encode()).hexdigest()
            r = cku = check_user(username, h, k)
            if len(cku) == 2:
                resp = make_response(redirect("/chat"))
                resp.set_cookie('username', username)
                resp.set_cookie('uid', k)
                return resp
            else:
                return r


@app.route('/chat')
def chat():
    uid = request.cookies.get('uid')
    username = request.cookies.get('username')
    if (username != None) and (uid != None):
        cku = check_user(username, "noPasswdButCookies", uid)
        if len(cku) == 2:
            rooms = ""
            oldMessage = ""
            rooms_messages = json.loads(cku[1])
            for room in rooms_messages:
                rooms += f"<div class='menu-item' onclick='sendnew(\"{room}\");'>{room}</div>\n\r"
        else:
            return redirect('/')
        return open("templates/heremeknown.html", "rb").read().replace(
            b"{{ rooms }}", rooms.encode()).replace(
                b"{{ username }}", username.encode()).replace(
                    b"{{ oldMessage }}", oldMessage.encode()).replace(
                        b"{{ roomID }}", b"Message a envoyer dans general;...")
    else:
        return redirect('/')


@app.route('/upload-img')
def upload_img():
    return send_file("cloud-computing.png")


@socketio.on('message')
def handle_message(message):
    r = message
    username = ""
    cookie = ""
    roomID = ""
    msg = ""
    try:
        if (len(json.loads(message['data'])['message']) > 0):
            app.config['tab']['usid'][json.loads(message['data'])['usid']] = {
                'tmp-img': ""
            }
            join_room(json.loads(message['data'])['roomID'])
            k = json.loads(message['data'])
            if k['message'].startswith('\n'):
                k['message'] = k['message'][1:]
            username = k["usid"]
            cookie = k["cookies"].split("; ")[1].replace("uid=", "")
            if cookie.find("username") != -1:
                cookie = k["cookies"].split("; ")[0].replace("uid=", "")
            roomID = k["roomID"]
            print(username, roomID)
            msg = k['message']

            if msg == "Connected!":
                cku = check_user(username, "noPasswdButCookies", cookie)
                messages = json.loads(cku[1]).get(roomID)
                for Msg in messages:
                    usid = Msg.split(": \n")[0]
                    emit(
                        'message', {
                            'data':
                            json.dumps(
                                {
                                    'message': Msg.replace(usid + ": \n", ""),
                                    "usid": usid,
                                    "stat": 'restoreHistory'
                                })
                        })
            r = {'data': json.dumps(k)}
            k["cookies"] = ""
            check_user(username,
                       "noPasswdButCookies",
                       cookie,
                       update=True,
                       data={roomID: [msg]})
    except Exception as e:
        a = 1
    try:
        if r['data'].find('donotsend: true') == -1:
            emit('message', r, room=json.loads(message['data'])['roomID'])
    except Exception as e:
        a = 1


@socketio.on('image')
def recv_images(
    image
):  # {'data': "{'usid': 1234, 'buf': 'b64MCQU', 'endded': 'bool', 'type': 'png'}"}
    if app.config['tab']['usid'][json.loads(
            image['data']).get('usid')] != None:
        if json.loads(image['data'])['endded'] != 'true':
            app.config['tab']['usid'][json.loads(
                image['data'])['usid']]['tmp-img'] += json.loads(
                    image['data'])['buf']
        else:
            data = json.dumps({
                'usid':
                json.loads(image['data'])['usid'],
                'ext':
                json.loads(image['data'])['type'],
                'file':
                app.config['tab']['usid'][json.loads(
                    image['data'])['usid']]['tmp-img']
            })
            app.config['tab']['usid'][json.loads(
                image['data'])['usid']]['tmp-img'] = ''
            data = json.loads(data)
            data["cookies"] = ""
            data = json.dumps(data)
            emit('message', {'data': data},
                 room=json.loads(image['data'])['roomID'])


@socketio.on('save')
def handle_message(message):
    r = message
    username = ""
    cookie = ""
    roomID = ""
    msg = ""
    try:
        if (len(json.loads(message['data'])['message']) > 0):
            k = json.loads(message['data'])
            if k['message'].startswith('\n'):
                k['message'] = k['message'][1:]
            username = k["usid"]
            cookie = k["cookies"].split("; ")[1].replace("uid=", "")
            if cookie.find("username") != -1:
                cookie = k["cookies"].split("; ")[0].replace("uid=", "")
            roomID = k["roomID"]
            msg = k['message']
            r = {'data': json.dumps(k)}
            k["cookies"] = ""
            check_user(username,
                       "noPasswdButCookies",
                       cookie,
                       update=True,
                       data={roomID: [msg]})
    except Exception as e:
        a = 1


if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0", port=80)
