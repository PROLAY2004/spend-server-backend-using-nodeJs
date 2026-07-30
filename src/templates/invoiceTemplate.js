import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import invoiceStyle from '../styles/invoiceStyle.js';
import formatDate from '../utils/dateFormater.js';

const invoiceTemplate = ({ invoiceDetails, userData, records }) => {
  let totalDue = 0;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const iconPath = path.join(__dirname, '../assets/icon.png');
  const iconBase64 = fs.readFileSync(iconPath, 'base64');
  const imageSrc = `data:image/png;base64,${iconBase64}`;

  const tableRows = records
    .map((record) => {
      if (record.status === 'non-paid') {
        totalDue += record.dueAmount;
      }

      return `
      <tr>
          <td>${formatDate(record.date)}</td>
          <td>${record.category}</td>
          <td class="center-align">₹${record.spendAmount.toFixed(2)}</td>
          <td class="center-align">₹${record.dueAmount.toFixed(2)}</td>
          <td class="center-align text-uppercase">
              ${record.status.toUpperCase()}
          </td>
      </tr>
    `;
    })
    .join('');

  return `
        <!DOCTYPE html>
        <html lang="en">

        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice - Spend Server</title>
            <style>
                ${invoiceStyle()}
            </style>
        </head>

        <body>
            <div class="invoice-container">
                <img src="${imageSrc}" class="watermark" alt="watermark image">

                <header>
                    <nav>
                        <div class="brand">
                            <h1 class="brand-name">SPEND SERVER</h1>
                            <div class="tagline">MANAGE YOUR DAILY EXPENSES</div>
                        </div>

                        <div class="invoice-title">
                            <h2>INVOICE</h2>
                            <p>Date: ${formatDate(invoiceDetails.createdAt)}</p>
                        </div>
                    </nav>


                    <section class="invoice-details">
                        <div class="biller-info">
                            <h3>BILL TO:</h3>
                            <p class="client-name">${invoiceDetails.payerName.toUpperCase()}</p>
                            <p>+91 ${invoiceDetails.payerMobile}</p>
                        </div>

                        <div class="invoice-info">
                            <h3>INVOICE DETAILS</h3>
                            <p>#${invoiceDetails.invoiceName}</p>
                            <p>${userData.email}</p>
                        </div>
                    </section>

                </header>

                <main>
                    <table>
                        <thead>
                            <tr>
                                <th>DATE</th>
                                <th>CATEGORY</th>
                                <th class="center-align">SPEND AMT</th>
                                <th class="center-align">DUE AMT</th>
                                <th class="center-align">STATUS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}

                            <tr class="total-row">
                                <td colspan="4">TOTAL DUE</td>
                                <td colspan="1" class="center-align">₹${totalDue.toFixed(2)}</td>
                            </tr>

                            <tr class="last-row">
                                <td colspan="3">PAYMENT STATUS</td>
                                <td colspan="2"
                                    class="center-align ${
                                    invoiceDetails.status === 'paid'
                                        ? 'pe-40'
                                        : invoiceDetails.status === 'non-paid'
                                        ? 'pe-25'
                                        : ''
                                    }">
                                    ${invoiceDetails.status.toUpperCase()}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <i class="note">This is a System Generated Invoice and No Signeture is Required.</i>
                </main>

                <footer class="invoice-footer">
                    <section class="left-footer">
                        <p>Please email spendserver@gmail.com if you have any questions or concerns regarding your billing.</p>
                        <b>Thank you for your business!</b>
                    </section>

                    <section class="right-footer">
                        <h4>SPEND SERVER</h4>
                        <p>spendserver@gmail.com</p>
                        <p>spendserver.dev</p>
                    </section>
                </footer>
            </div>
        </body>
    </html>
    `;
};

export default invoiceTemplate;
