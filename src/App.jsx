import AppRoutes from './routes'
import InstallPrompt from './components/InstallPrompt'
import ServiceRequestToast from './components/ServiceRequestToast'

function App() {
  return (
    <>
      <InstallPrompt />
      <ServiceRequestToast />
      <AppRoutes />
    </>
  )
}

export default App