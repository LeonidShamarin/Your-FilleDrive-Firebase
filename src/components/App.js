import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "../context/AuthContext";
import PrivateRoute from "./authentication/PrivateRoute";
import Signup from "./authentication/Signup";
import Login from "./authentication/Login";
import ForgotPassword from "./authentication/ForgotPassword";
import Profile from "./authentication/Profile";
import UpdateProfile from "./authentication/UpdateProfile";
import Dashboard from "./google-drive/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Drive */}
          <Route path="/" element={<PrivateRoute Component={Dashboard} />} />
          <Route
            path="/folder/:folderId"
            element={<PrivateRoute Component={Dashboard} />}
          />

          {/* Profile */}
          <Route path="/user" element={<PrivateRoute Component={Profile} />} />
          <Route
            path="/update-profile"
            element={<PrivateRoute Component={UpdateProfile} />}
          />

          {/* Auth */}
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Anything else belongs to the drive, which redirects if signed out. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
