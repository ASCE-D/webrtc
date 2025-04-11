import { WebRTCProvider } from './context/WebRTCContext'
import { VideoCall } from './components/VideoCall'
import './styles/VideoCall.css'

function App() {
  return (
    <WebRTCProvider>
      <div className="App">
        <h1>WebRTC Video Call</h1>
        <VideoCall />
      </div>
    </WebRTCProvider>
  )
}

export default App
