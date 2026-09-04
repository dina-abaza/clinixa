import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { IconSprite } from './components/icons/IconSprite';
import { FirstRunSetupPage } from './features/setup/FirstRunSetupPage';
import { LoginPage } from './features/auth/LoginPage';
import { ForgotPasswordPage } from './features/auth/ForgotPasswordPage';
import { DashboardPlaceholderPage } from './pages/DashboardPlaceholderPage';
import { SessionBoundary } from './app/SessionBoundary';
import { ProtectedRoute } from './app/ProtectedRoute';
import { RootRedirect } from './app/RootRedirect';
import { SetupOnlyRoute } from './app/SetupOnlyRoute';
import { GuestOnlyRoute } from './app/GuestOnlyRoute';
import { AppShell } from './components/shell/AppShell';
import { PatientsListPage } from './features/patients/PatientsListPage';
import { PatientProfilePage } from './features/patients/PatientProfilePage';
import { AttendancePage } from './features/attendance/AttendancePage';
import { PaymentsPage } from './features/payments/PaymentsPage';
import { InventoryPage } from './features/inventory/InventoryPage';
import { AdminPage } from './features/admin/AdminPage';

function App() {
  return (
    <BrowserRouter>
      <IconSprite />
      <SessionBoundary>
        <Routes>
          <Route path="/" element={<RootRedirect />} />

          <Route element={<SetupOnlyRoute />}>
            <Route path="/setup" element={<FirstRunSetupPage />} />
          </Route>

          <Route element={<GuestOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<DashboardPlaceholderPage />} />
              <Route path="/patients" element={<PatientsListPage />} />
              <Route path="/patients/:id" element={<PatientProfilePage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>
        </Routes>
      </SessionBoundary>
    </BrowserRouter>
  );
}

export default App;
