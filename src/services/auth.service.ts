import { HttpStatus } from '../constants/http.js';
import type { AppRole, AppUser, AuthenticatedUser, BusinessRecord } from '../models/auth.model.js';
import { accountRepository } from '../repositories/account/index.js';
import { businessRepository } from '../repositories/business/index.js';
import { userRepository } from '../repositories/user/index.js';
import { AppError } from '../utils/app-error.js';

export type CreateInactiveWorkerInput = {
  businessId: string;
  name: string;
  email: string;
  phoneNumber?: string;
  address?: string;
};

export type CreateOwnerBusinessInput = {
  user: AppUser;
  businessName: string;
  businessDescription?: string;
  phoneNumber: string;
  address: string;
};

export type UpdateCustomerProfileInput = {
  userId: string;
  phoneNumber: string;
  address: string;
  businessId?: string;
};

export interface UserRepositoryPort {
  findById(id: string): Promise<AppUser | null>;
  findByEmail(email: string): Promise<AppUser | null>;
  createInactiveWorker(input: CreateInactiveWorkerInput): Promise<AppUser>;
  activateWorker(userId: string): Promise<AppUser>;
  updateCustomerProfile(input: UpdateCustomerProfileInput): Promise<AppUser>;
}

export interface BusinessRepositoryPort {
  findByOwnerId(ownerId: string): Promise<BusinessRecord | null>;
  findFirst(): Promise<BusinessRecord | null>;
  createOwnerBusiness(
    input: CreateOwnerBusinessInput,
  ): Promise<{ user: AppUser; business: BusinessRecord }>;
}

export interface AccountRepositoryPort {
  hasGoogleAccount(userId: string): Promise<boolean>;
}

export type AuthServiceDependencies = {
  userRepository: UserRepositoryPort;
  businessRepository: BusinessRepositoryPort;
  accountRepository: AccountRepositoryPort;
};

export interface AuthServiceContract {
  getAuthenticatedUser(userId: string): Promise<AuthenticatedUser>;
  requireText(value: unknown, fieldName: string): string;
  optionalText(value: unknown): string | undefined;
  createInvitedWorker(input: {
    owner: AppUser;
    name: string;
    email: string;
    phoneNumber?: string;
    address?: string;
  }): Promise<AppUser>;
  onboardOwner(input: CreateOwnerBusinessInput): Promise<{ user: AppUser; business: BusinessRecord }>;
  onboardCustomer(input: {
    user: AppUser;
    phoneNumber: string;
    address: string;
    businessId?: string;
  }): Promise<AppUser>;
}

export class AuthService implements AuthServiceContract {
  constructor(private readonly dependencies: AuthServiceDependencies) {}

  async getAuthenticatedUser(userId: string): Promise<AuthenticatedUser> {
    const user = await this.dependencies.userRepository.findById(userId);

    if (!user) {
      throw new AppError('Authenticated user profile was not found.', HttpStatus.UNAUTHORIZED);
    }

    const activatedUser = await this.activateWorkerAfterGoogleLogin(user);

    if (activatedUser.role === 'WORKER' && !activatedUser.isActive) {
      throw new AppError('Worker account is not active yet.', HttpStatus.FORBIDDEN);
    }

    return {
      ...activatedUser,
      onboardingComplete: this.isOnboardingComplete(activatedUser),
    };
  }

  requireRole(user: AppUser, roles: AppRole[]): void {
    if (!roles.includes(user.role)) {
      throw new AppError('You do not have permission to perform this action.', HttpStatus.FORBIDDEN);
    }
  }

  requireText(value: unknown, fieldName: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new AppError(fieldName + ' is required.', HttpStatus.BAD_REQUEST);
    }

    return value.trim();
  }

  optionalText(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  async createInvitedWorker(input: {
    owner: AppUser;
    name: string;
    email: string;
    phoneNumber?: string;
    address?: string;
  }): Promise<AppUser> {
    this.requireRole(input.owner, ['OWNER']);

    const business = await this.dependencies.businessRepository.findByOwnerId(input.owner.id);

    if (!business) {
      throw new AppError('Create your business account before adding workers.', HttpStatus.BAD_REQUEST);
    }

    const email = input.email.toLowerCase();
    const existingUser = await this.dependencies.userRepository.findByEmail(email);

    if (existingUser) {
      throw new AppError('A user with this email already exists.', HttpStatus.CONFLICT);
    }

    return this.dependencies.userRepository.createInactiveWorker({
      businessId: business.id,
      name: input.name,
      email,
      phoneNumber: input.phoneNumber,
      address: input.address,
    });
  }

  async onboardOwner(input: CreateOwnerBusinessInput): Promise<{ user: AppUser; business: BusinessRecord }> {
    if (input.user.role === 'WORKER') {
      throw new AppError('Worker accounts cannot create businesses.', HttpStatus.FORBIDDEN);
    }

    const existingBusiness = await this.dependencies.businessRepository.findByOwnerId(input.user.id);

    if (existingBusiness) {
      throw new AppError('This owner already has a business account.', HttpStatus.CONFLICT);
    }

    return this.dependencies.businessRepository.createOwnerBusiness(input);
  }

  async onboardCustomer(input: {
    user: AppUser;
    phoneNumber: string;
    address: string;
    businessId?: string;
  }): Promise<AppUser> {
    if (input.user.role !== 'CUSTOMER') {
      throw new AppError('Only customer accounts can use customer onboarding.', HttpStatus.FORBIDDEN);
    }

    const businessId = input.businessId ?? input.user.businessId ?? (await this.dependencies.businessRepository.findFirst())?.id;
    if (!businessId) throw new AppError('No business account is available for customer onboarding.', HttpStatus.BAD_REQUEST);
    return this.dependencies.userRepository.updateCustomerProfile({
      userId: input.user.id,
      phoneNumber: input.phoneNumber,
      address: input.address,
      businessId,
    });
  }

  private isOnboardingComplete(user: AppUser): boolean {
    if (user.role === 'OWNER') {
      return Boolean(user.businessId && user.phoneNumber && user.address);
    }

    if (user.role === 'CUSTOMER') {
      return Boolean(user.businessId && user.phoneNumber && user.address);
    }

    return user.isActive;
  }

  private async activateWorkerAfterGoogleLogin(user: AppUser): Promise<AppUser> {
    if (user.role !== 'WORKER' || user.isActive) {
      return user;
    }

    const hasGoogleAccount = await this.dependencies.accountRepository.hasGoogleAccount(user.id);

    if (!hasGoogleAccount) {
      return user;
    }

    return this.dependencies.userRepository.activateWorker(user.id);
  }
}

export const authService = new AuthService({
  userRepository,
  businessRepository,
  accountRepository,
});
