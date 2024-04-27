import React from "react";
import Signup from "./authentication/Signup";

import { AuthProvider } from "../context/AuthContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Profile from "./authentication/Profile";
import Login from "./authentication/Login";

import PrivateRoute from "./authentication/PrivateRoute";
import ForgotPassword from "./authentication/ForgotPassword";
import UpdateProfile from "./authentication/UpdateProfile";
import Dashboard from "./google-drive/Dashboard";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Drive */}
          <Route
            exact
            path="/"
            element={<PrivateRoute Component={Dashboard} />}
          />
          <Route
            exact
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
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
