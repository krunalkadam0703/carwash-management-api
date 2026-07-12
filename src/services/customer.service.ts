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
    return userRepository.updateProfile({
      userId: id,
      ...input,
      phoneNumber: input.phoneNumber ? this.phone(input.phoneNumber) : input.phoneNumber,
      address: input.address ? this.address(input.address) : input.address,
    });
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

  private phone(value: string): string {
    const phone = value.replace(/\s|-/g, '');
    if (!/^(?:\+91)?[6-9]\d{9}$/.test(phone))
      throw new AppError('phoneNumber must be a valid Indian mobile number.', HttpStatus.BAD_REQUEST);
    return phone;
  }

  private address(value: string): string {
    const address = value.trim();
    if (!/(^|\D)[1-9]\d{5}(\D|$)/.test(address))
      throw new AppError('address must include a valid 6 digit pincode.', HttpStatus.BAD_REQUEST);
    return address;
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
