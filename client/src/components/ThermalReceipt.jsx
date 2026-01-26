import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';

export default function ThermalReceipt({ bill, clinicName = "HAIRSKIIN CRM" }) {
    if (!bill) return null;

    return (
        <div className="thermal-receipt">
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase' }}>{clinicName}</h2>
                <p style={{ margin: '2px 0', fontSize: '10px' }}>Quality Hair & Skin Care</p>
            </div>

            <div style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000', padding: '5px 0', marginBottom: '10px', fontSize: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Bill #: {bill.bill_id?.toString().padStart(4, '0') || 'N/A'}</span>
                    <span>{bill.bill_date ? format(new Date(bill.bill_date), 'dd/MM/yy') : 'N/A'}</span>
                </div>
                <div>Client: {bill.client_name}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', fontSize: '10px' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid #000' }}>
                        <th style={{ textAlign: 'left', padding: '2px 0' }}>Item</th>
                        <th style={{ textAlign: 'right', padding: '2px 0' }}>Qty</th>
                        <th style={{ textAlign: 'right', padding: '2px 0' }}>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {bill.details?.map((item, i) => (
                        <tr key={i}>
                            <td style={{ padding: '2px 0' }}>{item.item_name}</td>
                            <td style={{ textAlign: 'right', padding: '2px 0' }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', padding: '2px 0' }}>{item.total_price}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ borderTop: '1px solid #000', paddingTop: '5px', fontSize: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Subtotal:</span>
                    <span>LKR {bill.total_amount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Discount:</span>
                    <span>{bill.discount > 0 ? `-LKR ${bill.discount.toFixed(2)}` : 'LKR 0.00'}</span>
                </div>
                {bill.tax > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Tax:</span>
                        <span>+LKR {bill.tax}</span>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '12px', marginTop: '5px' }}>
                    <span>TOTAL:</span>
                    <span>LKR {bill.final_amount}</span>
                </div>
                {bill.cashReceived > 0 && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', borderTop: '1px dashed #000', paddingTop: '5px' }}>
                            <span>Cash Received:</span>
                            <span>LKR {bill.cashReceived}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                            <span>Balance:</span>
                            <span>LKR {Math.max(0, bill.cashReceived - bill.final_amount)}</span>
                        </div>
                    </>
                )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '5px' }}>
                    <QRCodeSVG
                        value={`hairskiin://pay?bill=${bill.bill_id}&amount=${bill.final_amount}`}
                        size={80}
                        level="M"
                    />
                </div>
                <p style={{ fontSize: '9px', margin: 0 }}>Scan to Pay</p>
                <p style={{ fontSize: '10px', marginTop: '10px', fontWeight: 'bold' }}>Thank You! Visit Again.</p>
            </div>
        </div>
    );
}
