from redis import Redis
from loguru import logger
from Tools import *
import dbConnect
import time

# 房间状态、密文保存在redis中
# 用户信息、房间信息保存在mysql中

# 房间ID：房主ID            房主ID：请求加入的用户ID列表            用户ID：初次密文数据    用户ID：房间ID
# ROOM$RoomID$: $hostID$, REQUEST$RoomID$: [$WantToJoinUserID$], DATA$UserID$: $data$, BACK$UserID$: $RoomID$
# 房间是否允许加入      临时成员列表（加入但未必上传数据)   房间成员列表(已上传数据)
# JOIN$RoomID$: exist, MEMBER$RoomID$: [$UserID$],      READY$RoomID$: [$UserID$]
# 用户A需要加密用户列表中所有用户的数据     用户A的申请加入的结果               用户A申请加入的房间
# TASK$UserAID$: [$UserXID$]          RESOFJOIN$UserID$: accept/reject         APPLY$UserID$: $RoomID$

# retireTime = 1200
# removeTime = 1800
retireTime = 120000
removeTime = 180000


conn = Redis(host='localhost', port=6379, decode_responses=True, db=2)

# 互斥锁，成功返回1失败返回0
def lock(mutex):
    logger.debug('lock')
    return conn.setnx(mutex, 1)
def unlock(mutex):
    logger.debug('unlock')
    return conn.delete(mutex)

# 查看房间列表
def getRoomList():
    roomList = conn.keys("JOIN*")
    logger.debug(roomList)
    return roomList

# 查看房间内人数 
def getRoomNumber(RoomID):
    number = conn.llen("MEMBER"+str(RoomID))
    return number

# 查看房主
def getHostID(RoomID):
    hostID = conn.get("ROOM"+str(RoomID))
    return hostID

# 查看用户申请加入的房间
def getApplyRoomID(UserID):
    roomID = conn.get("APPLY"+str(UserID))
    return roomID

# 创建房间
def createRoom(RoomID, hostID):
    conn.set("BACK"+str(hostID), RoomID)
    logger.debug(conn.get("MEMBER"+str(RoomID)))
    conn.lpush("MEMBER"+str(RoomID), hostID)
    # 将房间存入redis，30分钟后自动过期
    conn.set("ROOM"+str(RoomID), hostID, ex=retireTime)
    # 20分钟后不允许其他人加入
    conn.set("JOIN"+str(RoomID), 'exist', ex=removeTime)
    return 'success'

# 查看房间能否加入
def findRoom(RoomID):
    roomState = conn.get("JOIN"+str(RoomID))
    logger.debug(RoomID)
    logger.debug(roomState)
    if roomState is None:
        if(conn.get("ROOM"+str(RoomID)) is None):
            return 'not_exist'
        return 'expire'
    else:
        return 'success'

# 查看用户是否已经有房间，不能重复创建/加入房间
# None: 无房间, 有房间则返回房间号
def checkUser(userID):
    userState = conn.get("BACK"+str(userID))
    return userState

# 查看用户是否为房主
def checkHost(userID):
    roomID = checkUser(userID)
    if roomID is None:
        return False
    host = getHostID(roomID)
    if int(userID) == int(host):
        return True
    else:
        return False

def checkReady(userID):
    if conn.get("DATA"+str(userID)) is None:
        return False
    else:
        return True

# 申请加入，需要等待房主批准
def applyJoin(RoomID, userID):
    # 查看是否已经在房间内
    if conn.get("BACK"+str(userID)) is not None:
        return 'already_joined'
    # 查看房间是否存在
    status = findRoom(RoomID)
    if status != 'success':
        return status
    # 查看是否已经在申请加入
    if conn.get("APPLY"+str(userID)) is not None:
        return 'already_applied'
    # 能加入，发送申请
    conn.set("APPLY"+str(userID), RoomID)
    conn.rpush("REQUEST"+str(RoomID), userID)
    return 'success'

# 返回指定用户的加密后数据
def getData(userID):
    data = conn.get("DATA"+str(userID))
    listData = stringToList(data)
    return listData

# 保存用户首次加密的数据
def saveData(userID, data):
    # logger.debug(data)
    strData = listToString(data)
    conn.set("DATA"+str(userID), strData)
    roomID = conn.get("BACK"+str(userID))
    logger.debug(conn.get("DATA"+str(userID)))
    # 上传数据即成为正式成员
    oldUser = conn.lrange("READY"+str(roomID), 0, -1)
    conn.lpush("READY"+str(roomID), userID)
    logger.debug(oldUser)
    if len(oldUser) == 0:
        return None
    while(lock("lock") == 0):
        # 等待直到可用
        time.sleep(0.2)
    # 为老成员的数据加密
    res = {}
    for i in oldUser:
        # 将数据存入res，传回前端逐个加密
        data = conn.get("DATA"+str(i))
        listData = stringToList(data)
        res[i] = listData
        # 通知老用户加密
        addTask(i, userID)
    return res

# 更新加密数据
def UpdateData(userID, data):
    strData = listToString(data)
    conn.set("DATA"+str(userID), strData)
    return 'success'

# # 上传数据的新用户完成加密任务，释放锁
# def finishSaveData():
#     unlock("LOCK_OLD_USER")
#     return 'success'

# 要加入指定房主房间的用户列表
def getNewRequest(hostID):
    roomID = conn.get("BACK"+str(hostID))
    return conn.lrange("REQUEST"+str(roomID), 0, 0)

