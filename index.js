import fastify from 'fastify';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv, { parse } from 'dotenv';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'root',
})
client.connect()

dotenv.config();

const app = fastify();
const prismadb = new PrismaClient();


const start = async () => {
    try {
        app.listen(process.env.PORT, () => {
            console.log('Running at port:', process.env.PORT);
        });
    } catch (error) {
        console.log('Error in starting server:', error);
    }
};
start();
// console.log(prismadb,"PP");

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

app.get('/user', { preHandler: verifyToken , schema: userSchema }, async (req, res) => {
    try {
        const users = await client.query('SELECT * FROM "user"');
        console.log(users.rows);
        res.code(200).send(users.rows);
    } catch (error) {
        console.log(error);
        res.code(500).send({ error: 'data not found' });
    }
});

app.get('/user/:id', { preHandler: verifyToken }, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            res.code(400).send({ error: 'not valid id' });
            return
        }
        const user = await client.query('SELECT * FROM "user" WHERE _id = $1', [userId]);
        if (user.rows.length > 0) {
            res.code(200).send(user.rows[0]);
        } else {
            res.code(404).send({ error: 'not found' });
        }

    } catch (error) {
        res.code(500).send({ error: 'not found' });
    }
});

app.post('/user', { preHandler: verifyToken },async (req, res) => {
    const user = req.body;
    if (user.email && user.username && user._id) {
        try {
            const result = await client.query(`
                INSERT INTO "user" ("_id","username", "email", "role")
                VALUES ($1, $2, $3,$4)
                RETURNING *`,
                [user._id, user.username, user.email, user.role]
            );
            res.code(200).send(result);
        } catch (error) {
            console.log(error);
            res.code(500).send({ err: 'error in saving document' });
        }
    } else {
        res.code(501).send({ err: 'add username and email' });
    }
});

app.delete('/user/:id', { preHandler: verifyToken }, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            res.code(400).send({ error: 'Invalid user id' });
            return;
        }

        const result = await client.query('DELETE FROM "user" WHERE _id = $1 RETURNING *', [userId]);
        if (result.rows.length > 0) {
            res.code(200).send(result.rows[0]);
        } else {
            res.code(404).send({ error: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.code(500).send({ error: 'User not deleted' });
    }
});

app.patch('/user/:id', { preHandler: verifyToken }, async (req, res) => {
    const userId = parseInt(req.params.id);
    const newUser = req.body;

    if (isNaN(userId)) {
        res.code(400).send({ error: 'Invalid user id' });
        return;
    }

    try {
        const updatedUser = await client.query(
            'UPDATE "user" SET username = $1, email = $2, role = $3 WHERE _id = $4 RETURNING *',
            [newUser.username, newUser.email, newUser.role, userId]
        );
        if (updatedUser.rows.length > 0) {
            res.code(200).send(updatedUser.rows[0]);
        } else {
            res.code(404).send({ error: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.code(500).send({ error: 'User not updated' });
    }
});

app.post('/login', async (req, res) => {
    const user = req.body;
    if (user.username) {
        try {
            const result = await client.query('SELECT * FROM "user" WHERE username = $1', [user.username]);
            console.log(result);
            if (result.rows.length > 0) {
                const userFromDb = result.rows[0];
                jwt.sign({ username: userFromDb.username, role: userFromDb.role }, process.env.JWT_SCRT, { expiresIn: 3000 }, (err, token) => {
                    res.code(201).send({ token });
                });
            } else {
                res.code(404).send({ err: 'User not found' });
            }
        } catch (error) {
            console.log(error);
            res.code(500).send({ err: 'error in login' });
        }
    } else {
        res.code(501).send({ err: 'add username' });
    }
});
