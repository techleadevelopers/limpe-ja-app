// src/shared/types/user-roles.type.ts
import { UserRole } from '../../common/constants/roles.enum';

export type UserRoles = UserRole.CLIENT | UserRole.PROVIDER | UserRole.ADMIN;
