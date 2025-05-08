import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../views/HomePage.vue';

const routes = [
    { 
        path: '/', 
        name: 'home',
        component: HomePage 
    },
    {
        path: '/login',
        name: 'login',
        component: () => import('../views/LoginPage.vue')
    },
    {
        path: '/register',
        name: 'register',
        component: () => import('../views/RegisterPage.vue')
    },
    {
        path: '/superadmin',
        name: 'superadmin',
        component: () => import('../views/SuperAdmin.vue'),
        meta: { requiresAuth: true, role: 'superadmin' }
    },
    {
        path: '/admin',
        name: 'admin',
        component: () => import('../views/AdminPage.vue'),
        meta: { requiresAuth: true, role: 'admin' }
    },
    {
        path: '/teacher',
        name: 'teacher',
        component: () => import('../views/TeacherPage.vue'),
        meta: { requiresAuth: true, role: 'teacher' }
    },
    {
        path: '/student',
        name: 'student',
        component: () => import('../views/StudentPage.vue'),
        meta: { requiresAuth: true, role: 'student' }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// Navigation guard
router.beforeEach((to, from, next) => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (to.meta.requiresAuth && !token) {
        next('/login');
    } else if (to.meta.role && to.meta.role !== user.role) {
        next('/');
    } else {
        next();
    }
});

export default router;