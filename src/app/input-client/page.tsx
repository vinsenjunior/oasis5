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
import { Edit, Trash2, Plus, Search } from "lucide-react"

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
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const clientsPerPage = 5
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
        setError(errorData)
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
        // Refresh client list
        fetchClients()
      } else {
        const errorData = await response.json()
        console.log(errorData)
        setError(errorData.error);
        
      }
    } catch (err) {
      setError("Terjadi kesalahan saat menghapus data")
    } finally {
      // Always close the dialog and reset the client to delete
      setDeleteDialogOpen(false)
      setClientToDelete(null)
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

  // Filter clients based on search term
  const filteredClients = clients.filter(client => 
    client.txtClient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.txtCompany && client.txtCompany.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Pagination logic
  const indexOfLastClient = currentPage * clientsPerPage
  const indexOfFirstClient = indexOfLastClient - clientsPerPage
  const currentClients = filteredClients.slice(indexOfFirstClient, indexOfLastClient)
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Client</h1>
          <p className="text-gray-600">Tambah, edit, hapus data client</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          Kembali ke Dashboard
        </Button>
      </div>
      
      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Input Form */}
        <div>
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
        </div>

        {/* Right column - Client List */}
        <div>
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Daftar Client Terdaftar</CardTitle>
              <CardDescription>Kelola data client yang sudah terdaftar</CardDescription>
              
              {/* Search Box */}
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari berdasarkan nama client atau perusahaan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto">
               {isLoading? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Memuat data sewa...</p>
                </div>
              </div>
            ) : (
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
                    {currentClients.map((client) => (
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
                
                {filteredClients.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? "Tidak ada client yang cocok dengan pencarian" : "Belum ada data client terdaftar"}
                  </div>
                )}
              </div>
            )}
            </CardContent>
            
            {/* Pagination */}
            {filteredClients.length > clientsPerPage && (
              <CardFooter className="border-t pt-4">
                <div className="flex items-center justify-between w-full">
                  <div className="text-sm text-gray-500">
                    Menampilkan {indexOfFirstClient + 1} - {Math.min(indexOfLastClient, filteredClients.length)} dari {filteredClients.length} client
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => paginate(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Sebelumnya
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => paginate(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => paginate(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              </CardFooter>
            )}
          </Card>
        </div>
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