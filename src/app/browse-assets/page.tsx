"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardImage, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Search, Eye } from "lucide-react"

interface Asset {
  assetID: string
  txtStation: string
  txtDesc: string
  txtCode: string
  kodetitik: string
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

interface FilterOptions {
  stations: string[]
  mediaGroups: string[]
  mediaSubGroups: string[]
}

export default function BrowseAssetsPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()
  
  const [assets, setAssets] = useState<Asset[]>([])
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    stations: [],
    mediaGroups: [],
    mediaSubGroups: []
  })
  
  const [filters, setFilters] = useState({
    station: "",
    mediaGroup: "",
    mediaSubGroup: "",
    code: ""
  })
  
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [loading, setLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    const role = localStorage.getItem("userRole")
    
    if (!isAuthenticated) {
      router.push("/login")
      return
    }
    
    setUserRole(role)
    fetchAssets()
  }, [router])

  useEffect(() => {
    applyFilters()
  }, [filters, assets])

  const fetchAssets = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/assets")
      const assetsData = await response.json()
      setAssets(assetsData)
      
      // Extract filter options
      const stations = [...new Set(assetsData.map((asset: Asset) => asset.txtStation))]
      const mediaGroups = [...new Set(assetsData.map((asset: Asset) => asset.txtMediaGroup))]
      const mediaSubGroups = [...new Set(assetsData.map((asset: Asset) => asset.txtMediaSubGroup))]
      
      setFilterOptions({
        stations,
        mediaGroups,
        mediaSubGroups
      })
      
    } catch (error) {
      console.error("Error fetching assets:", error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
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

    if (filters.code) {
      filtered = filtered.filter(asset => 
        asset.kodetitik.toLowerCase().includes(filters.code.toLowerCase())
      )
    }

    //   if (filters.code) {
    //   filtered = filtered.filter(asset => 
    //     asset.kodetitik.toLowerCase() === filters.code
    //   )
    // }

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
      code: ""
    })
  }

  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentAssets = filteredAssets.slice(startIndex, startIndex + itemsPerPage)

  if (!userRole) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
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
              <Search className="w-5 h-5" />
              Filter Data Aset
            </CardTitle>
            <CardDescription>Cari aset berdasarkan kriteria tertentu</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Station</Label>
                <Select value={filters.station} onValueChange={(value) => handleFilterChange("station", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih station" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* <SelectItem value="">Semua Station</SelectItem> */}
                    {filterOptions.stations.map((station) => (
                      <SelectItem key={station} value={station}>
                        {station}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Media Group</Label>
                <Select value={filters.mediaGroup} onValueChange={(value) => handleFilterChange("mediaGroup", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih media group" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* <SelectItem value="">Semua Media Group</SelectItem> */}
                    {filterOptions.mediaGroups.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Media Sub Group</Label>
                <Select value={filters.mediaSubGroup} onValueChange={(value) => handleFilterChange("mediaSubGroup", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih media sub group" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* <SelectItem value="">Semua Media Sub Group</SelectItem> */}
                    {filterOptions.mediaSubGroups.map((subGroup) => (
                      <SelectItem key={subGroup} value={subGroup}>
                        {subGroup}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Kode Titik</Label>
                <Input
                  placeholder="Cari kode titik..."
                  value={filters.code}
                  onChange={(e) => handleFilterChange("code", e.target.value)}
                />
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
            Menampilkan {currentAssets.length} dari {filteredAssets.length} aset
          </p>
        </div>

        {/* Assets Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentAssets.map((asset) => (
              <Card key={asset.assetID} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{asset.txtCode}</CardTitle>
                      {/* <CardDescription className="text-xs text-gray-500">{asset.txtCode}</CardDescription> */}
                      <CardDescription>{asset.txtStation}</CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedAsset(asset)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Media Group:</span>
                      <Badge variant="secondary">{asset.txtMediaGroup}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Sub Group:</span>
                      <Badge variant="outline">{asset.txtMediaSubGroup}</Badge>
                    </div>
                    {/* <div className="flex justify-between">
                      <span className="text-sm font-medium">Quantity:</span>
                      <span>{asset.intQty}</span>
                    </div> */}
                    {asset.txtDesc && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {asset.txtDesc}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
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
                  const page = i + 1
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

        {/* Asset Detail Modal */}
        {selectedAsset && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <CardImage className="max-w-xl w-full max-h-[90vh] overflow-y-auto">
              {/* <img src="/placeholder.jpg" alt="test" className="rounded-t-lg" /> */}
              <iframe src="https://drive.google.com/file/d/1pk5GxFI2OxqDlMm-oPc8j6fc1EIOJEMy/preview" className="h-full w-full object-cover rounded-t-lg" ></iframe>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{selectedAsset.kodetitik}</CardTitle>
                    <CardDescription>{selectedAsset.txtStation}</CardDescription>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedAsset(null)}>
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Kode Aset</Label>
                      <p className="text-xs">{selectedAsset.txtCode}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Kode Titik</Label>
                      <p className="text-xs">{selectedAsset.kodetitik}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Media Group</Label>
                      <p className="text-xs">{selectedAsset.txtMediaGroup}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Media Sub Group</Label>
                      <p className="text-xs">{selectedAsset.txtMediaSubGroup}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Quantity</Label>
                      <p className="text-xs">{selectedAsset.intQty}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Visual Width</Label>
                      <p className="text-xs">{selectedAsset.numvisualW || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Visual Height</Label>
                      <p className="text-xs">{selectedAsset.numvisualH || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Size Width</Label>
                      <p className="text-xs">{selectedAsset.numsizeW || "-"}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Size Height</Label>
                      <p className="text-xs">{selectedAsset.numsizeH || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Size Depth</Label>
                      <p className="text-xs">{selectedAsset.numsizeD || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Size SQM</Label>
                      <p className="text-xs">{selectedAsset.numsizeSQM || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Weight Media</Label>
                      <p className="text-xs">{selectedAsset.numweightmedia || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Weight Structure</Label>
                      <p className="text-xs">{selectedAsset.numweightstructure || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Pixel Pitch</Label>
                      <p className="text-xs">{selectedAsset.txtpixelpitch || "-"}</p>
                    </div>
                  </div>
                </div>
                
                {selectedAsset.txtDesc && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-xs">{selectedAsset.txtDesc}</p>
                  </div>
                )}
                
                {selectedAsset.txtnotes && (
                  <div className="mt-4 py-8">
                    <Label className="text-sm font-medium">Notes</Label>
                    <p className="text-xs">{selectedAsset.txtnotes}</p>
                  </div>
                )}
              </CardContent>
            </CardImage>
          </div>
        )}
      </div>
    </div>
  )
}