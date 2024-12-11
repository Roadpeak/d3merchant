import React from 'react'
import Layout from '../../elements/Layout'
import StatsSection from './StatsSection'
import BookingsChart from './BookingsChart'
import RecentNotifications from './RecentNotifications'
import RevenueChart from './RevenueChart'
import RecentReviews from './RecentReviews'

const Dashboard = () => {
    return (
        <Layout title="Dashboard">
            <StatsSection />
            <div className="flex flex-col md:flex-row gap-4 mt-4">
                <div className="flex w-full md:w-[70%]">
                    <BookingsChart />
                </div>
                <RecentNotifications />
            </div>
            <div className="flex flex-col md:flex-row gap-4 mt-4">
                <div className="flex w-full md:w-[70%] h-fit">
                    <RevenueChart />
                </div>
                <RecentReviews />
            </div>
        </Layout>
    )
}

export default Dashboard