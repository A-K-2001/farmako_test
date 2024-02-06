import { RouteHandler } from 'fastify';
import { postgres } from 'src/lib/database';
import { User } from 'src/schemas/user';

export const handleGetAllUsers: RouteHandler = async (req, res) => {
  const users = await postgres.query('SELECT * FROM "user"');

  req.log.info(users.rows, 'Users');

  res.code(200).send(users);
};

export const handleGetUser: RouteHandler<{ Params: { id: string } }> = async (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.code(400).send({ error: 'Not valid id' });
  }

  const usersQuery = await postgres.query('SELECT * FROM "user" WHERE _id = $1', [userId]);

  res.status(200).send({
    count: usersQuery.rowCount,
    results: usersQuery.rows,
  });
};

export const handleUpdateUser: RouteHandler<{
  Body: User;
}> = async (req, res) => {
  const { username, email, id, role } = req.body;

  if (!email || !username || !id) {
    return res.code(400).send({ error: 'Invalid user data' });
  }

  const result = await postgres.query(
    `INSERT INTO "user" ("_id","username", "email", "role")
    VALUES ($1, $2, $3,$4)
    RETURNING *`,
    [id, username, email, role]
  );

  res.status(201).send(result.rows[0]);
};
