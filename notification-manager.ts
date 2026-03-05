// notification-manager.ts

export interface NotificationPayload {
  to: string; // Email or Phone
  subject?: string;
  body: string;
}

export class NotificationManager {
  
  /**
   * 1. SEND BOOKING CONFIRMATION
   * Triggered when a booking is created.
   */
  async sendBookingConfirmation(
    userEmail: string, 
    businessEmail: string, 
    bookingDetails: { date: string, time: string, serviceName: string }
  ): Promise<void> {
    
    // A. Notify User
    await this.sendEmail({
      to: userEmail,
      subject: "Booking Confirmed! ✅",
      body: `Hi there! Your appointment for ${bookingDetails.serviceName} is confirmed for ${bookingDetails.date} at ${bookingDetails.time}.`
    });

    // B. Notify Business
    await this.sendEmail({
      to: businessEmail,
      subject: "New Booking 📅",
      body: `You have a new booking: ${bookingDetails.serviceName} on ${bookingDetails.date} at ${bookingDetails.time}.`
    });
  }

  /**
   * 2. SEND REMINDER
   * Triggered by a cron job 24h before the appointment.
   */
  async sendReminder(userEmail: string, bookingDetails: any): Promise<void> {
    await this.sendEmail({
      to: userEmail,
      subject: "Reminder: Appointment Tomorrow ⏰",
      body: `Don't forget your appointment for ${bookingDetails.serviceName} tomorrow at ${bookingDetails.time}.`
    });
  }

  /**
   * 3. SEND CANCELLATION NOTICE
   */
  async sendCancellation(
    toEmail: string, 
    isBusiness: boolean, 
    details: { serviceName: string, date: string }
  ): Promise<void> {
    const subject = isBusiness ? "Booking Cancelled by User ❌" : "Appointment Cancelled ❌";
    const body = `The booking for ${details.serviceName} on ${details.date} has been cancelled.`;
    
    await this.sendEmail({ to: toEmail, subject, body });
  }

  /**
   * CORE SENDER (Mock implementation)
   * Replace this with Resend/SendGrid/Twilio logic.
   */
  private async sendEmail(payload: NotificationPayload): Promise<void> {
    console.log(`[EMAIL SENT] To: ${payload.to} | Subject: ${payload.subject}`);
    
    // Example Integration (Resend):
    // await resend.emails.send({
    //   from: 'onboarding@resend.dev',
    //   to: payload.to,
    //   subject: payload.subject,
    //   html: `<p>${payload.body}</p>`
    // });
  }

  private async sendSMS(payload: NotificationPayload): Promise<void> {
    console.log(`[SMS SENT] To: ${payload.to} | Body: ${payload.body}`);
    // Example Integration (Twilio):
    // await twilioClient.messages.create({ ... });
  }
}
