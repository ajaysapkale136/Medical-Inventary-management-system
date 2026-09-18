import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import OAuth2Redirect from './pages/OAuth2Redirect'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Suppliers from './pages/Suppliers'
import ExpiryTracking from './pages/ExpiryTracking'
import Reports from './pages/Reports'
import Notifications from './pages/Notifications'
import Users from './pages/Users'
import Profile from './pages/Profile'
import Sell from './pages/Sell'
import SalesAdmin from './pages/SalesAdmin'

/** All routes of the application. */
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/oauth2/redirect" element={<OAuth2Redirect />} />

          {/* Private */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/sell" element={
              <ProtectedRoute roles={['ADMIN','PHARMACIST','STAFF']}><Sell /></ProtectedRoute>} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/expiry" element={<ExpiryTracking />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/settings" element={<Profile />} />
            <Route path="/profile" element={<Navigate to="/settings" replace />} />
            <Route path="/reports" element={
              <ProtectedRoute roles={['ADMIN', 'PHARMACIST']}><Reports /></ProtectedRoute>} />
            <Route path="/sales-admin" element={
              <ProtectedRoute roles={['ADMIN']}><SalesAdmin /></ProtectedRoute>} />
            <Route path="/users" element={
              <ProtectedRoute roles={['ADMIN', 'PHARMACIST']}><Users /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
