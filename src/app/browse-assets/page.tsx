"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, MapPin, Ruler, Zap, Calendar, User, ExternalLink } from "lucide-react"
import { format } from "date-fns"

interface Asset {
  assetID: string
  txtStation: string
  txtDesc: string
  txtCode: string
  txtMediaGroup: string
  txtMediaSubGroup: string
  intQty: number
  lnkMockup: string
  numvisualW: string
  numvisualH: string
  numsizeW: string
  numsizeH: string
  numsizeD: string
  numsizeSQM: string
  numweightmedia: string
  numweightstructure: string
  numpoweract: string
  numpowerest: string
  txtpixelpitch: string
  txtnotes: string
}

interface Rental {
  rentid: number
  datestart: string
  dateend: string
  txtsales: string
  txtnotes: string
  lnkreport: string
  client: {
    txtClient: string
    txtCompany: string
  }
}

export default function BrowseAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])
  const [stations, setStations] = useState<string[]>([])
  const [mediaGroups, setMediaGroups] = useState<string[]>([])
  const [mediaSubGroups, setMediaSubGroups] = useState<string[]>([])
  const [filters, setFilters] = useState({
    station: "",
    mediaGroup: "",
    mediaSubGroup: "",
    assetCode: ""
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [rentalHistory, setRentalHistory] = useState<Rental[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const router = useRouter()
  const itemsPerPage = 20

  useEffect(() => {
    fetchAssets()
    fetchFilters()
  }, [])

  useEffect(() => {
    filterAssets()
  }, [assets, filters])

  const fetchAssets = async () => {
    try {
      const response = await fetch("/api/assets")
      if (response.ok) {
        const data = await response.json()
        setAssets(data)
      }
    } catch (err) {
      console.error("Error fetching assets:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchFilters = async () => {
    try {
      const [stationsRes, groupsRes, subGroupsRes] = await Promise.all([
        fetch("/api/assets/stations"),
        fetch("/api/assets/media-groups"),
        fetch("/api/assets/media-sub-groups")
      ])

      if (stationsRes.ok) {
        const stationsData = await stationsRes.json()
        setStations(stationsData)
      }

      if (groupsRes.ok) {
        const groupsData = await groupsRes.json()
        setMediaGroups(groupsData)
      }

      if (subGroupsRes.ok) {
        const subGroupsData = await subGroupsRes.json()
        setMediaSubGroups(subGroupsData)
      }
    } catch (err) {
      console.error("Error fetching filters:", err)
    }
  }

  const fetchRentalHistory = async (assetId: string) => {
    setHistoryLoading(true)
    try {
      const response = await fetch(`/api/assets/${assetId}/rentals`)
      if (response.ok) {
        const data = await response.json()
        setRentalHistory(data)
      }
    } catch (err) {
      console.error("Error fetching rental history:", err)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleViewHistory = async (asset: Asset) => {
    setSelectedAsset(asset)
    setHistoryDialogOpen(true)
    await fetchRentalHistory(asset.assetID)
  }

  const filterAssets = () => {
    let filtered = assets

    if (filters.station) {
      filtered = filtered.filter(asset => asset.txtStation === filters.station)
    }

    if (filters.mediaGroup) {
      filtered = filtered.filter(asset => asset.txtMediaGroup === filters.mediaGroup)
    }

    if (filters.mediaSubGroup) {
      filtered = filtered.filter(asset => asset.txtMediaSubGroup === filters.mediaSubGroup)
    }

    if (filters.assetCode) {
      filtered = filtered.filter(asset => 
        asset.txtCode.toLowerCase().includes(filters.assetCode.toLowerCase())
      )
    }

    setFilteredAssets(filtered)
    setCurrentPage(1)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      station: "",
      mediaGroup: "",
      mediaSubGroup: "",
      assetCode: ""
    })
  }

  const getRentalStatus = (startDate: string, endDate: string) => {
    const today = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (today < start) {
      return { status: "upcoming", label: "Akan Datang", variant: "secondary" as const }
    } else if (today >= start && today <= end) {
      return { status: "active", label: "Aktif", variant: "default" as const }
    } else {
      return { status: "completed", label: "Selesai", variant: "outline" as const }
    }
  }

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentAssets = filteredAssets.slice(startIndex, startIndex + itemsPerPage)

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading assets...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
         <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Browse Media Assets</h1>
            <p className="text-gray-600">Jelajahi semua aset media iklan yang tersedia</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Kembali ke Dashboard
          </Button>
        </div>

      {/* Filter Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Data Aset
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Station</label>
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
              <label className="text-sm font-medium">Media Group</label>
              <Select value={filters.mediaGroup} onValueChange={(value) => handleFilterChange("mediaGroup", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih media group" />
                </SelectTrigger>
                <SelectContent>
                  {/* <SelectItem value="">Semua Group</SelectItem> */}
                  {mediaGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Media Sub Group</label>
              <Select value={filters.mediaSubGroup} onValueChange={(value) => handleFilterChange("mediaSubGroup", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih sub group" />
                </SelectTrigger>
                <SelectContent>
                  {/* <SelectItem value="">Semua Sub Group</SelectItem> */}
                  {mediaSubGroups.map((subGroup) => (
                    <SelectItem key={subGroup} value={subGroup}>
                      {subGroup}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Kode Aset</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Cari kode aset..."
                  value={filters.assetCode}
                  onChange={(e) => handleFilterChange("assetCode", e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Menampilkan {filteredAssets.length} dari {assets.length} aset
            </p>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentAssets.map((asset) => (
          <Card key={asset.assetID} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-fit aspect-video bg-gray-200 relative">
              {asset.lnkMockup ? (
                <img
                  src={asset.lnkMockup}
                  alt={asset.txtDesc || asset.txtCode}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-2">
                <Badge variant="secondary">{asset.txtCode}</Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs"
                  onClick={() => handleViewHistory(asset)}
                >
                  History
                </Button>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="space-y-1">
                <div>
                  <h3 className="font-semibold text-lg">{asset.txtCode}</h3>
                  {/* <p className="text-sm text-gray-600 line-clamp-2">{asset.txtDesc || "No description available"}</p> */}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{asset.txtStation}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{asset.txtMediaGroup}</Badge>
                  <Badge variant="outline">{asset.txtMediaSubGroup}</Badge>
                </div>

                {/* <div className="grid grid-cols-2 gap-2 text-sm">
                  {asset.numsizeSQM && (
                    <div className="flex items-center gap-1">
                      <Ruler className="h-3 w-3" />
                      <span>{asset.numsizeSQM} m²</span>
                    </div>
                  )}
                  {asset.numpoweract && (
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <span>{asset.numpoweract}W</span>
                    </div>
                  )}
                </div> 

                {asset.txtnotes && (
                  <p className="text-xs text-gray-500 line-clamp-2">{asset.txtnotes}</p>
                )}*/}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {currentAssets.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Tidak ada aset yang ditemukan dengan filter yang dipilih.</p>
        </div>
      )}

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
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }

                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => setCurrentPage(pageNum)}
                      isActive={currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
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

      {/* Rental History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historical Data Sewa - {selectedAsset?.txtCode}
            </DialogTitle>
            <DialogDescription>
              {selectedAsset?.txtStation} - {selectedAsset?.txtMediaGroup} / {selectedAsset?.txtMediaSubGroup}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Asset Info */}
            {selectedAsset && (
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      {/* <h4 className="font-semibold mb-2">Detail Aset</h4> */}
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Kode:</span> {selectedAsset.txtCode}</p>
                        <p><span className="font-medium">Stasiun:</span> {selectedAsset.txtStation}</p>
                        <p><span className="font-medium">Media Group:</span> {selectedAsset.txtMediaGroup}</p>
                        <p><span className="font-medium">Media Sub Group:</span> {selectedAsset.txtMediaSubGroup}</p>
                        <p><span className="font-medium">Visual Width</span> {selectedAsset.numvisualW} m</p>
                        <p><span className="font-medium">Visual Height</span> {selectedAsset.numvisualH} m</p>
                        {selectedAsset.numsizeSQM && (
                          <p><span className="font-medium">Ukuran:</span> {selectedAsset.numsizeSQM} m²</p>
                        )}
                      </div>
                    </div>
                    <div>
                      {/* <h4 className="font-semibold mb-2">Gambar Aset</h4> */}
                      <div className="w-fit h-fit aspect-video bg-gray-200 rounded-lg overflow-hidden">
                        {selectedAsset.lnkMockup ? (
                          <img
                            src={selectedAsset.lnkMockup}
                            alt={selectedAsset.txtDesc || selectedAsset.txtCode}
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-auto flex items-center justify-center bg-gray-100">
                            <span className="text-gray-400">No Image Available</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* {selectedAsset.txtDesc && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-1">Deskripsi</h4>
                      <p className="text-sm text-gray-600">{selectedAsset.txtDesc}</p>
                    </div>
                  )} */}
                </CardContent>
              </Card>
            )}

            {/* Rental History Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Riwayat Penyewaan</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : rentalHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Client</TableHead>
                        <TableHead>Periode</TableHead>
                        <TableHead>Sales</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Report</TableHead>
                        <TableHead>Catatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rentalHistory.map((rental) => {
                        const status = getRentalStatus(rental.datestart, rental.dateend)
                        return (
                          <TableRow key={rental.rentid}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{rental.client.txtClient}</p>
                                {rental.client.txtCompany && (
                                  <p className="text-sm text-gray-500">{rental.client.txtCompany}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                <p>{format(new Date(rental.datestart), 'dd MMM yyyy')}</p>
                                <p className="text-gray-500">s/d</p>
                                <p>{format(new Date(rental.dateend), 'dd MMM yyyy')}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span className="text-sm">{rental.txtsales || '-'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={status.variant}>{status.label}</Badge>
                            </TableCell>
                            <TableCell>
                              {rental.lnkreport ? (
                                <a
                                  href={rental.lnkreport}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  Lihat
                                </a>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <p className="text-sm max-w-xs truncate" title={rental.txtnotes}>
                                {rental.txtnotes || '-'}
                              </p>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Belum ada data penyewaan untuk aset ini
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}