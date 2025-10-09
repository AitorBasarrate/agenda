import { AppProvider } from './contexts'
import { StateDemo } from './components/StateDemo'
import './App.css'

function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        <StateDemo />
      </div>
    </AppProvider>
  )
}

export default App
