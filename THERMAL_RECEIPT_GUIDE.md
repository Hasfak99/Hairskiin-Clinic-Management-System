# Thermal Receipt Guide - HAIRSKIIN CRM
## XP-58C Printer Implementation

This guide explains how to use the thermal receipt printing feature for the HAIRSKIIN CRM system with the XP-58C thermal printer.

---

## 📋 Overview

The thermal receipt is designed specifically for **58mm width thermal printers** (XP-58C model) commonly used in POS systems. It features:

- ✅ Black and white monochrome design
- ✅ Monospace font (Courier New) for authentic thermal printer look
- ✅ High contrast, minimal styling
- ✅ Optimized 58mm width layout
- ✅ Professional shop receipt format

---

## 🎨 Receipt Design

### Layout Structure

```
┌─────────────────────────────────┐
│          HAIRSKIIN              │  ← Shop Name (Bold, Large)
├─────────────────────────────────┤
│ 2nd No. 10, Shady Grove Ave...  │  ← Address
│   0112688449 | 0772008802       │  ← Contact Numbers
├─────────────────────────────────┤  ← Solid Line
│   Bill No: #008309/02/26        │  ← Bill Number + Date
│   receptionist: dfgr            │  ← Receptionist Name
├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤  ← Dashed Line
│ Item            Qty      Price   │  ← Table Header
│ fgg              1       3434    │  ← Item Rows
├─────────────────────────────────┤  ← Solid Line
│ Subtotal:               3434    │
│ Discount:                -34    │
├─────────────────────────────────┤
│ TOTAL:                  3400    │  ← Bold, Larger
├─────────────────────────────────┤
│         THANK YOU               │  ← Footer
└─────────────────────────────────┘
```

---

## 🖨️ Printer Setup

### XP-58C Printer Configuration

1. **Paper Size**: 58mm (2.28 inches) width
2. **Character Encoding**: UTF-8
3. **Print Quality**: High density (default)
4. **Auto-cut**: Enabled (recommended)

### Driver Installation

**Windows:**
1. Download XP-58C driver from manufacturer website
2. Install driver using the setup wizard
3. Connect printer via USB
4. Set as default printer (optional)

**Printer Settings:**
- Paper size: 58mm Roll (Custom)
- Orientation: Portrait
- Margins: 0mm (all sides)
- Scale: 100%

---

## 💻 Implementation Details

### Component Location

```
client/src/components/ThermalReceipt.jsx
```

### Usage in Billing Page

The thermal receipt is automatically available in the Billing module:

```jsx
import ThermalReceipt from '../components/ThermalReceipt';

// In your component
<ThermalReceipt bill={billData} clinicName="HAIRSKIIN" />
```

### Required Bill Data Structure

```javascript
const billData = {
  bill_id: 8309,              // Numeric ID
  bill_date: "2026-02-09",    // ISO date format
  client_name: "John Doe",    // Client name
  created_by_name: "dfgr",    // Receptionist/user name
  receptionist: "dfgr",       // Alternative receptionist field
  total_amount: 3434,         // Subtotal before discount
  discount: 34,               // Discount amount
  final_amount: 3400,         // Final amount after discount
  cashReceived: 0,            // Optional: cash received
  details: [                  // Array of items
    {
      item_name: "Hair Treatment",
      quantity: 1,
      total_price: 3434
    }
  ]
};
```

---

## 🔧 Printing Instructions

### From the Application

1. Open the Billing page
2. Select a paid bill
3. Click "Print Receipt" button
4. The print dialog will open
5. Select XP-58C printer
6. Click "Print"

### Browser Print Settings

**Chrome/Edge:**
- Destination: XP-58C Printer
- Pages: All
- Layout: Portrait
- Color: Black and white
- Paper size: 58mm Roll
- Margins: None
- Scale: Default (100%)
- Options: Background graphics (checked)

**Firefox:**
- Printer: XP-58C
- Orientation: Portrait
- Paper size: Custom (58mm)
- Print background colors/images: Yes

---

## 🎯 Key Features

### 1. Bill Number Format
- Format: `#NNNNNNMM/DD/YY`
- Example: `#008309/02/26`
- Components:
  - 6-digit bill ID (zero-padded)
  - Month/Day/Year

