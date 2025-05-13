import React from 'react'

const loginPage = "http://localhost:3000/#/login"
const roomPage = "http://localhost:3000/#/room"
const psiPage = "http://localhost:3000/#/psi"
const resultPage = "http://localhost:3000/#/result"
const unfoundPage = "http://localhost:3000/#/unfound"


const columns = [
    {
      title: 'User',
      dataIndex: 'name',
    },
    {
      title: 'Size',
      dataIndex: 'size',
      defaultSortOrder: 'descend',
      sorter: (a, b) => a.size - b.size,
    },
    {
      title: 'Intersection content',
      dataIndex: 'content',
    },
  ];



export {loginPage, roomPage, psiPage, resultPage, unfoundPage, columns}
