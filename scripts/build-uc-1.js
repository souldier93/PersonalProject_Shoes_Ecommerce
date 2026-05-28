const fs = require("fs");
const path = require("path");
const BASE = path.join(__dirname, "..", "docs", "requirements", "usecases");
if (!fs.existsSync(BASE)) fs.mkdirSync(BASE, { recursive: true });

function esc(s) { return s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

const ucs = [];
function uc(id,name,actors,pri,pre,post,mf,af,cat) { ucs.push({id,name,actors,pri,pre,post,mf,af,cat}); }

// ====== USE CASE DEFINITIONS ======
uc("UC-01","Browse Products",["Guest","User","Manager","Admin"],"High",
"Khong co","Danh sach san pham hien thi",
["User truy cap trang chu (/) hoac trang /all-shoes","System goi API GET /shoes",
"System tra ve danh sach san pham (name, price, thumbnail, colorName, rating, reviewCount)","Frontend render product cards voi lazy loading"],
["API loi -> hien thi error state"],"Browsing & Discovery");

uc("UC-02","Search/Filter Products",["Guest","User","Manager","Admin"],"High",
"Dang o trang product listing","Danh sach san pham duoc loc",
["User chon filter: category, color, price range, size","System goi API GET /shoes?category=men&color=Black&minPrice=50&maxPrice=150",
"System tra ve filtered results","User co the nhap text search vao thanh tim kiem","System goi API GET /shoes?search=Air+Max"],
["Khong co ket qua -> hien thi empty state"],"Browsing & Discovery");

uc("UC-03","View Product Detail",["Guest","User","Manager","Admin"],"High",
"Co productId hop le","Trang chi tiet san pham hien thi",
["User click vao 1 san pham","System goi API GET /shoes/detail/:productId",
"System tra ve: name, category, price, colors[], images[], sizes[], description, materialNote, origin, rating, reviewCount","Frontend hien thi image gallery, color picker, size picker, stock indicator","System dong thoi goi GET /reviews/product/:productId"],
["productId khong ton tai -> 404 page"],"Browsing & Discovery");

uc("UC-04","Check Stock Real-time",["Guest","User","Manager","Admin"],"High",
"Dang o trang product detail","Hien thi so luong ton kho cua size da chon",
["User chon color + size","System goi API GET /shoes/:productId/stock/:colorName/:size",
"System tra ve { stock: 5 }","UI hien thi Con hang (xanh) hoac Het hang (do)"],
["Size het hang -> disable nut Add to Cart"],"Browsing & Discovery");

uc("UC-05","View Reviews",["Guest","User","Manager","Admin"],"Medium",
"Dang o trang product detail","Danh sach reviews hien thi",
["User scroll xuong phan reviews cua product detail","System goi API GET /reviews/product/:productId",
"System tra ve danh sach reviews (rating, comment, images, user, createdAt)","UI hien thi star rating trung binh va danh sach reviews"],
["Chua co review -> hien thi Be the first to review"],"Browsing & Discovery");

uc("UC-06","Add Product to Cart",["Guest","User"],"High",
"Dang o trang product detail, da chon color + size, con hang","San pham duoc them vao gio hang",
["User chon quantity (mac dinh: 1)","User bam Add to Bag",
"System kiem tra stock lan nua","System them item vao cart state (Pinia store)",
"System luu cart vao localStorage (cho guest)","Toast notification: Added to bag"],
["Stock khong du -> hien thi loi","San pham da co trong cart -> tang quantity (neu con stock)"],"Shopping Cart");

uc("UC-07","Manage Shopping Cart",["Guest","User"],"High",
"Cart co it nhat 1 item","Cart duoc cap nhat",
["User vao trang /bag","System hien thi danh sach items: anh, ten, color, size, quantity, unit price, subtotal",
"User co the: tang/giam quantity, xoa item","System tinh lai tong tien (subtotal, discount, total)","System luu cart vao localStorage"],
["Giam quantity xuong 0 -> xoa item khoi cart","Tang quantity vuot stock -> gioi han o stock toi da"],"Shopping Cart");

uc("UC-08","Apply Coupon Code",["Guest","User"],"High",
"Dang o trang cart hoac checkout","Discount duoc ap dung (neu coupon hop le)",
["User nhap coupon code vao o Promo Code","User bam Apply",
"System goi API GET /coupons/validate?code=X&amount=Y",
"System tra ve { discountPercent, discountAmount, maxDiscount, finalDiscount }","UI hien thi so tien giam gia, tong moi"],
["Coupon khong ton tai -> Invalid code","Coupon het han -> Expired","Amount < minOrderAmount -> Min order not met"],"Shopping Cart");

uc("UC-09","Guest Checkout",["Guest"],"High",
"Cart co it nhat 1 item","Redirect den trang thanh toan",
["User bam Checkout tu cart","System chuyen den trang /checkout","User nhap: firstName, lastName, email, phone, address",
"System validate form","User chon payment method: PayOS hoac Stripe","User bam Place Order",
"System goi API POST /payment/checkout/payos hoac /stripe",
"System kiem tra stock batch, tao bill, tao payment lien ket",
"System redirect den payment URL (PayOS) hoac hien thi Stripe form"],
["Stock batch fail -> hien thi san pham het hang","Coupon da het luot dung -> thong bao loi","API loi -> thong bao loi server"],"Checkout & Payment");

uc("UC-10","PayOS Payment Processing",["Guest","User","PayOS Gateway"],"High",
"Bill da tao, payment link pending","Payment hoan tat hoac huy",
["System tao PayOS payment link voi orderCode, amount, items, returnUrl, cancelUrl","PayOS tra ve { checkoutUrl, qrCode }",
"System redirect user den checkoutUrl","User thanh toan tren trang PayOS (QR code / bank transfer)","PayOS gui webhook POST /payment/webhook/payos",
"System verify HMAC signature","System cap nhat bill status = PAID","System giam stock trong shoesDetail","System gui email xac nhan"],
["User huy -> redirect ve cancelUrl","Webhook timeout -> user query GET /payment/status?orderCode=X","Signature khong hop le -> 401"],"Checkout & Payment");

uc("UC-11","Stripe Payment Processing",["Guest","User","Stripe Gateway"],"High",
"Bill da tao","Payment hoan tat",
["System tao Stripe PaymentIntent voi amount, currency, metadata","Stripe tra ve { clientSecret }",
"Frontend hien thi Stripe Elements form (the tin dung)","User nhap thong tin the va xac nhan","Frontend goi stripe.confirmCardPayment(clientSecret)",
"Stripe xu ly thanh toan","Stripe gui webhook POST /payment/webhook/stripe",
"System verify voi stripe.webhooks.constructEvent()","System cap nhat bill status = PAID, giam stock, gui email"],
["Thanh toan bi tu choi -> hien thi loi the"],"Checkout & Payment");

uc("UC-12","Receive Payment Webhook",["PayOS Gateway","Stripe Gateway"],"High",
"Payment da duoc khoi tao boi PayOS/Stripe","Order status duoc cap nhat",
["PayOS/Stripe gui HTTP POST den webhook endpoint","System verify signature (HMAC cho PayOS, Stripe SDK cho Stripe)",
"System kiem tra idempotency (tranh xu ly trung)","System cap nhat bill.paymentStatus = PAID",
"System goi processStockAfterPayment de giam stock","System gui email confirmation","System tra ve HTTP 200"],
["Signature khong hop le -> 401 Unauthorized","Bill da PAID -> bo qua (idempotent)"],"Checkout & Payment");
