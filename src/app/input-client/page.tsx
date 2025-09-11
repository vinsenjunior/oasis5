"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"

export default function InputClientPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    txtClient: "",
    txtCompany: "",
    txtPhone: "",
    txtAddress: ""
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    const role = localStorage.getItem("userRole")
    
    if (!isAuthenticated || role !== "admin") {
      router.push("/login")
      return
    }
    
    setUserRole(role)
  }, [router])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validate form
      if (!formData.txtClient.trim()) {
        setError("Nama client harus diisi")
        return
      }

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Gagal menyimpan data client")
      }

      setSuccess("Data client berhasil disimpan")
      // Reset form
      setFormData({
        txtClient: "",
        txtCompany: "",
        txtPhone: "",
        txtAddress: ""
      })
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data")
    } finally {
      setLoading(false)
    }
  }

  if (!userRole) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Input Data Client</h1>
            <p className="text-gray-600">Tambah data client baru</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Kembali ke Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Input Data Client</CardTitle>
            <CardDescription>Isi data client baru</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="txtClient">Nama Client *</Label>
                <Input
                  id="txtClient"
                  placeholder="Nama client"
                  value={formData.txtClient}
                  onChange={(e) => handleInputChange("txtClient", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="txtCompany">Nama PT</Label>
                <Input
                  id="txtCompany"
                  placeholder="Nama perusahaan"
                  value={formData.txtCompany}
                  onChange={(e) => handleInputChange("txtCompany", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="txtPhone">Telp</Label>
                <Input
                  id="txtPhone"
                  placeholder="Nomor telepon"
                  value={formData.txtPhone}
                  onChange={(e) => handleInputChange("txtPhone", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="txtAddress">Alamat</Label>
                <Textarea
                  id="txtAddress"
                  placeholder="Alamat lengkap"
                  value={formData.txtAddress}
                  onChange={(e) => handleInputChange("txtAddress", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? "Loading..." : "Simpan"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}