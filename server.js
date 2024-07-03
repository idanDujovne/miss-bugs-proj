import express from 'express'
import cookieParser from 'cookie-parser'
import fs from 'fs'
import PDFDocument from 'pdfkit'

import { bugService } from './services/bug.service.js'
import { loggerService } from './services/logger.service.js'
import { userInfo } from 'os'
import { userService } from './services/user.service.js'

const app = express()

app.use(express.static('public'))
app.use(cookieParser())
app.use(express.json())

// Express Routing:

app.get('/api/bug', (req, res) => {
    const filterBy = {
        txt: req.query.txt || '',
        minSeverity: +req.query.minSeverity || 0,
        labels: req.query.labels || [],

        sortBy: req.query.sortBy || '',
        sortDir: +req.query.sortDir || 1,

        pageIdx: +req.query.pageIdx || 0,
    }

    bugService.query(filterBy)
        .then(bugs => res.send(bugs))
        .catch(err => {
            loggerService.error(`Couldn't get bugs`, err)
            res.status(500).send(`Couldn't get bugs`)
        })
})


app.get('/api/bug/labels', (req, res) => {
    bugService.getLabels()
        .then(labels => res.send(labels))
        .catch(err => {
            loggerService.error(`Couldn't get labels`, err)
            res.status(500).send(`Couldn't get labels`)
        })
})

app.get('/api/bug/pageCount', (req, res) => {
    bugService.getPageCount()
        .then(pageCount => res.send(pageCount + ''))
        .catch(err => {
            loggerService.error(`Couldn't get pageCount`, err)
            res.status(500).send(`Couldn't get pageCount`)
        })
})


app.get('/api/bug/download', (req, res) => {
    const doc = new PDFDocument()
    doc.pipe(fs.createWriteStream('bugs.pdf'))
    doc.fontSize(25).text('BUGS LIST').fontSize(16)

    bugService.query()
        .then((bugs) => {
            bugs.forEach((bug) => {
                const bugTxt = `${bug.title}: ${bug.description}. (severity: ${bug.severity})`
                doc.text(bugTxt)
            })

            doc.end()
            res.end()
        })
})

app.get('/api/bug/:id', (req, res) => {
    const { id } = req.params
    const visitedBugs = req.cookies.visitedBugs || []

    if (visitedBugs.length >= 2) return res.status(401).send('Wait for a bit')
    if (!visitedBugs.includes(id)) visitedBugs.push(id)

    res.cookie('visitedBugs', visitedBugs, { maxAge: 10000 })

    bugService.getById(id)
        .then(bug => res.send(bug))
        .catch(err => {
            loggerService.error(`Couldn't get bug (${id})`, err)
            res.status(400).send(`Couldn't get bug (${id})`)
        })
})

app.delete('/api/bug/:id', (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Cannot remove Bug')

    const { id } = req.params

    bugService.remove(id, loggedinUser)
        .then(() => res.send(`Bug ${id} deleted...`))
        .catch(err => {
            loggerService.error(`Couldn't delete bug (${id})`, err)
            res.status(500).send(`Couldn't delete bug (${id})`)
        })

})

app.put('/api/bug/:id', (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Cannot update Bug')

    const { _id, title, description, severity, createdAt, labels } = req.body
    const bugToSave = {
        _id,
        title: title || '',
        description: description || '',
        severity: +severity || 0,
        createdAt: +createdAt || 0,
        labels: labels || []
    }
    // console.log('bugToSave-server:', bugToSave)
    bugService.save(bugToSave, loggedinUser)
        .then(savedBug => res.send(savedBug))
        .catch(err => {
            loggerService.error(`Couldn't update bug (${_id})`, err)
            res.status(500).send(`Couldn't update bug (${_id})`)
        })
})

app.post('/api/bug', (req, res) => {
    const loggedinUser = userService.validateToken(req.cookies.loginToken)
    if (!loggedinUser) return res.status(401).send('Cannot add Bug')

    const { title, description, severity, createdAt, labels } = req.body
    const bugToSave = {
        title: title || '',
        description: description || '',
        severity: +severity || 0,
        createdAt: +createdAt || 0,
        labels: labels || []
    }

    // console.log('bugToSave-server:', bugToSave)
    bugService.save(bugToSave, loggedinUser)
        .then(savedBug => res.send(savedBug))
        .catch(err => {
            loggerService.error(`Couldn't add bug`, err)
            res.status(500).send(`Couldn't add bug`)
        })
})

app.get('/api/user', (req, res) => {
    userService.query()
        .then(users => res.send(users))
        .catch(err => {
            loggerService.error('Cannot load users', err)
            res.status(400).send('Cannot load users')
        })
})

app.get('/api/user/:userId', (req, res) => {
    const { userId } = req.params
    
    userService.getById(userId)
        .then(user => res.send(user))
        .catch(err => {
            loggerService.error('Cannot load users', err)
            res.status(400).send('Cannot load users')
        })
})

app.post('/api/auth/signup', (req, res) => {
    const credentials = req.body

    userService.save(credentials)
        .then(user => {
            if (user) {
                const loginToken = userService.getLoginToken(user)
                res.cookie('loginToken', loginToken)
                res.send(user)
            } else {
                res.status(400).send('Cannot signup')
            }
        })
})

app.post('/api/auth/login', (req, res) => {
    const credentials = req.body

    userService.checkLogin(credentials)
        .then(user => {
            if (user) {
                const loginToken = userService.getLoginToken(user)
                res.cookie('loginToken', loginToken)
                res.send(user)
            } else {
                res.status(401).send('Invalid credentials')
            }
        })
})

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('loginToken')
    res.send('logged-out')
})

const port = 3030
app.listen(port, () => loggerService.info(`Server listening on port http://127.0.0.1:${port}/`))
