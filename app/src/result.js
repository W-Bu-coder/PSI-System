import React, { useState, useEffect } from 'react'
import { Button, message, Result, Table } from 'antd';
import axios from 'axios';
import { columns } from './content'
import Heart from './useHeartBeat3';
import { encryptData } from './encrypt';

export default function Results() {

    const [result, setResult] = useState([])

    // 用户点击刷新后获取求交结果
    const refresh = () => {
        console.log('refresh')
        axios.post("/api/refresh", {
            username: sessionStorage.getItem("name")
        }).then(resp => {
            if (resp.data.status === 'success') {
                message.success('Refresh success!');
                let res = resp.data.result
                let rawData = JSON.parse(sessionStorage.getItem('rawData'))
                let resData = formatResult(res, rawData)
                console.log('interection result: ', resData)
                setResult(resData)
            }
            else if (resp.data.status === 'error') {
                message.error('Unable to obtain results temporarily, Please try again later');
            }
        })
    }

    const formatResult = (result, rawData) => {
        // result是一个字典；rawData是一个数组
        console.log(result)
        console.log(rawData)
        let resData = []
        let cont = []
        for (let i in result) {
            cont = []
            let size = result[i].length
            for (let j = 0; j < size; j++) {
                if(j === size-1)
                    cont.push(rawData[result[i][j]])
                else
                    cont.push(rawData[result[i][j]]+"; ")
            }
            console.log('res: ', i, size, cont)
            resData.push({
                key: i,
                name: i,
                size: size,
                content: cont
            })
        }
        return resData
    }

    return (
        <div>
            { //已经上传数据的用户询问并响应加密要求
                <Heart
                    url={'/api/dealPoll'}
                    callback={(data) => {
                        console.log('encryptData: ', data)
                        // workList是一个数组
                        if (data.targetUser !== null) {
                            let key = sessionStorage.getItem("key")
                            console.log('try to encrypt with key: ', key)
                            let res = encryptData(data.workList, key)
                            // for (let i in data.workList) {
                            //     respush(encryptData(data.workList[i]))
                            // }
                            // 将加密后的数据回传
                            axios.post("/api/collectData", {
                                cipher: res,
                                targetUser: data.targetUser
                            }).then(resp => {
                                console.log(resp)
                                if (resp.data.status === 'success') {
                                    message.success('Data transmission successful!')
                                }
                                else {
                                    message.error('Transmission Error')
                                }

                            })
                        }
                    }}
                    dumb={false}
                    delay={2000}
                    postData={{
                        username: sessionStorage.getItem("name"),
                        option: 'dealCypher'
                    }
                    }
                />
            }
            <Result
                status="success"
                title="Successfully submitted!"
                subTitle="Please keep your data and key properly. You can click the button below to refresh the results."
                extra={[
                    <Button type="primary" key="console" onClick={() => {
                        refresh()
                    }}>
                        Refresh result
                    </Button>,
                ]}
            />
            <Table columns={columns} dataSource={result} style={{ textAlign: 'center' }} />
        </div>
    )
}
