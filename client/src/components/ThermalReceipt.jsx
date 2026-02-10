import React from 'react';
import { format } from 'date-fns';

export default function ThermalReceipt({ bill, clinicName = "HAIRSKIIN" }) {
    if (!bill) return null;

    const formatBillNumber = () => {
        if (!bill.bill_id || !bill.bill_date) return 'N/A';
        const paddedId = bill.bill_id.toString().padStart(7, '0');
        return `Receipt #${paddedId}`;
    };

    const formatDateTime = () => {
        if (!bill.bill_date) return 'N/A';
        return format(new Date(bill.bill_date), 'dd/MM/yyyy hh:mm:ss a');
    };

    const thermalStyles = {
        container: {
            fontFamily: '"Courier New", Courier, monospace',
            width: '80mm',
            maxWidth: '80mm',
            padding: '8mm 6mm',
            backgroundColor: '#ffffff',
            color: '#000000',
            fontSize: '14px',
            lineHeight: '1.6',
            textAlign: 'center',
            fontWeight: '800',
        },
        logoContainer: {
            textAlign: 'center',
            marginBottom: '12px',
            marginTop: '8px',
        },
        logo: {
            width: '80px',
            height: '80px',
            marginBottom: '10px',
            objectFit: 'contain',
            display: 'inline-block',
        },
        header: {
            textAlign: 'center',
            marginBottom: '12px',
        },
        shopName: {
            fontSize: '28px',
            fontWeight: '900',
            letterSpacing: '5px',
            margin: '0 0 10px 0',
            textTransform: 'uppercase',
            lineHeight: '1.3',
            whiteSpace: 'nowrap',
        },
        contactInfo: {
            fontSize: '13px',
            margin: '6px 0',
            lineHeight: '1.7',
            textAlign: 'center',
            fontWeight: '800',
        },
        divider: {
            borderTop: '2px solid #000',
            margin: '12px auto',
            width: '100%',
        },
        dashedDivider: {
            borderTop: '2px dashed #000',
            margin: '12px auto',
            width: '100%',
        },
        billInfo: {
            textAlign: 'center',
            fontSize: '15px',
            margin: '10px 0',
            fontWeight: '900',
        },
        billNumber: {
            fontWeight: '900',
            margin: '5px 0',
            fontSize: '16px',
        },
        receptionist: {
            fontSize: '14px',
            margin: '5px 0',
            fontWeight: '800',
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: '12px',
            fontSize: '15px',
            fontWeight: '900',
            textAlign: 'center',
        },
        tableHeader: {
            borderBottom: '2px solid #000',
            paddingBottom: '6px',
            textAlign: 'center',
        },
        tableRow: {
            padding: '6px 0',
            textAlign: 'center',
        },
        itemName: {
            textAlign: 'center',
            padding: '6px 0',
            wordWrap: 'break-word',
            fontSize: '13px',
            fontWeight: '900',
        },
        totalsSection: {
            borderTop: '2px solid #000',
            paddingTop: '12px',
            marginTop: '12px',
            fontSize: '16px',
            fontWeight: '900',
            textAlign: 'center',
        },
        totalRow: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '6px 0',
            gap: '10px',
        },
        grandTotal: {
            display: 'block',
            textAlign: 'center',
            fontWeight: '900',
            fontSize: '22px',
            marginTop: '12px',
            paddingTop: '12px',
            borderTop: '3px double #000',
        },
        footer: {
            textAlign: 'center',
            marginTop: '18px',
            marginBottom: '10px',
            fontSize: '18px',
            fontWeight: '900',
            letterSpacing: '6px',
        }
    };

    return (
        <div className="thermal-receipt" style={thermalStyles.container}>
            {/* Header Section */}
            <div style={{ textAlign: 'center', marginBottom: '10px', paddingBottom: '8px' }}>
                <img
                    src="/HS_1.png"
                    alt="Logo"
                    style={thermalStyles.logo}
                />
            </div>

            {/* Receipt Info */}
            <div style={{ fontSize: '14px', margin: '10px 0', textAlign: 'center', fontWeight: '900' }}>
                <div>{formatBillNumber()}</div>
                <div style={{ marginTop: '6px', fontSize: '13px', fontWeight: '700' }}>
                    <div>{formatDateTime()}</div>
                    <div style={{ marginTop: '2px' }}>10 Shady Grove Ave, Colombo Borella</div>
                </div>
            </div>

            {/* Client Info Section */}
            {bill.client_name && (
                <div style={{ margin: '10px 0', padding: '8px 0', borderTop: '1px dashed #000', borderBottom: '1px dashed #000' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontSize: '13px' }}>
                        <span style={{ fontWeight: '900' }}>Client:</span>
                        <span style={{ fontWeight: '700' }}>{bill.client_name}</span>
                    </div>
                </div>
            )}

            {/* Items Table */}
            <div style={{ margin: '12px 0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #000' }}>
                            <th style={{ textAlign: 'left', fontWeight: '900', padding: '6px 4px', fontSize: '14px' }}>Item</th>
                            <th style={{ textAlign: 'center', fontWeight: '900', padding: '6px 4px', fontSize: '14px', width: '30px' }}>Qty</th>
                            <th style={{ textAlign: 'right', fontWeight: '900', padding: '6px 4px', fontSize: '14px', minWidth: '60px' }}>Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bill.details?.map((item, i) => (
                            <tr key={i} style={{ borderBottom: '1px dotted #999' }}>
                                <td style={{ textAlign: 'left', padding: '6px 4px', fontSize: '13px', fontWeight: '700' }}>
                                    {i + 1}.{item.item_name}
                                </td>
                                <td style={{ textAlign: 'center', padding: '6px 4px', fontSize: '13px', fontWeight: '700' }}>
                                    {item.quantity}
                                </td>
                                <td style={{ textAlign: 'right', padding: '6px 4px', fontSize: '13px', fontWeight: '700' }}>
                                    Rs.{parseFloat(item.total_price).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals Section */}
            <div style={{ margin: '12px 0', paddingTop: '8px', borderTop: '2px solid #000' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: '15px', fontWeight: '800' }}>
                    <span>Subtotal:</span>
                    <span>Rs.{parseFloat(bill.total_amount).toFixed(2)}</span>
                </div>
                {bill.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: '15px', fontWeight: '700', color: '#666' }}>
                        <span>Discount:</span>
                        <span>-Rs.{parseFloat(bill.discount).toFixed(2)}</span>
                    </div>
                )}
            </div>

            {/* Grand Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '20px', marginTop: '10px', paddingTop: '10px', borderTop: '3px double #000' }}>
                <span>TOTAL:</span>
                <span>Rs. {parseFloat(bill.final_amount).toFixed(2)}</span>
            </div>

            {/* Payment Info */}
            {bill.cashReceived > 0 && (
                <div style={{ margin: '12px 0', padding: '8px', background: '#f9f9f9', border: '1px solid #ddd', fontSize: '12px', fontWeight: '700' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                        <span>Cash Received:</span>
                        <span>Rs.{parseFloat(bill.cashReceived).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0', fontWeight: '900' }}>
                        <span>Balance:</span>
                        <span>Rs.{Math.max(0, bill.cashReceived - bill.final_amount).toFixed(2)}</span>
                    </div>
                </div>
            )}

            {/* Thank You Message */}
            <div style={{ textAlign: 'center', margin: '15px 0 10px', fontSize: '16px', fontWeight: '900', letterSpacing: '3px' }}>
                THANK YOU!
            </div>

            {/* Footer Info */}
            <div style={{ textAlign: 'center', fontSize: '13px', color: '#000', marginTop: '12px', lineHeight: '1.6', fontWeight: '700' }}>
                <div>2nd No. 10, Shady Grove Ave, Borella</div>
                <div style={{ marginTop: '4px', fontWeight: '800' }}>0112688449 | 0772008802</div>
            </div>
        </div>
    );
}
