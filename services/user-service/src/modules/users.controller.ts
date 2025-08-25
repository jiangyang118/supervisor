import { Controller, Get } from '@nestjs/common';
import { z } from 'zod';

const PublicUser = z.object({ id: z.string(), username: z.string(), displayName: z.string() });

@Controller('users')
export class UsersController {
  @Get()
  list() {
    const data = [
      { id: 'u_1', username: 'regulator_admin', displayName: 'Regulator Admin' },
      { id: 'u_2', username: 'school_admin', displayName: 'School Admin' },
    ];
    return data.map((u) => PublicUser.parse(u));
  }
}

