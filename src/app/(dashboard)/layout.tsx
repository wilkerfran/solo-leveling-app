"use client"

import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { Navigation } from "@/components/layout/Navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { logout } = useAuth()
  const router = useRouter()

  async function handleLogout() {
    await logout()
    router.push("/login")
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      minHeight: "100vh",
    }}>
      <Navigation onLogout={handleLogout} />
      {/* paddingTop = altura do header desktop, paddingBottom = altura da nav mobile */}
      <div style={{
        flex: 1,
        paddingTop: "60px",
        paddingBottom: "80px",
      }} className="dashboard-content">
        {children}
      </div>
    </div>
  )
}