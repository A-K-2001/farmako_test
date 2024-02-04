import fastify from 'fastify';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = fastify();

let db;

MongoClient.connect('mongodb://localhost:27017/farmako')
    .then((client) => {
        db = client.db();
        app.listen(process.env.PORT, () => {
            console.log('Running at port:', process.env.PORT);
        });
    })
    .catch((err) => {
        console.log(err);
    });

function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (typeof token !== 'undefined') {
        jwt.verify(token, process.env.JWT_SCRT, (err, authData) => {
            if (err) {
                res.code(403).send({ err: 'forbidden' });
            } else {
                next();
            }
        });
    }
}

// Define a schema for the get route
const userSchema = {
    response: {
        200: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    username: { type: 'string' },
                    email: { type: 'string', format: 'email' },
                    role: { type: 'string' },
                },
            },
        },
    },
};

app.get('/user', { preHandler: verifyToken, schema: userSchema }, async (req, res) => {
    try {
        const users = await db.collection('user').find().toArray();
        // console.log(users);
        res.code(200).send(users);
    } catch (error) {
        res.code(500).send({ error: 'data not found' });
    }
});

app.get('/user/:id', { preHandler: verifyToken }, async (req, res) => {
    try {
        if (ObjectId.isValid(req.params.id)) {
            const user = await db.collection('user').findOne({ _id: new ObjectId(req.params.id) });
            res.code(200).send(user);
        } else {
            res.code(500).send({ error: 'not valid id' });
        }
    } catch (error) {
        res.code(500).send({ error: 'not found' });
    }
});

app.post('/user', { preHandler: verifyToken }, async (req, res) => {
    const user = req.body;
    if (user.email && user.username) {
        try {
            const result = await db.collection('user').insertOne(user);
            res.code(200).send(result);
        } catch (error) {
            res.code(500).send({ err: 'error in saving document' });
        }
    } else {
        res.code(501).send({ err: 'add username and email' });
    }
});

app.delete('/user/:id', { preHandler: verifyToken }, async (req, res) => {
    try {
        if (ObjectId.isValid(req.params.id)) {
            const result = await db.collection('user').deleteOne({ _id: new ObjectId(req.params.id) });
            res.code(200).send(result);
        } else {
            res.code(500).send({ error: 'not valid id' });
        }
    } catch (error) {
        res.code(500).send({ error: 'not deleted' });
    }
});

app.patch('/user/:id', { preHandler: verifyToken }, async (req, res) => {
    const newUser = req.body;
    try {
        if (ObjectId.isValid(req.params.id)) {
            const result = await db.collection('user').updateOne({ _id: new ObjectId(req.params.id) }, { $set: newUser });
            res.code(200).send(result);
        } else {
            res.code(500).send({ error: 'not valid id' });
        }
    } catch (error) {
        res.code(500).send({ error: 'not updated' });
    }
});

app.post('/login', async (req, res) => {
    const user = req.body;
    if (user.username) {
        try {
            const result = await db.collection('user').findOne({ username: user.username });
            jwt.sign({ username: result.user, role: result.role }, process.env.JWT_SCRT, { expiresIn: 3000 }, (err, token) => {
                res.code(201).send({ token });
            });
        } catch (error) {
            res.code(500).send({ err: 'error in login' });
        }
    } else {
        res.code(501).send({ err: 'add username' });
    }
});
