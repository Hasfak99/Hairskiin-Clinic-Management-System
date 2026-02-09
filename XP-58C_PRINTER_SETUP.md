# XP-58C Thermal Printer Setup Guide
## Quick Setup for Windows

---

## 🖨️ Hardware Setup

### Step 1: Connect the Printer

1. **Power Connection**
   - Connect power adapter to printer
   - Plug into wall outlet
   - Power ON the printer (switch on back/side)

2. **USB Connection**
   - Connect USB cable to printer
   - Connect other end to computer USB port
   - Wait for Windows to detect the printer

3. **Paper Loading**
   - Open paper cover
   - Insert 58mm thermal paper roll
   - Feed paper through slot
   - Close cover

### Step 2: Test Printer Hardware

**Self-Test Print:**
1. Turn OFF printer
2. Hold FEED button
3. Turn ON printer while holding FEED
4. Release when printing starts
5. Should print test pattern with printer info

✅ If test prints successfully, hardware is OK!

---

## 💻 Driver Installation

### Option 1: Automatic Installation (Recommended)

1. Windows should auto-detect as "USB Printer"
2. Right-click Start → Settings
3. Devices → Printers & scanners
4. Click "Add a printer or scanner"
5. Select "XP-58C" or "POS-58" when found
6. Click "Add device"

### Option 2: Manual Driver Installation

1. Download driver from: https://www.xprinter.net/
   - Model: XP-58 Series
   - OS: Windows 10/11
   - Language: English

2. Extract downloaded ZIP file

3. Run `Setup.exe` as Administrator

4. Follow installation wizard:
   - Accept license
   - Choose installation folder
   - Select printer model: XP-58C
   - Complete installation

5. Restart computer (recommended)

---

## ⚙️ Printer Configuration

### Step 1: Set Paper Size

1. Open **Settings** → **Devices** → **Printers & scanners**
2. Click on **XP-58C** printer
3. Click **"Manage"**
4. Click **"Printing preferences"**

5. Set the following:
   - **Paper Size**: Custom → Width: 58mm, Length: 297mm
   - **Orientation**: Portrait
   - **Quality**: High
   - **Color**: Black & White only

6. Click **"Advanced"** button:
   - **Paper/Output** → **Paper Size**: 58mm Roll
   - **Document Options** → **Print Quality**: 600 dpi

7. Click **"OK"** to save

### Step 2: Configure Print Defaults

1. Still in Printer Properties → **"General"** tab
2. Click **"Preferences"** button

3. **Layout Tab:**
   - Orientation: Portrait
   - Paper Size: 58mm Roll
   - Pages per sheet: 1

4. **Paper/Quality Tab:**
   - Paper Source: Auto Select
   - Media: Plain Paper (Thermal)
   - Color: Black & White

5. **Advanced Tab:**
   - Paper Size: 58mm x 297mm (Custom)
   - Print Density: Normal
   - Print Speed: Medium

6. Click **"Apply"** then **"OK"**

### Step 3: Set as Default Printer (Optional)

1. In Printers & scanners
2. Click XP-58C
3. Click "Manage"
4. Check "Set as default printer"

---

## 🧪 Test Print from Application

### Test 1: From Notepad

1. Open Notepad
2. Type some text
3. File → Print
4. Select XP-58C
5. Print

✅ Text should print on thermal paper

### Test 2: From Demo HTML

1. Open `thermal_receipt_demo.html` in Chrome/Edge
2. Click "Print Receipt" button
3. Select XP-58C printer
4. Print

✅ Receipt should print with proper formatting

### Test 3: From HAIRSKIIN CRM

1. Open HAIRSKIIN CRM
2. Go to Billing page
3. Select a paid bill
4. Click "Print Receipt"
5. Select XP-58C printer
6. Print

✅ Receipt should print with all bill details

---

## 🔧 Browser Print Settings

### Google Chrome / Microsoft Edge

**For HAIRSKIIN CRM printing:**

1. When print dialog opens, configure:

```
Destination: XP-58C Printer
Pages: All
Layout: Portrait
Color: Black and white
Paper size: 58mm Roll (Custom)
Margins: None
Scale: Default
More settings:
  ✓ Background graphics
  □ Headers and footers
  ✓ Print backgrounds
```

2. Save as **"Print Preset"** for future use:
   - Click "Save" button at bottom
   - Name it: "Thermal Receipt"

3. Next time just select "Thermal Receipt" preset!

### Mozilla Firefox

1. Print dialog settings:

```
Printer: XP-58C
Orientation: Portrait
Paper Size: Custom (58mm x 297mm)
Scale: 100%
☑ Print background colors
☑ Print background images
```

2. Save these settings by clicking "Save as preset"

---

## 🎯 Optimal Print Settings for Receipt

### Windows Advanced Print Options

Open printer properties and set:

```ini
[Print Quality]
Resolution = 203dpi (thermal standard)
Print Speed = Normal
Density = Medium

[Paper Handling]
Paper Size = 58mm Roll
Paper Type = Thermal Paper
Auto Cut = Enabled (if supported)

[Advanced]
Character Set = UTF-8
Line Spacing = 30/180 inch
Print Direction = Unidirectional
ESC/POS Mode = Enabled
```

---

## 📊 Common Paper Sizes

