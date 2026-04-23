import { prisma } from "../db";

export class NotificationService {
  /**
   * Mocks sending a push notification and persists an alert record in the database.
   */
  static async sendNotification(userId: number, title: string, message: string, type: 'LOW_STOCK' | 'VACCINATION' | 'HEALTH') {
    try {
      // 1. Mock Push Notification (Logging to console for prototype demonstration)
      console.log(`[PUSH NOTIFICATION] To User ${userId}: ${title} - ${message}`);

      // 2. Persist Alert Record in Database (as claimed in Chapter 8)
      await prisma.alert.create({
        data: {
          userId,
          title,
          message,
          type,
          status: 'UNREAD'
        }
      });
      
      return true;
    } catch (err) {
      console.error('Failed to send notification:', err);
      return false;
    }
  }

  /**
   * Mock OTP Service (as claimed in User Manual)
   */
  static async sendOTP(mobileNumber: string, otp: string) {
    console.log(`[OTP SERVICE] Sent OTP ${otp} to ${mobileNumber}`);
    return true;
  }
}
