const invoiceStyle = () => {
    return `
        @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,200..900;1,200..900&display=swap');

        @page {
            size: A4;
            margin: 0;
        }

        * {
            box-sizing: border-box;
            padding: 0;
            margin: 0;
        }

        body {
            font-family: 'Crimson Pro', serif;
            color: #000;
            background-color: #fff;
            margin: 0;
            padding: 0;
            font-size: 14px;
            line-height: 1.5;
        }

        .invoice-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 80px;
            /* justify-content: space-evenly; */
            position: relative;
            display: flex;
            flex-direction: column;
        }

        .watermark {
            position: absolute;
            max-width: 550px;
            top: 50%;
            left: 50%;
            z-index: 10;
            transform: translate(-50%, -50%);
            opacity: 0.2;
        }

        header {
            position: relative;
            z-index: 100;
        }

        nav {
            display: flex;
            justify-content: space-between;
        }

        nav .brand-name {
            font-size: 38px;
            font-weight: 700;
            font-family: 'Bodoni Moda', serif;
            letter-spacing: 0px;
            margin: 0;
            line-height: 1.2;
        }

        nav .tagline {
            font-size: 15px;
            text-transform: uppercase;
            margin-top: 2px;
            margin-bottom: 20px;
        }

        nav .invoice-title {
            align-self: center;
        }

        nav .invoice-title h2 {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: 1.4;
            text-align: end;
        }

        nav .invoice-title p {
            font-size: 12px;
            font-weight: 400;
            text-align: end;
            line-height: 1.6;
        }

        .invoice-details {
            display: flex;
            justify-content: space-between;
            margin: 4rem auto;
        }

        .invoice-details h3 {
            font-size: 14px;
            margin-bottom: 2px;
            font-weight: 700;
        }

        .invoice-info p,
        .biller-info p {
            font-size: 12px !important;
        }

        .invoice-details .biller-info {
            line-height: 1.2;
        }

        .invoice-details .invoice-info {
            text-align: end;
            line-height: 1.2;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            z-index: 100;
            position: relative;
        }

        th {
            font-size: 12px;
            text-transform: uppercase;
            text-align: left;
            padding: 12px;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
        }

        td {
            padding: 12px;
            font-size: 12px;
            border-bottom: 1px solid #000;
            border-right: 1px solid #000;
            color: #000;
        }

        td:last-child {
            border-right: none;
        }

        th.center-align,
        td.center-align {
            text-align: center;
        }

        .total-row td {
            font-weight: 700;
            font-size: 12px;
            border-right: 0;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            color: #000;
        }

        .last-row td {
            font-weight: 700;
            font-size: 12px;
            border-right: 0;
            color: #000;
            border-bottom: 1px solid #000;
        }

        .last-row td:last-child {
            text-align: end;
            color: #000;
        }

        i.note {
            font-size: 12px;
            padding-left: 12px;
        }

        /* Footer */
        .invoice-footer {
            display: flex;
            justify-content: space-between;
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            font-size: 12px;
        }

        .left-footer {
            max-width: 250px;
            text-align: left;
        }

        .right-footer {
            line-height: 1.1;
            align-self: flex-end;
            text-align: end;
        }

        @media print {
            html,
            body {
                margin: 0;
                padding: 0;
                width: 210mm;
                height: 297mm;
            }

            body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }

            .invoice-container {
                width: 210mm;
                min-height: 297mm;
                margin: 0;
                page-break-after: avoid;
                break-after: avoid;
            }
        }

        .pe-40{
            padding-right: 35px !important;
        }

        .pe-25{
            padding-right: 27px !important;
        }
    `;
}

export default invoiceStyle;