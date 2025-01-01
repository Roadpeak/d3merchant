import React from 'react'
import RevenueAndPaymentsChart from './RevenueAndPaymentsChart'
import Layout from '../../elements/Layout'
import OffersStats from './OffersStats'
import ServicesStats from './ServicesStats'
import StaffPerformance from './StaffPerformance'

const Analytics = () => {
    return (
        <Layout title="Analytics">
            <RevenueAndPaymentsChart />
            <OffersStats />
            <ServicesStats />
            <StaffPerformance />
        </Layout>
    )
}

export default Analytics