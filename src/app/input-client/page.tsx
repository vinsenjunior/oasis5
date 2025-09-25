/* "use client"

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
    
    // if (!isAuthenticated || role !== "admin" || role!="sms") {
    //   router.push("/login")
    //   return
    // }
    
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
} */

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Edit, Trash2, Plus } from "lucide-react"

interface Client {
  clientID: number
  txtClient: string
  txtCompany: string
  txtPhone: string
  txtAddress: string
}

export default function InputClientPage() {
  const [clientName, setClientName] = useState("")
  const [companyName, setCompanyName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    const userRole = localStorage.getItem("userRole")
    
    if (!isAuthenticated || userRole !== "admin") {
      router.push("/login")
      return
    }

    fetchClients()
  }, [router])

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients")
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (err) {
      console.error("Error fetching clients:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validate form
      if (!clientName.trim()) {
        setError("Nama client harus diisi")
        return
      }

      const clientData = {
        txtClient: clientName.trim(),
        txtCompany: companyName.trim() || null,
        txtPhone: phone.trim() || null,
        txtAddress: address.trim() || null
      }

      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clientData),
      })

      if (response.ok) {
        setSuccess("Data client berhasil disimpan")
        // Reset form
        setClientName("")
        setCompanyName("")
        setPhone("")
        setAddress("")
        // Refresh client list
        fetchClients()
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Gagal menyimpan data client")
      }
    } catch (err) {
      setError("Terjadi kesalahan saat menyimpan data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setClientName(client.txtClient)
    setCompanyName(client.txtCompany || "")
    setPhone(client.txtPhone || "")
    setAddress(client.txtAddress || "")
    setError("")
    setSuccess("")
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient) return

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const clientData = {
        txtClient: clientName.trim(),
        txtCompany: companyName.trim() || null,
        txtPhone: phone.trim() || null,
        txtAddress: address.trim() || null
      }

      const response = await fetch(`/api/clients/${editingClient.clientID}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(clientData),
      })

      if (response.ok) {
        setSuccess("Data client berhasil diperbarui")
        // Reset form
        setClientName("")
        setCompanyName("")
        setPhone("")
        setAddress("")
        setEditingClient(null)
        // Refresh client list
        fetchClients()
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Gagal memperbarui data client")
      }
    } catch (err) {
      setError("Terjadi kesalahan saat memperbarui data")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteClick = (client: Client) => {
    setClientToDelete(client)
    setDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!clientToDelete) return

    try {
      const response = await fetch(`/api/clients/${clientToDelete.clientID}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setSuccess("Data client berhasil dihapus")
        setDeleteDialogOpen(false)
        setClientToDelete(null)
        // Refresh client list
        fetchClients()
      } else {
        const errorData = await response.json()
        setError(errorData.message || "Gagal menghapus data client")
      }
    } catch (err) {
      setError("Terjadi kesalahan saat menghapus data")
    }
  }

  const cancelEdit = () => {
    setEditingClient(null)
    setClientName("")
    setCompanyName("")
    setPhone("")
    setAddress("")
    setError("")
    setSuccess("")
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Manajemen Client</h1>
            <p className="text-gray-600">Tambah, edit, hapus data client</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Kembali ke Dashboard
          </Button>
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {editingClient ? "Edit Data Client" : "Input Data Client"}
            </CardTitle>
            <CardDescription>
              {editingClient ? "Perbarui data client yang ada" : "Masukkan data client baru"}
            </CardDescription>
          </CardHeader>
          <form onSubmit={editingClient ? handleUpdate : handleSubmit}>
            <CardContent className="space-y-4">
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
                <Label htmlFor="clientName">Nama Client *</Label>
                <Input
                  id="clientName"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nama client"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Nama PT</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Nama perusahaan"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telp</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Nomor telepon"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat client"
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={isLoading}>
                {isLoading ? "Memproses..." : editingClient ? "Update" : "Simpan"}
              </Button>
              {editingClient && (
                <Button className="w-1/2" type="button" variant="outline" onClick={cancelEdit}>
                  Batal
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>

        {/* Client List */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Client Terdaftar</CardTitle>
            <CardDescription>Kelola data client yang sudah terdaftar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Client</TableHead>
                    <TableHead>Perusahaan</TableHead>
                    <TableHead>Telepon</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.clientID}>
                      <TableCell className="font-medium">{client.txtClient}</TableCell>
                      <TableCell>{client.txtCompany || "-"}</TableCell>
                      <TableCell>{client.txtPhone || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(client)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(client)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {clients.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Belum ada data client terdaftar
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus client "{clientToDelete?.txtClient}"? 
              Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}