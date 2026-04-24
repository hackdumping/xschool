import { useState, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import type { PaletteMode } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { m3Theme } from '@/theme/m3-theme';
import { AuthProvider } from '@/contexts/AuthContext';
import { SchoolProvider } from '@/contexts/SchoolContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { Layout } from '@/components/Layout/Layout';
import { LoginPage } from '@/pages/Login/LoginPage';
import SignUpPage from '@/pages/Login/SignUpPage';
import ForgotPasswordPage from '@/pages/Login/ForgotPasswordPage';
import { DashboardPage } from '@/pages/Dashboard/DashboardPage';
import { StudentsPage } from '@/pages/Students/StudentsPage';
import { ClassesPage } from '@/pages/Classes/ClassesPage';
import { GradesPage } from '@/pages/Grades/GradesPage';
import { PaymentsPage } from '@/pages/Finances/PaymentsPage';
import { ExpensesPage } from '@/pages/Finances/ExpensesPage';
import { FinancialSummaryPage } from '@/pages/Finances/FinancialSummaryPage';
import { CalendarPage } from '@/pages/Agenda/CalendarPage';
import { ProfilePage } from '@/pages/Profile/ProfilePage';
import { SettingsPage } from '@/pages/Settings/SettingsPage';
import { TeachersPage } from '@/pages/Users/TeachersPage';
import { ReceiptPage } from '@/pages/Finances/ReceiptPage';
import SuperDashboard from '@/pages/SuperAdmin/SuperDashboard';
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute';

function App() {
  const [mode, setMode] = useState<PaletteMode>(() => {
    return (localStorage.getItem('themeMode') as PaletteMode) || 'light';
  });

  const theme = useMemo(() => m3Theme(mode), [mode]);

  const toggleTheme = () => {
    setMode((prev) => {
      const newMode = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <SchoolProvider>
            <NotificationProvider>
              <BrowserRouter>
                {/* ... existing routes ... */}
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<SignUpPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route
                    path="/*"
                    element={
                      <ProtectedRoute>
                        <Layout toggleTheme={toggleTheme} currentMode={mode}>
                          <Routes>
                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/dashboard" element={<DashboardPage />} />
                            <Route path="/students" element={<StudentsPage />} />
                            <Route path="/classes" element={<ClassesPage />} />
                            <Route path="/teachers" element={<TeachersPage />} />
                            <Route path="/grades" element={<GradesPage />} />
                            <Route path="/finances/payments" element={<PaymentsPage />} />
                            <Route path="/finances/expenses" element={<ExpensesPage />} />
                            <Route path="/finances/summary" element={<FinancialSummaryPage />} />
                            <Route path="/agenda" element={<CalendarPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="/receipt/:id" element={<ReceiptPage />} />
                            <Route path="/superadmin/dashboard" element={<SuperDashboard />} />
                            <Route path="/superadmin/schools" element={<SuperDashboard />} />
                            <Route path="/superadmin/users" element={<SuperDashboard />} />
                            <Route path="/superadmin/performance" element={<SuperDashboard />} />
                            <Route path="/superadmin/system" element={<SuperDashboard />} />
                            <Route path="/superadmin/:tab" element={<SuperDashboard />} />
                          </Routes>
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </BrowserRouter>
            </NotificationProvider>
          </SchoolProvider>
        </AuthProvider>
      </ThemeProvider>
    </LocalizationProvider>
  );
}

export default App;
