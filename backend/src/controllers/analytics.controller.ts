import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@/utils/asyncWrapper';
import { Database } from '@/config/database';

export class AnalyticsController {
  static getDashboardStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const prisma = Database.getInstance().client;

    // Date ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    // 1. Current Period Stats (Last 30 days)
    const [
      totalForms,
      activeForms,
      totalSubmissions,
      pendingApprovals,
      approvedSubmissions,
      rejectedSubmissions,
      activeWorkflows
    ] = await Promise.all([
      prisma.form.count(),
      prisma.form.count({ where: { isActive: true } }),
      prisma.submission.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.submission.count({ where: { status: 'submitted' } }), // Current pending is snapshot
      prisma.submission.count({ where: { status: 'approved', createdAt: { gte: thirtyDaysAgo } } }),
      prisma.submission.count({ where: { status: 'rejected', createdAt: { gte: thirtyDaysAgo } } }),
      prisma.workflow.count({ where: { isActive: true } })
    ]);

    // 2. Previous Period Stats (30-60 days ago)
    const [
      prevSubmissions,
      prevApproved,
      prevRejected
    ] = await Promise.all([
      prisma.submission.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      prisma.submission.count({ where: { status: 'approved', createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
      prisma.submission.count({ where: { status: 'rejected', createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } })
    ]);

    // Trend Calculations
    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const submissionTrend = calculateTrend(totalSubmissions, prevSubmissions);

    const totalDecided = approvedSubmissions + rejectedSubmissions;
    const approvalRate = totalDecided > 0 ? Math.round((approvedSubmissions / totalDecided) * 100) : 0;

    const prevTotalDecided = prevApproved + prevRejected;
    const prevApprovalRate = prevTotalDecided > 0 ? Math.round((prevApproved / prevTotalDecided) * 100) : 0;
    const approvalRateTrend = approvalRate - prevApprovalRate; // Absolute percentage point difference

    // 3. Workflow Performance (Monthly Trend)
    const monthlyPerformance = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        DATE_TRUNC('month', created_at) as date,
        COUNT(CASE WHEN status = 'approved' THEN 1 END)::int as approved,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END)::int as rejected,
        COUNT(CASE WHEN status = 'submitted' THEN 1 END)::int as pending
      FROM submissions
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'Mon'), DATE_TRUNC('month', created_at)
      ORDER BY date ASC
    `;

    // 4. Form Usage (Top 5)
    const formUsage = await prisma.form.findMany({
      select: {
        name: true,
        _count: {
          select: { submissions: true }
        }
      },
      take: 5,
      orderBy: {
        submissions: {
          _count: 'desc'
        }
      }
    });

    // 5. Approval Time Trend (Weekly Average)
    const approvalTimeData = await prisma.$queryRaw`
      SELECT 
        'W' || EXTRACT(WEEK FROM submitted_at) as week,
        MIN(submitted_at) as week_start,
        AVG(EXTRACT(EPOCH FROM (updated_at - submitted_at))/86400)::numeric(10,1) as time
      FROM submissions
      WHERE 
        status IN ('approved', 'rejected') 
        AND submitted_at IS NOT NULL
        AND submitted_at >= NOW() - INTERVAL '8 weeks'
      GROUP BY EXTRACT(WEEK FROM submitted_at)
      ORDER BY week_start ASC
    `;

    res.status(200).json({
      status: 'success',
      data: {
        stats: {
          totalForms,
          activeForms,
          activeWorkflows,
          totalSubmissions, // Current period (last 30 days)
          pendingApprovals,
          approvalRate: `${approvalRate}%`,
          avgApprovalTime: '2.4 days', // Still placeholder as complex logic needed
          trends: {
            submissions: submissionTrend > 0 ? `+${submissionTrend}%` : `${submissionTrend}%`,
            approvalRate: approvalRateTrend > 0 ? `+${approvalRateTrend}%` : `${approvalRateTrend}%`,
            avgTime: '-0.5 days' // Placeholder
          }
        },
        workflowPerformance: monthlyPerformance,
        formUsage: formUsage.map((f: { name: string; _count: { submissions: number } }) => ({
          name: f.name,
          submissions: f._count.submissions,
          fill: `hsl(var(--primary))`
        })),
        approvalTimeData: approvalTimeData
      }
    });
  });
}