# 处理加入房间请求
def handleRequest(roomID, userID, state):
    conn.set("RESOFJOIN"+str(userID), state)
    conn.delete("APPLY"+str(userID))
    conn.lrem("REQUEST"+str(roomID), 0, userID)
    if state == 'accept':
        # 允许加入房间
        logger.debug(str(userID)+"加入房间"+str(roomID))
        # conn.lrem("REQUEST"+str(roomID), 0, userID)
        conn.lpush("MEMBER"+str(roomID), userID)
        conn.set("BACK"+str(userID), roomID)
        return 'success'
    elif state == 'reject':
        return 'success'
    else:
        return 'error'

# 用户查看加入房间请求的结果
def getJoinResult(userID):
    result = conn.get("RESOFJOIN"+str(userID))
    if(result is not None):
        conn.delete("RESOFJOIN"+str(userID))
    return result

# 为老用户添加加密新用户的任务
def addTask(oldUserID, newUserID):
    logger.debug(str(oldUserID)+' new task: '+str(newUserID))
    conn.lpush("TASK"+str(oldUserID), newUserID)
    return 'success'

# 轮询查看是否需要为新用户加密，逐个加密
def handleEncrypt(userID):
    # 获取任务
    if(conn.exists("TASK"+str(userID)) == 0):
        logger.debug("no task for "+str(userID))
        return None, []
    taskUser = conn.lindex("TASK"+str(userID), 0)
    logger.debug('task from '+str(taskUser))
    # 获取锁
    if(taskUser is None):
        return None, []
    if(lock("lock") == 0):
        return None, []
    logger.debug(str(userID)+' will encrypt '+str(taskUser))
    data = conn.get("DATA"+str(taskUser))
    taskData = stringToList(data)
    logger.debug(conn.lpop("TASK"+str(userID)))
    return taskUser, taskData

# 将加密后的密文重新存入
def updateEncrypt(userID, data):
    strData = listToString(data)
    conn.set("DATA"+str(userID), strData)
    logger.debug(str(userID)+' updated, release lock.')
    unlock("LOCK"+str(userID))
    return 'success'

# 计算交集
def intersect(a: list, b: list):
    intersectIndexA = []
    intersectIndexB = []
    intersection = set()
    common = dict()
    for i in range(len(a)):
        common[a[i]] = [i]

    for j in range(len(b)):
        indexOfA = common.get(b[j])
        if indexOfA is not None:
            common[b[j]].append(j)
    
    for key, value in common.items():
        if len(value) > 1:
            intersectIndexA.append(value[0])
            intersectIndexB.append(value[1])
            intersection.add(key)
    
    return [intersectIndexA, intersectIndexB, intersection]

# 查询结果
def getResult(userID):
    # 等待，确认加密工作完成
    time.sleep(1)
    # 在READY中的成员均已经自动完成加密
    roomID = conn.get("BACK"+str(userID))
    logger.debug('start calculate result')
    if roomID is None:
        return None
    res = {}
    userList = conn.lrange("READY"+str(roomID), 0, -1)
    if userList is None:
        return None
    data1 = conn.get("DATA"+str(userID))
    data1 = stringToList(data1)
    for i in userList:
        if int(i) == int(userID):
            continue
        else:
            data2 = conn.get("DATA"+str(i))
            data2 = stringToList(data2)
           # logger.debug(data1, data2)
            intersectIndexA, intersectIndexB, intersection = intersect(data1, data2)
            logger.debug(intersectIndexA)
            i = dbConnect.getUserName(i)
            res[i]= intersectIndexA
    logger.debug(res)
    return res

def exitRoom(roomID, userID):
    conn.delete("BACK"+str(userID))
    conn.delete("DATA"+str(userID))
    conn.delete("TASK"+str(userID))
    conn.lrem("MEMBER"+str(roomID), 0, userID)
    conn.lrem("READY"+str(roomID), 0, userID)
    logger.debug(str(userID)+' exit')
    return 'success'

# 清除房间信息
def removeRoom(RoomID):
    hostID = conn.get("ROOM"+str(RoomID))
    # 需要删除每个成员的信息
    nextUser = conn.lpop("MEMBER"+str(RoomID))
    while nextUser is not None:
        conn.delete("DATA"+str(nextUser))
        conn.delete("BACK"+str(nextUser))
        conn.delete("TASK"+str(nextUser))
        nextUser = conn.lpop("MEMBER"+str(RoomID))
    # 删除房间信息
    conn.delete("ROOM"+str(RoomID))
    conn.delete("JOIN"+str(RoomID))
    conn.delete("MEMBER"+str(RoomID))
    conn.delete("READY"+str(RoomID))
    # 删除房主信息
    conn.delete("REQUEST"+str(hostID))
    logger.log(str(RoomID)+' is removed')
    return 'success'


if __name__ == '__main__':
    conn.flushall()
    # print(conn.lindex("TASK2", 0))
    # print(conn.get("lock"))
    # print(conn.lrange("TASK2", 0,0))
    # applyJoin(1,2)
    # print(conn.lrange("REQUEST9", 0, -1))
    # print(conn.lrange("MEMBER1", 0, -1))
    # handleRequest(1, 1, 'accept')
    # print(conn.get("DATA2"))
    # print(conn.get("DATA3"))
    # print(conn.lrange("MEMBER1", 0, -1))
    # print(conn.get("BACK1"))
    # print(conn.get("ROOM1"))
    # print(conn.get("JOIN4"))
    # print(conn.get("ROOM4"))
    