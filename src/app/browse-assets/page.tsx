"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MapPin, Calendar, User, ExternalLink, Eye } from "lucide-react"
import { format } from "date-fns"
import Image from 'next/image'

// 导入提供的组件和钩子
import Pagination from "@/components/Pagination"
import RentalFilters from "@/components/RentalFilters"
import { useRentalFilter } from "@/hooks/useRentalFilter"

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

// 将资产转换为租赁格式以适配过滤组件
const assetToRentalFormat = (asset: Asset): any => ({
  rentid: 0,
  assetID: asset.assetID,
  clientID: 0,
  datestart: "",
  dateend: "",
  txtsales: "",
  lnkreport: "",
  txtnotes: "",
  asset: {
    assetID: asset.assetID,
    txtStation: asset.txtStation,
    txtCode: asset.txtCode,
    kodetitik: "",
    txtMediaGroup: asset.txtMediaGroup,
    txtMediaSubGroup: asset.txtMediaSubGroup
  },
  client: {
    clientID: 0,
    txtClient: "",
    txtCompany: "",
    txtPhone: "",
    txtAddress: ""
  }
})

export default function BrowseAssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [rentalHistory, setRentalHistory] = useState<Rental[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const router = useRouter()
  
  // 状态用于分页
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  
  // 过滤状态
  const [filters, setFilters] = useState({
    station: "",
    mediaGroup: "",
    mediaSubGroup: "",
    assetCode: ""
  })

  useEffect(() => {
    fetchAssets()
  }, [])

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

  // 应用过滤条件到资产数据
  const getFilteredAssets = () => {
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

    return filtered
  }

  // 处理过滤变化
  const handleFilterChange = (newFilters: any) => {
    setFilters({
      station: newFilters.station || "",
      mediaGroup: newFilters.mediaGroup || "",
      mediaSubGroup: newFilters.mediaSubGroup || "",
      assetCode: newFilters.assetCode || ""
    })
    setCurrentPage(1) // 重置到第一页
  }

  // 清除过滤
  const handleClearFilters = () => {
    setFilters({
      station: "",
      mediaGroup: "",
      mediaSubGroup: "",
      assetCode: ""
    })
    setCurrentPage(1) // 重置到第一页
  }

  // 将资产转换为租赁格式以适配过滤组件
  const rentalsForFilter = assets.map(assetToRentalFormat)

  const filteredAssets = getFilteredAssets()
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

      {/* 使用提供的过滤组件 */}
      <RentalFilters 
        rentals={rentalsForFilter}
        onFilterChange={handleFilterChange}
        initialFilters={{
          station: filters.station,
          mediaGroup: filters.mediaGroup,
          mediaSubGroup: filters.mediaSubGroup,
          assetCode: filters.assetCode
        }}
      />

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentAssets.map((asset) => (
          <Card key={asset.assetID} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-fit aspect-video bg-gray-200 relative">
              {asset.lnkMockup ? (
                <img
                  src={asset.lnkMockup}
                  alt={asset.txtDesc || asset.txtCode}
                  className="w-full h-full"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <span className="text-gray-400">No Image</span>
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2 text-xs"
                  onClick={() => handleViewHistory(asset)}
                >
                  <Eye className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="space-y-1">
                <div>
                  <h3 className="font-semibold text-lg">{asset.txtCode}</h3>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{asset.txtStation}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{asset.txtMediaGroup}</Badge>
                  <Badge variant="outline">{asset.txtMediaSubGroup}</Badge>
                </div>
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

      {/* 使用提供的分页组件 */}
      {totalPages > 1 && (
        <div className="mt-8">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredAssets.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            showItemsPerPageSelector={true}
            itemsPerPageOptions={[10, 20, 50, 100]}
          />
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
                      <table className="min-w-full text-left text-sm whitespace-nowrap">
                        <tbody>
                          <tr className="">
                            <th scope="row" className="px-6 py-3 border-x dark:border-neutral-600">
                              Kode :
                            </th>
                            <td className="px-6 py-3 border-x dark:border-neutral-600">{selectedAsset.txtCode}</td>                        
                          </tr>
                          <tr className="bg-neutral-100 ">
                            <th scope="row" className="px-6 py-3 border-x dark:border-neutral-600">
                              Stasiun :
                            </th>
                            <td className="px-6 py-3 border-x dark:border-neutral-600">{selectedAsset.txtStation}</td>                        
                          </tr>
                          <tr className="">
                            <th scope="row" className="px-6 py-3 border-x dark:border-neutral-600">
                              Media Group :
                            </th>
                            <td className="px-6 py-3 border-x dark:border-neutral-600">{selectedAsset.txtMediaGroup}</td>                        
                          </tr>
                          <tr className="bg-neutral-100 ">
                            <th scope="row" className="px-6 py-3 border-x dark:border-neutral-600">
                              Media Sub Group :
                            </th>
                            <td className="px-6 py-3 border-x dark:border-neutral-600">{selectedAsset.txtMediaSubGroup}</td>                        
                          </tr>
                          <tr className="">
                            <th scope="row" className="px-6 py-3 border-x dark:border-neutral-600">
                              Visual Width :
                            </th>
                            <td className="px-6 py-3 border-x dark:border-neutral-600">{selectedAsset.numvisualW} m</td>                        
                          </tr>
                          <tr className="bg-neutral-100 ">
                            <th scope="row" className="px-6 py-3 border-x dark:border-neutral-600">
                              Visual Height :
                            </th>
                            <td className="px-6 py-3 border-x dark:border-neutral-600">{selectedAsset.numvisualH} m</td>                        
                          </tr>
                          <tr className="">
                            <th scope="row" className="px-6 py-3 border-x dark:border-neutral-600">
                              Visual SQM :
                            </th>
                            <td className="px-6 py-3 border-x dark:border-neutral-600">{selectedAsset.numsizeSQM} m²</td>                        
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div>
                      <div className="w-full h-full">
                        <img 
                          src={selectedAsset.lnkMockup} 
                          alt={selectedAsset.txtDesc && selectedAsset.txtCode }
                          className="h-full w-full"
                        />
                      </div>
                    </div>
                  </div>
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
                        const today = new Date()
                        const start = new Date(rental.datestart)
                        const end = new Date(rental.dateend)
                        
                        let status = { status: "completed", label: "Selesai", variant: "destructive" as const }
                        if (today < start) {
                          status = { status: "upcoming", label: "Akan Datang", variant: "secondary" as const }
                        } else if (today >= start && today <= end) {
                          status = { status: "active", label: "Aktif", variant: "default" as const }
                        }
                        
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