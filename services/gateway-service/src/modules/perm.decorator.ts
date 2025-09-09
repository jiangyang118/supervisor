import { SetMetadata } from '@nestjs/common';

export const PERM_METADATA = 'required_perms';
export const Perm = (...perms: string[]) => SetMetadata(PERM_METADATA, perms);

