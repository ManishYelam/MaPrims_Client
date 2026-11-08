import React, { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import Layout from '../layouts/Layout';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Loading from '../components/Loading';
import { StockPointProvider } from '../context/StockPointContext';

const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/auth/Login'));
const Signup = lazy(() => import('../pages/auth/Signup'));
const SetPassword = lazy(() => import('../pages/auth/SetPassword'));
const PrivacyPolicy = lazy(() => import('../pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('../pages/TermsOfService'));
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const Courses = lazy(() => import('../pages/Courses'));
const CourseDetail = lazy(() => import('../pages/CourseDetail'));
const ServiceDetail = lazy(() => import('../pages/ServiceDetail'));
const Services = lazy(() => import('../pages/Services'));
const Blogs = lazy(() => import('../pages/Blogs'));
const BlogDetail = lazy(() => import('../components/dashboard/BlogDetail'));
const About = lazy(() => import('../pages/About'));
const Contact = lazy(() => import('../pages/Contact'));

const useDisableDevToolsShortcuts = () => {
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!e.key) return;
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C'].includes(e.key)) ||
        (e.ctrlKey && ['U', 'S'].includes(e.key))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const onContextMenu = (e) => e.preventDefault();
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
};

const AppRoutes = () => {
  useDisableDevToolsShortcuts();

  return (
    <AuthProvider>
      <ThemeProvider>
        <StockPointProvider>
          <ScrollToTop />
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="courses" element={<Courses />} />
                <Route path="courses/:course_id" element={<CourseDetail />} />
                <Route path="services/:service_id" element={<ServiceDetail />} />
                <Route path="blog/:blog_id" element={<BlogDetail />} />
                <Route path="about" element={<About />} />
                <Route path="contact" element={<Contact />} />
                <Route path="services" element={<Services />} />
                <Route path="blogs" element={<Blogs />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Signup />} />
                <Route path="privacy" element={<PrivacyPolicy />} />
                <Route path="terms" element={<TermsOfService />} />
                <Route path="/set-password/:email" element={<SetPassword />} />
              </Route>

              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </StockPointProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default AppRoutes;