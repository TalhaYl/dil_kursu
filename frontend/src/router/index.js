import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import AdminDashboard from '@/views/AdminDashboard.vue'
import Students from '@/views/admin/Students.vue'
import Teachers from '@/views/admin/Teachers.vue'
import Branches from '@/views/admin/Branches.vue'
import Classrooms from '@/views/admin/Classrooms.vue'
import Courses from '@/views/admin/Courses.vue'
import About from '@/views/admin/About.vue'
import Contact from '@/views/admin/Contact.vue'

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
        path: '/admin',
        name: 'admin',
        component: AdminDashboard,
        children: [
            {
                path: 'students',
                component: Students
            },
            {
                path: 'teachers',
                component: Teachers
            },
            {
                path: 'branches',
                component: Branches
            },
            {
                path: 'classrooms',
                component: Classrooms
            },
            {
                path: 'courses',
                component: Courses
            },
            {
                path: 'about',
                component: About
            },
            {
                path: 'contact',
                component: Contact
            }
        ]
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