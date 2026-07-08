export default class NotificationStyles {
  contactStyle = () => {
    return `body,
            html {
                margin: 0;
                padding: 0;
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background-color: #000000;
                color: #ededed;
                -webkit-font-smoothing: antialiased;
                -moz-osx-font-smoothing: grayscale;
            }

            /* Container */
            .email-wrapper {
                padding: 40px 20px;
                background-color: #000000;
            }

            .email-container {
                max-width: 520px;
                margin: 0 auto;
                background: #0a0a0a;
                border-radius: 8px;
                border: 1px solid #27272a;
                overflow: hidden;
            }

            /* Header */
            .header {
                padding: 32px 32px 24px 32px;
                border-bottom: 1px solid #27272a;
            }

            .logo {
                font-size: 20px;
                font-weight: 600;
                color: #ffffff;
                text-decoration: none;
                display: inline-block;
                letter-spacing: -0.5px;
            }

            .logo span {
                color: #7155f9;
            }

            .tagline {
                font-size: 13px;
                color: #a1a1aa;
                margin-top: 6px;
            }

            /* Content */
            .content {
                padding: 32px;
                line-height: 1.6;
            }

            h1 {
                color: #ffffff;
                font-size: 18px;
                margin-top: 0;
                margin-bottom: 16px;
                font-weight: 600;
                letter-spacing: -0.3px;
            }

            p {
                margin-bottom: 20px;
                font-size: 14px;
                color: #a1a1aa;
                margin-top: 0;
            }

            .highlight {
                color: #ffffff;
                font-weight: 500;
            }

            /* Message Card - Minimalist Inset */
            .message-card {
                background: #111111;
                border-radius: 6px;
                padding: 24px;
                margin: 28px 0;
                border: 1px solid #27272a;
            }

            .message-field {
                margin-bottom: 20px;
            }

            .message-field:last-child {
                margin-bottom: 0;
            }

            .message-label {
                font-size: 12px;
                color: #71717a;
                margin-bottom: 6px;
                display: block;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 500;
            }

            .message-value {
                font-size: 14px;
                color: #ededed;
                word-break: break-word;
                line-height: 1.5;
            }

            /* Response Time Banner */
            .response-time {
                background: rgba(113, 85, 249, 0.08);
                border-left: 3px solid #7155f9;
                padding: 12px 16px;
                border-radius: 4px;
                margin: 24px 0 32px 0;
                font-size: 13px;
                color: #d4d4d8;
            }

            .response-time strong {
                color: #7155f9;
                font-weight: 500;
            }

            /* Button */
            .button-container {
                margin: 0 0 32px 0;
            }

            .button {
                display: inline-block;
                padding: 10px 18px;
                background: #ffffff;
                color: #000000 !important;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 500;
                font-size: 14px;
                transition: background 0.2s ease;
            }

            .button:hover {
                background: #e4e4e7;
            }

            /* Footer */
            .footer {
                padding: 24px 32px;
                border-top: 1px solid #27272a;
                font-size: 12px;
                color: #71717a;
                background: #0a0a0a;
            }

            .footer a {
                color: #a1a1aa !important;
                text-decoration: none;
                transition: color 0.2s ease;
            }

            .footer a:hover {
                color: #ededed !important;
            }

            .footer-bottom {
                margin-top: 16px;
                font-size: 12px;
                color: #52525b;
            }

            /* Responsive */
            @media screen and (max-width: 480px) {
                .email-wrapper {
                    padding: 16px;
                }
                .header,
                .content,
                .footer {
                    padding: 24px;
                }
                .message-card {
                    padding: 20px;
                }
            }`;
  };
}
