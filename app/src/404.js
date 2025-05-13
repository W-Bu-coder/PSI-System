import React from 'react';
import { Button, Result } from 'antd';

const Unfound = () => (
  <Result
    status="404"
    title="404"
    subTitle="Sorry, the page you visited does not exist."
    extra={<Button type="primary" onClick={()=>{
        //跳转至首页
        window.location.href="http://localhost:3000/#/login"
    }}>Back Home</Button>}
  />
);

export default Unfound;