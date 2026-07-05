import type { OwnerReportSummary, ReportRange } from '../../models/report.model.js';
import { reportPersistentStorageRepository } from './persistent-storage.js';

export class ReportRepository {
  ownerSummary(businessId: string, range: ReportRange): Promise<OwnerReportSummary> {
    return reportPersistentStorageRepository.ownerSummary(businessId, range);
  }
}

export const reportRepository = new ReportRepository();
