import { HttpStatus } from '../constants/http.js';
import { AppError } from './app-error.js';

export type PaginationInput = {
  page: number;
  pageSize: number;
  search?: string;
  status?: string;
  method?: string;
  assignment?: string;
  vehicleTypeId?: string;
  activeOnly?: string;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PaginatedResult<T> = {
  items: T[];
  pagination: PaginationMeta;
};

export function parsePagination(query: Record<string, unknown>): PaginationInput | undefined {
  if (query.page === undefined && query.pageSize === undefined) return undefined;
  const page = numberParam(query.page, 'page', 1, 1, 10_000);
  const pageSize = numberParam(query.pageSize, 'pageSize', 10, 1, 100);
  return {
    page,
    pageSize,
    search: textParam(query.search),
    status: textParam(query.status),
    method: textParam(query.method),
    assignment: textParam(query.assignment),
    vehicleTypeId: textParam(query.vehicleTypeId),
    activeOnly: textParam(query.activeOnly),
  };
}

export function paginated<T>(
  items: T[],
  total: number,
  input: PaginationInput,
): PaginatedResult<T> {
  return {
    items,
    pagination: {
      page: input.page,
      pageSize: input.pageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / input.pageSize)),
    },
  };
}

export function skip(input: PaginationInput): number {
  return (input.page - 1) * input.pageSize;
}

function textParam(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function numberParam(
  value: unknown,
  field: string,
  fallback: number,
  min: number,
  max: number,
): number {
  const parsed = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max)
    throw new AppError(`${field} must be between ${min} and ${max}.`, HttpStatus.BAD_REQUEST);
  return parsed;
}
