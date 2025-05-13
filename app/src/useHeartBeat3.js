import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';


import React from 'react'

export default function HeartBeat2({ url, postData, callback, delay, dumb }) {



    const [term, setTerm] = useState(false)
    const sendPost = useCallback(async () => {

        //     await new Promise((resolve)=>setTimeout(resolve, delay))
        //     return axios.post(url, postData)
        //     .then(resp=>resp.data)
        //     .then(data=>{callback(data)})
        // }, [url, postData, callback, delay]) 

        await new Promise((resolve) => setTimeout(resolve, delay))
        return axios.post(url, postData)
            .then(resp => resp.data)
            .then(data => { 
                callback(data)
                
                if(data.status === 'terminate') {
                    console.log("terminate query")
                    throw new Error("terminate query")
                }
                })
            .then(() => { 
                return true
            })
            .catch((err)=>{
                return false
            })
    }, [url, postData, callback, delay])

    const func = async () => {

        // let run
        // while (!term) {
        //     run = await sendPost()
        //     if(!run) {
        //         break
        //     }
        // }



        while(!term && await sendPost()) {}
    }

    useEffect(() => {
        func()
        return () => { setTerm(true) }
    }, [])





    return (
        <></>
    )
}
