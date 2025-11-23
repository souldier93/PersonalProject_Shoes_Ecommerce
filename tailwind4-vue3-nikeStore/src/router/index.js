import { createRouter, createWebHistory } from 'vue-router'

// ✅ Import theo cấu trúc thực tế của bạn
import Home from '../components/home/Home.vue'
import Login from '../components/header/Login/Login.vue'
import ShoesDetail from '../components/shoesDetail/ShoesDetail.vue'

// ✅ Import HeaderAdmin nếu cần sử dụng trong route
// import HeaderAdmin from '../components/HeaderAdmin.vue'

const routes = [
  // ✅ Public Routes
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/shoes/:id',
    name: 'ShoesDetail',
    component: ShoesDetail
  },
  
  // ✅ Admin Routes - Sử dụng lazy loading để tối ưu
  {
    path: '/admin',
    redirect: '/admin/dashboard',
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('../views/admin/Dashboard.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/products',
    name: 'AdminProducts',
    component: () => import('../views/admin/Products.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/purchases',
    name: 'AdminPurchases',
    component: () => import('../views/admin/Purchases.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/customers',
    name: 'AdminCustomers',
    component: () => import('../views/admin/Customers.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/analytics',
    name: 'AdminAnalytics',
    component: () => import('../views/admin/Analytics.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/settings',
    name: 'AdminSettings',
    component: () => import('../views/admin/Settings.vue'),
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  
  // ✅ Error Pages
  {
    path: '/unauthorized',
    name: 'Unauthorized',
    component: () => import('../views/Unauthorized.vue')
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ✅ Navigation Guard - Bảo vệ admin routes
router.beforeEach((to, from, next) => {
  // Lấy thông tin user từ localStorage
  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null

  // Kiểm tra nếu route yêu cầu admin
  if (to.meta.requiresAdmin) {
    if (!user) {
      // Chưa đăng nhập → redirect về login
      next('/login')
    } else if (user.role !== 'admin') {
      // Không phải admin → redirect về unauthorized
      next('/unauthorized')
    } else {
      // Là admin → cho phép truy cập
      next()
    }
  } else {
    // Route không yêu cầu admin → cho phép truy cập
    next()
  }
})

export default router
