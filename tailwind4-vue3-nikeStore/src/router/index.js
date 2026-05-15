import { createRouter, createWebHistory } from "vue-router";

// ✅ Import components
import Home from "../components/home/Home.vue";
import AllShoes from "../components/home/allShoes/AllShoes.vue";
import Login from "../components/header/Login/Login.vue";
import Register from "../components/header/Register/Register.vue";
import ShoesDetail from "../components/shoesDetail/ShoesDetail.vue";
import Bag from "../components/header/bag/Bag.vue";
import GuestCheckout from "../components/header/bag/GuestCheckout.vue";
import Payment from "../components/header/bag/Payment.vue";
import Wishlist from '../components/header/Wishlist.vue'
import Profile from '../components/header/Profile.vue'
import MyOrders from '../components/header/MyOrders.vue' // ✅ Import

const routes = [
  // ✅ Public Routes
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/products",
    name: "Products",
    component: AllShoes,
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
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
    path: "/payment",
    name: "Payment",
    component: Payment,
  },
  
  // ✅ My Orders - Yêu cầu đăng nhập
  {
    path: '/my-orders',
    name: 'MyOrders',
    component: MyOrders,
    meta: { requiresAuth: true } // ✅ Yêu cầu đăng nhập
  },

  // ✅ Admin Routes - Lazy loading
  {
    path: '/wishlist',
    name: 'Wishlist',
    component: Wishlist,
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
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
    if (savedPosition) {
      return savedPosition;
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
