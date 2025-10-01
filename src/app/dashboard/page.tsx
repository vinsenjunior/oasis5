"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Calendar, 
  LogOut,
  Plus,
  Edit,
  Search,
  Home,
  CheckCircle
} from "lucide-react"

interface Stats {
  totalAssets: number
  totalClients: number
  activeRentals: number
  totalStations: number
}

// Cache configuration
const STATS_CACHE_KEY = 'dashboard_stats_cache'
const CACHE_EXPIRY_TIME = 5 * 60 * 1000 // 5 minutes

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalAssets: 0,
    totalClients: 0,
    activeRentals: 0,
    totalStations: 0
  })
  const [userRole, setUserRole] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchStats()
  }, [])

  const checkAuth = () => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    const role = localStorage.getItem("userRole")
    
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    
    setUserRole(role || "")
  }

  // Get cached stats if available and not expired
  const getCachedStats = (): Stats | null => {
    try {
      const cachedData = localStorage.getItem(STATS_CACHE_KEY)
      if (!cachedData) return null
      
      const { stats, timestamp } = JSON.parse(cachedData)
      const now = new Date().getTime()
      
      // Return cached stats if still valid
      if (now - timestamp < CACHE_EXPIRY_TIME) {
        return stats
      }
      
      return null
    } catch (error) {
      console.error('Error reading cached stats:', error)
      return null
    }
  }

  // Save stats to cache with timestamp
  const setCachedStats = (stats: Stats) => {
    try {
      const cacheData = {
        stats,
        timestamp: new Date().getTime()
      }
      localStorage.setItem(STATS_CACHE_KEY, JSON.stringify(cacheData))
    } catch (error) {
      console.error('Error caching stats:', error)
    }
  }

  // Fetch stats with caching strategy
  const fetchStats = async () => {
    // First try to get cached stats
    const cachedStats = getCachedStats()
    if (cachedStats) {
      setStats(cachedStats)
      setIsLoading(false)
      // Refresh data in background
      refreshStats()
      return
    }

    // If no cache, fetch fresh data
    await refreshStats()
  }

  // Function to fetch fresh data from APIs
  const refreshStats = async () => {
    try {
      // Optimize API calls by using specific endpoints
      const [assetsRes, clientsRes, activeRentalsRes, stationsRes] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/clients"),
        fetch("/api/rentals"), // We'll optimize this later
        fetch("/api/assets/stations")
      ])

      const newStats: Stats = {
        totalAssets: 0,
        totalClients: 0,
        activeRentals: 0,
        totalStations: 0
      }

      if (assetsRes.ok) {
        const assets = await assetsRes.json()
        newStats.totalAssets = assets.length
      }

      if (clientsRes.ok) {
        const clients = await clientsRes.json()
        newStats.totalClients = clients.length
      }

      if (activeRentalsRes.ok) {
        const rentals = await activeRentalsRes.json()
        const today = new Date().toISOString().split('T')[0]
        // Optimize filtering by only checking necessary properties
        const activeRentals = rentals.filter((rental: any) => 
          rental.datestart && rental.dateend && 
          rental.datestart <= today && rental.dateend >= today
        )
        newStats.activeRentals = activeRentals.length
      }

      if (stationsRes.ok) {
        const stations = await stationsRes.json()
        newStats.totalStations = stations.length
      }

      setStats(newStats)
      setCachedStats(newStats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userRole")
    // Clear cached stats on logout
    localStorage.removeItem(STATS_CACHE_KEY)
    router.push("/login")
  }

  const getNavigationItems = () => {
    const baseItems = [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        current: true
      }
    ]

    if (userRole === "sms" || userRole === "admin") {
      return [
        ...baseItems,
        {
          title: "Check Availability",
          href: "/check-avail",
          icon: CheckCircle
        },
        {
          title: "Input Data Sewa",
          href: "/booking",
          icon: Calendar
        },
        {
          title: "Custom Input Sewa",
          href: "/input-rental",
          icon: Plus
        },
        {
          title: "Manajemen Data Sewa",
          href: "/manage-rentals",
          icon: Edit
        },
        {
          title: "Manajemen Client",
          href: "/input-client",
          icon: Users
        },
        {
          title: "Manajemen Aset",
          href: "/input-asset",
          icon: Package
        }
      ]
    } else if (userRole === "busdev" || userRole === "admin") {
      return [
        ...baseItems,
        {
          title: "Input Data Aset",
          href: "/input-asset",
          icon: Package
        }
      ]
    }

    return baseItems
  }

  const navigation = getNavigationItems()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - unchanged */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/o_logo2.png" className="w-18" alt="Otego Media" />
              <h1 className="text-xs font-semibold text-gray-900 ml-5">
                Otego Asset Sales & Inventory System (O.A.S.I.S)
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">
                {userRole === "admin" ? "Admin" : userRole === "sms" ? "SMS" : userRole === "busdev" ? "Busdev" : "Guest"}
              </Badge>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation - unchanged */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {navigation.map((item) => (
                  <Button
                    key={item.href}
                    variant={item.current ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => router.push(item.href)}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.title}
                  </Button>
                ))}
                
                {(userRole === "admin" || userRole === "sms" || userRole === "busdev" || userRole === "guest") && (
                  <div className="pt-4 mt-4 border-t">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => router.push("/browse-assets")}
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Browse Assets
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content - unchanged */}
          <div className="lg:col-span-3">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h2>
              <p className="text-gray-600">
                Selamat datang di sistem inventory dan booking media iklan
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Aset</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalAssets}</div>
                  <p className="text-xs text-muted-foreground">
                    Media assets tersedia
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Client</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalClients}</div>
                  <p className="text-xs text-muted-foreground">
                    Client terdaftar
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Sewa Aktif</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeRentals}</div>
                  <p className="text-xs text-muted-foreground">
                    Penyewaan aktif
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Stasiun</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalStations}</div>
                  <p className="text-xs text-muted-foreground">
                    Lokasi stasiun
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userRole === "admin" && (
                    <>
                      <Button
                        variant="outline"
                        className="h-20 flex-col"
                        onClick={() => router.push("/booking")}
                      >
                        <Calendar className="h-6 w-6 mb-2" />
                        Input Sewa
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col"
                        onClick={() => router.push("/input-rental")}
                      >
                        <Plus className="h-6 w-6 mb-2" />
                        Input Sewa (Manual)
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col"
                        onClick={() => router.push("/input-client")}
                      >
                        <Users className="h-6 w-6 mb-2" />
                        Tambah Client
                      </Button>
                      <Button
                        variant="outline"
                        className="h-20 flex-col"
                        onClick={() => router.push("/manage-rentals")}
                      >
                        <Edit className="h-6 w-6 mb-2" />
                        Manajemen Data Sewa
                      </Button>
                    </>
                  )}
                  
                  <Button
                    variant="outline"
                    className="h-20 flex-col"
                    onClick={() => router.push("/browse-assets")}
                  >
                    <Package className="h-6 w-6 mb-2" />
                    Lihat Semua Aset
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}