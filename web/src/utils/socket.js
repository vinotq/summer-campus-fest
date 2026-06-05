import { io } from 'socket.io-client'

let adminSocket = null
let dashboardSocket = null

export function getAdminSocket() {
  if (!adminSocket) {
    adminSocket = io({ auth: { role: 'admin' }, autoConnect: false })
  }
  return adminSocket
}

export function getDashboardSocket() {
  if (!dashboardSocket) {
    dashboardSocket = io({ auth: { role: 'dashboard' }, autoConnect: false })
  }
  return dashboardSocket
}

export function disconnectAdmin() {
  if (adminSocket) { adminSocket.disconnect(); adminSocket = null }
}
export function disconnectDashboard() {
  if (dashboardSocket) { dashboardSocket.disconnect(); dashboardSocket = null }
}
