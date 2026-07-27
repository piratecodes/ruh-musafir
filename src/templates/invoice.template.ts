import * as Handlebars from 'handlebars';

const invoiceHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - Ruh Musafir</title>
  <style>
    /* Reset & Base Styles */
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; 
      color: #2d3748; 
      background-color: #ffffff; 
      line-height: 1.5;
      padding: 40px 50px;
    }

    /* Typography */
    h1, h2, h3, h4 { color: #111827; }
    .text-sm { font-size: 12px; }
    .text-xs { font-size: 10px; }
    .text-muted { color: #6b7280; }
    .font-bold { font-weight: bold; }
    .font-black { font-weight: 900; }
    .uppercase { text-transform: uppercase; letter-spacing: 0.05em; }

    /* Header Section */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 30px;
      margin-bottom: 30px;
    }
    .brand-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .logo {
      height: 60px;
      width: auto;
      object-fit: contain;
      margin-bottom: 10px;
    }
    .brand-info p {
      font-size: 10px;
      color: #4b5563;
      line-height: 1.4;
    }
    
    .invoice-meta {
      text-align: right;
    }
    .invoice-meta h1 {
      font-size: 36px;
      letter-spacing: 0.1em;
      color: #1f2937;
      margin-bottom: 10px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: auto auto;
      gap: 5px 15px;
      text-align: right;
      font-size: 11px;
    }
    .meta-label { color: #9ca3af; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; }
    .meta-value { color: #111827; font-weight: bold; }

    /* Guest & Stay Details */
    .details-container {
      display: flex;
      justify-content: space-between;
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
    }
    .details-box h3 {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #6b7280;
      margin-bottom: 8px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 4px;
    }
    .details-box p {
      font-size: 12px;
      color: #374151;
      margin-bottom: 4px;
    }

    /* Itemized Table */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      background-color: #f3f4f6;
      color: #4b5563;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 12px;
      text-align: left;
      border-top: 1px solid #e5e7eb;
      border-bottom: 2px solid #d1d5db;
    }
    th.center, td.center { text-align: center; }
    th.right, td.right { text-align: right; }
    
    td {
      padding: 14px 12px;
      font-size: 11px;
      color: #374151;
      border-bottom: 1px solid #f3f4f6;
    }
    tr:nth-child(even) td {
      background-color: #fdfdfd;
    }
    .item-desc {
      font-size: 12px;
      font-weight: bold;
      color: #111827;
    }

    /* Financial Summary */
    .summary-container {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 40px;
    }
    .summary-box {
      width: 45%;
      background-color: #ffffff;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 12px;
      color: #4b5563;
    }
    .summary-row.total {
      border-top: 2px solid #e5e7eb;
      padding-top: 12px;
      margin-top: 4px;
      font-size: 14px;
      font-weight: bold;
      color: #111827;
    }
    .summary-row.paid {
      color: #059669; /* Emerald 600 */
      font-weight: bold;
    }
    .summary-row.due {
      background-color: #111827;
      color: #ffffff;
      padding: 16px;
      border-radius: 6px;
      margin-top: 10px;
      font-size: 16px;
      align-items: center;
    }
    .summary-row.due .due-label {
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-size: 12px;
    }

    /* Footer / Signatory */
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .terms {
      width: 60%;
    }
    .terms h4 {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #6b7280;
      margin-bottom: 6px;
    }
    .terms p {
      font-size: 9px;
      color: #9ca3af;
      line-height: 1.5;
    }
    .signatory {
      text-align: center;
      width: 30%;
    }
    .signature-line {
      border-top: 1px solid #111827;
      margin-top: 40px;
      padding-top: 8px;
    }
    .signature-line p {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: bold;
      color: #111827;
    }
    .signature-line span {
      font-size: 9px;
      color: #6b7280;
    }
  </style>
</head>
<body>

  <!-- HEADER -->
  <div class="header">
    <div class="brand-section">
      <!-- Fallback text if logo fails to load in PDF engine -->
      <img src="http://localhost:5173/ruh_musafir.jpeg" class="logo" alt="Ruh Musafir Logo" onerror="this.style.display='none'" />
      <div class="brand-info">
        <p class="font-bold text-sm" style="color: #111827;">Ruh Musafir Sanctuary</p>
        <p>Shangarh, Sainj Valley</p>
        <p>Kullu, Himachal Pradesh 175134</p>
        <p>hello@ruhmusafir.com | +91 XXXXXXXXXX</p>
      </div>
    </div>
    
    <div class="invoice-meta">
      <h1>TAX INVOICE</h1>
      <div class="meta-grid">
        <span class="meta-label">Invoice No:</span>
        <span class="meta-value">{{invoiceId}}</span>
        
        <span class="meta-label">Date of Issue:</span>
        <span class="meta-value">{{currentDate}}</span>
        
        <span class="meta-label">Booking Ref:</span>
        <span class="meta-value">{{bookingId}}</span>
      </div>
    </div>
  </div>

  <!-- DETAILS GRID -->
  <div class="details-container">
    <div class="details-box" style="width: 45%;">
      <h3>Bill To</h3>
      <p class="font-bold" style="font-size: 14px;">{{guestName}}</p>
      <p>{{guestEmail}}</p>
    </div>
    <div class="details-box" style="width: 45%;">
      <h3>Stay Details</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 8px;">
        <div>
          <p class="text-xs text-muted uppercase">Check-In</p>
          <p class="font-bold">{{checkIn}}</p>
        </div>
        <div>
          <p class="text-xs text-muted uppercase">Check-Out</p>
          <p class="font-bold">{{checkOut}}</p>
        </div>
        <div>
          <p class="text-xs text-muted uppercase">Occupancy</p>
          <p class="font-bold">{{adults}} Adults, {{children}} Children</p>
        </div>
      </div>
    </div>
  </div>

  <!-- ITEMIZED TABLE -->
  <table>
    <thead>
      <tr>
        <th style="width: 8%;">#</th>
        <th style="width: 42%;">Description</th>
        <th class="center" style="width: 10%;">Qty</th>
        <th class="right" style="width: 20%;">Rate (INR)</th>
        <th class="right" style="width: 20%;">Total (INR)</th>
      </tr>
    </thead>
    <tbody>
      {{#each items}}
      <tr>
        <td class="text-muted">{{this.slNo}}</td>
        <td><span class="item-desc">{{this.description}}</span></td>
        <td class="center">{{this.qty}}</td>
        <td class="right">₹{{this.rate}}</td>
        <td class="right font-bold" style="color: #111827;">₹{{this.total}}</td>
      </tr>
      {{/each}}
    </tbody>
  </table>

  <!-- FINANCIAL SUMMARY -->
  <div class="summary-container">
    <div class="summary-box">
      <div class="summary-row">
        <span>Subtotal</span>
        <span>₹{{subtotal}}</span>
      </div>
      
      <!-- Placeholder for future Tax implementation -->
      <!-- <div class="summary-row">
        <span>Taxes (GST 12%)</span>
        <span>₹0.00</span>
      </div> -->

      <div class="summary-row total">
        <span>Grand Total</span>
        <span>₹{{grandTotal}}</span>
      </div>
      
      {{#if previouslyPaid}}
      <div class="summary-row paid">
        <span>Less: Payments Received ({{paymentMode}})</span>
        <span>- ₹{{previouslyPaid}}</span>
      </div>
      {{/if}}
      
      <div class="summary-row due">
        <span class="due-label font-bold">Balance Due</span>
        <span class="font-black">₹{{balanceDue}}</span>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div class="terms">
      <h4>Terms & Conditions</h4>
      <p>1. All balances must be settled prior to or at the time of check-out.</p>
      <p>2. Any damages to property will be charged to the guest ledger.</p>
      <p>3. This is a computer-generated invoice and does not require a physical signature.</p>
      <p style="margin-top: 10px; color: #111827; font-weight: bold;">Thank you for staying with Ruh Musafir!</p>
    </div>
    
    <div class="signatory">
      <div class="signature-line">
        <p>Authorized Signatory</p>
        <span>For Ruh Musafir Sanctuary</span>
      </div>
    </div>
  </div>

</body>
</html>
`;

export const generateInvoiceHtml = (data: any) => {
  const template = Handlebars.compile(invoiceHtml);
  return template(data);
};