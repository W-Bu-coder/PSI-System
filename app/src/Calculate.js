import React, { useState, useEffect } from 'react'
import { Button, Input, Space, message, Watermark } from 'antd';
import axios from 'axios';
import Logout from './logout';
import { listToString } from './Tools';
import { loginPage, resultPage, roomPage } from './content';
import { encryptData, pretreatment } from './encrypt';
// import { useHeartBeat } from './useHeartBeat2';


const fileSaver = require('file-saver');

export default function Calculate() {

    const { TextArea } = Input;
    const [data, setData] = useState("");
    const [key, setKey] = useState("");
    const [input, setInput] = useState("");
    const [isHost, setIsHost] = useState(false);
    

    useEffect(() => {
        let name = sessionStorage.getItem("name")
        // console.log(name)
        if (name === null) {
            message.error('Please login first!');
            window.location.href = loginPage;
        }
        else {
            axios.post("/api/isHost", {
                username: name
            })
                .then(resp => {
                    if (resp.data.status === true) {
                        console.log('host')
                        setIsHost(true)
                    } else {
                        console.log('not a host')
                    }
                })
            axios.post("/api/isReady", {
                username: name
            })
                .then(resp => {
                    if (resp.data.status === true) {
                        console.log('ready!')
                        window.location.href = loginPage;
                    } else {
                        console.log('not ready')
                    }
                })
        }

    }, [])
    
    const onChange1 = (e) => {
        setData(e.target.value);
    };
    const onChange2 = (e) => {
        setKey(e.target.value);
        setInput(e.target.value);
    };

    const randomKey = () => {
        //随机生成64位密钥
        const MaxInt1 = 2147483647;
        const MaxInt2 = 1073741824;
        const key = Math.floor(Math.random() * (MaxInt1 - MaxInt2) + MaxInt2);
        setInput(key);
        // message.success(key);
        setKey(key);
    }


    const handleEncryptResponse = (data) => {
        if (data.status === 'success') {
            message.success('Cipher transmission successful! Please waiting for other participants to respond!');
        }
        else if (data.status === 'error') {
            message.error('Encryp data error! Please try again!');
        }
        else {
            message.error('Session expired, please relogin!');
            sessionStorage.removeItem('name');
            window.location.href = loginPage;
        }
        if (data.list !== "") {
            // 为老用户的data加密
            console.log(data.list)
            let cipher = {};
            for (let e in data.list) {
                console.log('encrypt for other users...')
                console.log(e, data.list[e])
                cipher[e]=encryptData(data.list[e], key);
                // for (let j = 0; j < data.list[i].length; j++) {
                //     let tmp = QuickPow(data.list[i][j], parseInt(key), parseInt(mod));
                //     cipher[i].append(tmp);
                // }
            }
            console.log('others cipher: ', cipher)
            // 将加密后的数据发给后端
            axios.post('/api/collectData', {
                cipher: cipher,
                targetUser: Object.keys(data.list)
            }).then((resp) => {
                if (resp.data.status === 'success') {
                    console.log('Collect data success!');
                }
                else {
                    message.error('Unknown Error');
                }
            })
        }
    }

    const transmitData = (data) => {
        //传输给后端
        axios.post('/api/encryptData', {
            username: sessionStorage.getItem("name"),
            cipher: data
        }).then((resp) => {
            console.log(resp.data)
            handleEncryptResponse(resp.data)
        })
    }

    const handleEncrypt = (data) => {
        //对数据进行预处理
        console.log('pretreatment')
        let edata = pretreatment(data);
        //对数据进行加密
        console.log('encrypt')
        let transData = encryptData(edata, key);
        //将加密后数据传输到后端
        console.log('transmit')
        transmitData(transData);
        return edata
    }


    const removeRoom = (roomID) => {
        axios.post("/api/removeRoom", {
            roomID: roomID
        }).then(resp => {
            message.success('Room ' + roomID + ' is removed')
            sessionStorage.removeItem("roomId")
            window.location.href = roomPage
        })
    }

    const exitRoom = (roomID) => {
        axios.post("/api/exitRoom", {
            roomID: roomID,
            username: sessionStorage.getItem("name")
        }).then(resp => {
            message.success('Exit from ' + roomID)
            sessionStorage.removeItem("roomId")
            window.location.href = roomPage
        })

    }

    const handleSubmit = () => {
        sessionStorage.setItem("key", key);
        let startTime = new Date().getTime();
        // console.log(data)
        handleEncrypt(data)
        let endTime = new Date().getTime();
        console.log('time: ', endTime - startTime);
        // 将数据保存到用户本地：
        message.success('Data saved successfully');
        fileSaver.saveAs(new Blob([data], { type: 'text/plain;charset=utf-8' }), 'data.txt');
        // 保存data到sessionStorage
        sessionStorage.setItem("rawData", JSON.stringify(data.split(/[,，\s\n]/)))
        setTimeout(() => {
            message.success('Jump to result page')
            window.location.href = resultPage
        }, 500)
    }

        return (
            <div>
                <Watermark content={sessionStorage.getItem("name")}>
                    <label style={{ textAlign: 'center', fontSize: '30px' }}>PSI Calculator - {sessionStorage.getItem("name")}</label>
                    <br />
                    <TextArea
                        showCount
                        maxLength={1024}
                        style={{ height: 300, width: 500, margin: '10px', resize: 'none' }}
                        onChange={onChange1}
                        placeholder="input data here"
                    />
                    <br />
                    <Space.Compact style={{ width: '35%', margin: '15px' }}>
                        <Input value={input} onChange={onChange2} />
                        <Button type="primary" onClick={() => {
                            randomKey();
                        }}>Random key</Button>
                    </Space.Compact>
                    <br />
                    <Button type="primary" style={{ marginLeft: '10%' }} onClick={() => {
                        handleSubmit()
                    }}>Submit</Button>
                    <Logout />
                    <br />

                    {isHost && <Button type="primary" onClick={() => {
                        // 房主关闭房间
                        setIsHost(false)
                        removeRoom(sessionStorage.getItem("roomId"))
                    }}>Close room</Button>}
                    {!isHost && <Button type="primary" onClick={() => {
                        // 成员退出房间
                        exitRoom(sessionStorage.getItem("roomId"))
                    }}>Exit room</Button>
                    }
                </Watermark>
            </div>
        )
}

export {encryptData}