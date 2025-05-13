from flask import Flask, request,session
import json
import dbConnect
import Storage
from loguru import logger
import time
app = Flask(__name__)

secret_key = '123456'
app.secret_key = secret_key
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SECRET_KEY'] = secret_key
app.config['SESSION_PERMANENT'] = False

# JoinQueue保存请求加入房间的新用户，格式为{roomID: [userID1, userID2, ...], ...}
JoinQueue = {}

@app.before_first_request
def before_first_request():
    session.clear()


@app.route('/')
def hello_world():
    return 'Server is running!'

# 检查用户是不是房主
@app.route('/isHost', methods=['POST'])
def isHost():
    data = json.loads(request.data)
    username = data['username']
    res = isHostImpl(username)
    return json.dumps({'status': res, 'data': data})

def isHostImpl(username):
    id = dbConnect.getUserID(username)
    res = Storage.checkHost(id)
    return res

# 检查用户是否已经上传数据
@app.route('/isReady', methods=['POST'])
def isReady():
    data = json.loads(request.data)
    username = data['username']
    logger.debug(username)
    id = dbConnect.getUserID(username)
    res = Storage.checkReady(id)
    return json.dumps({'status': res})

# 检查用户是否在房间内
@app.route('/checkUser', methods=['POST'])
def checkUser():
    data = json.loads(request.data)
    username = data['username']
    userID = dbConnect.getUserID(username)
    res = Storage.checkUser(userID)
    if res is None:
        res = -1
    return json.dumps({'roomID': res})

# 查看用户是否在线，待修改
def onLine(username):
    return True
    # if(username in session):
    #     return True
    # return False

# 处理前端的轮询请求，由此调用dealRequestImpl和dealCypherImpl
@app.route('/dealPoll', methods=['POST'])
def dealPoll():
    data = json.loads(request.data)
    username = data['username']
    if onLine(username) == False:
        logger.debug(username+' is offline')
        return json.dumps({'status': 'offline'})
    option = data['option']
    logger.debug(option+data['username'])
    if option == 'dealRequest':
        res = dealRequestImpl(data)
        return json.dumps({'status': 'success', 'joinList': res})
    else :
        user, List = dealCypherImpl(data)
        return json.dumps({'status': 'success', 'workList': List, 'targetUser': user})
        

# 处理加入房间请求
def dealRequestImpl(data):
    id = dbConnect.getUserID(data['username'])
    req = Storage.getNewRequest(id)
    # logger.debug(len(req) == 0)
    if len(req) == 0:
        return ""
    logger.debug(req)
    name = dbConnect.getUserName(req[0])
    res = name
    return res

# 处理加密轮询
def dealCypherImpl(data):
    username = data['username']
    logger.debug('dealCypher: '+username)
    userID = dbConnect.getUserID(username)
    targetUser, workList = Storage.handleEncrypt(userID)
    if targetUser is None:
        return None, []
    else:
        logger.debug(username+' will encrypt for '+targetUser)
        return targetUser, workList

# 用户获取加入申请的结果
@app.route('/getJoinResult', methods=['POST'])
def getJoinResult():
    data = json.loads(request.data)
    res = getJoinResultImpl(data)
    logger.debug(res)
    if res is None:
        return json.dumps({'status': 'success', 'result': ""})
    else:
        return json.dumps({'status': 'terminate', 'result': res})

def getJoinResultImpl(data):
    username = data['username']
    userID = dbConnect.getUserID(username)
    res = Storage.getJoinResult(userID)
    return res

# 向房主发送加入房间的请求
@app.route('/sendJoinRequest', methods=['POST'])
def sendJoinRequest():
    data = json.loads(request.data)
    logger.debug(data)
    userID = dbConnect.getUserID(data['username'])
    res = Storage.applyJoin(data['roomID'], userID)
    logger.debug(res)
    return json.dumps({'status': res})

# 房主允许加入房间
@app.route('/allowJoin', methods=['POST'])
def allowJoin():
    data = json.loads(request.data)
    username = data['username']
    if username is None:
        return json.dumps({'status': 'userError'})
    userID = dbConnect.getUserID(username)
    roomID = Storage.getApplyRoomID(userID)
    if roomID is None:
        return json.dumps({'status': 'roomError'})
    logger.debug('allowJoin: '+username)
    dbConnect.dbJoinRoom(roomID, userID)
    return json.dumps({'status': 'success'})

# 拒绝加入房间
@app.route('/rejectJoin', methods=['POST'])
def rejectJoin():
    data = json.loads(request.data)
    username = data['username']
    if username is None:
        return json.dumps({'status': 'userError'})
    userID = dbConnect.getUserID(username)
    roomID = Storage.getApplyRoomID(userID)
    if roomID is None:
        return json.dumps({'status': 'roomError'})
    logger.debug('rejectJoin: '+username)
    dbConnect.dbRejectJoin(roomID, username)
    # userID = dbConnect.getUserID(username)
    # Storage.handleRequest(roomID, userID, 'reject')
    return json.dumps({'status': 'success'})

# 进入房间
@app.route('/enterRoom', methods=['POST'])
def enterRoom():
    data = json.loads(request.data)
    username = data['username']
    roomID = data.get('roomID')
    if username is None or roomID is None:
        return json.dumps({'status': 'error'})
    userID = dbConnect.getUserID(username)
    res = Storage.enterRoom(roomID, userID)
    return json.dumps({'status': res})

# 登录处理
@app.route('/login', methods=['POST'])
def login():
    data = json.loads(request.data)
    res = dbConnect.dbLogin(data['username'], data['password'])
    print(res)
    if res == 'success':
        session[data['username']] = True
        print(data['username'], '登录成功')
    return json.dumps({'status': res})

