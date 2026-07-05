import { HttpStatus } from '../constants/http.js';
import type { AppUser } from '../models/auth.model.js';
import type { OwnerReportSummary, ReportRange } from '../models/report.model.js';
import { reportRepository } from '../repositories/report/index.js';
import { AppError } from '../utils/app-error.js';

export class ReportService {
  ownerSummary(user: AppUser, range: ReportRange): Promise<OwnerReportSummary> {
    if (user.role !== 'OWNER') throw new AppError('Only owners can view reports.', HttpStatus.FORBIDDEN);
    return reportRepository.ownerSummary(this.requireBusinessId(user), range);
  }

  range(fromValue: unknown, toValue: unknown): ReportRange {
    const to = this.date(toValue, new Date());
    const from = this.date(fromValue, this.daysAgo(30));
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    if (from > to) throw new AppError('from must be before to.', HttpStatus.BAD_REQUEST);
    return { from, to };
  }

  private date(value: unknown, fallback: Date): Date {
    if (typeof value !== 'string' || !value.trim()) return fallback;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) throw new AppError('date range is invalid.', HttpStatus.BAD_REQUEST);
    return parsed;
  }

  private daysAgo(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
  }

  private requireBusinessId(user: AppUser): string {
    if (!user.businessId) throw new AppError('Business account is required.', HttpStatus.BAD_REQUEST);
    return user.businessId;
  }
}

export const reportService = new ReportService();
