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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogOverlay } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Trash2, Eye, Search, Calendar, MapPin, Users,ChevronsUpDown } from "lucide-react"
import { format } from "date-fns"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Rental {
  rentid: number
  assetID: string
  clientID: number
  datestart: string
  dateend: string
  txtsales: string
  lnkreport: string
  txtnotes: string

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
    status: "all", // all, active, expired
    txtCode: "",
    startDate: "", // Tanggal mulai filter
    endDate: ""     // Tanggal akhir filter
  })

  const [clientSearch, setClientSearch] = useState("")

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  // const [loading, setLoading] = useState(true)
  //const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null)
  const [editingRental, setEditingRental] = useState<Rental | null>(null)
  const [editForm, setEditForm] = useState({
    txtsales: "",
    lnkreport: "",
    txtnotes: "",
    datestart: "",  // Tambahkan ini
    dateend: ""     // Tambahkan ini
  })
  
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Fungsi pembantu tanggal
  // Tambahkan fungsi pembantu untuk memformat tanggal dengan aman
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "--";
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "--";
    }
  };

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    const role = localStorage.getItem("userRole")
    
    // if (!isAuthenticated || role !== "admin") {
    //   router.push("/login")
    //   return
    // }
    
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

  // Fungsi untuk menerapkan filter
  // Perbaiki fungsi applyFilters
    const applyFilters = () => {
    let filtered = rentals

    // Filter client
    if (filters.clientID) {
      filtered = filtered.filter(rental => rental.clientID.toString() === filters.clientID)
    }

    // Filter station
    if (filters.station) {
      filtered = filtered.filter(rental => rental.asset.txtStation === filters.station)
    }
    
    // Filter kode aset
    if (filters.assetCode) {
      filtered = filtered.filter((rental) =>
        rental.asset.txtCode
          .toLowerCase()
          .includes(filters.assetCode.toLowerCase())
      )
    }

    // Filter status
    if (filters.status !== "all") {
      const today = new Date()
      if (filters.status === "active") {
        filtered = filtered.filter(rental => {
          if (!rental.datestart || !rental.dateend) return false
          const start = new Date(rental.datestart)
          const end = new Date(rental.dateend)
          return end >= today && start <= today
        })
      } else if (filters.status === "expired") {
        filtered = filtered.filter(rental => {
          if (!rental.dateend) return false
          const end = new Date(rental.dateend)
          return end < today
        })
      } else if (filters.status === "booked") {
        filtered = filtered.filter(rental => {
          if (!rental.datestart) return false
          const start = new Date(rental.datestart)
          return start > today
        })
      }
    }

    // Filter periode tanggal
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate)
      const endDate = new Date(filters.endDate)
      
      // Set jam ke 00:00:00 untuk startDate dan 23:59:59 untuk endDate
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
      
      filtered = filtered.filter(rental => {
        // Lewati jika tanggal rental kosong
        if (!rental.datestart || !rental.dateend) return false
        
        const rentalStart = new Date(rental.datestart)
        const rentalEnd = new Date(rental.dateend)
        
        // Cek apakah periode rental tumpang tindih dengan periode filter
        return rentalStart <= endDate && rentalEnd >= startDate
      })
    }

    setFilteredRentals(filtered)
    setCurrentPage(1)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
  setFilters({
    clientID: "",
    station: "",
    status: "all",
    assetCode: "",
    startDate: "",
    endDate: ""
    })  
  }
  // Parameter untuk pagination
  const totalPages = Math.ceil(filteredRentals.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentAssets = filteredRentals.slice(startIndex, startIndex + itemsPerPage)

  const handleEdit = (rental: Rental) => {
    setEditingRental(rental)
    setEditForm({
      txtsales: rental.txtsales || "",
      lnkreport: rental.lnkreport || "",
      txtnotes: rental.txtnotes || "",
      datestart: rental.datestart ? format(new Date(rental.datestart), "yyyy-MM-dd") : "",
      dateend: rental.dateend ? format(new Date(rental.dateend), "yyyy-MM-dd") : ""
    })
  }

  const handleUpdate = async () => {
    if (!editingRental) return

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validasi tanggal
      if (!editForm.datestart || !editForm.dateend) {
        throw new Error("Tanggal mulai dan selesai sewa harus diisi")
      }
      
      if (new Date(editForm.dateend) < new Date(editForm.datestart)) {
        throw new Error("Tanggal selesai harus setelah tanggal mulai")
      }

      const response = await fetch(`/api/rentals`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rentid: editingRental.rentid,
          ...editForm,
          // Konversi tanggal ke format ISO jika ada
          datestart: editForm.datestart ? new Date(editForm.datestart).toISOString() : null,
          dateend: editForm.dateend ? new Date(editForm.dateend).toISOString() : null
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

  // Fungsi untuk mendapatkan badge status
  // Perbaiki fungsi getStatusBadge
  const getStatusBadge = (startDate: string | null, endDate: string | null) => {
    const today = new Date();
    
    if (!startDate || !endDate) {
      return <Badge variant="secondary">Tanggal tidak valid</Badge>;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return <Badge variant="secondary">Tanggal tidak valid</Badge>;
    }
    
    if (today < start) {
      return <Badge className="bg-green-100 text-green-800">Booked</Badge>;
    } else if (today >= start && today <= end) {
      return <Badge variant="outline">Aktif</Badge>;
    } else {
      return <Badge variant="destructive">Selesai</Badge>;
    }
  };

  if (!userRole) {
    return <div>Loading...</div>
  }

  // Fungsi untuk menghasilkan nomor halaman yang akan ditampilkan
  const generatePaginationItems = (currentPage: number, totalPages: number) => {
    // Jika total halaman <= 7, tampilkan semua
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    
    // Jika halaman aktif di awal (1-4)
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, 6, '...', totalPages]
    }
    
    // Jika halaman aktif di akhir (total-3 hingga total)
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 5, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    
    // Jika halaman aktif di tengah
    return [
      1, 
      '...', 
      currentPage - 2, 
      currentPage - 1, 
      currentPage, 
      currentPage + 1, 
      currentPage + 2, 
      '...', 
      totalPages
    ]
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
            <div className="flex flex-wrap gap-4 items-end">
              {/* Filter Client */}
              <div className="min-w-[200px] flex-1">
                <Label className="text-sm">Client</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded="false"
                      className="w-full justify-between mt-1"
                    >
                      {filters.clientID
                        ? clients.find(c => c.clientID.toString() === filters.clientID)?.txtClient
                        : (clientSearch || "Pilih client...")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full max-w-md p-0 max-h-[60vh] overflow-y-auto">
                    <Command>
                      <CommandInput
                        value={clientSearch}
                        onValueChange={(value) => {
                          const v = value.trim()
                          setClientSearch(value)
                          if (v === "") {
                            handleFilterChange("clientID", "")
                            return
                          }
                          const exact = clients.find(
                            (c) =>
                              c.txtClient.toLowerCase() === v.toLowerCase() ||
                              c.txtCompany.toLowerCase() === v.toLowerCase()
                          )
                          if (exact) {
                            handleFilterChange("clientID", exact.clientID.toString())
                          } else {
                            handleFilterChange("clientID", "")
                          }
                        }}
                        placeholder="Ketik nama client..."
                      />
                      <CommandList>
                        {(() => {
                          const q = clientSearch.trim().toLowerCase()
                          const filtered = q
                            ? clients.filter(
                                (c) =>
                                  c.txtClient.toLowerCase().includes(q) ||
                                  c.txtCompany.toLowerCase().includes(q)
                              )
                            : clients

                          if (filtered.length === 0) {
                            return <CommandEmpty>Tidak ada client ditemukan</CommandEmpty>
                          }

                          return (
                            <CommandGroup>
                              {filtered.map((client) => (
                                <CommandItem
                                  key={client.clientID}
                                  value={client.txtClient}
                                  onSelect={() => {
                                    handleFilterChange("clientID", client.clientID.toString())
                                    setClientSearch(client.txtClient)
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span>{client.txtClient}</span>
                                    {client.txtCompany && (
                                      <span className="text-sm text-muted-foreground">
                                        {client.txtCompany}
                                      </span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )
                        })()}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Filter Station */}
              <div className="min-w-[150px] flex-1">
                <Label className="text-sm">Stasiun</Label>
                <Select value={filters.station} onValueChange={(value) => handleFilterChange("station", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih stasiun" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (
                      <SelectItem key={station} value={station}>
                        {station}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filter Kode Aset */}
              <div className="min-w-[150px] flex-1">
                <Label className="text-sm">Kode Aset</Label>
                <Input
                  placeholder="Kode aset..."
                  value={filters.assetCode}
                  onChange={(e) => handleFilterChange("assetCode", e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Filter Status */}
              <div className="min-w-[150px] flex-1">
                <Label className="text-sm">Status</Label>
                <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="booked">Booked</SelectItem>
                    <SelectItem value="expired">Selesai</SelectItem>
                  </SelectContent>
                </Select>
              </div>

             {/* Filter Tanggal */}
              <div className="min-w-[250px] flex-1 date-picker-container">
                <Label className="text-sm">Periode Tanggal</Label>
                <div className="flex gap-1 mt-1">
                  <Input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange("startDate", e.target.value)}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Force show picker
                      (e.target as HTMLInputElement).showPicker?.();
                    }}
                    className="w-full"
                    // Tambahkan atribut ini
                    data-testid="start-date"
                  />
                  <span className="self-center text-gray-500">-</span>
                  <Input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => {
                      const selectedDate = e.target.value
                      if (filters.startDate && selectedDate < filters.startDate) {
                        setError("Tanggal akhir tidak boleh sebelum tanggal mulai")
                        return
                      }
                      handleFilterChange("endDate", selectedDate)
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Force show picker
                      (e.target as HTMLInputElement).showPicker?.();
                    }}
                    min={filters.startDate || undefined}
                    className="w-full"
                    // Tambahkan atribut ini
                    data-testid="end-date"
                  />
                </div>
              </div>

              {/* Tombol Clear */}
              <div>
                <Button variant="outline" onClick={clearFilters} className="mt-6">
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
       {/* Indikator Filter Aktif dan badge */}
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          {filters.clientID && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              Client: {clients.find(c => c.clientID.toString() === filters.clientID)?.txtClient}
            </Badge>
          )}
          
          {filters.station && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Stasiun: {filters.station}
            </Badge>
          )}
          
          {filters.assetCode && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Kode: {filters.assetCode}
            </Badge>
          )}
          
          {filters.status !== "all" && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {filters.status === "active" ? "Aktif" : filters.status === "booked" ? "Booked" : "Selesai"}
            </Badge>
          )}
          
          {filters.startDate && filters.endDate && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(filters.startDate), "dd/MM/yyyy")} - {format(new Date(filters.endDate), "dd/MM/yyyy")}
            </Badge>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <p className="text-sm text-gray-600">
              Menampilkan {currentAssets.length} dari {filteredRentals.length} data sewa
            </p>
            {totalPages > 1 && (
              <Badge variant="outline">
                Halaman {currentPage} dari {totalPages}
              </Badge>
            )}
          </div>
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
                  {currentAssets.map((rental) => (
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
                          <div>{formatDate(rental.datestart)}</div>
                          <div className="text-gray-500">s/d {formatDate(rental.dateend)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{rental.txtsales || "-"}</TableCell>
                      <TableCell>{getStatusBadge(rental.datestart, rental.dateend)}</TableCell>
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
                                <p className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  {formatDate(rental.datestart)} - {formatDate(rental.dateend)}
                                </p>
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

                          {/* <Dialog>
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
                          </Dialog> */}
                          
                          {/* Dialog Edit Data Sewa */}

                          
                          <Dialog open={!!editingRental} onOpenChange={(open) => !open && setEditingRental(null)}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => handleEdit(rental)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Edit Data Sewa #{editingRental?.rentid}</DialogTitle>
                                <DialogDescription>
                                  Update informasi sewa aset
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4">
                                {/* Input Tanggal Start */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="datestart">Tanggal Mulai Sewa</Label>
                                      <Input
                                        id="datestart"
                                        type="date"
                                        value={editForm.datestart}
                                        onChange={(e) => {
                                          setEditForm(prev => ({ ...prev, datestart: e.target.value }))
                                          // Reset tanggal end jika lebih kecil dari tanggal start baru
                                          if (editForm.dateend && e.target.value > editForm.dateend) {
                                            setEditForm(prev => ({ ...prev, dateend: "" }))
                                          }
                                        }}
                                      />
                                      {/* badge diubah jika berbeda dari data awal */}
                                      {editingRental && editForm.datestart !== format(new Date(editingRental.datestart), "yyyy-MM-dd") && (
                                          <Badge variant="secondary">Diubah</Badge>
                                        )}
                                    </div>

                                    {/* Input Tanggal End */}
                                    <div className="space-y-2">
                                      <Label htmlFor="dateend">Tanggal Selesai Sewa</Label>
                                      <Input
                                        id="dateend"
                                        type="date"
                                        value={editForm.dateend}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, dateend: e.target.value }))}
                                        min={editForm.datestart || undefined}
                                        disabled={!editForm.datestart}
                                      />
                                      {!editForm.datestart && (
                                        <p className="text-sm text-red-500">Pilih tanggal mulai terlebih dahulu</p>
                                      )}
                                      {editForm.datestart && editForm.dateend && new Date(editForm.dateend) < new Date(editForm.datestart) && (
                                        <p className="text-sm text-red-500">Tanggal selesai harus setelah tanggal mulai</p>
                                      )}
                                    </div>
                                </div>

                                {/* Input Sales */}
                                <div className="space-y-2">
                                  <Label htmlFor="txtsales">Nama Sales</Label>
                                  <Input
                                    id="txtsales"
                                    value={editForm.txtsales}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, txtsales: e.target.value }))}
                                  />
                                </div>

                                {/* Input Link Report */}
                                <div className="space-y-2">
                                  <Label htmlFor="lnkreport">Link Report</Label>
                                  <Input
                                    id="lnkreport"
                                    value={editForm.lnkreport}
                                    onChange={(e) => setEditForm(prev => ({ ...prev, lnkreport: e.target.value }))}
                                  />
                                </div>

                                {/* Input Catatan */}
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

                                {/* Tombol Update dengan konfirmasi */}
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      disabled={loading || !editForm.datestart || !editForm.dateend || 
                                              (editForm.datestart && editForm.dateend && new Date(editForm.dateend) < new Date(editForm.datestart))}
                                    >
                                      {loading ? "Loading..." : "Update"}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Konfirmasi Update</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Apakah Anda yakin ingin menyimpan perubahan data sewa ini?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={async () => {
                                          await handleUpdate()
                                          setEditingRental(null) // tutup setelah sukses
                                        }}
                                      >
                                        Ya, Simpan
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {/* Dialog konfirmasi hapus */}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {generatePaginationItems(currentPage, totalPages).map((page, index) => {
                  if (page === '...') {
                    return (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <span className="px-2">...</span>
                      </PaginationItem>
                    )
                  }
                  
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  )
}