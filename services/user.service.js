import fs from 'fs'
import Cryptr from 'cryptr'

import { utilService } from './util.service.js'

const cryptr = new Cryptr(process.env.SECRET1 || 'secret-bug-1234')
const users = utilService.readJsonFile('data/user.json')

export const userService = {
    query,
    getById,
    save,
    remove,
    getLoginToken,
    checkLogin,
    validateToken,
}

function checkLogin({ userName, password }) {
    var user = users.find(user => user.userName === userName && user.password === password)
    if (user) {
        user = {
            _id: user._id,
            userName: user.userName,
            fullName: user.fullName,
        }
        return Promise.resolve(user)
    }
}

function validateToken(token) {
    if (!token) return null
    const str = cryptr.decrypt(token)
    const user = JSON.parse(str)
    return user
}

function getLoginToken(user) {
    const str = JSON.stringify(user)
    const encryptStr = cryptr.encrypt(str)
    return encryptStr
}

function query() {
    const usersToReturn = users.map(user => ({ _id: user._id, fullName: user.fullName }))
    return Promise.resolve(usersToReturn)
}

function getById(userId) {
    var user = users.find(user => user._id === userId)
    if (!user) return Promise.reject('User not found')

    user = {
        _id: user._id,
        userName: user.userName,
        fullName: user.fullName,
    }
    return Promise.resolve(user)
}

function remove(userId) {
    users = users.filter(user => user._id !== userId)
    return _saveUsersToFile()
}

function save(user) {
    user._id = utilService.makeId()
    users.push(user)

    return _saveUsersToFile()
        .then(() => ({
            _id: user._id,
            fullName: user.fullName,
            isAdmin: user.isAdmin,
        }))
}

function _saveUsersToFile() {
    return new Promise((resolve, reject) => {
        const usersStr = JSON.stringify(users, null, 2)
        fs.writeFile('data/user.json', usersStr, err => {
            if (err) {
                return console.log(err)
            }
            resolve()
        })
    })
}