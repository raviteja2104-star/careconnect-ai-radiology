// @careconnect/database — Repository Pattern & Prisma Utilities

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginationInput {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function buildPaginationArgs(input: PaginationInput) {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
    ...(input.sortBy ? {
      orderBy: { [input.sortBy]: input.sortOrder ?? 'asc' },
    } : {}),
  };
}

export function buildPaginatedResult<T>(data: T[], total: number, input: PaginationInput): PaginatedResult<T> {
  const pageSize = Math.min(100, Math.max(1, input.pageSize ?? 20));
  return {
    data,
    total,
    page: Math.max(1, input.page ?? 1),
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ─── Soft Delete Helpers ──────────────────────────────────────────────────────
export interface SoftDeletable {
  deletedAt: Date | null;
  deletedById?: string | null;
}

export const softDeleteWhere = { deletedAt: null };

export function softDeleteData(deletedById?: string): SoftDeletable {
  return { deletedAt: new Date(), deletedById };
}

// ─── Audit Helpers ────────────────────────────────────────────────────────────
export interface Auditable {
  createdAt: Date;
  updatedAt: Date;
  createdById?: string;
  updatedById?: string;
}

export function auditCreate(userId?: string): Pick<Auditable, 'createdById' | 'updatedById'> {
  return { createdById: userId, updatedById: userId };
}

export function auditUpdate(userId?: string): Pick<Auditable, 'updatedById'> {
  return { updatedById: userId };
}

// ─── MRN Generator ───────────────────────────────────────────────────────────
export function generateMRN(prefix = 'MRN', padLength = 8): string {
  const seq = Date.now().toString().slice(-padLength).padStart(padLength, '0');
  return `${prefix}-${new Date().getFullYear()}-${seq}`;
}

// ─── Query Utilities ──────────────────────────────────────────────────────────
export function searchFilter(field: string, search?: string) {
  if (!search) return {};
  return {
    [field]: { contains: search, mode: 'insensitive' },
  };
}

export function dateRangeFilter(field: string, from?: string, to?: string) {
  if (!from && !to) return {};
  const filter: Record<string, Date> = {};
  if (from) filter.gte = new Date(from);
  if (to) filter.lte = new Date(to);
  return { [field]: filter };
}

// ─── Repository Base Interface ────────────────────────────────────────────────
export interface IRepository<T, CreateDto, UpdateDto, Filters = Record<string, unknown>> {
  findById(id: string): Promise<T | null>;
  findMany(filters: Filters, pagination: PaginationInput): Promise<PaginatedResult<T>>;
  create(data: CreateDto, createdById?: string): Promise<T>;
  update(id: string, data: UpdateDto, updatedById?: string): Promise<T>;
  delete(id: string, deletedById?: string): Promise<void>;
  softDelete(id: string, deletedById?: string): Promise<T>;
  count(filters: Filters): Promise<number>;
  exists(id: string): Promise<boolean>;
}

// ─── Transaction Helper (Prisma-specific types) ───────────────────────────────
export type TransactionFn<T> = (tx: unknown) => Promise<T>;

// ─── Seed Utilities ───────────────────────────────────────────────────────────
export interface SeedConfig {
  environment: 'development' | 'staging' | 'production';
  truncate: boolean;
}

// ─── Error Types ──────────────────────────────────────────────────────────────
export class RecordNotFoundError extends Error {
  constructor(public readonly entity: string, public readonly id: string) {
    super(`${entity} with id '${id}' not found`);
    this.name = 'RecordNotFoundError';
  }
}

export class UniqueConstraintError extends Error {
  constructor(public readonly field: string, public readonly value: string) {
    super(`A record with ${field}='${value}' already exists`);
    this.name = 'UniqueConstraintError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'DatabaseError';
  }
}