| Size Name | Width | Common Use |
|-----------|-------|------------|
| **58mm** (XP-58C) | 58mm / 2.28" | Small receipts (this printer) |
| 80mm | 80mm / 3.15" | Standard receipts |
| 44mm | 44mm / 1.73" | Labels only |

✅ **Your printer**: 58mm width

---

## 🐛 Troubleshooting

### Issue: Printer not detected

**Solutions:**
1. Check USB cable connection
2. Try different USB port
3. Restart computer
4. Install driver manually
5. Check Device Manager for errors

### Issue: Prints blank paper

**Solutions:**
1. Check paper loaded correctly (thermal side down)
2. Check paper not expired (thermal paper has shelf life)
3. Test with self-test print (hold FEED button on startup)
4. Clean printer head with isopropyl alcohol

### Issue: Receipt cut off at edges

**Solutions:**
1. Verify paper size is 58mm
2. Check margins set to 0mm
3. Adjust scale to 95%
4. Check printer width settings

### Issue: Garbled text or strange characters

**Solutions:**
1. Set character encoding to UTF-8
2. Update printer driver
3. Check Windows regional settings
4. Reinstall printer driver

### Issue: Prints too light/faint

**Solutions:**
1. Increase print density in driver settings
2. Check thermal paper quality
3. Clean printer head
4. Replace thermal paper roll

### Issue: Paper jam

**Solutions:**
1. Power OFF printer
2. Open paper cover
3. Remove jammed paper carefully
4. Reload paper correctly
5. Close cover and power ON

---

## 🔍 Checking Printer Status

### Windows Device Manager

1. Right-click Start → Device Manager
2. Expand "Printers" or "Print queues"
3. Find XP-58C
4. Should show no errors (no yellow warning)

### Printer Properties

1. Settings → Printers & scanners → XP-58C
2. Click "Manage" → "Printer properties"
3. Click "Print Test Page" button
4. Should print Windows test page

---

## 📱 Mobile Printing (Optional)

### Via Bluetooth (if your XP-58C has BT)

1. Enable Bluetooth on XP-58C (refer to manual)
2. Pair with phone via Settings → Bluetooth
3. Use ESC/POS printing app
4. Configure port: Bluetooth Serial
5. Test print

### Via USB OTG (Android)

1. Connect printer to Android via USB OTG cable
2. Install RawBT app or similar
3. Configure for USB connection
4. Test print

---

## ✅ Setup Checklist

**Hardware:**
- [ ] Printer powered ON
- [ ] USB connected to computer
- [ ] 58mm thermal paper loaded correctly
- [ ] Self-test print successful

**Driver:**
- [ ] Driver installed
- [ ] Printer appears in Windows Printers list
- [ ] Test page prints successfully

**Configuration:**
- [ ] Paper size set to 58mm
- [ ] Orientation: Portrait
- [ ] Margins: 0mm
- [ ] Color: Black & White
- [ ] ESC/POS enabled

**Testing:**
- [ ] Notepad test print works
- [ ] Demo HTML receipt prints correctly
- [ ] HAIRSKIIN CRM receipt prints perfectly
- [ ] No cutting/alignment issues

---

## 📞 Support & Resources

### Manufacturer Support
- **Website**: https://www.xprinter.net/
- **Email**: service@xprinter.net
- **Driver Downloads**: https://www.xprinter.net/download

### Manual
- Search for "XP-58C User Manual PDF"
- Usually includes:
  - Hardware specifications
  - Command reference
  - Troubleshooting guide
  - Maintenance instructions

### ESC/POS Commands (Advanced)

For developers who need to send raw commands:

```
ESC @ - Initialize printer
ESC a n - Align (0=left, 1=center, 2=right)
ESC E n - Bold on/off
ESC d n - Feed n lines
GS V - Cut paper
```

Refer to ESC/POS command manual for full list.

---

## 🎓 Best Practices

1. **Daily Maintenance**
   - Check paper supply at start of day
   - Clean printer exterior with soft cloth
   - Ensure ventilation slots clear

2. **Weekly Maintenance**
   - Clean printer head with isopropyl alcohol
   - Check for paper dust inside
   - Test print quality

3. **Monthly Maintenance**
   - Check USB cable for damage
   - Update printer driver if available
   - Review print quality settings

4. **Paper Storage**
   - Store in cool, dry place
   - Away from direct sunlight
   - Use within 1-2 years of manufacture

5. **Environmental Conditions**
   - Temperature: 15-30°C
   - Humidity: 20-80% (no condensation)
   - Keep away from heat sources

---

## 📐 Technical Specifications

### XP-58C Printer

| Specification | Details |
|---------------|---------|
| Print Method | Direct thermal |
| Paper Width | 58mm (2.28") |
| Print Width | 48mm (printable area) |
| Print Speed | 90mm/sec |
| Resolution | 203 DPI (8 dots/mm) |
| Interface | USB 2.0 |
| Character Set | UTF-8, ASCII, Code Page 437 |
| Emulation | ESC/POS compatible |
| Paper Diameter | Max 50mm roll |
| MTBF | 50km paper length |
| Power | 24V DC, 2.5A |

---

**Setup completed? Start printing receipts from HAIRSKIIN CRM! 🎉**

**Version**: 1.0  
**Date**: February 9, 2026  
**Compatibility**: Windows 10/11, XP-58C Thermal Printer

