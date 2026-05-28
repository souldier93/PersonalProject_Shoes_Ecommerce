from __future__ import annotations

import html
import os
import re
import shutil
import struct
import subprocess
import textwrap
from datetime import date
from pathlib import Path

from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
REQ_DIR = ROOT / "docs" / "requirements"
DIAGRAM_DIR = REQ_DIR / "diagrams"
RENDER_DIR = REQ_DIR / "_rendered"
USECASE_IMAGE = ROOT / "docs" / "design" / "usecase-images" / "Master_Detailed_All_76_UseCases.png"
TODAY = date.today().isoformat()
CHROME = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")


BLUE = "2E74B5"
DARK_BLUE = "1F4D78"
INK = "0B2545"
MUTED = "667085"
LIGHT_FILL = "F2F4F7"
CALLOUT_FILL = "F4F6F9"
BORDER = "D0D7DE"
GREEN = "2E7D32"
RED = "9B1C1C"
GOLD = "7A5A00"


def ensure_dirs() -> None:
    REQ_DIR.mkdir(parents=True, exist_ok=True)
    DIAGRAM_DIR.mkdir(parents=True, exist_ok=True)
    RENDER_DIR.mkdir(parents=True, exist_ok=True)


def slug(value: str) -> str:
    value = re.sub(r"[^A-Za-z0-9]+", "_", value).strip("_")
    return value or "file"


def escape(value: str) -> str:
    return html.escape(str(value), quote=True)


def wrap_svg_text(value: str, width_chars: int = 20, max_lines: int = 4) -> list[str]:
    lines: list[str] = []
    for raw_line in str(value).splitlines():
        wrapped = textwrap.wrap(raw_line, width=width_chars) or [""]
        lines.extend(wrapped)
    if len(lines) > max_lines:
        return lines[: max_lines - 1] + [lines[max_lines - 1] + "..."]
    return lines


def svg_text(
    x: int,
    y: int,
    value: str,
    css_class: str = "label",
    anchor: str = "middle",
    width_chars: int = 20,
    line_height: int = 18,
    max_lines: int = 4,
) -> str:
    lines = wrap_svg_text(value, width_chars, max_lines)
    start = y - int((len(lines) - 1) * line_height / 2)
    tspans = []
    for idx, line in enumerate(lines):
        dy = 0 if idx == 0 else line_height
        tspans.append(
            f'<tspan x="{x}" dy="{dy if idx else 0}">{escape(line)}</tspan>'
        )
    return (
        f'<text x="{x}" y="{start}" class="{css_class}" text-anchor="{anchor}" '
        f'dominant-baseline="middle">{"".join(tspans)}</text>'
    )


