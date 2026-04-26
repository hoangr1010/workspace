import { useEffect } from 'react'
import styles from './App.module.css'
import { ChatPanel } from './components/ChatPanel'
import { EmptyState } from './components/EmptyState'
import { Sidebar } from './components/Sidebar'
import { TitleBar } from './components/TitleBar'
import { ViewerArea } from './components/ViewerArea'
import { useWorkspaceStore } from './store/workspaceStore'

async function pickAndOpenWorkspace(): Promise<void> {
  const path = await window.api.pickWorkspace()
  if (path) await useWorkspaceStore.getState().setWorkspace(path)
}

function App(): JSX.Element {
  const workspacePath = useWorkspaceStore((s) => s.workspacePath)

  useEffect(() => {
    const isFresh = new URLSearchParams(window.location.search).get('fresh') === '1'
    if (!isFresh) {
      void window.api.getRecentWorkspaces().then((recents) => {
        const latest = recents[0]
        if (latest) useWorkspaceStore.setState({ workspacePath: latest })
      })
    }
    const offClose = window.api.onCloseWorkspace(() => {
      useWorkspaceStore.getState().closeWorkspace()
    })
    const offOpen = window.api.onOpenWorkspace(() => {
      void pickAndOpenWorkspace()
    })
    return () => {
      offClose()
      offOpen()
    }
  }, [])

  if (!workspacePath) {
    return (
      <div className={`${styles.root} ${styles.rootEmpty}`}>
        <div className={styles.titlebar}>
          <TitleBar />
        </div>
        <div className={styles.empty}>
          <EmptyState />
        </div>
      </div>
    )
  }

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
