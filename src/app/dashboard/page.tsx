"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    const role = localStorage.getItem("userRole")
    
    if (!isAuthenticated || !role) {
      router.push("/login")
      return
    }
    
    setUserRole(role)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated")
    localStorage.removeItem("userRole")
    router.push("/login")
  }

  if (!userRole) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600">Sistem Inventory dan Booking Media Iklan</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline">{userRole.toUpperCase()}</Badge>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Admin Features */}
          {userRole === "admin" && (
            <>
              
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/booking")}>
                <CardHeader>
                  <CardTitle>Booking Sewa</CardTitle>
                  <CardDescription>Booking based on availability</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Booking sewa aset media iklan</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/manage-rentals")}>
                <CardHeader>
                  <CardTitle>Manajemen Data Sewa</CardTitle>
                  <CardDescription>Lihat, edit, hapus data sewa</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Kelola seluruh data penyewaan aset</p>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/input-rental")}>
                <CardHeader>
                  <CardTitle>Input Data Sewa (Manual)</CardTitle>
                  <CardDescription>Sharing titik, custom</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Masukkan data custom sewa aset</p>
                </CardContent>
              </Card>

              {/* <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/update-rental")}>
                <CardHeader>
                  <CardTitle>Ubah Data Sewa</CardTitle>
                  <CardDescription>Update data penyewaan existing</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Edit data penyewaan yang sudah ada</p>
                </CardContent>
              </Card> */}

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/input-client")}>
                <CardHeader>
                  <CardTitle>Input Data Client</CardTitle>
                  <CardDescription>Tambah data client baru</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Masukkan informasi client baru</p>
                </CardContent>
              </Card>
            </>
          )}

          {/* Busdev Features */}
          {(userRole === "busdev") && (
               <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/input-asset")}>
                <CardHeader>
                  <CardTitle>Input Data Aset</CardTitle>
                  <CardDescription>Tambah data aset media baru</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Masukkan data aset media iklan baru</p>
                </CardContent>
              </Card>
          )}

          {/* Guest Features */}
          {(userRole === "admin" || userRole === "busdev" || userRole === "guest") && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push("/browse-assets")}>
              <CardHeader>
                <CardTitle>Browse Aset</CardTitle>
                <CardDescription>Lihat daftar aset media</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">Jelajahi semua aset media iklan yang tersedia</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}