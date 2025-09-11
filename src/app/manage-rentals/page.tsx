"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Trash2, Eye, Search, Calendar, MapPin, Users } from "lucide-react"
import { format } from "date-fns"

interface Rental {
  rentid: number
  assetID: string
  clientID: number
  datestart: string
  dateend: string
  txtsales: string
  lnkreport: string
  txtnotes: string
  createdAt: string
  updatedAt: string
  asset: {
    assetID: string
    txtStation: string
    txtCode: string
    kodetitik: string
    txtMediaGroup: string
    txtMediaSubGroup: string
  }
  client: {
    clientID: number
    txtClient: string
    txtCompany: string
    txtPhone: string
    txtAddress: string
  }
}

interface Client {
  clientID: number
  txtClient: string
  txtCompany: string
}

export default function ManageRentalsPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()
  
  const [rentals, setRentals] = useState<Rental[]>([])
  const [filteredRentals, setFilteredRentals] = useState<Rental[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [stations, setStations] = useState<string[]>([])
  
  const [filters, setFilters] = useState({
    clientID: "",
    station: "",
    status: "all" // all, active, expired
  })
  
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null)
  const [editingRental, setEditingRental] = useState<Rental | null>(null)
  const [editForm, setEditForm] = useState({
    txtsales: "",
    lnkreport: "",
    txtnotes: ""
  })
  
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
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
    fetchData()
  }, [router])

  useEffect(() => {
    applyFilters()
  }, [filters, rentals])

  const fetchData = async () => {
    try {
      // Fetch rentals with joined data
      const rentalsResponse = await fetch("/api/rentals")
      const rentalsData = await rentalsResponse.json()
      setRentals(rentalsData)
      
      // Extract unique stations and clients
      const uniqueStations = [...new Set(rentalsData.map((rental: Rental) => rental.asset.txtStation))]
      const uniqueClients = rentalsData.reduce((acc: Client[], rental: Rental) => {
        if (!acc.find(c => c.clientID === rental.clientID)) {
          acc.push({
            clientID: rental.clientID,
            txtClient: rental.client.txtClient,
            txtCompany: rental.client.txtCompany || ""
          })
        }
        return acc
      }, [])
      
      setStations(uniqueStations)
      setClients(uniqueClients)
      
    } catch (err) {
      setError("Gagal memuat data")
    }
  }

  const applyFilters = () => {
    let filtered = rentals

    if (filters.clientID) {
      filtered = filtered.filter(rental => rental.clientID.toString() === filters.clientID)
    }

    if (filters.station) {
      filtered = filtered.filter(rental => rental.asset.txtStation === filters.station)
    }

    if (filters.status !== "all") {
      const today = new Date()
      if (filters.status === "active") {
        filtered = filtered.filter(rental => new Date(rental.dateend) >= today)
      } else if (filters.status === "expired") {
        filtered = filtered.filter(rental => new Date(rental.dateend) < today)
      }
    }

    setFilteredRentals(filtered)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      clientID: "",
      station: "",
      status: "all"
    })
  }

  const handleEdit = (rental: Rental) => {
    setEditingRental(rental)
    setEditForm({
      txtsales: rental.txtsales || "",
      lnkreport: rental.lnkreport || "",
      txtnotes: rental.txtnotes || ""
    })
  }

  const handleUpdate = async () => {
    if (!editingRental) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/rentals`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rentid: editingRental.rentid,
          ...editForm
        })
      })

      if (!response.ok) {
        throw new Error("Gagal update data sewa")
      }

      setSuccess("Data sewa berhasil diupdate")
      setEditingRental(null)
      await fetchData()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat update data")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (rentalId: number) => {
    setDeleteLoading(true)
    setError("")

    try {
      const response = await fetch(`/api/rentals?rentId=${rentalId}`, {
        method: "DELETE"
      })

      if (!response.ok) {
        throw new Error("Gagal hapus data sewa")
      }

      setSuccess("Data sewa berhasil dihapus")
      await fetchData()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat hapus data")
    } finally {
      setDeleteLoading(false)
    }
  }

  const getStatusBadge = (dateEnd: string) => {
    const endDate = new Date(dateEnd)
    const today = new Date()
    
    if (endDate >= today) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>
    } else {
      return <Badge variant="destructive">Expired</Badge>
    }
  }

  if (!userRole) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Manajemen Data Sewa</h1>
            <p className="text-gray-600">Lihat, edit, dan hapus data penyewaan aset</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Kembali ke Dashboard
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 mb-6">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Filter Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Filter Data Sewa
            </CardTitle>
            <CardDescription>Filter data sewa berdasarkan kriteria tertentu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Client</Label>
                <Select value={filters.clientID} onValueChange={(value) => handleFilterChange("clientID", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih client" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* <SelectItem value="">Semua Client</SelectItem> */}
                    {clients.map((client) => (
                      <SelectItem key={client.clientID} value={client.clientID.toString()}>
                        {client.txtClient} {client.txtCompany && `(${client.txtCompany})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Stasiun</Label>
                <Select value={filters.station} onValueChange={(value) => handleFilterChange("station", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih stasiun" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* <SelectItem value="">Semua Stasiun</SelectItem> */}
                    {stations.map((station) => (
                      <SelectItem key={station} value={station}>
                        {station}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Menampilkan {filteredRentals.length} dari {rentals.length} data sewa
          </p>
        </div>

        {/* Rentals Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rent ID</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Aset</TableHead>
                    <TableHead>Stasiun</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRentals.map((rental) => (
                    <TableRow key={rental.rentid}>
                      <TableCell className="font-medium">#{rental.rentid}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rental.client.txtClient}</div>
                          {rental.client.txtCompany && (
                            <div className="text-sm text-gray-500">{rental.client.txtCompany}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{rental.asset.txtCode}</div>
                          <div className="text-xs text-gray-500">{rental.asset.kodetitik}</div>
                        </div>
                      </TableCell>
                      <TableCell>{rental.asset.txtStation}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{format(new Date(rental.datestart), "dd/MM/yyyy")}</div>
                          <div className="text-gray-500">s/d {format(new Date(rental.dateend), "dd/MM/yyyy")}</div>
                        </div>
                      </TableCell>
                      <TableCell>{rental.txtsales || "-"}</TableCell>
                      <TableCell>{getStatusBadge(rental.dateend)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => setSelectedRental(rental)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Detail Sewa #{rental.rentid}</DialogTitle>
                              </DialogHeader>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Client</Label>
                                  <p>{rental.client.txtClient}</p>
                                  {rental.client.txtCompany && <p className="text-sm text-gray-500">{rental.client.txtCompany}</p>}
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Sales</Label>
                                  <p>{rental.txtsales || "-"}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Aset</Label>
                                  <p>{rental.asset.txtCode}</p>
                                  <p className="text-sm text-gray-500">{rental.asset.kodetitik}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Stasiun</Label>
                                  <p>{rental.asset.txtStation}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Media Group</Label>
                                  <p>{rental.asset.txtMediaGroup}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Media Sub Group</Label>
                                  <p>{rental.asset.txtMediaSubGroup}</p>
                                </div>
                                <div className="col-span-2">
                                  <Label className="text-sm font-medium">Periode Sewa</Label>
                                  <p>{format(new Date(rental.datestart), "dd/MM/yyyy")} - {format(new Date(rental.dateend), "dd/MM/yyyy")}</p>
                                </div>
                                {rental.lnkreport && (
                                  <div className="col-span-2">
                                    <Label className="text-sm font-medium">Link Report</Label>
                                    <a href={rental.lnkreport} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                      {rental.lnkreport}
                                    </a>
                                  </div>
                                )}
                                {rental.txtnotes && (
                                  <div className="col-span-2">
                                    <Label className="text-sm font-medium">Catatan</Label>
                                    <p className="mt-1">{rental.txtnotes}</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => handleEdit(rental)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Data Sewa #{rental.rentid}</DialogTitle>
                                <DialogDescription>
                                  Update informasi sewa aset
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor="txtsales">Nama Sales</Label>
                                  <Input
                                    id="txtsales"
                                    value={editForm.txtsales}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, txtsales: e.target.value }))}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="lnkreport">Link Report</Label>
                                  <Input
                                    id="lnkreport"
                                    value={editForm.lnkreport}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, lnkreport: e.target.value }))}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="txtnotes">Catatan</Label>
                                  <Textarea
                                    id="txtnotes"
                                    value={editForm.txtnotes}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, txtnotes: e.target.value }))}
                                    rows={3}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEditingRental(null)}>
                                  Batal
                                </Button>
                                <Button onClick={handleUpdate} disabled={loading}>
                                  {loading ? "Loading..." : "Update"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Konfirmasi Hapus Data</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus data sewa #{rental.rentid}? 
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(rental.rentid)}
                                  disabled={deleteLoading}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {deleteLoading ? "Loading..." : "Hapus"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}