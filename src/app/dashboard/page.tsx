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

  const fetchStats = async () => {
    try {
      const [assetsRes, clientsRes, rentalsRes, stationsRes] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/clients"),
        fetch("/api/rentals"),
        fetch("/api/assets/stations")
      ])

      if (assetsRes.ok) {
        const assets = await assetsRes.json()
        setStats(prev => ({ ...prev, totalAssets: assets.length }))
      }

      if (clientsRes.ok) {
        const clients = await clientsRes.json()
        setStats(prev => ({ ...prev, totalClients: clients.length }))
      }

      if (rentalsRes.ok) {
        const rentals = await rentalsRes.json()
        const today = new Date().toISOString().split('T')[0]
        const activeRentals = rentals.filter((rental: any) => 
          rental.datestart <= today && rental.dateend >= today
        )
        setStats(prev => ({ ...prev, activeRentals: activeRentals.length }))
      }

      if (stationsRes.ok) {
        const stations = await stationsRes.json()
        setStats(prev => ({ ...prev, totalStations: stations.length }))
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userRole")
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
      {/* Header */}
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
          {/* Sidebar Navigation */}
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

          {/* Main Content */}
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
                {/* <CardDescription>
                  Aksi cepat yang sering digunakan
                </CardDescription> */}
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

// export default function DashboardPage() {
//   const [userRole, setUserRole] = useState<string | null>(null)
//   const router = useRouter()

//   useEffect(() => {
//     const isAuthenticated = localStorage.getItem("isAuthenticated")
//     const role = localStorage.getItem("userRole")
    
//     if (!isAuthenticated || !role) {
//       router.push("/login")
//       return
//     }
    
//     setUserRole(role)
//   }, [router])

//   const handleLogout = () => {
//     localStorage.removeItem("isAuthenticated")
//     localStorage.removeItem("userRole")
//     router.push("/login")
//   }

//   if (!userRole) {
//     return <div>Loading...</div>
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-4">
//       <div className="max-w-6xl mx-auto">
//         <div className="flex justify-between items-center mb-8">
//           <div>
//             <h1 className="text-3xl font-bold">Dashboard</h1>
//             <p className="">O.A.S.I.S</p>
//           </div>
//           <div className="flex items-center gap-4">
//             <Badge variant="outline" className="">{userRole.toUpperCase()}</Badge>
//             <Button variant="" className="bg-blue-800 text-white hover:bg-blue-950" onClick={handleLogout}>
//               Logout
//             </Button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {/* Admin Features */}
//           {(userRole === "admin" || userRole === "sms") && (
//             <>
              
//               <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/booking")}>
//                 <CardHeader>
//                   <CardTitle>Booking Sewa</CardTitle>
//                   <CardDescription>Booking based on availability</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <p className="text-sm text-gray-600">Booking sewa aset media iklan</p>
//                 </CardContent>
//               </Card>

//               <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/manage-rentals")}>
//                 <CardHeader>
//                   <CardTitle>Manajemen Data Sewa</CardTitle>
//                   <CardDescription>Lihat, edit, hapus data sewa</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <p className="text-sm text-gray-600">Kelola seluruh data penyewaan aset</p>
//                 </CardContent>
//               </Card>

//               <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/input-rental")}>
//                 <CardHeader>
//                   <CardTitle>Input Data Sewa (Manual)</CardTitle>
//                   <CardDescription>Sharing titik, Digital, custom</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <p className="text-sm text-gray-600">Masukkan data custom sewa aset</p>
//                 </CardContent>
//               </Card>

//               {/* <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/update-rental")}>
//                 <CardHeader>
//                   <CardTitle>Ubah Data Sewa</CardTitle>
//                   <CardDescription>Update data penyewaan existing</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <p className="text-sm text-gray-600">Edit data penyewaan yang sudah ada</p>
//                 </CardContent>
//               </Card> */}

//               <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/input-client")}>
//                 <CardHeader>
//                   <CardTitle>Input Data Client</CardTitle>
//                   <CardDescription>Tambah data client baru</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <p className="text-sm text-gray-600">Masukkan informasi client baru</p>
//                 </CardContent>
//               </Card>
//             </>
//           )}

//           {/* Busdev Features */}
//           {(userRole === "busdev" || userRole === "admin") && (
//                <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/input-asset")}>
//                 <CardHeader>
//                   <CardTitle>Input Data Aset</CardTitle>
//                   <CardDescription>Tambah data aset media baru</CardDescription>
//                 </CardHeader>
//                 <CardContent>
//                   <p className="text-sm text-gray-600">Masukkan data aset media iklan baru</p>
//                 </CardContent>
//               </Card>
//           )}

//           {/* Guest Features */}
//           {(userRole === "admin" || userRole === "busdev" || userRole === "guest" || userRole === "sms") && (
//             <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/browse-assets")}>
//               <CardHeader>
//                 <CardTitle>Browse Aset</CardTitle>
//                 <CardDescription>Lihat daftar aset media</CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <p className="text-sm text-gray-600">Jelajahi semua aset media iklan yang tersedia</p>
//               </CardContent>
//             </Card>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }