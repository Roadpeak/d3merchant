import React from 'react'
import { Route, Routes } from 'react-router-dom'
import SignupPage from './pages/auth/SignUp'
import LoginPage from './pages/auth/Login'
import ServicesPage from './pages/services/Service'
import OfferPage from './pages/offers/Offers'

const AppRoutes = () => {
  return (
    <Routes>
        <Route path="/accounts/sign-up" element={<SignupPage />} />
        <Route path="/accounts/sign-in" element={<LoginPage />} />
        <Route path="/dashboard/services" element={<ServicesPage />} />
        <Route path='/dashboard/offers' element={<OfferPage />} />
    </Routes>
  )
}

export default AppRoutes