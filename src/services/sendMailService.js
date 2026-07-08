import nodemailer from 'nodemailer';

import configuration from '../config/config.js';
import NotificationTemplate from '../templates/NotificationTemplate.js';

const template = new NotificationTemplate();

export default class SendEmailService {
  // Common mail sender
  mailSender = async (email, title, body) => {
    try {
      const transporter = nodemailer.createTransport({
        service: configuration.MAIL_SERVICE,
        auth: {
          user: configuration.MAIL_USER,
          pass: configuration.MAIL_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: 'Admin - Tracker79',
        to: email,
        subject: title,
        html: body,
      });

      return info;
    } catch (error) {
      return error;
    }
  };

  contactMailer = async (name, email, message, isSubscribed, msgId) => {
    try {
      const mailResponse1 = await this.mailSender(
        email,
        'Contact Request Received',
        template.contactTemplate(name, email, message, isSubscribed)
      );

      const admins = await user
        .find({
          isDeleted: false,
          $or: [{ isSuperAdmin: true }, { role: 'admin' }],
        })
        .select('email');

      const adminEmails = admins.map((admin) => admin.email);

      const mailResponse2 = await this.mailSender(
        adminEmails,
        'New Contact Request',
        template.adminContactTemplate(name, email, msgId)
      );

      if (mailResponse1 instanceof Error) {
        throw mailResponse1;
      }
      if (mailResponse2 instanceof Error) {
        throw mailResponse2;
      }
    } catch (error) {
      throw error;
    }
  };
}