def box(
    x: int,
    y: int,
    w: int,
    h: int,
    title: str,
    body: str = "",
    css: str = "box",
    title_css: str = "box-title",
    body_css: str = "box-body",
    chars: int = 22,
) -> str:
    body_text = svg_text(x + w // 2, y + h // 2 + (10 if body else 0), body, body_css, "middle", chars, 17, 4) if body else ""
    title_text = svg_text(x + w // 2, y + 23, title, title_css, "middle", chars, 17, 2)
    return f'<g><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" class="{css}"/>{title_text}{body_text}</g>'


def arrow(x1: int, y1: int, x2: int, y2: int, css: str = "arrow", label: str | None = None) -> str:
    label_svg = ""
    if label:
        label_svg = svg_text((x1 + x2) // 2, (y1 + y2) // 2 - 14, label, "arrow-label", "middle", 18, 15, 1)
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" class="{css}" marker-end="url(#arrow)"/>{label_svg}'


def make_svg(title: str, subtitle: str, width: int, height: int, body: str) -> str:
    return f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">
  <defs>
    <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,8 L11,4 z" fill="#334155"/>
    </marker>
  </defs>
  <style>
    svg {{ background: #ffffff; font-family: Calibri, Arial, sans-serif; }}
    .page-title {{ font-size: 34px; font-weight: 700; fill: #{INK}; }}
    .page-subtitle {{ font-size: 18px; fill: #475467; }}
    .box {{ fill: #ffffff; stroke: #{BORDER}; stroke-width: 1.8; }}
    .box-alt {{ fill: #f8fbff; stroke: #{BLUE}; stroke-width: 2; }}
    .box-good {{ fill: #f2fbf3; stroke: #{GREEN}; stroke-width: 2; }}
    .box-risk {{ fill: #fff7f7; stroke: #{RED}; stroke-width: 2; }}
    .box-warn {{ fill: #fff9e7; stroke: #{GOLD}; stroke-width: 2; }}
    .lane {{ fill: #f8fafc; stroke: #cbd5e1; stroke-width: 1.4; }}
    .box-title {{ font-size: 16px; font-weight: 700; fill: #{INK}; }}
    .box-body {{ font-size: 14px; fill: #344054; }}
    .lane-title {{ font-size: 18px; font-weight: 700; fill: #{DARK_BLUE}; }}
    .label {{ font-size: 15px; fill: #{INK}; }}
    .small {{ font-size: 13px; fill: #475467; }}
    .arrow {{ stroke: #334155; stroke-width: 2; fill: none; }}
    .arrow-soft {{ stroke: #64748b; stroke-width: 1.5; fill: none; stroke-dasharray: 8 7; }}
    .arrow-label {{ font-size: 12px; fill: #475467; paint-order: stroke; stroke: #fff; stroke-width: 5px; }}
  </style>
  <rect width="{width}" height="{height}" fill="#ffffff"/>
  <text x="50" y="55" class="page-title">{escape(title)}</text>
  <text x="50" y="86" class="page-subtitle">{escape(subtitle)}</text>
  {body}
</svg>'''


def write_diagram(name: str, title: str, subtitle: str, width: int, height: int, body: str) -> Path:
    svg_path = DIAGRAM_DIR / f"{name}.svg"
    html_path = DIAGRAM_DIR / f"{name}.html"
    png_path = DIAGRAM_DIR / f"{name}.png"
    svg = make_svg(title, subtitle, width, height, body)
    svg_path.write_text(svg, encoding="utf-8")
    html_path.write_text(
        f'<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0;background:#fff;width:{width}px;height:{height}px;overflow:hidden}}svg{{display:block}}</style></head><body>{svg}</body></html>',
        encoding="utf-8",
    )
    if CHROME.exists():
        subprocess.run(
            [
                str(CHROME),
                "--headless=new",
                "--disable-gpu",
                "--hide-scrollbars",
                f"--window-size={width},{height}",
                f"--screenshot={png_path}",
                html_path.as_uri(),
            ],
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
    return png_path if png_path.exists() else svg_path


def build_diagrams() -> dict[str, Path]:
    diagrams: dict[str, Path] = {}

    trace_rows = [
        ("Goal 1\nSell shoes online", "BR-01\nCatalog & cart", "FR-01..FR-06\nBrowse, detail, cart", "UC-01..UC-08", "AC-CATALOG\nAC-CART"),
        ("Goal 2\nSecure payment", "BR-04\nPayOS + Visa", "FR-07..FR-11\nCheckout, Stripe, webhook", "UC-09..UC-12", "AC-CHECKOUT\nAC-PAYMENT"),
        ("Goal 3\nOrder service", "BR-06\nTrack, email, refund", "FR-12..FR-15\nOrder, email, cancel/refund", "UC-13, UC-19\nUC-38, UC-76", "AC-ORDER\nAC-REFUND"),
        ("Goal 4\nOperate store", "BR-08\nAdmin operations", "FR-16..FR-20\nProduct, inventory, analytics", "UC-25..UC-75", "AC-ADMIN\nAC-REPORT"),
    ]
    col_x = [55, 350, 645, 940, 1235]
    headers = ["Business Goals", "BRD Requirements", "SRS Requirements", "Stories / Use Cases", "Acceptance Criteria"]
    parts = []
    for x, h in zip(col_x, headers):
        parts.append(box(x, 125, 240, 56, h, "", "box-alt", chars=22))
    for row_idx, row in enumerate(trace_rows):
        y = 220 + row_idx * 125
        for col_idx, value in enumerate(row):
            css = "box-good" if col_idx == 4 else "box"
            parts.append(box(col_x[col_idx], y, 240, 86, value.split("\n")[0], "\n".join(value.split("\n")[1:]), css, chars=24))
            if col_idx < 4:
                parts.append(arrow(col_x[col_idx] + 240, y + 43, col_x[col_idx + 1], y + 43))
    diagrams["traceability"] = write_diagram(
        "requirements_traceability_map",
        "Requirements Traceability Map",
        "Luồng liên kết từ mục tiêu kinh doanh đến yêu cầu, use case, tiêu chí nghiệm thu và kiểm thử.",
        1530,
        760,
        "\n".join(parts),
    )

    context = []
    context.append(box(630, 270, 300, 130, "NestJS Backend API", "Auth, Shoes, Payments, Orders, Inventory, Returns, Reviews, Wishlist, Chat, Analytics", "box-alt", chars=24))
    context.append(box(260, 270, 260, 130, "Vue Storefront", "Home, listing, product detail, bag, checkout, account, order tracking", "box", chars=23))
    context.append(box(1010, 270, 260, 130, "MongoDB", "Users, products, bills, stock, returns, chat, reviews", "box", chars=22))
    context.append(box(65, 165, 190, 95, "Guest / User", "Browse, buy, track, review, chat", "box-good", chars=20))
    context.append(box(65, 415, 190, 95, "Admin / Manager", "Operate catalog, orders, inventory, coupons, support", "box-good", chars=20))
    context.append(box(1010, 105, 240, 90, "PayOS", "Bank transfer / QR", "box-warn", chars=20))
    context.append(box(1290, 105, 240, 90, "Stripe", "Visa / Mastercard cards", "box-warn", chars=20))
    context.append(box(1010, 465, 240, 90, "Gmail SMTP", "Order, shipment, refund emails", "box", chars=20))
    context.append(box(1290, 465, 240, 90, "Cloudflare R2", "Product images and review media", "box", chars=20))
    context.extend(
        [
            arrow(255, 215, 260, 312, label="uses"),
            arrow(255, 465, 260, 352, label="admin"),
            arrow(520, 335, 630, 335, label="REST"),
            arrow(930, 335, 1010, 335, label="Mongoose"),
            arrow(930, 294, 1010, 150, label="PayOS API"),
            arrow(930, 310, 1290, 150, label="Stripe API"),
            arrow(930, 373, 1010, 510, label="email"),
            arrow(930, 392, 1290, 510, label="media"),
        ]
    )
    diagrams["context"] = write_diagram(
        "system_context_diagram",
        "System Context Diagram",
        "Các actor, hệ thống chính và dịch vụ tích hợp của Shoes Ecommerce.",
        1580,
        650,
        "\n".join(context),
    )

    flow = []
    lanes = [("Customer", 120), ("Frontend", 360), ("Backend API", 600), ("Payment Provider", 840), ("Email / Order", 1080)]
    for label, x in lanes:
        flow.append(f'<rect x="{x}" y="120" width="185" height="660" rx="12" class="lane"/>')
        flow.append(svg_text(x + 92, 150, label, "lane-title", "middle", 18, 18, 2))
    nodes = [
        (120, 210, "Select items", "Choose size/color, add to bag", "box-good"),
        (360, 210, "Cart & checkout", "Validate customer, address, coupon", "box"),
        (600, 210, "Create order", "Reserve order data, verify stock, compute total", "box-alt"),
        (840, 210, "PayOS or Stripe", "Bank QR/transfer or Visa card intent", "box-warn"),
        (600, 390, "Webhook", "Verify signature and idempotency", "box-alt"),
        (1080, 390, "Paid order", "Mark PAID, reduce stock, clear bag", "box-good"),
        (1080, 560, "Notification", "Send confirmation email with secure order details", "box-good"),
        (360, 560, "Failure state", "Keep bag, show actionable error", "box-risk"),
    ]
    for x, y, title, body, css in nodes:
        flow.append(box(x, y, 185, 105, title, body, css, chars=18))
    flow.extend(
        [
            arrow(305, 262, 360, 262),
            arrow(545, 262, 600, 262),
            arrow(785, 262, 840, 262),
            arrow(932, 315, 692, 390, label="webhook"),
            arrow(785, 442, 1080, 442),
            arrow(1172, 495, 1172, 560),
            arrow(600, 315, 452, 560, "arrow-soft", "validation error"),
        ]
    )
    diagrams["checkout"] = write_diagram(
        "checkout_payment_flow",
        "Checkout & Payment Flow",
        "Quy trình thanh toán guest/user với PayOS, Stripe/Visa, webhook, email và xử lý lỗi.",
        1320,
        840,
        "\n".join(flow),
    )

    refund = []
    states = [
        (90, 250, "PAID + CONFIRMED", "Đã thanh toán, đơn vừa xác nhận", "box-good"),
        (350, 250, "PACKING", "Đang chuẩn bị hàng", "box-good"),
        (640, 155, "Cancel & refund allowed", "Khách nhập lý do, hệ thống hoàn stock", "box-alt"),
        (930, 155, "REFUNDED / REFUND_PENDING", "Stripe hoàn tự động, PayOS chờ thủ công", "box-good"),
        (640, 395, "SHIPPING", "Đã gửi đi, có vận đơn", "box-warn"),
        (930, 395, "DELIVERED", "Đã giao thành công", "box"),
        (350, 525, "Blocked cancel/refund", "Chỉ cho phép đổi trả theo return policy", "box-risk"),
    ]
    for x, y, title, body, css in states:
        refund.append(box(x, y, 220, 105, title, body, css, chars=23))
    refund.extend(
        [
            arrow(330, 302, 350, 302, label="admin updates"),
            arrow(535, 288, 640, 210, label="customer cancels"),
            arrow(820, 210, 930, 210, label="refund path"),
            arrow(535, 318, 640, 448, label="ship order"),
            arrow(820, 448, 930, 448, label="delivered"),
            arrow(640, 500, 535, 570, "arrow-soft", "cancel not allowed"),
        ]
    )
    diagrams["refund"] = write_diagram(
        "order_cancel_refund_flow",
        "Order Cancel & Refund State Flow",
        "Điều kiện nghiệp vụ: chỉ hủy/hoàn tiền khi đơn PAID còn ở CONFIRMED hoặc PACKING.",
        1240,
        720,
        "\n".join(refund),
    )

    admin = []
    admin.append(box(650, 315, 260, 110, "Admin Dashboard", "Revenue, orders, users, product KPIs", "box-alt", chars=22))
    modules = [
        (90, 150, "Product", "CRUD, variants, images, discounts"),
        (390, 150, "Orders", "View, detail, fulfillment, tracking"),
        (960, 150, "Inventory", "Stock overview, adjust, movement log"),
        (1260, 150, "Returns", "Approve, reject, process, complete"),
        (90, 500, "Coupons & Users", "Promo rules, roles, account status"),
        (390, 500, "Live Chat", "Open, reply, read, close"),
        (960, 500, "Analytics", "Revenue, order, product, user stats"),
        (1260, 500, "Media / R2", "Upload and reuse images"),
    ]
    for x, y, title, body in modules:
        admin.append(box(x, y, 235, 100, title, body, "box", chars=22))
        admin.append(arrow(650 if x < 650 else 910, 370, x + 117, y + 100 if y < 315 else y, "arrow-soft"))
    diagrams["admin"] = write_diagram(
        "admin_operations_map",
        "Admin Operations Map",
        "Nhóm chức năng quản trị cho product, order, inventory, returns, users, coupons, chat và analytics.",
        1550,
        720,
        "\n".join(admin),
    )

    return diagrams


USE_CASES = [
    ("UC-01", "Browsing & Discovery", "Guest, User", "Browse Products", "Xem danh sách sản phẩm ở trang chủ/listing."),
    ("UC-02", "Browsing & Discovery", "Guest, User", "Search/Filter Products", "Tìm, lọc theo category, color, size, price."),
    ("UC-03", "Browsing & Discovery", "Guest, User", "View Product Detail", "Xem ảnh, màu, size, giá, mô tả và review."),
    ("UC-04", "Browsing & Discovery", "Guest, User", "Check Stock Real-time", "Kiểm tra tồn kho theo màu và size."),
    ("UC-05", "Browsing & Discovery", "Guest, User", "View Reviews", "Xem rating và nhận xét của người mua."),
    ("UC-06", "Shopping Cart", "Guest, User", "Add Product to Cart", "Thêm sản phẩm đã chọn size/màu vào bag."),
    ("UC-07", "Shopping Cart", "Guest, User", "Manage Shopping Cart", "Tăng giảm số lượng, xóa item, tính lại tổng."),
    ("UC-08", "Shopping Cart", "Guest, User", "Apply Coupon Code", "Áp mã giảm giá hợp lệ trước thanh toán."),
    ("UC-09", "Checkout & Payment", "Guest", "Guest Checkout", "Mua hàng không cần tài khoản, nhập thông tin giao hàng."),
    ("UC-10", "Checkout & Payment", "Guest, User, PayOS", "PayOS Payment Processing", "Thanh toán qua QR/chuyển khoản ngân hàng."),
    ("UC-11", "Checkout & Payment", "Guest, User, Stripe", "Stripe/Visa Payment Processing", "Thanh toán bằng thẻ Visa/Mastercard qua Stripe."),
    ("UC-12", "Checkout & Payment", "PayOS, Stripe, System", "Receive Payment Webhook", "Xác thực webhook, cập nhật PAID, trừ kho, gửi email."),
    ("UC-13", "Order Tracking", "Guest", "Track Order by Email + Order Code", "Tra cứu đơn guest bằng email và mã đơn."),
    ("UC-14", "Account Management", "Guest", "Register New Account", "Tạo tài khoản, validate email/username/password."),
    ("UC-15", "Account Management", "Guest", "User Login", "Đăng nhập, nhận access/refresh token."),
    ("UC-16", "Account Management", "User", "Manage User Profile", "Cập nhật họ tên, số điện thoại, avatar."),
    ("UC-17", "Account Management", "User", "Manage Addresses", "Thêm/sửa/xóa địa chỉ và đặt mặc định."),
    ("UC-18", "Checkout & Payment", "User", "User Checkout", "Checkout khi đã đăng nhập, dùng profile/address lưu sẵn."),
    ("UC-19", "Order Tracking", "User", "View Order History", "Xem lịch sử mua hàng trong tài khoản."),
    ("UC-20", "Reviews & Returns", "User", "Write Product Review", "Review sản phẩm đã mua, rating và ảnh."),
    ("UC-21", "Reviews & Returns", "User", "Create Return Request", "Tạo yêu cầu trả/đổi/hoàn tiền."),
    ("UC-22", "Reviews & Returns", "User", "Track Return Status", "Theo dõi trạng thái yêu cầu đổi trả."),
    ("UC-23", "Wishlist", "User", "Manage Wishlist", "Lưu/xóa sản phẩm yêu thích, thêm vào cart."),
    ("UC-24", "Live Chat", "User", "Start Chat with Support", "Mở cuộc trò chuyện với hỗ trợ."),
    ("UC-25", "Admin - Product Management", "Admin", "Create New Product", "Tạo product với variant màu/size/tồn kho."),
    ("UC-26", "Admin - Product Management", "Admin", "Update Product", "Cập nhật sản phẩm, giá, ảnh, stock."),
    ("UC-27", "Admin - Product Management", "Admin", "Soft Delete Product", "Ẩn sản phẩm khỏi store mà giữ dữ liệu."),
    ("UC-28", "Admin - Product Management", "Admin", "Manage Colors & Sizes", "Quản lý biến thể màu và size."),
    ("UC-29", "Admin - Product Management", "Admin", "Upload Product Images", "Upload ảnh lên Cloudflare R2."),
    ("UC-30", "Admin - Product Management", "Admin", "Browse R2 Media", "Chọn lại ảnh đã upload trong R2."),
    ("UC-31", "Admin - Product Management", "Admin", "Set Discount Price", "Thiết lập giá sale theo sản phẩm."),
    ("UC-32", "Admin - Order & Inventory", "Admin, Manager", "View All Orders", "Xem danh sách toàn bộ đơn hàng."),
    ("UC-33", "Admin - Order & Inventory", "Admin, Manager", "Filter/Search Orders", "Lọc order theo status, ngày, từ khóa."),
    ("UC-34", "Admin - Order & Inventory", "Admin, Manager", "View Order Detail", "Xem đầy đủ thông tin đơn, khách, thanh toán, item."),
    ("UC-35", "Admin - Order & Inventory", "Admin, Manager", "Update Fulfillment Status", "Chuyển trạng thái chuẩn bị, giao, hoàn tất."),
    ("UC-36", "Admin - Order & Inventory", "Admin, Manager", "Add Carrier + Tracking", "Thêm hãng vận chuyển và mã tracking."),
    ("UC-37", "Admin - Order & Inventory", "Admin, Manager", "Add Order Note", "Ghi chú nội bộ vào đơn hàng."),
    ("UC-38", "Admin - Order & Inventory", "System", "Send Order Status Email", "Gửi email khi trạng thái đơn thay đổi."),
    ("UC-39", "Admin - Order & Inventory", "Admin, Manager", "Cancel Order", "Admin hủy đơn hợp lệ và hoàn stock."),
    ("UC-40", "Admin - Inventory", "Admin, Manager", "View Inventory Overview", "Xem tổng quan tồn kho."),
    ("UC-41", "Admin - Inventory", "Admin, Manager", "View Low Stock Alert", "Xem cảnh báo sắp hết hàng."),
    ("UC-42", "Admin - Inventory", "Admin, Manager", "View Stock by Product", "Xem tồn kho chi tiết theo product/color/size."),
    ("UC-43", "Admin - Inventory", "Admin, Manager", "Adjust Stock (IN/OUT/ADJUST)", "Điều chỉnh tồn kho và ghi audit trail."),
    ("UC-44", "Admin - Inventory", "Admin, Manager", "View Stock Movements", "Xem lịch sử biến động tồn kho."),
    ("UC-45", "Admin - Inventory", "Admin, Manager", "Export Inventory Report", "Xuất báo cáo tồn kho."),
    ("UC-46", "Admin - Returns", "Admin, Manager", "View Return Requests", "Xem danh sách yêu cầu đổi trả."),
    ("UC-47", "Admin - Returns", "Admin, Manager", "View Return Request Detail", "Xem chi tiết yêu cầu đổi trả."),
    ("UC-48", "Admin - Returns", "Admin, Manager", "Approve Return Request", "Duyệt yêu cầu đổi trả."),
    ("UC-49", "Admin - Returns", "Admin, Manager", "Reject Return Request", "Từ chối yêu cầu đổi trả."),
    ("UC-50", "Admin - Returns", "Admin, Manager", "Process Return Request", "Chuyển yêu cầu sang đang xử lý."),
    ("UC-51", "Admin - Returns", "Admin, Manager", "Complete Return Request", "Hoàn tất yêu cầu đổi trả."),
    ("UC-52", "Admin - Returns", "System", "Notify User Return Status", "Gửi email cập nhật đổi trả."),
    ("UC-53", "Admin - Coupons & Users", "Admin, Manager", "Create Coupon", "Tạo coupon theo % hoặc số tiền."),
    ("UC-54", "Admin - Coupons & Users", "Admin, Manager", "Update Coupon", "Cập nhật điều kiện coupon."),
    ("UC-55", "Admin - Coupons & Users", "Admin, Manager", "Delete Coupon", "Xóa/vô hiệu hóa coupon."),
    ("UC-56", "Admin - Coupons & Users", "Admin, Manager", "View Coupons List", "Xem danh sách coupon."),
    ("UC-57", "Admin - Coupons & Users", "Admin", "View Users List", "Xem danh sách người dùng."),
    ("UC-58", "Admin - Coupons & Users", "Admin", "View User Detail", "Xem thông tin chi tiết user."),
    ("UC-59", "Admin - Coupons & Users", "Admin", "Change User Role", "Đổi role user theo RBAC."),
    ("UC-60", "Admin - Coupons & Users", "Admin", "Disable User", "Khóa tài khoản người dùng."),
    ("UC-61", "Admin - Analytics", "Admin, Manager", "View Dashboard Overview", "Xem doanh thu, đơn hàng, sản phẩm, user."),
    ("UC-62", "Admin - Analytics", "Admin, Manager", "View Revenue Stats", "Xem biểu đồ doanh thu."),
    ("UC-63", "Admin - Analytics", "Admin, Manager", "View Order Stats", "Xem thống kê đơn hàng."),
    ("UC-64", "Admin - Analytics", "Admin, Manager", "View Product Stats", "Xem thống kê sản phẩm bán chạy."),
    ("UC-65", "Admin - Analytics", "Admin", "View User Stats", "Xem thống kê người dùng."),
    ("UC-66", "Admin - Analytics", "Admin, Manager", "Filter by Date Range", "Lọc dashboard theo thời gian."),
    ("UC-67", "Admin - Analytics", "Admin", "Export Analytics Report", "Xuất báo cáo analytics."),
    ("UC-68", "Live Chat", "Guest", "Open Chat Widget (Guest)", "Guest nhập tên/email để mở chat."),
    ("UC-69", "Live Chat", "Guest, User", "Send Chat Message", "Gửi tin nhắn hỗ trợ."),
    ("UC-70", "Live Chat", "Guest, User", "Receive Chat Reply", "Nhận phản hồi từ admin/support."),
    ("UC-71", "Admin - Chat", "Admin, Manager", "View Open Conversations", "Xem hội thoại đang mở."),
    ("UC-72", "Admin - Chat", "Admin, Manager", "Open Conversation (Admin)", "Mở chi tiết hội thoại."),
    ("UC-73", "Admin - Chat", "Admin, Manager", "Reply to Customer Chat", "Trả lời khách hàng."),
    ("UC-74", "Admin - Chat", "Admin, Manager", "Mark Conversation Read", "Đánh dấu hội thoại đã đọc."),
    ("UC-75", "Admin - Chat", "Admin, Manager", "Close Conversation", "Đóng hội thoại hỗ trợ."),
    ("UC-76", "Order Tracking", "Guest, User", "Cancel Paid Order and Request Refund", "Hủy đơn PAID khi còn chuẩn bị hàng và hoàn tiền."),
]


BRD_REQUIREMENTS = [
    ("BR-01", "Catalog", "Khách hàng xem, tìm kiếm, lọc và đọc chi tiết sản phẩm giày/thời trang.", "High"),
    ("BR-02", "Shopping cart", "Khách có thể thêm, chỉnh số lượng, áp coupon và giữ bag ổn định khi lỗi thanh toán.", "High"),
    ("BR-03", "Guest checkout", "Khách không cần tài khoản vẫn mua được và tra cứu lịch sử bằng email + mã đơn.", "High"),
    ("BR-04", "Dual payment", "Hỗ trợ PayOS cho ngân hàng Việt Nam và Stripe cho thẻ Visa/Mastercard.", "High"),
    ("BR-05", "Secure notification", "Email chỉ gửi thông tin cần thiết, không lộ dữ liệu nhạy cảm thẻ/ngân hàng.", "High"),
    ("BR-06", "Order lifecycle", "Đơn hàng có trạng thái rõ ràng từ paid, packing, shipping, delivered, cancelled/refunded.", "High"),
    ("BR-07", "Refund policy", "Chỉ cho hủy/hoàn tiền khi đơn đã thanh toán và còn đang chuẩn bị hàng.", "High"),
    ("BR-08", "Admin operations", "Admin quản lý product, order, inventory, returns, coupon, user, chat và analytics.", "High"),
    ("BR-09", "Wishlist/reviews/returns", "Tăng trải nghiệm mua sắm bằng yêu thích, review sau mua, đổi trả.", "Medium"),
    ("BR-10", "Support chat", "Khách có kênh liên hệ nhanh và admin quản lý hội thoại.", "Medium"),
    ("BR-11", "Media storage", "Ảnh sản phẩm/review dùng Cloudflare R2 để lưu trữ và phục vụ nhanh.", "Medium"),
    ("BR-12", "Auditability", "Các thao tác tồn kho, trạng thái đơn, hoàn tiền cần có lịch sử để truy vết.", "High"),
]


FUNCTIONAL_REQUIREMENTS = [
    ("FR-01", "Product listing", "Hệ thống phải hiển thị danh sách sản phẩm với ảnh, giá, màu, rating và trạng thái hàng.", "UC-01"),
    ("FR-02", "Search and filter", "Hệ thống phải lọc theo category, color, size, price và text search.", "UC-02"),
    ("FR-03", "Product detail", "Hệ thống phải hiển thị gallery, variant, size, stock, mô tả và review.", "UC-03, UC-04, UC-05"),
    ("FR-04", "Cart", "Hệ thống phải thêm/xóa/sửa số lượng và tính tổng tiền, coupon, discount.", "UC-06, UC-07, UC-08"),
    ("FR-05", "Guest checkout", "Hệ thống phải nhận thông tin guest và tạo đơn không cần đăng nhập.", "UC-09, UC-13"),
    ("FR-06", "Logged-in checkout", "Hệ thống phải prefill profile/address và lưu lịch sử đơn cho user.", "UC-18, UC-19"),
    ("FR-07", "PayOS payment", "Hệ thống phải tạo payment link/QR, verify webhook và cập nhật PAID.", "UC-10, UC-12"),
    ("FR-08", "Stripe card payment", "Hệ thống phải tạo PaymentIntent, xác nhận thẻ và verify Stripe webhook.", "UC-11, UC-12"),
    ("FR-09", "Order email", "Hệ thống phải gửi email xác nhận, cập nhật shipping, cancel/refund.", "UC-38, UC-52, UC-76"),
    ("FR-10", "Order tracking", "Hệ thống phải cho guest/user xem trạng thái và chi tiết đơn.", "UC-13, UC-19"),
    ("FR-11", "Cancel/refund", "Hệ thống phải cho khách hủy/hoàn tiền khi PAID và CONFIRMED/PACKING.", "UC-76"),
    ("FR-12", "Wishlist", "Hệ thống phải cho user quản lý wishlist và chuyển item sang cart.", "UC-23"),
    ("FR-13", "Review", "Hệ thống phải cho user đã mua sản phẩm viết review kèm ảnh.", "UC-20"),
    ("FR-14", "Returns", "Hệ thống phải cho user tạo/track return và admin xử lý return.", "UC-21, UC-22, UC-46..UC-52"),
    ("FR-15", "Live chat", "Hệ thống phải hỗ trợ chat guest/user và quản trị hội thoại.", "UC-24, UC-68..UC-75"),
    ("FR-16", "Product admin", "Admin phải CRUD product, variants, images, discount.", "UC-25..UC-31"),
    ("FR-17", "Order admin", "Admin phải xem, lọc, cập nhật fulfillment, tracking và note.", "UC-32..UC-39"),
    ("FR-18", "Inventory admin", "Admin phải xem, cảnh báo, điều chỉnh và audit stock movement.", "UC-40..UC-45"),
    ("FR-19", "Coupon/user admin", "Admin phải quản lý coupon, users, roles và disable account.", "UC-53..UC-60"),
    ("FR-20", "Analytics", "Admin phải xem/export dashboard theo doanh thu, đơn, sản phẩm, user.", "UC-61..UC-67"),
]


NFRS = [
    ("NFR-01", "Security", "JWT bảo vệ API, RBAC cho admin/manager, không log card data, verify webhook signature."),
    ("NFR-02", "Privacy", "Email/order detail chỉ chứa dữ liệu cần thiết; không gửi số thẻ, secret, token hoặc thông tin nhạy cảm."),
    ("NFR-03", "Reliability", "Webhook xử lý idempotent; lỗi email không làm fail thanh toán đã thành công."),
    ("NFR-04", "Usability", "Bag không bị xóa nếu thanh toán lỗi; lỗi phải rõ ràng và có hành động tiếp theo."),
    ("NFR-05", "Performance", "Product listing dùng lazy/virtual loading; API phân trang cho admin order/user/coupon."),
    ("NFR-06", "Maintainability", "Backend module hóa theo auth, shoes, payment, inventory, returns, reviews, wishlist, chat, analytics."),
    ("NFR-07", "Observability", "Log webhook, email, refund, inventory movement và fulfillment history."),
    ("NFR-08", "Scalability", "Media dùng R2, frontend/backend container hóa và có hướng tách microservice."),
    ("NFR-09", "Data integrity", "Stock phải giảm sau khi payment PAID và hoàn lại khi cancel/refund hợp lệ."),
    ("NFR-10", "Compatibility", "Stripe Elements chạy trên trình duyệt hiện đại; PayOS redirect hoạt động với mobile/desktop."),
]


ACCEPTANCE_CRITERIA = [
    ("AC-CATALOG-01", "Product listing", "Given khách mở store, When API trả sản phẩm, Then danh sách hiển thị ảnh, tên, giá, màu và rating."),
    ("AC-CATALOG-02", "Product detail", "Given khách chọn product, When vào detail, Then có gallery, color/size picker, stock và reviews."),
    ("AC-CART-01", "Cart", "Given khách thêm item còn hàng, When bấm Add to Bag, Then item xuất hiện trong bag và lưu localStorage."),
    ("AC-CART-02", "Cart", "Given stock không đủ, When tăng quantity quá tồn kho, Then hệ thống chặn và thông báo rõ."),
    ("AC-COUPON-01", "Coupon", "Given coupon hợp lệ, When apply ở cart/checkout, Then total giảm đúng theo rule."),
    ("AC-CHECKOUT-01", "Guest checkout", "Given guest nhập đủ email/phone/address, When đặt hàng, Then order được tạo và đi đến payment."),
    ("AC-CHECKOUT-02", "Logged-in checkout", "Given user đăng nhập, When checkout, Then profile/address được prefill và order lưu vào lịch sử."),
    ("AC-PAYOS-01", "PayOS", "Given PayOS callback hợp lệ, When webhook đến, Then order thành PAID, trừ stock và gửi email."),
    ("AC-STRIPE-01", "Stripe/Visa", "Given thẻ thanh toán thành công, When Stripe webhook verified, Then order thành PAID và bag bị clear sau khi confirm."),
    ("AC-PAYMENT-ERR-01", "Payment error", "Given payment bị lỗi hoặc blocked, When confirm thất bại, Then bag vẫn giữ nguyên và user thấy lỗi dễ hiểu."),
    ("AC-ORDER-01", "Guest order tracking", "Given guest có email và mã đơn đúng, When tra cứu, Then hiển thị trạng thái và item của đơn."),
    ("AC-ORDER-02", "User order history", "Given user đăng nhập đã mua hàng, When vào My Orders, Then thấy lịch sử và mở được detail."),
    ("AC-REFUND-01", "Cancel/refund allowed", "Given order PAID và fulfillment CONFIRMED/PACKING, When customer hủy, Then status CANCELLED và refund được tạo."),
    ("AC-REFUND-02", "Cancel/refund blocked", "Given order SHIPPING/DELIVERED, When customer hủy, Then hệ thống chặn và giải thích không thể hoàn tiền tự động."),
    ("AC-EMAIL-01", "Secure email", "Given order thay đổi trạng thái, When gửi Gmail, Then email không chứa số thẻ, secret, token hoặc link nhạy cảm."),
    ("AC-WISHLIST-01", "Wishlist", "Given user bấm icon tim, When item chưa có trong wishlist, Then item được lưu và hiển thị ở wishlist page."),
    ("AC-REVIEW-01", "Review", "Given user đã mua sản phẩm, When gửi rating/comment, Then review được lưu và cập nhật rating trung bình."),
    ("AC-RETURN-01", "Returns", "Given user tạo return request, When admin approve/reject/process/complete, Then user nhận được trạng thái mới."),
    ("AC-CHAT-01", "Live chat", "Given guest/user gửi tin nhắn, When admin mở chat, Then thấy conversation và trả lời được."),
    ("AC-ADMIN-PRODUCT-01", "Admin products", "Given admin tạo/cập nhật product, When lưu, Then storefront hiển thị dữ liệu mới đúng variant."),
    ("AC-ADMIN-ORDER-01", "Admin orders", "Given admin chuyển PACKING -> SHIPPING, When nhập carrier/tracking, Then order history và email có tracking."),
    ("AC-INVENTORY-01", "Inventory", "Given admin adjust stock, When quantity hợp lệ, Then stock thay đổi và movement log được ghi."),
    ("AC-COUPON-ADMIN-01", "Admin coupons", "Given admin tạo coupon trùng code, When submit, Then hệ thống trả lỗi conflict."),
    ("AC-USER-ADMIN-01", "Admin users", "Given admin đổi role user khác, When submit hợp lệ, Then role cập nhật và không cho tự đổi role chính mình."),
    ("AC-ANALYTICS-01", "Analytics", "Given admin chọn date range, When dashboard load, Then metrics/charts phản ánh đúng khoảng thời gian."),
]


USER_STORIES = [
    ("US-01", "Guest", "xem nhanh các sản phẩm nổi bật", "tìm được sản phẩm phù hợp mà không cần đăng nhập", "UC-01"),
    ("US-02", "Guest", "lọc giày theo màu, size và giá", "rút ngắn thời gian tìm kiếm", "UC-02"),
    ("US-03", "Guest", "xem chi tiết size, tồn kho và review", "tự tin trước khi thêm vào bag", "UC-03..UC-05"),
    ("US-04", "Guest", "mua hàng không cần tài khoản", "checkout nhanh", "UC-09"),
    ("US-05", "Guest", "tra cứu đơn bằng email và mã đơn", "biết trạng thái sau khi mua", "UC-13"),
    ("US-06", "User", "đăng ký và đăng nhập", "quản lý hồ sơ và lịch sử mua", "UC-14..UC-17"),
    ("US-07", "User", "lưu địa chỉ mặc định", "checkout ít nhập liệu hơn", "UC-17, UC-18"),
    ("US-08", "User", "xem lịch sử mua hàng", "theo dõi các đơn đã thanh toán", "UC-19"),
    ("US-09", "User", "hủy đơn và nhận hoàn tiền khi đơn còn chuẩn bị", "xử lý nhầm size/màu kịp thời", "UC-76"),
    ("US-10", "User", "lưu sản phẩm yêu thích", "quay lại mua sau dễ hơn", "UC-23"),
    ("US-11", "User", "review sản phẩm đã mua", "chia sẻ trải nghiệm cho khách khác", "UC-20"),
    ("US-12", "User", "tạo yêu cầu đổi trả", "được hỗ trợ sau bán hàng", "UC-21, UC-22"),
    ("US-13", "Guest/User", "nhắn support", "được giải đáp trước và sau khi mua", "UC-24, UC-68..UC-70"),
    ("US-14", "Admin", "tạo và cập nhật sản phẩm nhiều biến thể", "catalog luôn chính xác", "UC-25..UC-31"),
    ("US-15", "Admin", "theo dõi đơn và cập nhật vận chuyển", "khách biết tiến độ giao hàng", "UC-32..UC-38"),
    ("US-16", "Admin", "quản lý tồn kho và cảnh báo low stock", "tránh bán quá hàng", "UC-40..UC-45"),
    ("US-17", "Admin", "xử lý return/refund", "dịch vụ hậu mãi minh bạch", "UC-46..UC-52"),
    ("US-18", "Admin", "quản lý coupon", "chạy chiến dịch giảm giá an toàn", "UC-53..UC-56"),
    ("US-19", "Admin", "quản lý user và role", "bảo vệ quyền truy cập hệ thống", "UC-57..UC-60"),
    ("US-20", "Manager", "xem analytics theo ngày", "ra quyết định nhập hàng và marketing", "UC-61..UC-67"),
    ("US-21", "Admin/Manager", "trả lời live chat", "không bỏ sót khách cần hỗ trợ", "UC-71..UC-75"),
]


def set_cell_text(cell, value: str, bold: bool = False, color: str | None = None) -> None:
    cell.text = ""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run(str(value))
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
    run._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
    run.font.size = Pt(9.5)
    run.bold = bold
    if color:
        run.font.color.rgb = RGBColor.from_string(color)


def shade_cell(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top: int = 80, start: int = 120, bottom: int = 80, end: int = 120) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    tc_mar = tc_pr.find(qn("w:tcMar"))
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for name, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{name}"))
        if node is None:
            node = OxmlElement(f"w:{name}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def set_table_geometry(table, widths: list[int]) -> None:
    table.alignment = WD_TABLE_ALIGNMENT.LEFT
    table.autofit = False
    tbl = table._tbl
    tbl_pr = tbl.tblPr
    tbl_w = tbl_pr.find(qn("w:tblW"))
    if tbl_w is None:
        tbl_w = OxmlElement("w:tblW")
        tbl_pr.append(tbl_w)
    tbl_w.set(qn("w:w"), str(sum(widths)))
    tbl_w.set(qn("w:type"), "dxa")

    tbl_ind = tbl_pr.find(qn("w:tblInd"))
    if tbl_ind is None:
        tbl_ind = OxmlElement("w:tblInd")
        tbl_pr.append(tbl_ind)
    tbl_ind.set(qn("w:w"), "120")
    tbl_ind.set(qn("w:type"), "dxa")

    tbl_layout = tbl_pr.find(qn("w:tblLayout"))
    if tbl_layout is None:
        tbl_layout = OxmlElement("w:tblLayout")
        tbl_pr.append(tbl_layout)
    tbl_layout.set(qn("w:type"), "fixed")

    borders = tbl_pr.find(qn("w:tblBorders"))
    if borders is None:
        borders = OxmlElement("w:tblBorders")
        tbl_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = qn(f"w:{edge}")
        el = borders.find(tag)
        if el is None:
            el = OxmlElement(f"w:{edge}")
            borders.append(el)
        el.set(qn("w:val"), "single")
        el.set(qn("w:sz"), "6")
        el.set(qn("w:space"), "0")
        el.set(qn("w:color"), BORDER)

    grid = tbl.tblGrid
    if grid is None:
        grid = OxmlElement("w:tblGrid")
        tbl.insert(0, grid)
    for child in list(grid):
        grid.remove(child)
    for width in widths:
        col = OxmlElement("w:gridCol")
        col.set(qn("w:w"), str(width))
        grid.append(col)

    for row in table.rows:
        for idx, cell in enumerate(row.cells):
            cell.width = Inches(widths[idx] / 1440)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            set_cell_margins(cell)
            tc_pr = cell._tc.get_or_add_tcPr()
            tc_w = tc_pr.find(qn("w:tcW"))
            if tc_w is None:
                tc_w = OxmlElement("w:tcW")
                tc_pr.append(tc_w)
            tc_w.set(qn("w:w"), str(widths[idx]))
            tc_w.set(qn("w:type"), "dxa")


def add_table(doc: Document, headers: list[str], rows: list[tuple], widths: list[int]) -> None:
    table = doc.add_table(rows=1, cols=len(headers))
    set_table_geometry(table, widths)
    header_cells = table.rows[0].cells
    for idx, header in enumerate(headers):
        shade_cell(header_cells[idx], LIGHT_FILL)
        set_cell_text(header_cells[idx], header, bold=True, color=INK)
    for row_values in rows:
        cells = table.add_row().cells
        for idx, value in enumerate(row_values):
            set_cell_text(cells[idx], str(value))
    set_table_geometry(table, widths)
    doc.add_paragraph()


def set_run_font(run, size: float = 11, color: str | None = None, bold: bool | None = None, italic: bool | None = None) -> None:
    run.font.name = "Calibri"
    run._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
    run._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    run.font.size = Pt(size)
    if color:
        run.font.color.rgb = RGBColor.from_string(color)
    if bold is not None:
        run.bold = bold
    if italic is not None:
        run.italic = italic


def set_paragraph_border_bottom(paragraph, color: str = BLUE) -> None:
    p_pr = paragraph._p.get_or_add_pPr()
    p_bdr = p_pr.find(qn("w:pBdr"))
    if p_bdr is None:
        p_bdr = OxmlElement("w:pBdr")
        p_pr.append(p_bdr)
    bottom = p_bdr.find(qn("w:bottom"))
    if bottom is None:
        bottom = OxmlElement("w:bottom")
        p_bdr.append(bottom)
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), "12")
    bottom.set(qn("w:space"), "6")
    bottom.set(qn("w:color"), color)


def configure_styles(doc: Document) -> None:
    section = doc.sections[0]
    section.page_width = Inches(8.5)
    section.page_height = Inches(11)
    section.top_margin = Inches(1)
    section.right_margin = Inches(1)
    section.bottom_margin = Inches(1)
    section.left_margin = Inches(1)
    section.header_distance = Inches(0.492)
    section.footer_distance = Inches(0.492)

    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = "Calibri"
    normal._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
    normal._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), "Calibri")
    normal.font.size = Pt(11)
    normal.paragraph_format.space_before = Pt(0)
    normal.paragraph_format.space_after = Pt(6)
    normal.paragraph_format.line_spacing = 1.10

    for style_name, size, color, before, after in [
        ("Title", 22, INK, 0, 6),
        ("Subtitle", 12, MUTED, 0, 12),
        ("Heading 1", 16, BLUE, 16, 8),
        ("Heading 2", 13, BLUE, 12, 6),
        ("Heading 3", 12, DARK_BLUE, 8, 4),
    ]:
        st = styles[style_name]
        st.font.name = "Calibri"
        st._element.rPr.rFonts.set(qn("w:ascii"), "Calibri")
        st._element.rPr.rFonts.set(qn("w:hAnsi"), "Calibri")
        st.font.size = Pt(size)
        st.font.color.rgb = RGBColor.from_string(color)
        st.paragraph_format.space_before = Pt(before)
        st.paragraph_format.space_after = Pt(after)
        st.paragraph_format.line_spacing = 1.10

    for list_style in ["List Bullet", "List Number"]:
        st = styles[list_style]
        st.font.name = "Calibri"
        st.font.size = Pt(11)
        st.paragraph_format.left_indent = Inches(0.5)
        st.paragraph_format.first_line_indent = Inches(-0.25)
        st.paragraph_format.space_after = Pt(8)
        st.paragraph_format.line_spacing = 1.167


def add_header_footer(doc: Document, short_title: str) -> None:
    section = doc.sections[0]
    header = section.header.paragraphs[0]
    header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run = header.add_run(f"Shoes Ecommerce Requirements | {short_title}")
    set_run_font(run, 9, MUTED)
    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = footer.add_run("Confidential project documentation")
    set_run_font(run, 9, MUTED)


def add_masthead(doc: Document, title: str, subtitle: str, doc_type: str) -> None:
    p = doc.add_paragraph()
    p.style = "Title"
    r = p.add_run(title)
    set_run_font(r, 22, INK, True)
    p = doc.add_paragraph()
    p.style = "Subtitle"
    r = p.add_run(subtitle)
    set_run_font(r, 12, MUTED)
    rows = [
        ("Project", "Shoes Ecommerce / fashion store"),
        ("Document type", doc_type),
        ("Version", "1.0"),
        ("Date", TODAY),
        ("Prepared for", "Business, development and testing review"),
    ]
    for label, value in rows:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(2)
        lr = p.add_run(f"{label}: ")
        set_run_font(lr, 10.5, INK, True)
        vr = p.add_run(value)
        set_run_font(vr, 10.5, INK)
    rule = doc.add_paragraph()
    set_paragraph_border_bottom(rule)


def add_callout(doc: Document, title: str, body: str) -> None:
    table = doc.add_table(rows=1, cols=1)
    set_table_geometry(table, [9360])
    cell = table.rows[0].cells[0]
    shade_cell(cell, CALLOUT_FILL)
    cell.text = ""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run(title)
    set_run_font(r, 11, INK, True)
    p = cell.add_paragraph()
    p.paragraph_format.space_after = Pt(0)
    r = p.add_run(body)
    set_run_font(r, 10.5, INK)
    doc.add_paragraph()


def png_size(path: Path) -> tuple[int, int]:
    with path.open("rb") as f:
        signature = f.read(8)
        if signature != b"\x89PNG\r\n\x1a\n":
            return (1200, 800)
        length = struct.unpack(">I", f.read(4))[0]
        chunk_type = f.read(4)
        if chunk_type != b"IHDR":
            return (1200, 800)
        width, height = struct.unpack(">II", f.read(8))
        return width, height


def add_figure(doc: Document, path: Path, caption: str, max_width: float = 6.3, max_height: float = 6.4) -> None:
    if not path.exists() or path.suffix.lower() != ".png":
        return
    width_px, height_px = png_size(path)
    ratio = width_px / max(1, height_px)
    width_in = min(max_width, max_height * ratio)
    height_in = width_in / ratio
    if height_in > max_height:
        height_in = max_height
        width_in = height_in * ratio
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.add_run().add_picture(str(path), width=Inches(width_in), height=Inches(height_in))
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(8)
    r = p.add_run(caption)
    set_run_font(r, 9.5, MUTED, italic=True)


def add_bullets(doc: Document, items: list[str]) -> None:
    for item in items:
        p = doc.add_paragraph(style="List Bullet")
        r = p.add_run(item)
        set_run_font(r, 10.5, INK)


def new_doc(short_title: str, title: str, subtitle: str, doc_type: str) -> Document:
    doc = Document()
    configure_styles(doc)
    add_header_footer(doc, short_title)
    add_masthead(doc, title, subtitle, doc_type)
    return doc


def save_doc(doc: Document, filename: str) -> Path:
    path = REQ_DIR / filename
    doc.save(path)
    return path


def build_brd(diagrams: dict[str, Path]) -> tuple[Path, Path]:
    doc = new_doc(
        "BRD",
        "Business Requirements Document (BRD)",
        "Yêu cầu nghiệp vụ cho hệ thống thương mại điện tử giày, quần áo và thời trang.",
        "Business Requirements Document",
    )
    doc.add_heading("1. Business Context", level=1)
    doc.add_paragraph(
        "Shoes Ecommerce là hệ thống bán hàng trực tuyến theo phong cách thời trang thể thao. "
        "Hệ thống cần hỗ trợ khách duyệt sản phẩm, mua hàng bằng ngân hàng Việt Nam hoặc thẻ quốc tế, "
        "theo dõi đơn, yêu thích sản phẩm, review, đổi trả và nhận hỗ trợ chat."
    )
    add_callout(
        doc,
        "Business outcome",
        "Mục tiêu chính là tạo một trải nghiệm mua hàng hoàn chỉnh từ catalog đến hậu mãi, đồng thời cung cấp bộ công cụ admin đủ để vận hành store hằng ngày.",
    )
    doc.add_heading("2. Stakeholders", level=1)
    add_table(
        doc,
        ["Stakeholder", "Need", "Success signal"],
        [
            ("Guest customer", "Mua hàng nhanh không cần tài khoản", "Checkout thành công và tra cứu đơn được"),
            ("Registered user", "Quản lý hồ sơ, wishlist, lịch sử mua", "Quay lại mua và theo dõi đơn dễ dàng"),
            ("Admin", "Quản lý catalog, order, inventory, return, coupon, user", "Ít thao tác thủ công, dữ liệu rõ ràng"),
            ("Manager", "Theo dõi doanh thu, đơn hàng và tồn kho", "Có dashboard và báo cáo theo ngày"),
            ("Payment providers", "Nhận request/webhook đúng chuẩn", "Webhook verify và xử lý idempotent"),
        ],
        [1900, 4200, 3260],
    )
    doc.add_heading("3. Scope", level=1)
    doc.add_heading("In scope", level=2)
    add_bullets(
        doc,
        [
            "Storefront: browsing, search/filter, product detail, cart, coupon, checkout, order tracking.",
            "Payments: PayOS bank transfer/QR and Stripe card payment, webhook verification and email confirmation.",
            "Account: registration, login, profile, addresses, order history.",
            "Post-purchase: wishlist, reviews, returns/exchanges, cancellation/refund while order is still being prepared.",
            "Admin: product, order, inventory, returns, coupons, users, analytics and live chat.",
        ],
    )
    doc.add_heading("Out of scope", level=2)
    add_bullets(
        doc,
        [
            "Marketplace multi-vendor settlement.",
            "Native mobile app; current target is responsive web.",
            "Automatic PayOS bank refund; PayOS refunds remain manual/pending unless provider API is added later.",
        ],
    )
    doc.add_heading("4. Business Requirements", level=1)
    add_table(doc, ["ID", "Area", "Requirement", "Priority"], BRD_REQUIREMENTS, [900, 1800, 5450, 1210])
    doc.add_heading("5. Business Rules", level=1)
    add_bullets(
        doc,
        [
            "A paid order can be cancelled/refunded by the customer only when fulfillment is CONFIRMED or PACKING.",
            "Orders already SHIPPING or DELIVERED cannot be cancelled/refunded automatically; customer must use return/exchange flow.",
            "Stock is reduced only after payment is confirmed as PAID by verified webhook or trusted payment confirmation.",
            "Stripe card details are never stored by the application; only provider references and safe metadata are kept.",
            "Guest order lookup must require both email and order code to reduce accidental exposure.",
        ],
    )
    doc.add_heading("6. Diagrams", level=1)
    add_figure(doc, diagrams["context"], "Figure 1. System context diagram")
    add_figure(doc, diagrams["traceability"], "Figure 2. Requirements traceability map")
    docx = save_doc(doc, "BRD_Business_Requirements_Document.docx")
    md = write_markdown_brd(diagrams)
    return docx, md


def build_srs(diagrams: dict[str, Path]) -> tuple[Path, Path]:
    doc = new_doc(
        "SRS",
        "Software Requirements Specification (SRS)",
        "Đặc tả yêu cầu phần mềm chi tiết cho frontend Vue, backend NestJS, MongoDB và các tích hợp.",
        "Software Requirements Specification",
    )
    doc.add_heading("1. System Overview", level=1)
    doc.add_paragraph(
        "Hệ thống gồm frontend Vue 3/Vite/TailwindCSS, backend NestJS module hóa, MongoDB/Mongoose, "
        "PayOS, Stripe, Gmail SMTP và Cloudflare R2. API chính bao gồm auth, shoes, payments, inventory, "
        "coupons, reviews, returns, wishlist, chat, analytics và r2."
    )
    add_figure(doc, diagrams["context"], "Figure 1. System context diagram")
    doc.add_heading("2. Actors and Permissions", level=1)
    add_table(
        doc,
        ["Actor", "Permissions / Responsibility"],
        [
            ("Guest", "Browse, search, cart, guest checkout, payment, guest order lookup, guest chat."),
            ("User", "All guest actions plus profile, addresses, wishlist, order history, reviews, returns, cancel/refund eligible orders."),
            ("Admin", "Full admin functions: product, order, inventory, returns, coupon, users, analytics, chat."),
            ("Manager", "Operational admin functions excluding highest-risk account/role operations where restricted."),
            ("System", "Webhook verification, stock changes, email notification, status history and audit logs."),
        ],
        [1800, 7560],
    )
    doc.add_heading("3. Functional Requirements", level=1)
    add_table(doc, ["ID", "Name", "Requirement", "Use cases"], FUNCTIONAL_REQUIREMENTS, [900, 1700, 5100, 1660])
    doc.add_heading("4. Non-Functional Requirements", level=1)
    add_table(doc, ["ID", "Quality", "Specification"], NFRS, [900, 1600, 6860])
    doc.add_heading("5. Payment and Order State Specifications", level=1)
    add_bullets(
        doc,
        [
            "Payment status: PENDING, PAID, FAILED, CANCELLED, REFUNDED, REFUND_PENDING.",
            "Fulfillment status: CONFIRMED, PACKING, SHIPPING, DELIVERED, CANCELLED.",
            "Stripe webhook must be verified with the configured webhook secret before updating order status.",
            "PayOS webhook must be verified with checksum/HMAC before updating order status.",
            "Bag should only be cleared after the app receives a successful payment confirmation path.",
        ],
    )
    add_figure(doc, diagrams["checkout"], "Figure 2. Checkout and payment flow")
    add_figure(doc, diagrams["refund"], "Figure 3. Cancel and refund state flow")
    doc.add_heading("6. Admin Operations", level=1)
    add_figure(doc, diagrams["admin"], "Figure 4. Admin operations map")
    docx = save_doc(doc, "SRS_Software_Requirements_Specification.docx")
    md = write_markdown_srs(diagrams)
    return docx, md


def build_user_stories(diagrams: dict[str, Path]) -> tuple[Path, Path]:
    doc = new_doc(
        "Stories & Use Cases",
        "User Stories and Use Cases",
        "Mô tả tính năng theo góc nhìn actor và mapping sang 76 use cases tổng.",
        "User Stories / Use Cases",
    )
    doc.add_heading("1. Actor Model", level=1)
    add_table(
        doc,
        ["Actor", "Primary goals"],
        [
            ("Guest", "Browse products, manage bag, checkout, pay, track guest order and chat support."),
            ("User", "Buy faster with account data, wishlist, review, return, order history and cancel/refund eligible orders."),
            ("Admin", "Operate product, order, inventory, coupon, user, returns, chat and analytics."),
            ("Manager", "Monitor operations and handle order/inventory/support workflows."),
            ("External providers", "PayOS, Stripe, Gmail SMTP and Cloudflare R2 integration endpoints."),
        ],
        [1800, 7560],
    )
    doc.add_heading("2. User Stories", level=1)
    add_table(doc, ["ID", "As a", "I want to", "So that", "UC"], USER_STORIES, [850, 1300, 2600, 3000, 1610])
    doc.add_heading("3. Master Use Case Catalog", level=1)
    add_callout(
        doc,
        "Use case coverage",
        "Danh mục dưới đây tóm tắt 76 UC tổng. File ảnh chi tiết đầy đủ nằm ở docs/design/usecase-images/Master_Detailed_All_76_UseCases.png.",
    )
    add_figure(doc, USECASE_IMAGE, "Figure 1. Master detailed use case diagram preview", max_width=5.9, max_height=7.0)
    add_table(doc, ["ID", "Category", "Actor", "Use case", "Goal"], USE_CASES, [780, 1700, 1300, 2200, 3380])
    docx = save_doc(doc, "User_Stories_Use_Cases.docx")
    md = write_markdown_user_stories(diagrams)
    return docx, md


def build_acceptance_criteria(diagrams: dict[str, Path]) -> tuple[Path, Path]:
    doc = new_doc(
        "Acceptance Criteria",
        "Acceptance Criteria",
        "Tiêu chí nghiệm thu theo feature để QA/dev kiểm tra trước khi bàn giao.",
        "Acceptance Criteria",
    )
    doc.add_heading("1. Acceptance Approach", level=1)
    doc.add_paragraph(
        "Mỗi tiêu chí dùng dạng Given/When/Then để dễ chuyển thành test case thủ công hoặc E2E. "
        "Các tiêu chí tập trung vào luồng có rủi ro cao: checkout, payment, email, order history, cancel/refund, admin và inventory."
    )
    add_figure(doc, diagrams["traceability"], "Figure 1. Acceptance criteria traceability")
    doc.add_heading("2. Criteria Matrix", level=1)
    add_table(doc, ["ID", "Feature", "Acceptance criteria"], ACCEPTANCE_CRITERIA, [1200, 1800, 6360])
    doc.add_heading("3. Release Gate Checklist", level=1)
    add_bullets(
        doc,
        [
            "Run customer checkout test for guest PayOS, guest Stripe/Visa and logged-in checkout.",
            "Verify bag is preserved on failed/blocked payment and cleared only on confirmed payment success.",
            "Verify Gmail order email content contains order code, item summary and safe tracking/refund information only.",
            "Verify cancel/refund works for PAID + CONFIRMED/PACKING and is blocked for SHIPPING/DELIVERED.",
            "Verify admin order detail modal/view does not obscure the page with an unwanted black background.",
            "Verify wishlist persists per user and supports remove/add-to-cart without stale UI state.",
            "Verify inventory stock decreases after paid order and restores after eligible cancellation/refund.",
        ],
    )
    docx = save_doc(doc, "Acceptance_Criteria.docx")
    md = write_markdown_acceptance_criteria(diagrams)
    return docx, md


def rel(path: Path) -> str:
    return path.relative_to(REQ_DIR).as_posix()


def md_table(headers: list[str], rows: list[tuple]) -> str:
    out = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    for row in rows:
        out.append("| " + " | ".join(str(x).replace("\n", "<br>") for x in row) + " |")
    return "\n".join(out)


def write_markdown_brd(diagrams: dict[str, Path]) -> Path:
    path = REQ_DIR / "brd.md"
    text = f"""# Business Requirements Document (BRD)

Version: 1.0  
Date: {TODAY}

## Business Context

Shoes Ecommerce là hệ thống bán hàng trực tuyến cho giày, quần áo và thời trang. Mục tiêu là hoàn thiện trải nghiệm từ duyệt sản phẩm, mua hàng, thanh toán, theo dõi đơn, hỗ trợ sau bán đến vận hành admin.

## Stakeholders

{md_table(["Stakeholder", "Need", "Success signal"], [
("Guest customer", "Mua hàng nhanh không cần tài khoản", "Checkout thành công và tra cứu đơn được"),
("Registered user", "Quản lý hồ sơ, wishlist, lịch sử mua", "Quay lại mua và theo dõi đơn dễ dàng"),
("Admin", "Quản lý catalog, order, inventory, return, coupon, user", "Ít thao tác thủ công, dữ liệu rõ ràng"),
("Manager", "Theo dõi doanh thu, đơn hàng và tồn kho", "Có dashboard và báo cáo theo ngày"),
])}

## Business Requirements

{md_table(["ID", "Area", "Requirement", "Priority"], BRD_REQUIREMENTS)}

## Business Rules

- Chỉ cho khách hủy/hoàn tiền khi order PAID và fulfillment CONFIRMED hoặc PACKING.
- Order SHIPPING hoặc DELIVERED không được hủy/hoàn tiền tự động.
- Stock chỉ giảm sau khi payment được xác nhận PAID qua webhook/confirmation tin cậy.
- Không lưu dữ liệu thẻ; không gửi thông tin nhạy cảm trong email.

## Diagrams

![System context]({rel(diagrams["context"])})

![Traceability]({rel(diagrams["traceability"])})
"""
    path.write_text(text, encoding="utf-8")
    return path


def write_markdown_srs(diagrams: dict[str, Path]) -> Path:
    path = REQ_DIR / "srs.md"
    text = f"""# Software Requirements Specification (SRS)

Version: 1.0  
Date: {TODAY}

## System Overview

Frontend Vue 3/Vite/TailwindCSS, backend NestJS, MongoDB/Mongoose, PayOS, Stripe, Gmail SMTP và Cloudflare R2.

## Functional Requirements

{md_table(["ID", "Name", "Requirement", "Use cases"], FUNCTIONAL_REQUIREMENTS)}

## Non-Functional Requirements

{md_table(["ID", "Quality", "Specification"], NFRS)}

## Diagrams

![System context]({rel(diagrams["context"])})

![Checkout payment flow]({rel(diagrams["checkout"])})

![Order cancel refund flow]({rel(diagrams["refund"])})

![Admin operations map]({rel(diagrams["admin"])})
"""
    path.write_text(text, encoding="utf-8")
    return path


def write_markdown_user_stories(diagrams: dict[str, Path]) -> Path:
    path = REQ_DIR / "user-stories-use-cases.md"
    usecase_rel = Path(os.path.relpath(USECASE_IMAGE, REQ_DIR)).as_posix() if USECASE_IMAGE.exists() else ""
    text = f"""# User Stories and Use Cases

Version: 1.0  
Date: {TODAY}

## User Stories

{md_table(["ID", "As a", "I want to", "So that", "UC"], USER_STORIES)}

## Master Use Case Diagram

![Master use case diagram]({usecase_rel})

## Use Case Catalog

{md_table(["ID", "Category", "Actor", "Use case", "Goal"], USE_CASES)}
"""
    path.write_text(text, encoding="utf-8")
    return path


def write_markdown_acceptance_criteria(diagrams: dict[str, Path]) -> Path:
    path = REQ_DIR / "acceptance-criteria.md"
    text = f"""# Acceptance Criteria

Version: 1.0  
Date: {TODAY}

## Criteria Matrix

{md_table(["ID", "Feature", "Acceptance criteria"], ACCEPTANCE_CRITERIA)}

## Release Gate Checklist

- Run customer checkout test for guest PayOS, guest Stripe/Visa and logged-in checkout.
- Verify bag is preserved on failed/blocked payment and cleared only on confirmed success.
- Verify Gmail order email contains safe order details only.
- Verify cancel/refund allows PAID + CONFIRMED/PACKING and blocks SHIPPING/DELIVERED.
- Verify wishlist, order history and admin order detail work without stale UI or unwanted overlay.

![Traceability]({rel(diagrams["traceability"])})
"""
    path.write_text(text, encoding="utf-8")
    return path


def write_index(docx_paths: list[Path], md_paths: list[Path], diagrams: dict[str, Path]) -> Path:
    path = REQ_DIR / "README.md"
    doc_links = "\n".join([f"- [{p.name}]({p.name})" for p in docx_paths])
    md_links = "\n".join([f"- [{p.name}]({p.name})" for p in md_paths])
    diagram_links = "\n".join([f"- [{p.name}]({rel(p)})" for p in diagrams.values()])
    text = f"""# Requirements Documentation

Generated: {TODAY}

## Word Documents

{doc_links}

## Markdown Copies

{md_links}

## Diagrams

{diagram_links}

## Existing Master Use Case Image

- [Master_Detailed_All_76_UseCases.png](../design/usecase-images/Master_Detailed_All_76_UseCases.png)
"""
    path.write_text(text, encoding="utf-8")
    return path


def write_html_index(docx_paths: list[Path], md_paths: list[Path], diagrams: dict[str, Path]) -> Path:
    path = REQ_DIR / "Requirements_Documents_Index.html"
    diagram_cards = "\n".join(
        f'<section><h2>{escape(p.stem.replace("_", " "))}</h2><a href="{rel(p)}"><img src="{rel(p)}" alt="{escape(p.stem)}"></a></section>'
        for p in diagrams.values()
        if p.suffix.lower() == ".png"
    )
    doc_links = "\n".join(f'<li><a href="{p.name}">{p.name}</a></li>' for p in docx_paths)
    md_links = "\n".join(f'<li><a href="{p.name}">{p.name}</a></li>' for p in md_paths)
    master = "../design/usecase-images/Master_Detailed_All_76_UseCases.png"
    html_text = f"""<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Requirements Documents</title>
  <style>
    body {{ margin: 0; font-family: Arial, sans-serif; color: #0b2545; background: #f6f8fb; }}
    header {{ padding: 32px 48px; background: #fff; border-bottom: 1px solid #d0d7de; }}
    main {{ max-width: 1180px; margin: 0 auto; padding: 32px 24px; }}
    h1 {{ margin: 0 0 8px; font-size: 34px; }}
    h2 {{ margin: 0 0 14px; font-size: 20px; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 18px; margin-bottom: 30px; }}
    .panel, section {{ background: #fff; border: 1px solid #d0d7de; border-radius: 8px; padding: 18px; }}
    img {{ max-width: 100%; height: auto; border: 1px solid #d0d7de; background: #fff; }}
    a {{ color: #1f4d78; }}
    li {{ margin: 8px 0; }}
  </style>
</head>
<body>
  <header>
    <h1>Shoes Ecommerce - Requirements Documents</h1>
    <p>BRD, SRS, User Stories / Use Cases, Acceptance Criteria và các biểu đồ yêu cầu.</p>
  </header>
  <main>
    <div class="grid">
      <div class="panel"><h2>Word Documents</h2><ul>{doc_links}</ul></div>
      <div class="panel"><h2>Markdown Copies</h2><ul>{md_links}</ul></div>
      <div class="panel"><h2>Master Use Case</h2><ul><li><a href="{master}">Master_Detailed_All_76_UseCases.png</a></li></ul></div>
    </div>
    {diagram_cards}
  </main>
</body>
</html>"""
    path.write_text(html_text, encoding="utf-8")
    return path


def main() -> None:
    ensure_dirs()
    diagrams = build_diagrams()
    outputs: list[tuple[Path, Path]] = [
        build_brd(diagrams),
        build_srs(diagrams),
        build_user_stories(diagrams),
        build_acceptance_criteria(diagrams),
    ]
    docx_paths = [item[0] for item in outputs]
    md_paths = [item[1] for item in outputs]
    write_index(docx_paths, md_paths, diagrams)
    write_html_index(docx_paths, md_paths, diagrams)
    print("Generated requirements documents:")
    for p in docx_paths + md_paths + list(diagrams.values()):
        print(p)


if __name__ == "__main__":
    main()
