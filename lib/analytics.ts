import prisma from "./prisma";

export interface EventData {
  name: string;
  tenantId: string;
  userId?: string;
  properties?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface CampaignAnalyticsData {
  tenantId: string;
  campaignId: string;
  campaignName?: string;
  totalSent?: number;
  totalDelivered?: number;
  totalOpened?: number;
  totalClicked?: number;
  totalFailed?: number;
}

export interface UsageData {
  tenantId: string;
  period: string; // YYYY-MM format
  contactsCount?: number;
  messagesCount?: number;
  groupsCount?: number;
  imagesCount?: number;
  usersCount?: number;
  apiRequests?: number;
  storageUsed?: bigint;
}

/**
 * Track custom events for analytics
 */
export async function trackEvent(eventData: EventData): Promise<void> {
  try {
    await prisma.event.create({
      data: {
        name: eventData.name,
        tenantId: eventData.tenantId,
        userId: eventData.userId,
        properties: eventData.properties || {},
        metadata: eventData.metadata || {},
      },
    });
  } catch (error) {
    console.error('Erro ao registrar evento:', error);
  }
}

/**
 * Update campaign analytics
 */
export async function updateCampaignAnalytics(data: CampaignAnalyticsData): Promise<void> {
  try {
    const period = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const deliveryRate = data.totalSent && data.totalDelivered 
      ? (data.totalDelivered / data.totalSent) * 100 
      : 0;
    
    const openRate = data.totalDelivered && data.totalOpened
      ? (data.totalOpened / data.totalDelivered) * 100
      : 0;
    
    const clickRate = data.totalOpened && data.totalClicked
      ? (data.totalClicked / data.totalOpened) * 100
      : 0;

    await prisma.campaignAnalytics.upsert({
      where: {
        tenantId_campaignId_period: {
          tenantId: data.tenantId,
          campaignId: data.campaignId,
          period,
        },
      },
      update: {
        campaignName: data.campaignName,
        totalSent: data.totalSent || 0,
        totalDelivered: data.totalDelivered || 0,
        totalOpened: data.totalOpened || 0,
        totalClicked: data.totalClicked || 0,
        totalFailed: data.totalFailed || 0,
        deliveryRate,
        openRate,
        clickRate,
      },
      create: {
        tenantId: data.tenantId,
        campaignId: data.campaignId,
        campaignName: data.campaignName,
        period,
        totalSent: data.totalSent || 0,
        totalDelivered: data.totalDelivered || 0,
        totalOpened: data.totalOpened || 0,
        totalClicked: data.totalClicked || 0,
        totalFailed: data.totalFailed || 0,
        deliveryRate,
        openRate,
        clickRate,
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar analytics da campanha:', error);
  }
}

/**
 * Update usage metrics for a tenant
 */
export async function updateUsageMetrics(data: UsageData): Promise<void> {
  try {
    await prisma.usageMetrics.upsert({
      where: {
        tenantId_period: {
          tenantId: data.tenantId,
          period: data.period,
        },
      },
      update: {
        contactsCount: data.contactsCount,
        messagesCount: data.messagesCount,
        groupsCount: data.groupsCount,
        imagesCount: data.imagesCount,
        usersCount: data.usersCount,
        apiRequests: data.apiRequests,
        storageUsed: data.storageUsed,
      },
      create: {
        tenantId: data.tenantId,
        period: data.period,
        contactsCount: data.contactsCount || 0,
        messagesCount: data.messagesCount || 0,
        groupsCount: data.groupsCount || 0,
        imagesCount: data.imagesCount || 0,
        usersCount: data.usersCount || 0,
        apiRequests: data.apiRequests || 0,
        storageUsed: data.storageUsed || BigInt(0),
      },
    });
  } catch (error) {
    console.error('Erro ao atualizar métricas de uso:', error);
  }
}

/**
 * Get events for a tenant with filters
 */
export async function getEvents(
  tenantId: string,
  options: {
    eventName?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}
) {
  const where: any = { tenantId };

  if (options.eventName) {
    where.name = options.eventName;
  }

  if (options.userId) {
    where.userId = options.userId;
  }

  if (options.startDate || options.endDate) {
    where.createdAt = {};
    if (options.startDate) {
      where.createdAt.gte = options.startDate;
    }
    if (options.endDate) {
      where.createdAt.lte = options.endDate;
    }
  }

  return prisma.event.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options.limit || 100,
    skip: options.offset || 0,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Get campaign analytics for a tenant
 */
export async function getCampaignAnalytics(
  tenantId: string,
  options: {
    campaignId?: string;
    startDate?: string;
    endDate?: string;
  } = {}
) {
  const where: any = { tenantId };

  if (options.campaignId) {
    where.campaignId = options.campaignId;
  }

  if (options.startDate || options.endDate) {
    where.period = {};
    if (options.startDate) {
      where.period.gte = options.startDate;
    }
    if (options.endDate) {
      where.period.lte = options.endDate;
    }
  }

  return prisma.campaignAnalytics.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get usage metrics for a tenant
 */
export async function getUsageMetrics(
  tenantId: string,
  options: {
    startPeriod?: string;
    endPeriod?: string;
  } = {}
) {
  const where: any = { tenantId };

  if (options.startPeriod || options.endPeriod) {
    where.period = {};
    if (options.startPeriod) {
      where.period.gte = options.startPeriod;
    }
    if (options.endPeriod) {
      where.period.lte = options.endPeriod;
    }
  }

  return prisma.usageMetrics.findMany({
    where,
    orderBy: { period: 'desc' },
  });
}

/**
 * Get analytics summary for dashboard
 */
export async function getAnalyticsSummary(tenantId: string) {
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
  const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalEvents,
    recentEvents,
    currentUsage,
    campaignStats
  ] = await Promise.all([
    // Total events count
    prisma.event.count({
      where: { tenantId },
    }),

    // Recent events (last 30 days)
    prisma.event.count({
      where: {
        tenantId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    }),

    // Current month usage
    prisma.usageMetrics.findFirst({
      where: {
        tenantId,
        period: currentMonth,
      },
    }),

    // Campaign stats for today
    prisma.campaignAnalytics.aggregate({
      where: {
        tenantId,
        period: currentDate,
      },
      _sum: {
        totalSent: true,
        totalDelivered: true,
        totalOpened: true,
        totalClicked: true,
        totalFailed: true,
      },
      _avg: {
        deliveryRate: true,
        openRate: true,
        clickRate: true,
      },
    }),
  ]);

  return {
    events: {
      total: totalEvents,
      recent: recentEvents,
    },
    usage: currentUsage || {
      contactsCount: 0,
      messagesCount: 0,
      groupsCount: 0,
      imagesCount: 0,
      usersCount: 0,
      apiRequests: 0,
      storageUsed: BigInt(0),
    },
    campaigns: {
      totalSent: campaignStats._sum.totalSent || 0,
      totalDelivered: campaignStats._sum.totalDelivered || 0,
      totalOpened: campaignStats._sum.totalOpened || 0,
      totalClicked: campaignStats._sum.totalClicked || 0,
      totalFailed: campaignStats._sum.totalFailed || 0,
      avgDeliveryRate: campaignStats._avg.deliveryRate || 0,
      avgOpenRate: campaignStats._avg.openRate || 0,
      avgClickRate: campaignStats._avg.clickRate || 0,
    },
  };
}

/**
 * Common event names for consistency
 */
export const EventNames = {
  // Authentication
  USER_REGISTERED: 'user_registered',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  
  // Contacts
  CONTACT_CREATED: 'contact_created',
  CONTACT_UPDATED: 'contact_updated',
  CONTACT_DELETED: 'contact_deleted',
  CONTACTS_IMPORTED: 'contacts_imported',
  
  // Groups
  GROUP_CREATED: 'group_created',
  GROUP_UPDATED: 'group_updated',
  GROUP_DELETED: 'group_deleted',
  
  // Messages
  MESSAGE_SENT: 'message_sent',
  MESSAGE_DELIVERED: 'message_delivered',
  MESSAGE_OPENED: 'message_opened',
  MESSAGE_CLICKED: 'message_clicked',
  MESSAGE_FAILED: 'message_failed',
  
  // Images
  IMAGE_UPLOADED: 'image_uploaded',
  IMAGE_DELETED: 'image_deleted',
  
  // Subscriptions
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_DOWNGRADED: 'subscription_downgraded',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  
  // Features
  FEATURE_USED: 'feature_used',
  PAGE_VIEW: 'page_view',
  BUTTON_CLICKED: 'button_clicked',
} as const;
