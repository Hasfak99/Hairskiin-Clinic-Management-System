import React from 'react';
import { format } from 'date-fns';

export default function ThermalReceipt({ bill, clinicName = "HAIRSKIIN" }) {
    if (!bill) return null;

    const formatBillNumber = () => {
        if (!bill.bill_id || !bill.bill_date) return 'N/A';
        const paddedId = bill.bill_id.toString().padStart(6, '0');
        const date = format(new Date(bill.bill_date), 'MM/dd/yy');
        return `#${paddedId}${date}`;
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
            <div style={thermalStyles.logoContainer}>
                <img 
                    src="/HS_1.png" 
                    alt="Logo"
                    style={thermalStyles.logo}
                />
            </div>

            <div style={thermalStyles.header}>
                <div style={thermalStyles.shopName}>{clinicName}</div>
            </div>

            <div style={thermalStyles.contactInfo}>
                <div>2nd No. 10, Shady Grove Ave</div>
                <div>Borella</div>
                <div>0112688449 | 0772008802</div>
            </div>

            <div style={thermalStyles.divider}></div>

            <div style={thermalStyles.billInfo}>
                <div style={thermalStyles.billNumber}>Bill No: {formatBillNumber()}</div>
                <div style={thermalStyles.receptionist}>
                    Receptionist: {bill.created_by_name || bill.receptionist || 'N/A'}
                </div>
            </div>

            <div style={thermalStyles.dashedDivider}></div>

            <table style={thermalStyles.table}>
                <thead>
                    <tr style={thermalStyles.tableHeader}>
                        <th style={{ textAlign: 'center', fontWeight: '900', padding: '6px 0', fontSize: '16px' }}>Item</th>
                        <th style={{ textAlign: 'center', fontWeight: '900', padding: '6px 0', fontSize: '16px' }}>Qty</th>
                        <th style={{ textAlign: 'center', fontWeight: '900', padding: '6px 0', fontSize: '16px' }}>Price</th>
                    </tr>
                </thead>
                <tbody>
                    {bill.details?.map((item, i) => (
                        <tr key={i} style={thermalStyles.tableRow}>
                            <td style={{ textAlign: 'center', padding: '6px 0', fontSize: '15px', fontWeight: '900' }}>
                                {item.item_name}
                            </td>
                            <td style={{ textAlign: 'center', padding: '6px 0', fontSize: '15px', fontWeight: '900' }}>
                                {item.quantity}
                            </td>
                            <td style={{ textAlign: 'center', padding: '6px 0', fontSize: '15px', fontWeight: '900' }}>
                                {parseFloat(item.total_price).toFixed(2)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div style={thermalStyles.totalsSection}>
                <div style={{ textAlign: 'center', margin: '6px 0', fontSize: '16px', fontWeight: '900' }}>
                    <div>Subtotal: {parseFloat(bill.total_amount).toFixed(2)}</div>
                </div>
                {bill.discount > 0 && (
                    <div style={{ textAlign: 'center', margin: '6px 0', fontSize: '16px', fontWeight: '900' }}>
                        <div>Discount: -{parseFloat(bill.discount).toFixed(2)}</div>
                    </div>
                )}
            </div>

            <div style={thermalStyles.grandTotal}>
                <div style={{ marginBottom: '8px', fontSize: '22px' }}>TOTAL</div>
                <div style={{ fontSize: '28px', fontWeight: '900' }}>Rs. {parseFloat(bill.final_amount).toFixed(2)}</div>
            </div>

            {bill.cashReceived > 0 && (
                <div style={{ marginTop: '10px', fontSize: '11px', borderTop: '2px dashed #000', paddingTop: '10px', textAlign: 'center' }}>
                    <div style={{ margin: '5px 0', fontWeight: '800' }}>
                        <div>Cash Received: {parseFloat(bill.cashReceived).toFixed(2)}</div>
                    </div>
                    <div style={{ margin: '5px 0', fontWeight: '900', fontSize: '12px' }}>
                        <div>Balance: {Math.max(0, bill.cashReceived - bill.final_amount).toFixed(2)}</div>
                    </div>
                </div>
            )}

            <div style={thermalStyles.footer}>
                <div>THANK YOU</div>
            </div>
        </div>
    );
}
