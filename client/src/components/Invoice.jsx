import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';

export default function Invoice({ bill, clinicDetails = {} }) {
    if (!bill) return null;

    const {
        name = "HAIRSKIIN CLINIC",
        address = "123 Luxury Lane, Colombo, Sri Lanka",
        phone = "+94 11 234 5678",
        email = "info@hairskiin.lk",
        website = "www.hairskiin.lk"
    } = clinicDetails;

    return (
        <div className="professional-bill">
            <div className="bill-header">
                <div className="clinic-info">
                    <img src="/logo.png" alt="Hairskiin Logo" className="bill-logo" />
                    <div>
                        <h1 className="clinic-name">{name}</h1>
                        <p className="clinic-details">{address}</p>
                        <p className="clinic-details">Phone: {phone} | Email: {email}</p>
                        <p className="clinic-details">{website}</p>
                    </div>
                </div>
                <div className="invoice-meta">
                    <h2 className="invoice-title">INVOICE</h2>
                    <div className="meta-grid">
                        <div className="meta-label">Invoice #</div>
                        <div className="meta-value">{bill.bill_id?.toString().padStart(4, '0') || 'N/A'}</div>
                        <div className="meta-label">Date</div>
                        <div className="meta-value">{bill.bill_date ? format(new Date(bill.bill_date), 'MMMM dd, yyyy') : 'N/A'}</div>
                        <div className="meta-label">Status</div>
                        <div className="meta-value" style={{ textTransform: 'capitalize' }}>{bill.payment_status || 'Pending'}</div>
                    </div>
                </div>
            </div>

            <div className="bill-to">
                <h3>BILL TO</h3>
                <p className="client-name">{bill.client_name}</p>
            </div>

            <table className="bill-table">
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left' }}>Description</th>
                        <th style={{ textAlign: 'center' }}>Qty</th>
                        <th style={{ textAlign: 'right' }}>Unit Price</th>
                        <th style={{ textAlign: 'right' }}>Total</th>
                    </tr>
                </thead>
                <tbody>
                    {bill.details?.map((item, i) => (
                        <tr key={i}>
                            <td>
                                <div><strong>{item.item_name}</strong></div>
                                <div className="item-type">{item.item_type}</div>
                            </td>
                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right' }}>LKR {item.unit_price}</td>
                            <td style={{ textAlign: 'right' }}>LKR {item.total_price}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="bill-footer">
                <div className="footer-left">
                    <div className="payment-qr">
                        <QRCodeSVG
                            value={`hairskiin://pay?bill=${bill.bill_id}&amount=${bill.final_amount}`}
                            size={100}
                        />
                        <p>Scan to Pay</p>
                    </div>
                    {bill.notes && (
                        <div className="notes-section">
                            <h4>Special Notes</h4>
                            <p>{bill.notes}</p>
                        </div>
                    )}
                </div>
                <div className="footer-right">
                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span>LKR {bill.total_amount}</span>
                    </div>
                    <div className="summary-row">
                        <span>Discount</span>
                        <span style={{ color: bill.discount > 0 ? '#dc2626' : 'inherit' }}>
                            {bill.discount > 0 ? `-LKR ${bill.discount.toFixed(2)}` : 'LKR 0.00'}
                        </span>
                    </div>
                    {bill.tax > 0 && (
                        <div className="summary-row">
                            <span>Tax</span>
                            <span>+LKR {bill.tax}</span>
                        </div>
                    )}
                    <div className="summary-row grand-total">
                        <span>Grand Total</span>
                        <span>LKR {bill.final_amount}</span>
                    </div>
                    {bill.cashReceived > 0 && (
                        <>
                            <div className="summary-row cash-received">
                                <span>Cash Received</span>
                                <span>LKR {bill.cashReceived}</span>
                            </div>
                            <div className="summary-row balance">
                                <span>Balance to Return</span>
                                <span>LKR {Math.max(0, bill.cashReceived - bill.final_amount)}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="bill-terms">
                <p>Terms & Conditions:</p>
                <ul>
                    <li>Payment is due within 7 days.</li>
                    <li>Service quality guaranteed. For feedback, contact us at {phone}.</li>
                    <li>Thank you for choosing Hairskiin Clinic!</li>
                </ul>
            </div>
        </div>
    );
}
