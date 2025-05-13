import React, { useEffect, useState } from 'react'
import { Input, Button, message, Alert } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import CryptoJS from 'crypto-js'
import {loginPage} from './content';
import axios from 'axios'

export default function Register() {

    const [username, setUsername] = useState();
    const [password, setPassword] = useState();
    const [password2, setPassword2] = useState("");
    const [email, setEmail] = useState();
    const [Pstatus, setPstatus] = useState();

    //第二次输入密码时，检查两次密码是否一致
    useEffect(()=>{
        if(password2===''){
            setPstatus('success')
            return
        }
       setPstatus(password === password2 ? 'success' : 'error')
    },[password,password2])

    function register() {
        let url = '/api/register';
        let hashword = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
        // console.log(username)
        axios.post(url, {
            username: username,
            password: hashword,
            email: email
        })
            .then((resp) => {
                // console.log(resp)
                if (resp.data.status === 'success') {
                    message.success('注册成功，请登录');
                    setTimeout(() => {
                        window.location.href = loginPage;
                    }, 800);
                }       
                else if (resp.data.status === 'exist')
                    message.error('注册失败，用户已存在');
                else if (resp.data.status === 'error')
                    message.error('注册失败，请重试');
            })
    }

    return (
        <div style={{ textAlign: 'center' }}>
            <h2>Register</h2>
            <Input size="large" placeholder="Username" style={{ width: '500px', height: '40px', margin: '15px', fontSize: '15px' }}
                onChange={(e) => {
                    setUsername(e.target.value)
                }} value={username}
                prefix={<UserOutlined />}
            />
            <br />
            <Input size="large" placeholder="E-mail" style={{ width: '500px', height: '40px', margin: '15px', fontSize: '15px' }} value={email}
                onChange={(e) => {
                    setEmail(e.target.value)
                }} />
            <br />
            <Input.Password placeholder="Password" style={{ width: '500px', height: '40px', margin: '15px', fontSize: '15px' }} value={password}
                onChange={(e) => {
                    setPassword(e.target.value)
                }} />
            <br />
            <Input.Password status={Pstatus} placeholder="Repeat password" value={password2}
                style={{ width: '500px', height: '40px', marginTop: '15px', fontSize: '15px' }}
                onChange={(e) => {
                    setPassword2(e.target.value)
                }} />
            <br />
            {(Pstatus==='error') &&  <Alert style={{width:'400px', margin:'5px'}} message="Two passwords above do not match" type="error" />}
            <br />
            <Button type="primary" style={{ margin: '20px' }} onClick={() => {
                console.log('register');
                register();
            }}>Register</Button>
        </div>
    )
}
