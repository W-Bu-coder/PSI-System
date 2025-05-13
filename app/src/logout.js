import React from 'react'
import {loginPage} from './content';
import { Button, message } from 'antd';
import axios from 'axios';

export default function Logout() {
  return (
    <div>
        <Button type="primary" onClick={()=>{
            console.log("logout")
            let url = '/api/logout';
            axios.post(url, {
                username: sessionStorage.getItem("name")
            }).then((resp) => {
                    if (resp.data.status === 'success') {
                        message.success('注销成功');
                        sessionStorage.removeItem("name")
                        setTimeout(() => {
                            window.location.href = loginPage;
                        }, 800);
                    }
                    else 
                        message.error('未知错误');
                        setTimeout(() => {
                            window.location.href = loginPage;
                        }, 800);
                })
            
        }}>Logout</Button>
    </div>
  )
}
