import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import UpdatePasswordPage from './pages/UpdatePasswordPage';
import Dashboard from './pages/Dashboard';
import Garage from './pages/Garage';
import Service from './pages/Service';
import Profile from './pages/Profile';
import Ride from './pages/Ride';
import AllRides from './pages/AllRides';
import MainLayout from './components/layout/MainLayout';
import AuthGuard from './components/AuthGuard';
import AppUpdateChecker from './components/AppUpdateChecker';
import BackButtonHandler from './components/BackButtonHandler';

function App() {
  return (
    <BrowserRouter>
      <BackButtonHandler />
      <AppUpdateChecker />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<UpdatePasswordPage />} />
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/garage"
          element={
            <AuthGuard>
              <MainLayout>
                <Garage />
              </MainLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/service/:bikeId"
          element={
            <AuthGuard>
              <MainLayout>
                <Service />
              </MainLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthGuard>
              <MainLayout>
                <Profile />
              </MainLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/ride"
          element={
            <AuthGuard>
              <MainLayout>
                <Ride />
              </MainLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/rides"
          element={
            <AuthGuard>
              <MainLayout>
                <AllRides />
              </MainLayout>
            </AuthGuard>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster
        theme="dark"
        position="top-center"
        expand={false}
        visibleToasts={5}
        gap={8}
        richColors={false}
        toastOptions={{
          className: 'apex-toast',
          style: {
            background: '#0A0A0A',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#E2E2E2',
            fontFamily: 'inherit',
          },
          duration: 3000,
        }}
      />
      <SpeedInsights />
      <Analytics />
    </BrowserRouter>
  );
}

export default App;
