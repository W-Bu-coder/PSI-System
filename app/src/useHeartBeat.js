import {useEffect, useState} from 'react';
import axios from 'axios';

export function useHeartBeat({url, postData, callback, back, delay, dumb}){

 

    useEffect(()=>{

        if (dumb) return
        const id = setInterval(()=>{
            axios.post(url, postData)
            .then(resp=>resp.data)
            .then(data=>{callback(data)})
        }, delay)
        return ()=>{
            clearInterval(id)
        }
    },[url, postData, callback, back, delay, dumb])

  

}

