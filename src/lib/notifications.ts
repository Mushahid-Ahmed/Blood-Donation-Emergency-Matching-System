import { prisma } from './prisma';
import { NotificationType } from '@prisma/client';

/**
 * Notification Service
 * 
 * Replaces actual SMS/Push service for MVP via a database table.
 */

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  referenceId?: string
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      body,
      referenceId,
    },
  });
}

export async function getUnreadNotifications(userId: string) {
  return prisma.notification.findMany({
    where: {
      userId,
      isRead: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function markAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });
}

export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
