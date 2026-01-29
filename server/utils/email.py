import os
from dotenv import load_dotenv
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from typing import List

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD"),
    MAIL_FROM = os.getenv("MAIL_FROM"),
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER = os.getenv("MAIL_SERVER"),
    MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", "HairSkin CRM"),
    MAIL_STARTTLS = os.getenv("MAIL_TLS") == "True",
    MAIL_SSL_TLS = os.getenv("MAIL_SSL") == "True",
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = True
)

async def send_low_stock_notification(
    product_name: str, 
    current_stock: int, 
    threshold: int,
    recipients: List[EmailStr] = None
):
    if recipients is None:
        admin_email = os.getenv("MAIL_USERNAME")
        if admin_email:
            recipients = [admin_email]
        else:
            print("No recipient email found")
            return

    html = f"""
    <h3>Low Stock Alert</h3>
    <p>The stock for product <strong>{product_name}</strong> has dropped below {threshold}.</p>
    <p>Current Stock: <span style="color:red; font-weight:bold;">{current_stock}</span></p>
    <p>Please restock immediately.</p>
    """

    message = MessageSchema(
        subject=f"⚠️ Low Stock Alert: {product_name}",
        recipients=recipients,
        body=html,
        subtype="html"
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print(f"Low stock alert sent for {product_name}")
    except Exception as e:
        print(f"Failed to send email: {e}")


async def send_low_stock_report(
    products: List[dict],
    recipients: List[EmailStr] = None
):
    """
    Send a report of all low stock products.
    products: List of dicts with 'name' and 'stock' keys
    """
    if recipients is None:
        admin_email = os.getenv("MAIL_USERNAME")
        if admin_email:
            recipients = [admin_email]
        else:
            print("No recipient email found")
            return

    # Build HTML Table
    rows = ""
    for p in products:
        rows += f"<tr><td style='border: 1px solid #ddd; padding: 8px;'>{p['name']}</td><td style='border: 1px solid #ddd; padding: 8px; color: red;'>{p['stock']}</td></tr>"

    html = f"""
    <h3>Low Stock Report</h3>
    <p>The following products are below the stock threshold (50):</p>
    <table style="border-collapse: collapse; width: 100%;">
        <thead>
            <tr style="background-color: #f2f2f2;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Product</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Stock</th>
            </tr>
        </thead>
        <tbody>
            {rows}
        </tbody>
    </table>
    <p>Please review inventory.</p>
    """

    message = MessageSchema(
        subject="📊 Low Stock Inventory Report",
        recipients=recipients,
        body=html,
        subtype="html"
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print(f"Low stock report sent with {len(products)} items")
    except Exception as e:
        print(f"Failed to send report: {e}")
