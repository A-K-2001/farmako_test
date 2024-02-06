import dotenv from 'dotenv';
import fastify from 'fastify';
import { handleGetAllUsers, handleGetUser, handleUpdateUser } from './controllers/user.controllers';
import { USER_SCHEMA } from './schemas/user';

dotenv.config();

const server = fastify();

export { server };

// function verifyToken(req, res, done) {
//   const token = req.headers['authorization'];
//   if (typeof token !== 'undefined') {
//     jwt.verify(token, process.env.JWT_SCRT, (err, authData) => {
//       if (err) {
//         res.code(403).send({ err: 'forbidden' });
//       } else {
//         next();
//       }
//     });
//   }
// }

server.get(
  '/user',
  {
    preHandler: verifyToken,
    schema: USER_SCHEMA,
  },
  handleGetAllUsers
);

server.get('/user/:id', { preHandler: verifyToken }, handleGetUser);

server.post('/user', { preHandler: verifyToken }, handleUpdateUser);

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
        jwt.sign(
          { username: userFromDb.username, role: userFromDb.role },
          process.env.JWT_SCRT,
          { expiresIn: 3000 },
          (err, token) => {
            res.code(201).send({ token });
          }
        );
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