### 2. Monospace Font
- Font: Courier New
- Purpose: Authentic thermal printer appearance
- Benefits: Clear, consistent character spacing

### 3. Line Separators
- **Solid lines**: Major sections (header, totals)
- **Dashed lines**: Minor sections (bill info)

### 4. Responsive Text
- Auto word-wrap for long item names
- Maintains table alignment
- Prevents text overflow

### 5. Dynamic Content
- Shows discount only if > 0
- Shows cash/balance only if paid
- Auto-formats dates and numbers

---

## 📐 Technical Specifications

### Print Dimensions
- **Width**: 58mm (2.28 inches)
- **Safe print area**: 48mm (with 5mm margins)
- **Height**: Auto (varies with content)

### Font Sizes
- Shop name: 18px
- Bill number: 9px
- Items table: 9px
- Contact info: 8px
- Total: 14px (bold)

### Spacing
- Line height: 1.3
- Section spacing: 6px
- Table padding: 3px

---

## 🐛 Troubleshooting

### Issue: Receipt is cut off at edges
**Solution**: Reduce print scale to 95% or check printer margins

### Issue: Font looks different
**Solution**: Ensure "Print background graphics" is enabled

### Issue: Receipt is too wide
**Solution**: Verify printer is set to 58mm paper size

### Issue: Bill number format incorrect
**Solution**: Check that `bill_id` and `bill_date` are provided correctly

### Issue: Items not showing
**Solution**: Verify `details` array exists and contains items

---

## 🔄 Customization

### Change Shop Name

```jsx
<ThermalReceipt bill={billData} clinicName="YOUR SHOP NAME" />
```

### Modify Contact Details

Edit in `ThermalReceipt.jsx`:

```jsx
<div style={thermalStyles.contactInfo}>
  <div style={{ textAlign: 'center' }}>Your Address Here</div>
  <div style={{ textAlign: 'center' }}>Phone 1 | Phone 2</div>
</div>
```

### Adjust Font Size

Modify `thermalStyles.container` in `ThermalReceipt.jsx`:

```jsx
fontSize: '10px',  // Change to '9px' or '11px' as needed
```

---

## 📱 Testing

### Preview Before Printing

1. Open `thermal_receipt_demo.html` in your browser
2. View the realistic preview
3. Click "Print Receipt" to test printer output

### Print Test Page

```javascript
// In browser console
window.print();
```

---

## 📊 Sample Output

When printed correctly, you should see:

- **Sharp, black text** on white paper
- **Aligned columns** in the items table
- **Clear line separators**
- **Proper spacing** between sections
- **Bold TOTAL** amount stands out

---

## 🚀 Best Practices

1. **Always test print** on scrap paper first
2. **Keep printer drivers updated**
3. **Use high-quality thermal paper** (80gsm recommended)
4. **Check paper roll alignment** before printing
5. **Clean printer head regularly** for best quality
6. **Store thermal paper properly** (away from heat and light)

---

## 📞 Support

For issues with:
- **Printer hardware**: Contact XP-58C manufacturer
- **Driver issues**: Check manufacturer website for latest drivers
- **Receipt design**: Modify `ThermalReceipt.jsx` component
- **CSS styling**: Update `index.css` thermal receipt styles

---

## ✅ Checklist for First Use

- [ ] XP-58C printer connected and powered on
- [ ] Driver installed correctly
- [ ] Test page prints successfully
- [ ] Paper loaded (58mm width)
- [ ] Browser print settings configured
- [ ] Tested with demo HTML file
- [ ] Tested from billing page
- [ ] Receipt prints clearly and aligned

---

## 📝 Notes

- The receipt is optimized for **ESC/POS** compatible thermal printers
- Uses standard **58mm width** (most common size for receipts)
- **Black and white only** (thermal printers don't support color)
- **Monospace font** provides authentic receipt appearance
- **Auto-cuts** after printing (if printer supports it)

---

**Version**: 1.0  
**Last Updated**: February 9, 2026  
**Compatible With**: XP-58C, ESC/POS compatible thermal printers

