import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Login from './pages/Login';
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
      <SpeedInsights />
    </BrowserRouter>
  );
}

export default App;
