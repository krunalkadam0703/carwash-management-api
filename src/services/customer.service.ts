import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import { userRepository } from '../repositories/user/index.js';
import { AppError } from '../utils/app-error.js';

export class CustomerService {
  async list(user: AppUser): Promise<AppUser[]> {
    this.requireOwner(user);
    return userRepository.findManyByBusinessAndRole(this.requireBusinessId(user), 'CUSTOMER');
  }

  async update(
    user: AppUser,
    id: string,
    input: { name?: string; phoneNumber?: string | null; address?: string | null },
  ): Promise<AppUser> {
    this.requireOwner(user);
    const customer = await userRepository.findById(id);
    if (
      !customer ||
      customer.businessId !== this.requireBusinessId(user) ||
      customer.role !== 'CUSTOMER'
    )
      throw new AppError('Customer was not found.', HttpStatus.NOT_FOUND);
    return userRepository.updateProfile({ userId: id, ...input });
  }

  text(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim())
      throw new AppError(field + ' is required.', HttpStatus.BAD_REQUEST);
    return value.trim();
  }

  optText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  nullableText(value: unknown): string | null | undefined {
    return value === null ? null : this.optText(value);
  }

  private requireOwner(user: AppUser): void {
    if (!['OWNER', 'SYSTEM_ADMIN'].includes(user.role))
      throw new AppError('Only owners can manage customers.', HttpStatus.FORBIDDEN);
  }

  private requireBusinessId(user: AppUser): string {
    if (!user.businessId)
      throw new AppError('Business account is required.', HttpStatus.BAD_REQUEST);
    return user.businessId;
  }
}

export const customerService = new CustomerService();
