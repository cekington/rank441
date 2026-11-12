import Header from './components/header'
import ChartSection from './components/chart'
import './App.css'

function App() {
  return (
    <div
      style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '40px 20px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <Header />
      <main>
        <ChartSection />
      </main>
    </div>
  )
}

export default App
