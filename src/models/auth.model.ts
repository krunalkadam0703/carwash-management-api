export type AppRole = 'OWNER' | 'WORKER' | 'CUSTOMER';

export type AppUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role: AppRole;
  businessId?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  isActive: boolean;
};

export type BusinessRecord = {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
};

export type AuthenticatedUser = AppUser & {
  onboardingComplete: boolean;
};
