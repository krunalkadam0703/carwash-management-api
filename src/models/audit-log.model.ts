export type AuditLogRecord = {
  id: string;
  businessId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldData?: unknown;
  newData?: unknown;
  createdAt: Date;
};

export type CreateAuditLogInput = {
  businessId?: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldData?: unknown;
  newData?: unknown;
};
