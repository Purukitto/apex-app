import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Garage from './pages/Garage';
import Profile from './pages/Profile';
import Ride from './pages/Ride';
import AllRides from './pages/AllRides';
import MainLayout from './components/layout/MainLayout';
import AuthGuard from './components/AuthGuard';

function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
