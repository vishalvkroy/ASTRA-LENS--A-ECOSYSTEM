import Topbar from '@/components/layout/Topbar'
import ChatWindow from '@/components/chat/ChatWindow'

export default function ChatPage() {
  return (
    <>
      <Topbar title="Business Advisor" subtitle="Powered by Claude AI" />
      <ChatWindow />
    </>
  )
}
