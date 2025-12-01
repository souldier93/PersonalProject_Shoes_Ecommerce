import { createRouter, createWebHistory } from "vue-router";

// ✅ Import components
import Home from "../components/home/Home.vue";
import Login from "../components/header/Login/Login.vue";
import ShoesDetail from "../components/shoesDetail/ShoesDetail.vue";
import Bag from "../components/header/bag/Bag.vue";
import GuestCheckout from "../components/header/bag/GuestCheckout.vue";
import Payment from "../components/header/bag/Payment.vue";

const routes = [
  // ✅ Public Routes
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
  },
  {
    path: "/shoes/:id",
    name: "ShoesDetail",
    component: ShoesDetail,
  },
  
  // ✅ Shopping Cart & Checkout Routes
  {
    path: "/bag",
    name: "Bag",
    component: Bag,
  },
  {
    path: "/checkout",
    name: "GuestCheckout",
    component: GuestCheckout,
  },
  // Redirect cho phòng trường hợp user vào /bag/checkout
  {
    path: "/bag/checkout",
    redirect: "/checkout",
  },
  {
    path: "/payment",        // ✅ THÊM route này
    name: "Payment",
    component: Payment,
  },

  // ✅ Admin Routes - Lazy loading
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
    path: "/admin/purchases",
    name: "AdminPurchases",
    component: () => import("../views/admin/Purchases.vue"),
    meta: { requiresAuth: true, requiresAdmin: true },
  },
  {
    path: "/admin/customers",
    name: "AdminCustomers",
    component: () => import("../views/admin/Customers.vue"),
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
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

// ✅ Navigation Guard
router.beforeEach((to, from, next) => {
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  if (to.meta.requiresAdmin) {
    if (!user) {
      next("/login");
    } else if (user.role !== "admin") {
      next("/unauthorized");
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;
