import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { CombinedProvider } from "./contexts/useContext";
import { ToastContainer } from "react-toastify";
import ProtectedRoute from "./utils/ProtectedRoute";
import Loading from "./utils/Loading";

const SelectionPage = lazy(() => import("./pages/SelectionPage"));
const SignupPage = lazy(() => import("./pages/Signup"));
const LoginTanod = lazy(() => import("./pages/LoginTanod"));
const LoginResident = lazy(() => import("./pages/ResidentLogin"));

//Admin routes
const AdminDashboard = lazy(() => import("./components/users/admin/AdminDashboard"));
const ManageTanod = lazy(() => import("./components/users/admin/Personels"));
const Resources = lazy(() => import("./components/users/admin/Resources"));
const PatrolManagement = lazy(() => import("./components/users/admin/ManagePatrol"));

// Tanod routes
const Dashboard = lazy(() => import("./components/users/tanods/Dashboard"));
const Patrolmap = lazy(() => import("./components/users/tanods/Map"));
const Equipments = lazy(() => import("./components/users/tanods/Equipment"));
const Performance = lazy(() => import("./components/users/tanods/Performance"));
const Schedule = lazy(() => import("./components/users/tanods/Schedule"));
const Incidents = lazy(() => import("./components/users/tanods/Incidents"));
const MyAccount = lazy(() => import("./components/users/tanods/MyAcc"));

// Resident routes
const ResidentRating = lazy(() => import("./components/users/residents/TanodPersonels"));
const Home= lazy(() => import("./components/users/residents/Home"));
const ReportIncident= lazy(() => import("./components/users/residents/ReportIncident"));
function App() {
  return (
    <div className="flex-1 p-6 bg-background text-text">
      <BrowserRouter>
        <CombinedProvider>
          <Suspense fallback={<div className="flex items-center justify-center min-h-screen" ><Loading type="spinner" /></div>}>
            <ToastContainer />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<SelectionPage />} />
              <Route path="/tanod-login" element={<LoginTanod />} />
              <Route path="/resident-login" element={<LoginResident />} />
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
                <Route
                  path="/Patrol"
                  element={<ProtectedRoute userTypeAllowed={["tanod"]}><Incidents /></ProtectedRoute>}
                />
                
              </Route>

              {/* Protected Routes for Residents */}
              <Route element={<Layout />}>
                <Route
                  path="/Home"
                  element={<ProtectedRoute userTypeAllowed={["resident"]}><Home /></ProtectedRoute>}
                />
                <Route
                  path="/Ratetanod"
                  element={<ProtectedRoute userTypeAllowed={["resident"]}><ResidentRating /></ProtectedRoute>}
                />
                <Route
                  path="/Reportincidents"
                  element={<ProtectedRoute userTypeAllowed={["resident"]}><ReportIncident /></ProtectedRoute>}
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
              </Route>
              

            </Routes>
          </Suspense>
        </CombinedProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
