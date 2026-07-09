import NotificationStyles from '../styles/NotificationStyles.js';
import configuration from '../config/config.js';

const style = new NotificationStyles();

export default class NotificationTemplate {
  contactTemplate = (name, email, message, userType = 'user') => {
    return `<!DOCTYPE html>
            <html lang="en">

                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
                    <title>Spend Server - Message Received</title>
                    <link rel="icon" href="{% static 'Images/icon.png' %}" type="image/x-icon">
                    <!-- Clean, modern system fonts similar to Vercel/Figma -->
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
                    
                    <style type="text/css">
                        ${style.contactStyle()}
                    </style>
                </head>

                <body>
                    <div class="email-wrapper">
                        <div class="email-container">
                            <!-- Header -->
                            <div class="header">
                                <a href="#" class="logo">Spend<span>Server</span></a>
                                <div class="tagline">We've received your message</div>
                            </div>

                            <!-- Content -->
                            <div class="content">
                                <h1>${userType === 'admin' ? 'New Contact Form Submitted' : 'Thank You for Contacting Us'}</h1>

                                <p>Dear <span class="highlight">${userType === 'admin' ? 'Admin' : name}</span>,</p>

                                <p>${userType === 'admin' ? 'A new contact form has been submitted and below are the details.' : "We've successfully received your message and our team will get back to you as soon as possible. Below is a copy of what you submitted:"}</p>

                                <!-- Message Details -->
                                <div class="message-card">
                                    <div class="message-field">
                                        <span class="message-label">${userType === 'admin' ? 'Submitted By' : 'Your Name'}</span>
                                        <div class="message-value">${name}</div>
                                    </div>

                                    <div class="message-field">
                                        <span class="message-label">${userType === 'admin' ? 'Submitted Email' : 'Your Email'}</span>
                                        <div class="message-value">${email}</div>
                                    </div>

                                    <div class="message-field">
                                        <span class="message-label">${userType === 'admin' ? 'Submitted Message' : 'Your Message'}</span>
                                        <div class="message-value">${message}</div>
                                    </div>
                                </div>

                                <!-- Info Banner -->
                                <div class="response-time">
                                    ${userType === 'admin' ? 'Please review the message and respond accordingly.' : 'Our typical response time is <strong>24-48 hours</strong> during business days.'}
                                </div>

                                <!-- Action Button -->
                                <div class="button-container">
                                    <a href="${configuration.FRONTEND_URL}" class="button">Go to SpendServer</a>
                                </div>

                                <p>We appreciate you reaching out to <span class="highlight">Spend Server</span> and look forward to assisting you.</p>

                                <p style="margin-bottom: 0;">Best regards,<br>The Spend Server Team</p>
                            </div>

                            <!-- Footer -->
                            <div class="footer">
                                <div class="contact">
                                    Email: <a href="mailto:spendserver@gmail.com">spendserver@gmail.com</a>
                                </div>
                                <div class="footer-bottom">
                                    &copy; 2025 Spend Server. All rights reserved.
                                </div>
                            </div>
                        </div>
                    </div>
                </body>
            </html>`;
  };

  otpTemplate = (otp) => {
    return ``;
  };
}
