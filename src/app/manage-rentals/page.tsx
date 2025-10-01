"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Edit, Trash2, Eye, Search, Calendar, MapPin, Users, ChevronsUpDown } from "lucide-react"
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
  datestart: string | null
  dateend: string | null
  txtsales: string | null
  lnkreport: string | null
  txtnotes: string | null
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
    txtCompany: string | null
    txtPhone?: string | null
    txtAddress?: string | null
  }
}

interface Client {
  clientID: number
  txtClient: string
  txtCompany: string | null
}

const fetcher = (url: string) =>
  fetch(url).then(res => {
    if (!res.ok) throw new Error("Fetch failed")
    return res.json()
  })

export default function ManageRentalsPage() {
  const router = useRouter()
  const { data: rentals, error, isLoading, mutate } = useSWR<Rental[]>("/api/rentals", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5 * 60 * 1000,
  })

  const [filters, setFilters] = useState({
    clientID: "",
    station: "",
    status: "all",
    mediaGroup: "",
    mediaSubGroup: "",
    assetCode: "",
    startDate: "",
    endDate: "",
  })

  const [clientSearch, setClientSearch] = useState("")
  const [filteredRentals, setFilteredRentals] = useState<Rental[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  const [editingRental, setEditingRental] = useState<Rental | null>(null)
  const [editForm, setEditForm] = useState({
    txtsales: "",
    lnkreport: "",
    txtnotes: "",
    datestart: "",
    dateend: "",
  })

  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [errorMsg, setErrorMsg] = useState("")

  // Derived lists from rentals
  const clients: Client[] = rentals
    ? rentals.reduce((acc: Client[], rental: Rental) => {
        if (!acc.find(c => c.clientID === rental.clientID)) {
          acc.push({
            clientID: rental.clientID,
            txtClient: rental.client.txtClient,
            txtCompany: rental.client.txtCompany || null,
          })
        }
        return acc
      }, [])
    : []

  const stations = rentals ? Array.from(new Set(rentals.map(r => r.asset.txtStation))).filter(Boolean) : []
  const mediaGroups = rentals ? Array.from(new Set(rentals.map(r => r.asset.txtMediaGroup))).filter(Boolean) : []
  const mediaSubGroups = rentals ? Array.from(new Set(rentals.map(r => r.asset.txtMediaSubGroup))).filter(Boolean) : []

  // Apply filters (derived)
  useEffect(() => {
    if (!rentals) return
    let filtered = rentals.slice()

    if (filters.clientID) {
      filtered = filtered.filter(r => r.clientID.toString() === filters.clientID)
    }
    if (filters.station) {
      filtered = filtered.filter(r => r.asset.txtStation === filters.station)
    }
    if (filters.mediaGroup) {
      filtered = filtered.filter(r => r.asset.txtMediaGroup === filters.mediaGroup)
    }
    if (filters.mediaSubGroup) {
      filtered = filtered.filter(r => r.asset.txtMediaSubGroup === filters.mediaSubGroup)
    }
    if (filters.assetCode) {
      const q = filters.assetCode.toLowerCase()
      filtered = filtered.filter(r => r.asset.txtCode.toLowerCase().includes(q))
    }

    if (filters.status !== "all") {
      const today = new Date()
      if (filters.status === "active") {
        filtered = filtered.filter(r => r.datestart && r.dateend && new Date(r.datestart) <= today && new Date(r.dateend) >= today)
      } else if (filters.status === "expired") {
        filtered = filtered.filter(r => r.dateend && new Date(r.dateend) < new Date())
      } else if (filters.status === "booked") {
        filtered = filtered.filter(r => r.datestart && new Date(r.datestart) > new Date())
      }
    }

    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate); startDate.setHours(0,0,0,0)
      const endDate = new Date(filters.endDate); endDate.setHours(23,59,59,999)
      filtered = filtered.filter(r => {
        if (!r.datestart || !r.dateend) return false
        const rs = new Date(r.datestart)
        const re = new Date(r.dateend)
        return rs <= endDate && re >= startDate
      })
    }

    setFilteredRentals(filtered)
    setCurrentPage(1)
  }, [filters, rentals])

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      clientID: "",
      station: "",
      status: "all",
      mediaGroup: "",
      mediaSubGroup: "",
      assetCode: "",
      startDate: "",
      endDate: "",
    })
    setClientSearch("")
  }

  // Update rental
  const handleUpdate = async () => {
    if (!editingRental) return
    setLoading(true)
    setErrorMsg("")
    try {
      // basic validation
      if (!editForm.datestart || !editForm.dateend) {
        setErrorMsg("Tanggal mulai dan selesai harus diisi")
        setLoading(false)
        return
      }
      if (new Date(editForm.dateend) < new Date(editForm.datestart)) {
        setErrorMsg("Tanggal selesai harus setelah tanggal mulai")
        setLoading(false)
        return
      }

      const response = await fetch(`/api/rentals`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rentid: editingRental.rentid,
          ...editForm,
          datestart: editForm.datestart ? new Date(editForm.datestart).toISOString() : null,
          dateend: editForm.dateend ? new Date(editForm.dateend).toISOString() : null,
        }),
      })
      if (!response.ok) throw new Error("Update failed")
      
      setSuccess("Data sewa berhasil diupdate")
      setEditingRental(null)
      await mutate()
     
    } catch (err) {
      console.error(err)
      setErrorMsg("Gagal update data")
    } finally {
      setLoading(false)
    }
  }

  // Delete rental
  const handleDelete = async (rentalId: number) => {
    setDeleteLoading(true)
    setErrorMsg("")
    try {
      const response = await fetch(`/api/rentals?rentId=${rentalId}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Delete failed")
      setSuccess("Data sewa berhasil dihapus")
      await mutate()
    } catch (err) {
      console.error(err)
      setErrorMsg("Gagal menghapus data")
    } finally {
      setDeleteLoading(false)
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Gagal memuat data</div>

  // pagination
  const totalPages = Math.max(1, Math.ceil(filteredRentals.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentAssets = filteredRentals.slice(startIndex, startIndex + itemsPerPage)

  const formatDateSafe = (d: string | null) => {
    if (!d) return "-"
    try { return format(new Date(d), "dd/MM/yyyy") } catch { return "-" }
  }

  const getStatusBadge = (datestart: string | null, dateend: string | null) => {
    if (!datestart || !dateend) return <Badge variant="secondary">Tanggal tidak valid</Badge>
    const today = new Date()
    const start = new Date(datestart)
    const end = new Date(dateend)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return <Badge variant="secondary">Tanggal tidak valid</Badge>
    if (today < start) return <Badge className="bg-green-100 text-green-800">Booked</Badge>
    if (today >= start && today <= end) return <Badge variant="outline">Aktif</Badge>
    return <Badge variant="destructive">Selesai</Badge>
  }

  const generatePaginationItems = (currentPage: number, totalPages: number) => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    if (currentPage <= 4) return [1,2,3,4,5,6,'...', totalPages]
    if (currentPage >= totalPages - 3) return [1,'...', totalPages-5, totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages]
    return [1,'...', currentPage-2, currentPage-1, currentPage, currentPage+1, currentPage+2,'...', totalPages]
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Manajemen Data Sewa</h1>
            <p className="text-gray-600">Lihat, edit, dan hapus data penyewaan aset</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>Kembali ke Dashboard</Button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Filter Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" /> Filter Data Sewa
            </CardTitle>
            <CardDescription>Filter data sewa berdasarkan kriteria tertentu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              {/* Client Popover */}
              <div className="min-w-[200px] flex-1">
                <Label className="text-sm">Client</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded="false" className="w-full justify-between mt-1">
                      {filters.clientID ? clients.find(c => c.clientID.toString() === filters.clientID)?.txtClient : (clientSearch || "Pilih client...")}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full max-w-md p-0 max-h-[60vh] overflow-y-auto">
                    <Command>
                      <CommandInput
                        placeholder="Ketik nama client..."
                        value={clientSearch}
                        onValueChange={(val) => {
                          setClientSearch(val)
                          const v = val.trim().toLowerCase()
                          if (!v) {
                            handleFilterChange("clientID", "")
                            return
                          }
                          const exact = clients.find(c => c.txtClient.toLowerCase() === v || (c.txtCompany || "").toLowerCase() === v)
                          if (exact) handleFilterChange("clientID", exact.clientID.toString())
                          else handleFilterChange("clientID", "")
                        }}
                      />
                      <CommandList>
                        {clients.length === 0 ? (
                          <CommandEmpty>Tidak ada client ditemukan</CommandEmpty>
                        ) : (
                          <CommandGroup>
                            {clients.map(client => (
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
                                  {client.txtCompany && <span className="text-sm text-muted-foreground">{client.txtCompany}</span>}
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Station */}
              <div className="min-w-[150px] flex-1">
                <Label className="text-sm">Stasiun</Label>
                <select className="w-full border rounded p-2 mt-1" value={filters.station} onChange={(e) => handleFilterChange("station", e.target.value)}>
                  <option value="">Pilih stasiun</option>
                  {stations.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Media Group */}
              <div className="min-w-[150px] flex-1">
                <Label className="text-sm">Media Group</Label>
                <select className="w-full border rounded p-2 mt-1" value={filters.mediaGroup} onChange={(e) => handleFilterChange("mediaGroup", e.target.value)}>
                  <option value="">Pilih media group</option>
                  {mediaGroups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* Media Sub Group */}
              <div className="min-w-[150px] flex-1">
                <Label className="text-sm">Media Sub Group</Label>
                <select className="w-full border rounded p-2 mt-1" value={filters.mediaSubGroup} onChange={(e) => handleFilterChange("mediaSubGroup", e.target.value)}>
                  <option value="">Pilih media sub group</option>
                  {mediaSubGroups.map(sg => <option key={sg} value={sg}>{sg}</option>)}
                </select>
              </div>

              {/* Asset Code */}
              <div className="w-24 flex-none">
                <Label className="text-sm">Kode Aset</Label>
                <Input placeholder="Kode aset..." className="mt-1" value={filters.assetCode} onChange={(e) => handleFilterChange("assetCode", e.target.value)} />
              </div>

              {/* Status */}
              <div className="min-w-[150px] flex-1">
                <Label className="text-sm">Status</Label>
                <select className="w-full border rounded p-2 mt-1" value={filters.status} onChange={(e) => handleFilterChange("status", e.target.value)}>
                  <option value="all">Semua</option>
                  <option value="active">Aktif</option>
                  <option value="booked">Booked</option>
                  <option value="expired">Selesai</option>
                </select>
              </div>

              {/* Date Range */}
              <div className="min-w-[250px] flex-none">
                <Label className="text-sm">Periode Tanggal</Label>
                <div className="flex gap-1 mt-1">
                  <Input type="date" value={filters.startDate} onChange={(e) => handleFilterChange("startDate", e.target.value)} />
                  <span className="self-center text-gray-500">-</span>
                  <Input type="date" value={filters.endDate} min={filters.startDate || undefined} onChange={(e) => handleFilterChange("endDate", e.target.value)} />
                </div>
              </div>

              <div>
                <Button variant="default" onClick={clearFilters} className="mt-6">Clear</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result count and pagination badge */}
        <div className="mb-4 flex items-center gap-2">
          <p className="text-sm text-gray-600">Menampilkan {currentAssets.length} dari {filteredRentals.length} data sewa</p>
          {totalPages > 1 && <Badge variant="outline">Halaman {currentPage} dari {totalPages}</Badge>}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
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
                  {currentAssets.map(r => (
                    <TableRow key={r.rentid}>
                      <TableCell className="font-medium">#{r.rentid}</TableCell>
                      <TableCell>
                        <div className="font-medium">{r.client.txtClient}</div>
                        {r.client.txtCompany && <div className="text-sm text-gray-500">{r.client.txtCompany}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{r.asset.txtCode}</div>
                        <div className="text-xs text-gray-500">{r.asset.kodetitik}</div>
                      </TableCell>
                      <TableCell>{r.asset.txtStation}</TableCell>
                      <TableCell>
                        <div className="text-sm">{formatDateSafe(r.datestart)}</div>
                        <div className="text-xs text-gray-500">s/d {formatDateSafe(r.dateend)}</div>
                      </TableCell>
                      <TableCell>{r.txtsales || "-"}</TableCell>
                      <TableCell>{getStatusBadge(r.datestart, r.dateend)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Dialog open={!!editingRental && editingRental.rentid === r.rentid} onOpenChange={(open) => { if (!open) setEditingRental(null) }}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" onClick={() => {
                                setEditingRental(r)
                                setEditForm({
                                  txtsales: r.txtsales || "",
                                  lnkreport: r.lnkreport || "",
                                  txtnotes: r.txtnotes || "",
                                  datestart: r.datestart ? format(new Date(r.datestart), "yyyy-MM-dd") : "",
                                  dateend: r.dateend ? format(new Date(r.dateend), "yyyy-MM-dd") : "",
                                })
                              }}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Edit Data Sewa #{editingRental?.rentid}</DialogTitle>
                              </DialogHeader>

                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="datestart">Tanggal Mulai Sewa</Label>
                                    <Input id="datestart" type="date" value={editForm.datestart} onChange={(e) => {
                                      setEditForm(prev => ({ ...prev, datestart: e.target.value }))
                                      if (editForm.dateend && e.target.value > editForm.dateend) {
                                        setEditForm(prev => ({ ...prev, dateend: "" }))
                                      }
                                    }} />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="dateend">Tanggal Selesai Sewa</Label>
                                    <Input id="dateend" type="date" value={editForm.dateend} onChange={(e) => setEditForm(prev => ({ ...prev, dateend: e.target.value }))} min={editForm.datestart || undefined} disabled={!editForm.datestart} />
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="txtsales">Nama Sales</Label>
                                  <Input id="txtsales" value={editForm.txtsales} onChange={(e) => setEditForm(prev => ({ ...prev, txtsales: e.target.value }))} />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="lnkreport">Link Report</Label>
                                  <Input id="lnkreport" value={editForm.lnkreport} onChange={(e) => setEditForm(prev => ({ ...prev, lnkreport: e.target.value }))} />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="txtnotes">Catatan</Label>
                                  <Textarea id="txtnotes" value={editForm.txtnotes} onChange={(e) => setEditForm(prev => ({ ...prev, txtnotes: e.target.value }))} rows={3} />
                                </div>
                              </div>

                              <DialogFooter>
                                <Button variant="outline" onClick={() => setEditingRental(null)}>Batal</Button>

                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button disabled={loading || !editForm.datestart || !editForm.dateend || (editForm.datestart && editForm.dateend && new Date(editForm.dateend) < new Date(editForm.datestart))}>
                                      {loading ? "Loading..." : "Update"}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Konfirmasi Update</AlertDialogTitle>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Batal</AlertDialogCancel>
                                      <AlertDialogAction onClick={async () => {
                                        await handleUpdate()
                                      }}>
                                        Ya, Simpan
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
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
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(r.rentid)}>
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
                  <PaginationPrevious onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                </PaginationItem>

                {generatePaginationItems(currentPage, totalPages).map((p, idx) => {
                  if (p === '...') {
                    return <PaginationItem key={`ellipsis-${idx}`}><span className="px-2">...</span></PaginationItem>
                  }
                  return (
                    <PaginationItem key={p}>
                      <PaginationLink onClick={() => setCurrentPage(Number(p))} isActive={currentPage === p} className="cursor-pointer">
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  )
                })}

                <PaginationItem>
                  <PaginationNext onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  )
}
