import {useCallback, useEffect, useState} from 'react';
import axios from 'axios';


import React from 'react'

export default function HeartBeat2({url, postData, callback,  delay, dumb}) {




   const sendPost = useCallback( async ()=>{

    await new Promise((resolve)=>setTimeout(resolve, delay))
    return axios.post(url, postData)
    .then(resp=>resp.data)
    .then(data=>{callback(data)})
}, [url, postData, callback, delay]) 

    const func = async ()=>{
        while(!dumb){
            await sendPost()
        }
    }

    
    useEffect(()=>{
           func()
     }, [dumb])
    




  return (
    <></>
  )
}
