const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const knex = require('knex')
const bcrypt = require('bcrypt-nodejs');


const app = express()
const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'rshutj967',
        database: 'mathpractice',
    }
})

app.use(bodyParser.json())
app.use(cors())

app.get('/', (req, res) => {
    res.send('it is working')
})

app.post('/signin', (req, res) => {
    db.select('email', 'hash').from('login')
    .where('email', '=', req.body.email)
    .then(data => {
        const isValid = bcrypt.compareSync(req.body.password, data[0].hash)
        if (isValid) {
            return db.select('*').from('users')
            .where('email', '=', req.body.email)
            .then(user => {
                res.json(user[0])
            })
            .catch(err => {
                res.status(400).json('error logging in')
            })            
        } else {
            res.status(400).json('couldnt find this user')
        }
    })
    .catch(err => {
        res.status(400).json('couldnt find this user')
    })
})



app.post('/signup', (req, res) => {
    const {email, name, password} = req.body
    const hash = bcrypt.hashSync(password)
        db.transaction(trx => {
            trx.insert({
                email: email,
                hash: hash
            })
            .into('login')
            .returning('email')
            .then(loginEmail => {
                return trx('users')
                    .returning('*')
                    .insert({
                        email: loginEmail[0],
                        name: name,
                    })
                    .then(user => {
                        res.json(user[0])
                    })
            })
            .then(trx.commit)
            .catch(trx.rollback)
        })
        .catch(err => res.status(400).json('identical email'))
})


app.put('/updateStats', (req, res) => {
    let found = false;
    const {id, answer} = req.body
    if (answer === 'correct') {
        db('users').where('id', '=', id)
        .increment('questionsAnswered', 1)
        .increment('questionsCorrect', 1)
        .then(res.json('updated'))
        .catch(res.status(400).json('unable to register'))
    } else {
        db('users').where('id', '=', id)
        .increment('questionsAnswered', 1)
        .increment('questionsIncorrect', 1)
        .then(res.json('updated'))
        .catch(res.status(400).json('unable to register'))
    }
})

app.listen(process.env.PORT, () => {
    console.log('app is running on port 3000')
})