import React, { useState, useEffect } from 'react'
import { loginPage } from './content';
import Heart from './useHeartBeat2';
import axios from 'axios';
import { message, Modal } from 'antd';


export default function DealJoin() {

    const [showModal, setShowModal] = useState(false);
    const [modalContext, setModalContext] = useState("");
    const [isHost, setIsHost] = useState(false);


    useEffect(() => {
        let name = sessionStorage.getItem("name")
        if (name !== null) {
            hostRequest(sessionStorage.getItem("name"))
        }
    }, [])

    // url改变时执行
    window.addEventListener('hashchange', function () {
        console.log('hash value changed:', window.location.hash);
        if (window.location.hash === '#/login') {
            sessionStorage.clear()
            return;
        }
        if (getLoginState()) {
            hostRequest(sessionStorage.getItem("name"))
        }
    });

    const getLoginState = () => {
        // console.log(name)
        if (sessionStorage.getItem("name") === null) {
            message.error('Please login first!');
            window.location.href = loginPage;
            return false
        }
        return true
    }

    const hostRequest = (name) => {
        axios.post("/api/isHost", {
            username: name
        })
            .then(resp => {
                if (resp.data.status === true) {
                    console.log('host')
                    setIsHost(true)
                } else {
                    console.log('not a host')
                    setIsHost(false)
                }
            })
    }

    useEffect(() => {
        if (modalContext.length !== 0)
            setShowModal(true)
    }, [modalContext])


    // 允许加入房间
    const AllowRequest = (key) => {
        axios.post("/api/allowJoin", {
            username: key,
        }).then(resp => {
            message.success('Accepted the request')
        })
    }


    const RejectRequest = (key) => {
        axios.post("/api/rejectJoin", {
            username: key,
        }).then(resp => {
            message.warning('Rejected the request')
        })
    }

    return (
        <div>
            { //房主接收加入房间申请
                isHost && <Heart
                    url={'/api/dealPoll'}
                    callback={(data) => {
                        console.log('joinData: ', data)
                        if (data.joinList !== "") {
                            setModalContext(data.joinList)
                            setShowModal(true)
                        }
                    }}
                    dumb={false}
                    delay={2000}
                    postData={{
                        username: sessionStorage.getItem("name"),
                        option: 'dealRequest'
                    }}
                />}
            <Modal okText="Accept" cancelText="Reject" closable={false} open={showModal} maskClosable={false}
                onCancel={() => {
                    RejectRequest(modalContext)
                    setShowModal(false)
                }}
                onOk={() => {
                    AllowRequest(modalContext)
                    setShowModal(false)
                }}>
                <p style={{ textAlign: 'center', margin: '10px' }}>User "{modalContext}" is applying to join your room.</p>
                <br />
                {/* <p>
    {modalConext.status ? 'true' : 'false'}
</p> */}
                {/* <p>
    
    <ul>
        {modalConext.map((item, index) => 
                <li key={index} style={{listStyle:'none', margin:'10px'}}>
                    Username: {item}
                <Button onClick={() => replyRequest(item)}>Accept</Button>
                </li>
        )}
    </ul>
</p> */}
                {/* <Input value={modalInput} onChange={(e) => { setModalInput(e.target.value) }} />
<Button onClick={() => {
    axios.post("/api/handleToClient", { 'value': modalInput })
        .then(resp => {
            alert(resp.data.status)
        }
        )
}}>send</Button> */}
            </Modal>
        </div>
    )
}
