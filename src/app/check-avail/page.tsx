"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  MapPin, 
  Ruler, 
  Zap, 
  CheckCircle, 
  XCircle,
  Clock,
  Users
} from "lucide-react"
import { format, isAfter, isBefore, isWithinInterval, parseISO } from "date-fns"


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
  assetID: string
  datestart: string
  dateend: string
  txtsales: string
  txtnotes: string
  client: {
    txtClient: string
    txtCompany: string
  }
}

export default function CheckAvailabilityPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])
  const [rentals, setRentals] = useState<Rental[]>([])
  const [stations, setStations] = useState<string[]>([])
  const [mediaGroups, setMediaGroups] = useState<string[]>([])
  const [mediaSubGroups, setMediaSubGroups] = useState<string[]>([])
  const [filters, setFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    station: "",
    mediaGroup: "",
    mediaSubGroup: "",
    assetCode: ""
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isChecking, setIsChecking] = useState(false)
  const [error, setError] = useState("")
  const [itemsPerPage] = useState(12)

  useEffect(() => {
    fetchData()
  }, [])
  
  useEffect(() => {
  if (!filters.startDate || !filters.endDate) {
    setFilteredAssets(assets)
    return
  }

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
}, [filters, assets])


  const fetchData = async () => {
    try {
      const [assetsRes, rentalsRes, stationsRes, groupsRes, subGroupsRes] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/rentals"),
        fetch("/api/assets/stations"),
        fetch("/api/assets/media-groups"),
        fetch("/api/assets/media-sub-groups")
      ])

      if (assetsRes.ok) {
        const assetsData = await assetsRes.json()
        setAssets(assetsData)
        setFilteredAssets(assetsData)
      }

      if (rentalsRes.ok) {
        const rentalsData = await rentalsRes.json()
        setRentals(rentalsData)
      }

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
      console.error("Error fetching data:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const isAssetAvailable = (asset: Asset, startDate: Date, endDate: Date) => {
    const assetRentals = rentals.filter(rental => rental.assetID === asset.assetID)
    
    return !assetRentals.some(rental => {
      const rentalStart = parseISO(rental.datestart)
      const rentalEnd = parseISO(rental.dateend)
      
      return (
        isWithinInterval(startDate, { start: rentalStart, end: rentalEnd }) ||
        isWithinInterval(endDate, { start: rentalStart, end: rentalEnd }) ||
        (isBefore(startDate, rentalStart) && isAfter(endDate, rentalEnd))
      )
    })
  }

  const getAssetStatus = (asset: Asset) => {
    if (!filters.startDate || !filters.endDate) {
      return { status: "neutral", message: "Pilih tanggal terlebih dahulu", icon: Clock }
    }

    const available = isAssetAvailable(asset, filters.startDate, filters.endDate)
    if (available) {
      return { status: "available", message: "Tersedia", icon: CheckCircle }
    } else {
      return { status: "booked", message: "Tidak tersedia", icon: XCircle }
    }
  }

  const handleCheckAvailability = async () => {
    if (!filters.startDate || !filters.endDate) {
      setError("Mohon pilih tanggal awal dan tanggal akhir")
      return
    }

    if (isAfter(filters.startDate, filters.endDate)) {
      setError("Tanggal awal tidak boleh setelah tanggal akhir")
      return
    }

    setIsChecking(true)
    setError("")

    try {
      // Apply filters
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
    } catch (err) {
      setError("Terjadi kesalahan saat memeriksa ketersediaan")
    } finally {
      setIsChecking(false)
    }
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
    //   startDate: undefined,
    //   endDate: undefined,
      station: "",
      mediaGroup: "",
      mediaSubGroup: "",
      assetCode: ""
    })
    setFilteredAssets(assets)
    setCurrentPage(1)
    setError("")
  }
  const router = useRouter()
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentAssets = filteredAssets.slice(startIndex, startIndex + itemsPerPage)

  // Count statistics
  const availableCount = filters.startDate && filters.endDate 
    ? filteredAssets.filter(asset => isAssetAvailable(asset, filters.startDate, filters.endDate)).length
    : 0
  const bookedCount = filters.startDate && filters.endDate 
    ? filteredAssets.length - availableCount
    : 0

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Check Availability</h1>
            <p className="text-gray-600">Cari aset yang tersedia</p>
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
            Filter Ketersediaan
          </CardTitle>
          <CardDescription className="text-red-400">
            !Pilih tanggal periode yang diinginkan sebelum menerapkan filter lainnya
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Date Selection
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Awal</label>
              <div className="relative">
               <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => {
                        setFilters(prev => ({ ...prev, startDate: date }))
                        if (date && !filters.endDate) {
                        const end = new Date(date)
                        end.setDate(end.getDate() + 7)
                        setFilters(prev => ({ ...prev, endDate: end }))
                        }
                    }
                    }
                    
                    className="rounded-md border shadow"
                    />

              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Akhir</label>
              <div className="relative">
                
                <Calendar
                  mode="single"
                  selected={filters.endDate}
                  onSelect={(date) => setFilters(prev => ({ ...prev, endDate: date }))}
                  disabled={(date) => filters.startDate ? date < filters.startDate : false}
                  className="absolute top-full mt-1 z-10 bg-white border rounded-md shadow-lg"
                />
              </div>
            </div>
          </div> */}

          {/* Date Selection */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div className="space-y-2">
    <label className="text-sm font-medium">Tanggal Awal</label>
    <Input
      type="date"
      value={filters.startDate ? format(filters.startDate, "yyyy-MM-dd") : ""}
      onChange={(e) => {
        const date = e.target.value ? new Date(e.target.value) : undefined
          if (date) {
            const end = new Date(date)
            end.setDate(end.getDate() + 7)
            setFilters((prev) => ({ ...prev, startDate: date, endDate: end }))
          } else {
            setFilters((prev) => ({ ...prev, startDate: undefined, endDate: undefined }))
          }
      }}
      className="w-full bg-green-50"
    />
  </div>

  <div className="space-y-2">
    <label className="text-sm font-medium">Tanggal Akhir</label>
    <Input
      type="date"
      value={filters.endDate ? format(filters.endDate, "yyyy-MM-dd") : ""}
      min={filters.startDate ? format(filters.startDate, "yyyy-MM-dd") : undefined}
      onChange={(e) => {
        const date = e.target.value ? new Date(e.target.value) : undefined
        setFilters((prev) => ({ ...prev, endDate: date }))
      }}
      className="w-full bg-red-50"
    />
  </div>
</div>


          {/* Asset Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Stasiun</label>
              <Select value={filters.station} onValueChange={(value) => handleFilterChange("station", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Stasiun" />
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
                  <SelectValue placeholder="Semua Group" />
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
                  <SelectValue placeholder="Semua Sub Group" />
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

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* <Button 
              onClick={handleCheckAvailability} 
              disabled={isChecking || !filters.startDate || !filters.endDate}
              className="flex-1"
            >
              {isChecking ? "Memeriksa..." : "Check Availability"}
            </Button> */}
            <Button variant="outline" onClick={clearFilters} className="flex-1">
              Clear Filters
            </Button>
          </div>

          {/* Statistics */}
          {filters.startDate && filters.endDate && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{filteredAssets.length}</div>
                <div className="text-sm text-gray-600">Total Aset</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{availableCount}</div>
                <div className="text-sm text-gray-600">Tersedia</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{bookedCount}</div>
                <div className="text-sm text-gray-600">Dibooking</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {filters.startDate && filters.endDate && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Hasil Pencarian</h2>
            <p className="text-sm text-gray-600">
              Menampilkan {filteredAssets.length} aset ({availableCount} tersedia, {bookedCount} dibooking)
            </p>
          </div>

          {/* Assets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentAssets.map((asset) => {
              const status = getAssetStatus(asset)
              const StatusIcon = status.icon

              return (
                <Card key={asset.assetID} className={`overflow-hidden hover:shadow-lg transition-shadow ${
                  status.status === 'booked' ? 'opacity-75' : ''
                }`}>
                  <div className="aspect-video bg-gray-200 relative">
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
                      <Badge 
                        variant={status.status === 'available' ? 'default' : 'destructive'}
                        className="flex items-center gap-1"
                      >
                        <StatusIcon className="h-3 w-3" />
                        {status.message}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
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
                      )} */}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
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
        </div>
      )}

      {!filters.startDate && !filters.endDate && (
        <div className="text-center py-12">
          <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Pilih Tanggal Periode</h3>
          <p className="text-gray-500">Silakan pilih tanggal awal dan tanggal akhir untuk mengecek ketersediaan aset</p>
        </div>
      )}
    </div>
  )
}