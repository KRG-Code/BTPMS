import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { CombinedProvider } from "./contexts/useContext";
import { ThemeProvider } from "./contexts/ThemeContext";  // Import the ThemeProvider
import { ToastContainer } from "react-toastify";
import ProtectedRoute from "./utils/ProtectedRoute";
import Loading from "./utils/Loading";

const SelectionPage = lazy(() => import("./pages/SelectionPage"));
const SignupPage = lazy(() => import("./pages/Signup"));
const LoginTanod = lazy(() => import("./pages/LoginTanod"));

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
    <ThemeProvider>  {/* Add ThemeProvider here */}
      <div className="flex-1 p-0 bg-background text-text">
        <BrowserRouter>
          <CombinedProvider>
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen" ><Loading type="spinner" /></div>}>
              <ToastContainer />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<SelectionPage />} />
                <Route path="/tanod-login" element={<LoginTanod />} />
                <Route path="/signup" element={<SignupPage />} />
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

                {/* Protected Routes for Residents */}
                <Route>
                  <Route
                    path="/Home"
                    element={<Home />}
                  />
                  <Route
                    path="/Tanodevaluation"
                    element={<ResidentRating />}
                  />
                  <Route
                    path="/Reportincidents"
                    element={<ReportIncident />}
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
                

              </Routes>
            </Suspense>
          </CombinedProvider>
        </BrowserRouter>
      </div>
    </ThemeProvider>
  );
}

export default App;
