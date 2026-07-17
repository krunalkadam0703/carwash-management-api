import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';

import { prisma } from '../infrastructure/prisma/prisma.client.js';

const trustedOrigins = process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === 'production';
const sameSiteOptions = ['lax', 'strict', 'none'] as const;
type SameSiteOption = (typeof sameSiteOptions)[number];

const configuredSameSite = process.env.COOKIE_SAME_SITE?.toLowerCase();
const cookieSameSite: SameSiteOption = sameSiteOptions.includes(
  configuredSameSite as SameSiteOption,
)
  ? (configuredSameSite as SameSiteOption)
  : isProduction
    ? 'none'
    : 'lax';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: cookieSameSite,
      secure: isProduction,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
      requireLocalEmailVerified: false,
      updateUserInfoOnLink: true,
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    },
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        input: false,
        defaultValue: 'CUSTOMER',
      },
      businessId: {
        type: 'string',
        required: false,
        input: false,
      },
      phoneNumber: {
        type: 'string',
        required: false,
        input: true,
      },
      address: {
        type: 'string',
        required: false,
        input: true,
      },
      isActive: {
        type: 'boolean',
        input: false,
        defaultValue: true,
      },
    },
  },
});
