import React, { useState, useEffect } from 'react';
import { Button, message, Input } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import CryptoJS from 'crypto-js';
import {roomPage} from './content';
import 'antd/dist/reset.css';
import './App.css';
import axios from 'axios';


function App() {

    const [username, setUsername] = useState();
    const [password, setPassword] = useState();

    // 登录处理
    function login() {
        let url = '/api/login';
        let hashword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
        axios.post(url, {
            username: username,
            password: hashword
        }).then((resp) => {
                console.log(resp)
                if (resp.data.status === 'success') {
                    message.success('登录成功');
                    sessionStorage.setItem("name", username);
                    window.location.href = roomPage;
                }
                else if(resp.data.status === 'not_exist')
                    message.error('登录失败，用户不存在');
                else if(resp.data.status === 'error')
                    message.error('登录失败，密码错误');
                else if(resp.data.status === 'repeat_login') {
                    message.error('您已登录，即将自动跳转');
                    sessionStorage.setItem("name", username);
                    setTimeout(() => {
                        window.location.href = roomPage;
                    }, 800);
                }
            })
    }

    return (
        <div className="App">
            <h2 style={{ textAlign: 'center', fontSize: '30px', margin: '15px' }}>PSI System</h2>
            <br />
            <Input size="large" placeholder="Username" style={{ width: '500px', margin: '15px' }} value={username}
                onChange={(e) => {
                    setUsername(e.target.value);
                }} prefix={<UserOutlined />} />
            <br />
            <Input.Password placeholder="Password" style={{ width: '500px', height: '40px', margin: '15px', fontSize: '15px' }} value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                }} />
            <br />
            <Button type="primary" style={{ margin: '15px' }} onClick={() => {
                console.log('login');
                login();
            }}>Login</Button>
            <Link to={{ pathname: "/register" }}>click to register</Link>
        </div>
    );
}

export default App;