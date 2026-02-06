import React from 'react';

import { format } from 'date-fns';

export default function ThermalReceipt({ bill, clinicName = "HAIRSKIIN CRM" }) {
    if (!bill) return null;

    return (
        <div className="thermal-receipt">
            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                <img
                    src="/HS_1.png"
                    alt="Logo"
                    style={{
                        width: '45px', /* Adjusted for 48mm width */
                        height: '45px',
                        marginBottom: '5px',
                        marginTop: '5px',
                        objectFit: 'contain'
                    }}
                />
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 900, textTransform: 'uppercase', lineHeight: '1.1' }}>{clinicName}</h2>
                <p style={{ margin: '2px 0', fontSize: '10px' }}>Quality Hair & Skin Care</p>
            </div>

            <div style={{ borderTop: '2px dashed #000', borderBottom: '2px dashed #000', padding: '5px 0', marginBottom: '10px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700 }}>#{bill.bill_id?.toString().padStart(4, '0') || 'N/A'}</span>
                    <span style={{ fontWeight: 600 }}>{bill.bill_date ? format(new Date(bill.bill_date), 'dd/MM/yy') : 'N/A'}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '12px' }}>{bill.client_name}</div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '10px', fontSize: '11px', tableLayout: 'fixed', lineHeight: '1.2' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #000' }}>
                        <th style={{ textAlign: 'left', padding: '2px 0', width: '50%', fontWeight: 800 }}>Item</th>
                        <th style={{ textAlign: 'center', padding: '2px 0', width: '15%', fontWeight: 800 }}>Qty</th>
                        <th style={{ textAlign: 'right', padding: '2px 0', width: '35%', fontWeight: 800 }}>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {bill.details?.map((item, i) => (
                        <tr key={i}>
                            <td style={{ padding: '2px 0', wordWrap: 'break-word', whiteSpace: 'normal', overflowWrap: 'break-word', fontWeight: 600 }}>{item.item_name}</td>
                            <td style={{ textAlign: 'center', padding: '2px 0', verticalAlign: 'top', fontWeight: 600 }}>{item.quantity}</td>
                            <td style={{ textAlign: 'right', padding: '2px 0', verticalAlign: 'top', fontWeight: 600 }}>{item.total_price}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={{ borderTop: '2px solid #000', paddingTop: '5px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <span>Subtotal:</span>
                    <span style={{ fontWeight: 600 }}>{bill.total_amount}</span>
                </div>
                {bill.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span>Disc:</span>
                        <span>-{bill.discount.toFixed(0)}</span>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: '16px', marginTop: '5px' }}>
                    <span>TOTAL:</span>
                    <span>{bill.final_amount}</span>
                </div>
                {bill.cashReceived > 0 && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', borderTop: '1px dashed #000', paddingTop: '5px', fontSize: '11px' }}>
                            <span>Cash:</span>
                            <span>{bill.cashReceived}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '12px' }}>
                            <span>Bal:</span>
                            <span>{Math.max(0, bill.cashReceived - bill.final_amount)}</span>
                        </div>
                    </>
                )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '15px' }}>
                <p style={{ fontSize: '11px', marginTop: '5px', fontWeight: 700, textTransform: 'uppercase' }}>Thank You!</p>
            </div>
        </div>
    );
}
