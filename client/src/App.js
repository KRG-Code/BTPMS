import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { CombinedProvider } from "./contexts/useContext";
import { ThemeProvider } from "./contexts/ThemeContext";  // Import the ThemeProvider
import ProtectedRoute from "./utils/ProtectedRoute";
import Loading from "./utils/Loading";
import { ToastContainer } from "react-toastify";

// Import NotFound component
const NotFound = lazy(() => import("./components/common/NotFound"));

// Add these imports for the new password reset components
const ForgotPassword = lazy(() => import("./components/users/common/ForgotPassword"));
const ResetPassword = lazy(() => import("./components/users/common/ResetPassword"));

// Add import for the new ResetPin component
const ResetPin = lazy(() => import("./components/users/residents/ResetPin"));

const SelectionPage = lazy(() => import("./pages/SelectionPage"));
const SignupPage = lazy(() => import("./pages/Signup"));
const LoginTanod = lazy(() => import("./pages/LoginTanod"));

// Add import for resident signup
const ResidentSignup = lazy(() => import("./components/users/residents/Signup"));

//Admin routes
const AdminDashboard = lazy(() => import("./components/users/admin/AdminDashboard"));
const ManageTanod = lazy(() => import("./components/users/admin/Personels"));
const Resources = lazy(() => import("./components/users/admin/Resources"));
const PatrolManagement = lazy(() => import("./components/users/admin/ManageScheduleComponents/ManagePatrol"));
const PatrolTrack = lazy(() => import("./components/users/admin/PatrolTracking"));

// Tanod routes
const Dashboard = lazy(() => import("./components/users/tanods/Dashboard"));
const Patrolmap = lazy(() => import("./components/users/tanods/Map"));
const Equipments = lazy(() => import("./components/users/tanods/Equipment"));
const Performance = lazy(() => import("./components/users/tanods/Performance"));
const Schedule = lazy(() => import("./components/users/tanods/Schedule"));
const MyAccount = lazy(() => import("./components/users/tanods/MyAcc"));

// Resident routes
const ResidentRating = lazy(() => import("./components/users/residents/TanodPersonels"));
const Home= lazy(() => import("./components/users/residents/Home"));
const ReportIncident= lazy(() => import("./components/users/residents/ReportIncident"));

function App() {
  return (
    <ThemeProvider>  {/* Make sure ThemeProvider is at the top level */}
      <div className="flex-1 p-0 bg-background text-text">
        <BrowserRouter>
          <CombinedProvider>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen" ><Loading type="spinner" /></div>}>
              <ToastContainer position="top-right" theme="light" /> {/* Set a default theme */}
              <Routes>
                {/* Public Routes */}
                <Route path="/tanod-login" element={<LoginTanod />} />
                <Route path="/signup" element={<SignupPage />} />
                
                {/* Add the new resident signup route */}
                <Route path="/resident-signup" element={<ResidentSignup />} />
                
                {/* Public Resident Routes - No authentication needed */}
                <Route path="/" element={<Home />} />
                <Route path="/Tanodevaluation" element={<ResidentRating />} />
                <Route path="/Reportincidents" element={<ReportIncident />} />
                
                {/* Password and PIN reset routes */}
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />
                <Route path="/reset-pin/:token" element={<ResetPin />} />
                
                <Route element={<Layout />}>
                  <Route path="/myaccount" element={<MyAccount />}/>
                </Route>
                
                {/* Protected Routes for Tanod */}
                <Route element={<Layout />}>
                  <Route
                    path="/Dashboard"
                    element={<ProtectedRoute userTypeAllowed={["tanod"]}><Dashboard /></ProtectedRoute>}
                  />
                  <Route
                    path="/Patrolmap"
                    element={<ProtectedRoute userTypeAllowed={["tanod"]}><Patrolmap /></ProtectedRoute>}
                  />
                  <Route
                    path="/Equipments"
                    element={<ProtectedRoute userTypeAllowed={["tanod"]}><Equipments /></ProtectedRoute>}
                  />
                  <Route
                    path="/Performance"
                    element={<ProtectedRoute userTypeAllowed={["tanod"]}><Performance /></ProtectedRoute>}
                  />
                  <Route
                    path="/Schedule"
                    element={<ProtectedRoute userTypeAllowed={["tanod"]}><Schedule /></ProtectedRoute>}
                  /> 
                </Route>

                {/* Protected Routes for Admin */}
                <Route element={<Layout />}>
                  <Route
                    path="/Admindashboard"
                    element={<ProtectedRoute userTypeAllowed={["admin"]}><AdminDashboard /></ProtectedRoute>}
                  />
                  <Route
                    path="/ManageTanod"
                    element={<ProtectedRoute userTypeAllowed={["admin"]}><ManageTanod /></ProtectedRoute>}
                  />
                  <Route
                    path="/Resources"
                    element={<ProtectedRoute userTypeAllowed={["admin"]}><Resources /></ProtectedRoute>}
                  />
                  <Route
                    path="/ManagePatrolschedules"
                    element={<ProtectedRoute userTypeAllowed={["admin"]}><PatrolManagement /></ProtectedRoute>}
                  />
                  <Route
                    path="/Patrol&incidenttracking"
                    element={<ProtectedRoute userTypeAllowed={["admin"]}><PatrolTrack /></ProtectedRoute>}
                  />
                </Route>
                
                {/* 404 Not Found - This must be the last route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </CombinedProvider>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

export default App;
