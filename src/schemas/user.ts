import { Static, Type } from '@sinclair/typebox';

export const USER_SCHEMA = Type.Object({
  id: Type.Number(),
  username: Type.String(),
  email: Type.String(),
  role: Type.String(),
});

export type User = Static<typeof USER_SCHEMA>;
