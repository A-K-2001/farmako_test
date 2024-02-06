import { Client } from 'pg';

export const postgres = new Client({
  host: 'localhost',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'root',
});
