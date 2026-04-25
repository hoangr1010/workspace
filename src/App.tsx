import styles from './App.module.css'
import { ChatPanel } from './components/ChatPanel'
import { Sidebar } from './components/Sidebar'
import { TitleBar } from './components/TitleBar'
import { ViewerArea } from './components/ViewerArea'

function App(): JSX.Element {
  return (
    <div className={styles.root}>
      <div className={styles.titlebar}>
        <TitleBar />
      </div>
      <div className={styles.sidebar}>
        <Sidebar />
      </div>
      <div className={styles.viewer}>
        <ViewerArea />
      </div>
      <div className={styles.chat}>
        <ChatPanel />
      </div>
    </div>
  )
}

export default App
