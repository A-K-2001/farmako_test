import fastify from 'fastify';
import { MongoClient, ObjectId } from 'mongodb';
import dotenv, { parse } from 'dotenv';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

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

app.get('/user', { preHandler: verifyToken, schema: userSchema }, async (req, res) => {
    try {
        const users = await prismadb.user.findMany();
        // console.log(users);
        res.code(200).send(users);
    } catch (error) {
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
        const user = await prismadb.user.findUnique({
            where: {
                id: userId,
            },
        });
        if (user) {
            res.code(200).send(user);
        } else {
            res.code(404).send({ error: 'not found' });
        }

    } catch (error) {
        res.code(500).send({ error: 'not found' });
    }
});

app.post('/user', { preHandler: verifyToken }, async (req, res) => {
    const user = req.body;
    if (user.email && user.username) {
        try {
            const result = await prismadb.user.create({
                data: {
                    username: user.username,
                    email: user.email,
                    role: user.role,
                },
            });
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
        const userId = parseInt(req.params.id);

        if (isNaN(userId)) {
            res.code(400).send({ error: 'Invalid user id' });
            return;
        }

        const result = await prismadb.user.delete({
            where: { id: userId },
        });

        res.code(200).send(result);
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
      const updatedUser = await prismadb.user.update({
        where: { id: userId },
        data: newUser,
      });
  
      res.code(200).send(updatedUser);
    } catch (error) {
      console.error(error);
      res.code(500).send({ error: 'User not updated' });
    }
});

app.post('/login', async (req, res) => {
    const user = req.body;
    if (user.username) {
        try {
            const result = await prismadb.user.findUnique({
                where: {
                    username: user.username,
                },
            });
            console.log(result);
            if(!result) {
                res.code(404).send({ err: 'user not found' });
                return;
            }
            jwt.sign({ username: result.username, role: result.role }, process.env.JWT_SCRT, { expiresIn: 3000 }, (err, token) => {
                res.code(201).send({ token });
            });
        } catch (error) {
            console.log(error);
            res.code(500).send({ err: 'error in login' });
        }
    } else {
        res.code(501).send({ err: 'add username' });
    }
});