# 退出登录 清除session
@app.route('/logout', methods=['POST'])
def logout():
    data = json.loads(request.data)
    username = data['username']
    print('old session: ', session)
    if session.get(username) is not None:
        session.pop(username)
        print(username, '退出登录')
        return json.dumps({'status': 'success'})
    else:
        return json.dumps({'status': 'error'})
   

# 注册处理
@app.route('/register', methods=['POST'])
def register():
    data = json.loads(request.data)
    res = dbConnect.dbRegister(data['username'], data['password'], data['email'])
    return json.dumps({'status': res})

# 返回房间列表
@app.route('/getRoomList', methods=['POST'])
def getRoomList():
    roomList = Storage.getRoomList()
    logger.debug(roomList)
    res = []
    for i in roomList:
        roomID = i[4:]
        hostID = Storage.getHostID(roomID)
        host = dbConnect.getUserName(int(hostID))
        number = Storage.getRoomNumber(roomID)
        Desc = dbConnect.dbGetRoomDesc(roomID)
        res.append({'id':roomID, 'name':host, 'number':number, 'desc':Desc, 'key':host})
    logger.debug(res)
    return json.dumps({'status': 'success', 'roomList': res})


# 创建房间
@app.route('/createRoom', methods=['POST'])
def createRoom():
    data = json.loads(request.data)
    username = data['username']
    logger.debug(username+' is creating a new room')
    userID = dbConnect.getUserID(username)
    # 查看该用户是否已经有房间
    userState = Storage.checkUser(userID)
    if userState is not None:
        logger.debug("用户已经有房间")
        return json.dumps({'status': 'exist'})
    # 从数据库中获取用户ID
    # 创建房间
    desc = "This is a test room."
    # desc = data['desc']
    roomID = int(dbConnect.dbCreateRoom(userID, desc))
    # 将用户加入房间
    return json.dumps({'status': 'success', 'roomID': roomID})

# 接收客户端首次传来的加密数据
@app.route('/encryptData', methods=['POST'])
def encryptData():
    data = json.loads(request.data)
    logger.debug('first transmission'+str(data))
    username = data['username']
    cipher = data['cipher']
    userID = dbConnect.getUserID(username)
    logger.debug(cipher)
    # 将密文存入表中
    workList = Storage.saveData(userID, cipher)
    logger.debug('first transmission '+str(workList))
    if workList is None:
        logger.debug('workList is None')
        return json.dumps({'status':'success', 'list':""})
    res = {}
    # 要求用户给老成员加密
    for i in workList:
        res[i] = Storage.getData(i)
    logger.debug("workList "+str(res))
    if res == {}:
        return json.dumps({'status':'success', 'list':""})
    return json.dumps({'status':'success', 'list': res})

# 接收并保存客户端传来的给其他用户的加密数据，cipher是一个字典
@app.route('/collectData', methods=['POST'])
def collectData():
    logger.debug('postBack')
    data = json.loads(request.data)
    cipher = data['cipher']
    logger.debug(type(cipher))
    userID = data['targetUser']
    if type(cipher) == list:
        logger.debug('update for '+str(userID))
        Storage.UpdateData(userID, cipher)
    else:
        for i in userID:
            logger.debug('list update, for '+i)
            Storage.UpdateData(i, cipher[str(i)])
    # 释放锁
    Storage.unlock("lock")
    return json.dumps({'status':'success'})

# 查看房间状态（加入房间前置）
@app.route('/checkRoom', methods=['POST'])
def checkRoom():
    data = json.loads(request.data)
    username = data.get('username')
    roomID = data.get('roomID')
    res = dbConnect.dbFindRoom(roomID)
    # 若房间存在，发送请求
    if res == 'success':
        # 加入请求队列
        if JoinQueue.get(roomID) is None:
            JoinQueue[roomID] = [username]
        else:
            JoinQueue[roomID].append(username)
        return json.dumps({'status': 'success'})
    else:
        return json.dumps({'status': 'error'})

# 刷新结果列表
@app.route('/refresh', methods=['POST'])
def refresh():
    data = json.loads(request.data)
    username = data.get('username')
    id = dbConnect.getUserID(username)
    res = Storage.getResult(id)
    logger.debug('interaction result: '+str(res))
    if res is None:
        return json.dumps({'status': 'error'})
    else:
        return json.dumps({'status': 'success', 'result': res})

# 退出房间
@app.route('/exitRoom', methods=['POST'])
def exitRoom():
    data = json.loads(request.data)
    username = data.get('username')
    roomID = data.get('roomID')
    userID = dbConnect.getUserID(username)
    # 将相关内容标记为过期
    dbConnect.dbExitRoom(roomID, userID)
    return json.dumps({'status': 'success'})

# 删除房间
@app.route('/removeRoom', methods=['POST'])
def removeRoom():
    data = json.loads(request.data)
    roomID = data.get('roomID')
    logger.debug('removeRoom: '+str(roomID))
    res = dbConnect.dbRemoveRoom(roomID)
    return json.dumps({'status': res})

# @app.before_request
# def before_request():
#     data = json.loads(request.data)
#     # 检查用户是否合法
#     # 需要给session加密钥，待解决
#     username = data.get('username')
#     mock = data.get("__$POSTMANMOCK", False)
#     if not mock:
#         if session.get(username) is None:
#             if request.path == '/login' or request.path == '/register':
#                 pass
#             else:
#                 print('非法访问(未登录不能访问)')
#                 return json.dumps({'status': 'not_login'})
#         else:
#             if request.path == '/login' or request.path == '/register':
#                 print('非法访问(不能重复登录)')
#                 return json.dumps({'status': 'repeat_login'})
       


if __name__ == '__main__':
    dbConnect.connect()
    app.run(port=5000, debug=True)
    dbConnect.close()