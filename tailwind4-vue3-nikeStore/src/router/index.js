import { createRouter, createWebHistory } from "vue-router";
import { readProductScrollRestore } from "../utils/productScrollRestore";

// ✅ Import components

const routes = [
  // ✅ Public Routes
  {
    path: "/",
    name: "Home",
    component: () => import("../components/home/Home.vue"),
  },
  {
    path: "/products",
    name: "Products",
    component: () => import("../components/home/allShoes/AllShoes.vue"),
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("../components/header/Login/Login.vue"),
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("../components/header/Register/Register.vue"),
  },
  {
    path: "/shoes/:id",
    name: "ShoesDetail",
    component: () => import("../components/shoesDetail/ShoesDetail.vue"),
  },
  
  // ✅ Shopping Cart & Checkout Routes
  {
    path: "/bag",
    name: "Bag",
    component: () => import("../components/header/bag/Bag.vue"),
  },
  {
    path: "/checkout",
    name: "GuestCheckout",
    component: () => import("../components/header/bag/GuestCheckout.vue"),
  },
  // Redirect cho phòng trường hợp user vào /bag/checkout
  {
    path: "/bag/checkout",
    redirect: "/checkout",
  },
  {
    path: "/payment",
    name: "Payment",
    component: () => import("../components/header/bag/Payment.vue"),
  },
  
  // My Orders supports both members and secure guest lookup
  {
    path: '/my-orders',
    name: 'MyOrders',
    component: () => import('../components/header/MyOrders.vue'),
  },

  // ✅ Admin Routes - Lazy loading
  {
    path: '/wishlist',
    name: 'Wishlist',
    component: () => import('../components/header/Wishlist.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../components/header/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: "/admin",
    redirect: "/admin/dashboard",
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/admin/dashboard",
    name: "AdminDashboard",
    component: () => import("../views/admin/Dashboard.vue"),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/admin/products",
    name: "AdminProducts",
    component: () => import("../views/admin/Products.vue"),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/admin/inventory",
    name: "AdminInventory",
    component: () => import("../views/admin/Inventory.vue"),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/admin/purchases",
    name: "AdminPurchases",
    component: () => import("../views/admin/Purchases.vue"),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/admin/chat",
    name: "AdminChatSupport",
    component: () => import("../views/admin/ChatSupport.vue"),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/admin/users",
    name: "AdminCustomers",
    component: () => import("../views/admin/Users.vue"),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/admin/analytics",
    name: "AdminAnalytics",
    component: () => import("../views/admin/Analytics.vue"),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/admin/settings",
    name: "AdminSettings",
    component: () => import("../views/admin/Settings.vue"),
    meta: { requiresAuth: true, requiresAdmin: true },
  },

  // ✅ Error Pages
  {
    path: "/unauthorized",
    name: "Unauthorized",
    component: () => import("../views/Unauthorized.vue"),
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("../views/NotFound.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  // ✅ Scroll to top khi chuyển trang
  scrollBehavior(to, from, savedPosition) {
    const pendingProductRestore = from.name === 'ShoesDetail'
      ? readProductScrollRestore(to.fullPath, { removeInvalid: false })
      : null;

    if (to.name === 'Products' && from.name === 'ShoesDetail') {
      return false;
    }

    if (savedPosition) {
      return savedPosition;
    } else if (to.name === 'Home' && from.name === 'ShoesDetail' && pendingProductRestore) {
      return { top: Math.max(0, Number(pendingProductRestore.scrollY || 0)) };
    } else {
      return { top: 0 };
    }
  },
});

// ✅ Navigation Guard - CẬP NHẬT ĐỂ XỬ LÝ requiresAuth
router.beforeEach((to, from, next) => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  // ✅ Kiểm tra yêu cầu admin
  if (to.meta.requiresAdmin) {
    if (!user) {
      next("/login");
    } else if (!["admin", "manager"].includes(user.role)) {
      next("/unauthorized");
    } else {
      next();
    }
  } 
  // ✅ Kiểm tra yêu cầu đăng nhập (không phải admin)
  else if (to.meta.requiresAuth && !to.meta.requiresAdmin) {
    if (!user) {
      next("/login");
    } else {
      next();
    }
  } 
  // ✅ Route công khai
  else {
    next();
  }
});

export default router;
