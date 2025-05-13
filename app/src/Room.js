import React, { useEffect, useState } from 'react'
import { Button, Input, Space, message, Modal, Table } from 'antd'
import { psiPage, loginPage } from './content'
import axios from 'axios'
import Heart from './useHeartBeat3';
import { createRoom } from './createRoom';


export default function Room() {

    const [data, setData] = useState([])
    const [refresh, setRefresh] = useState(0)
    const [showModal, setShowModal] = useState(false);
    const [modalContext, setModalContext] = useState("");
    const [Dumb, setDumb] = useState(true);
    const [joinState, setJoinState] = useState("");

    const userExistInRoom = (name) => {
        axios.post('/api/checkUser', {
            username: name
        }).then(resp => {
            let room = resp.data.roomID
            return room
        })
    }

    const sendJoinRequest = (username, roomID) => {
        axios.post('/api/sendJoinRequest', {
            username: username,
            roomID: roomID
        }).then(resp => {
            if(resp.data.status === 'already_joined') {
                message.error("You have joined a room, Jumping to new page soon.")
                setTimeout(() => {
                    window.location.href = psiPage;
                }, 800);
            }
            else if(resp.data.status === 'already_applied') {
                message.error("You have already applied to join this room, please wait for the host to accept your request.")
            }
            else if (resp.data.status !== 'success') {
                message.error("This room has expired, please refresh page.")
            }
            
            else {
                message.success("Sending successfully, please waiting for the host to accept your request.")
                //启动长轮询，等待房主同意
                setDumb(false)
            }
        })
    }

    const handleJoin = (roomID) => {
        let name = sessionStorage.getItem("name")
        console.log('join ', name)
        if (name === null) {
            message.error("Please login first!")
            setTimeout(() => {
                window.location.href = loginPage;
            }, 800);
            return
        }
        let username = sessionStorage.getItem("name")
        if (userExistInRoom(username) != null) {
            message.error("You have joined a room, Jumping to new page soon.")
            setTimeout(() => {
                window.location.href = psiPage;
            }, 800);
            return
        } else {
            // 向房主发送加入请求，sendJoinRequest
            message.warning("Sending join request to host, please wait")
            sendJoinRequest(username, roomID)
        }
    }

    //房间列表信息
    const column = [
        {
            title: 'Room ID',
            dataIndex: 'id',
            key: 'id',
        },
        {
            title: 'Host Name',
            dataIndex: 'name',
            key: 'name',
            //   render: (text) => <a>{text}</a>,
        },
        {
            title: 'Number',
            dataIndex: 'number',
            key: 'number',
        },
        {
            title: 'Description',
            dataIndex: 'desc',
            key: 'desc',
        },
        {
            title: 'Action',
            key: 'action',
            render: (text, record) => (
                <Space size="middle">
                    <a onClick={() => {
                        // alert(record.id)
                        handleJoin(record.id)
                    }}>join</a>
                </Space>
            ),
        },
    ];

    const Accepted = (roomID) => {
        message.success("Jumping...")
        setTimeout(() => {
            // sessionStorage.setItem("isHost", false)
            sessionStorage.setItem("roomID", roomID)
            window.location.href = psiPage
        }, 800);
    }

    const getList = () => {
        axios.post("/api/getRoomList", {
        }).then((resp) => {
            console.log(resp)
            if (resp.data.status === 'success') {
                console.log(resp.data.roomList)
                setData(resp.data.roomList)
            } else {
                message.error("Unknown Error")
            }
        }, [])
    }

    useEffect(() => {
        getList()
    }, [refresh])

    // 创建房间
    const tryToCreate = () => {
        if (!sessionStorage.getItem("name")) {
            message.error("Please Login First!")
            setTimeout(() => {
                window.location.href = loginPage;
            }, 800);
            return;
        }
        let desc, setting = createRoom(sessionStorage.getItem("name"))
        axios.post("/api/createRoom", {
            username: sessionStorage.getItem("name")
        })
            .then(resp => {
                console.log(resp)
                if (resp.data.status === 'success') {
                    message.success("Create Room Successfully, your room id is " + resp.data.roomID)
                    // sessionStorage.setItem("isHost", true)
                    sessionStorage.setItem("roomId", resp.data.roomID)
                    console.log(sessionStorage)
                    window.location.href = psiPage
                } else if (resp.data.status === 'exist') {
                    message.error("Already in a room!")
                } else if(resp.data.statue === 'applied'){
                    message.error("You have already applied to join a room, please wait for the host to process request.")
                } else {
                    message.error("Unknown Error")}
            })
    }

    return (
        <div>
            <h2>Room List</h2>
            <Modal closable={false} open={showModal} footer={<Button type='primary' onClick={()=>{
                setShowModal(false)
                if(joinState === 'accept') {
                    Accepted()
                }
            }}>Confirm</Button>} >
                <p>{modalContext}</p>
            </Modal>
            <Table columns={column} dataSource={data} />
            <Button type="primary" onClick={() => {
                tryToCreate()
            }}>Create Room</Button>
            <Button type="primary" onClick={() => {
                setRefresh(refresh + 1)
            }}>Refresh List</Button>
            {/*长轮询查看是否成功加入房间*/}
            { !Dumb && <Heart
                url={'/api/getJoinResult'}
                callback={(data) => {
                    console.log('data: ', data)
                    if (data.result !== "") {
                        // 处理结果
                        setJoinState(data.result)
                        if(data.result === 'reject') {
                            setModalContext("Your request has been rejected by the host.")
                        }
                        else if(data.result === 'accept') {
                            setModalContext("Join Successfully, click confirm to jump to new page.")
                        }
                        setShowModal(true)
                    }
                }}
                dumb={Dumb}
                delay={2000}
                postData={{ username: sessionStorage.getItem("name")}}
            />}
            
        </div>
    )
}