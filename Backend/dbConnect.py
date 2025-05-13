import pymysql
import Storage
from loguru import logger

# logger controller
# logger.remove()

# 房间状态、密文保存在redis中
# 用户信息、房间信息保存在mysql中

db = None
cursor = None

# 连接数据库
def connect():
    global db, cursor
    if db == None:
        db = pymysql.connect(host='localhost',
                            user='root',
                                password='121418',
                                database='psi')
    # 使用cursor()方法创建一个游标对象cursor
        cursor = db.cursor()
        db.autocommit(True)
        logger.debug('数据库连接成功')

# 登录的数据库操作
def dbLogin(username, password):
    global cursor
    sql = 'select * from UserInfo where Username = \'%s\';' % username
    cursor.execute(sql)
    data = cursor.fetchone()
    if data is None:
        return 'not_exist'
    sql = 'select * from UserInfo where Username = \'%s\' and Password = \'%s\';' % (username, password)
    cursor.execute(sql)
    data = cursor.fetchone()
    if data is None:
        return 'error'
    else:
        logger.debug(username, '登录成功')
        return 'success'
    
# 注册的数据库操作
def dbRegister(username, password, email):
    global cursor
    sql = 'select * from UserInfo where Username = \'%s\';' % username
    cursor.execute(sql)
    data = cursor.fetchone()
    if data is None:
        sql = 'insert into UserInfo(Username, Password, Email, Type) values(\''+str(username)+'\', \''+str(password)+'\', \''+str(email)+'\', 1);'
        if(cursor.execute(sql)):
            logger.debug('{} register success'.format(username))
            return 'success'
        else:
            return 'fail'
    else:
        return 'exist'

# 根据用户名获取ID
def getUserID(username):
    global cursor
    sql = 'select ID from UserInfo where username = \'%s\';' % str(username)
    cursor.execute(sql)
    data = cursor.fetchone()
    if data is None:
        logger.debug('user {} is not exist'.format(username))
        return None
    else:
        return data[0]

# 根据ID获取用户名
def getUserName(id):
    global cursor
    sql = 'select Username from UserInfo where ID = %d;' % int(id)
    cursor.execute(sql)
    data = cursor.fetchone()
    if data is None:
        logger.debug('user {} is  not exist'.format(id))
        return None
    return data[0]


# 根据房间ID获取房主ID
def getHostID(roomID):
    global cursor
    sql = 'select HostID from RoomInfo where RoomID = %d;' % int(roomID)
    cursor.execute(sql)
    data = cursor.fetchone()
    if data is None:
        logger.debug('room {} is not exist'.format(roomID))
        return None
    else:
        return data[0]

# 获取房间描述信息
def dbGetRoomDesc(roomID):
    global cursor
    sql = 'select Description from RoomInfo where RoomID = %d;' % int(roomID)
    cursor.execute(sql)
    data = cursor.fetchone()
    if data is None:
        logger.debug('room {} is not exist'.format(roomID))
        return None
    else:
        return data[0]

# 房主创建房间
def dbCreateRoom(id, desc, state=0):
    global cursor
    if id is not None:
        # sql = 'insert into RoomInfo(HostID, Switch) values(\''+str(id)+'\', \''+str(state)+'\');'
        # sql = f"insert into RoomInfo(HostID, Switch) values('{id}', '{state}');"
        # SQL = "insert into RoomInfo(HostID, Switch) values('{}', '{}');".format(id, state)
        sql = "insert into RoomInfo(HostID, Number, Description, Type, State) values(%d, 1, \'%s\', %d, 0);" % (int(id), str(desc), int(state))
        if(cursor.execute(sql)):
            sql = 'select RoomID from RoomInfO where HostID = %d and State=0;' % int(id)
            cursor.execute(sql)
            roomID = cursor.fetchone()
            sql = 'insert into User_Room(UserID, RoomID, Alive) values(%d, %d, 1);' % (int(id), int(roomID[0]))
            cursor.execute(sql)
            logger.debug('{} 创建房间 {} 成功'.format(id, roomID[0]))
            Storage.createRoom(roomID[0], id)
            return roomID[0]
        else:
            return 'fail'

# 查询能否加入房间
def dbFindRoom(roomID):
    global cursor
    res = Storage.findRoom(roomID)
    if(res == 'not_exist'):
        # 房间不存在，移除房间信息
        logger.debug('room {} is not exist'.format(roomID))
        dbRemoveRoom(roomID)
        sql = 'select * from RoomInfo where RoomID = %d;' % int(roomID)
        cursor.execute(sql)
    elif(res == 'expire'):
        # 房间不允许加入，更新房间信息
        dbExpireRoom(roomID)
        logger.debug('room {} is closed now'.format(roomID))
    else:
        return 'success'

# 新用户加入房间，在数据库中只作备用记录
def dbJoinRoom(roomID, id):
    global cursor
    res = 'success'
    if id is None:
        res = 'user_not_exist'
        logger.debug(str(id)+res)
        return res
    sql = 'insert into User_Room(UserID, RoomID, Alive) values(%d, %d, 1);' % (int(id), int(roomID))
    if(cursor.execute(sql)):
        Storage.handleRequest(roomID, id, 'accept')
        logger.debug(str(roomID)+res)
        return res
    else:
        res = 'fail'
        logger.error(roomID)
        return res

# 拒绝新用户的加入
def dbRejectJoin(roomID, username):
    id = getUserID(username)
    Storage.handleRequest(roomID, id, 'reject')

# # 检查用户是否在房间内
# def dbCheckUser(username):
#     global cursor
#     id = getUserID(username)
#     sql = 'select * from User_Room where UserID = \'%d\' and Alive=1;' % int(id)
#     cursor.execute(sql)
#     data = cursor.fetchone()
#     if data is None:
#         return 'not_exist'
#     else:
#         return 'exist'

# 标记房间为过期
def dbExpireRoom(roomID):
    global cursor
    sql = 'update RoomInfo set State=1 where RoomID = %d;' % int(roomID)
    if(cursor.execute(sql)):
        return 'success'
    return 'error'

# 移除房间
def dbRemoveRoom(roomID):
    global cursor
    sql = 'update RoomInfo set State=2 where RoomID = %d;' % int(roomID)
    if(cursor.execute(sql)):
        logger.debug('room {} expire'.format(roomID))
        sql = 'update User_Room set Alive=0 where RoomID = %d;' % int(roomID)
        cursor.execute(sql)
        Storage.removeRoom(roomID)
        return 'success'
    else:
        return 'fail'

###
def dbExitRoom(roomID, userID):
    global cursor
    # sql = 'update User_Room set Alive=0 where RoomID = %d and userID= %d;' % (int(roomID), int(userID))
    sql = 'update User_Room set Alive=0 where RoomID = 1 and userID= 4;'
    if cursor.execute(sql):
        return 'error'
    return Storage.exitRoom(roomID, userID)

# 关闭数据库连接
def close():
    global db
    db.close()
    logger.debug("close")




# if __name__ == '__main__':
#     connect()
#     dbLogin('admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918')
#     # print(dbCreateRoom('ming', 4, 1))
#     # print(dbLogin('ad', '123456'))
#     # print(getUserID('ming'))
#     close()