// Add runtime checks for environment variables
export const CONFIG = {
  PORT: process.env.PORT!,
  JWT_SCRT: process.env.JWT_SCRT!,
  DATABASE_URL: process.env.DATABASE_URL!,
};
