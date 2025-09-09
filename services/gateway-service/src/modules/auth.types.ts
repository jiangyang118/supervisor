export type AuthPayload = {
  sub: number | string;
  username: string;
  roles: string[];
  iat?: number;
  exp?: number;
};

export type AuthUser = AuthPayload & {
  permissions?: string[];
};

