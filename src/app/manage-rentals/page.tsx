// app/dashboard/rentals/manage/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogOverlay } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit, Trash2, Eye, Calendar } from "lucide-react"
import { format } from "date-fns"
import RentalFilters from "@/components/RentalFilters"
import Pagination from "@/components/Pagination"
import { useRentalFilter } from "@/hooks/useRentalFilter"

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

export default function ManageRentalsPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()
  
  const [rentals, setRentals] = useState<Rental[]>([])
  const { filters, filteredRentals, updateFilters, clearFilters } = useRentalFilter(rentals)
  
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null)
  const [editingRental, setEditingRental] = useState<Rental | null>(null)
  const [editForm, setEditForm] = useState({
    txtsales: "",
    lnkreport: "",
    txtnotes: "",
    datestart: "",  
    dateend: ""     
  })
  
  // 新增状态：批量操作相关
  const [selectedRentals, setSelectedRentals] = useState<number[]>([])
  const [batchEditDialogOpen, setBatchEditDialogOpen] = useState(false)
  const [batchEditForm, setBatchEditForm] = useState({
    datestart: "",
    dateend: "",
    txtsales: "",
    lnkreport: "",
    txtnotes: ""
  })
  const [selectedClientID, setSelectedClientID] = useState<number | null>(null)
  
  const [loading, setLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [batchLoading, setBatchLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Fungsi pembantu tanggal
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "--";
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "--";
    }
  };

  // Check authentication on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthenticated = localStorage.getItem("isAuthenticated")
      const role = localStorage.getItem("userRole")
      
      setUserRole(role)
      
      if (!isAuthenticated || role !== "admin") {
        router.push("/login")
        return
      }
      
      fetchData()
    }
  }, [router])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch rentals with joined data
      const rentalsResponse = await fetch("/api/rentals")
      if (!rentalsResponse.ok) {
        throw new Error("Failed to fetch rentals")
      }
      const rentalsData = await rentalsResponse.json()
      setRentals(rentalsData)
      
    } catch (err) {
      setError("Gagal memuat data")
      console.error("Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

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

      const response = await fetch("/api/rentals", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rentid: editingRental.rentid,
          ...editForm,
          datestart: editForm.datestart ? new Date(editForm.datestart).toISOString() : null,
          dateend: editForm.dateend ? new Date(editForm.dateend).toISOString() : null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Gagal update data sewa")
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
        const errorData = await response.json()
        throw new Error(errorData.error || "Gagal hapus data sewa")
      }

      setSuccess("Data sewa berhasil dihapus")
      await fetchData()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat hapus data")
    } finally {
      setDeleteLoading(false)
    }
  }

  // 新增函数：处理单个复选框选择
  const handleSelectRental = (rentalId: number, clientID: number) => {
    setSelectedRentals(prev => {
      if (prev.includes(rentalId)) {
        return prev.filter(id => id !== rentalId);
      } else {
        // 如果是第一次选择，设置clientID
        if (prev.length === 0) {
          setSelectedClientID(clientID);
        }
        return [...prev, rentalId];
      }
    });
  };

  // 新增函数：处理全选
  const handleSelectAll = () => {
    if (selectedRentals.length === currentAssets.length) {
      // 如果已经全选，则取消全选
      setSelectedRentals([]);
      setSelectedClientID(null);
    } else {
      // 否则全选当前页
      const allIds = currentAssets.map(rental => rental.rentid);
      setSelectedRentals(allIds);
      
      // 检查所有选中的数据是否属于同一个client
      const clientIDs = currentAssets.map(rental => rental.clientID);
      const uniqueClientIDs = [...new Set(clientIDs)];
      
      if (uniqueClientIDs.length === 1) {
        setSelectedClientID(uniqueClientIDs[0]);
      } else {
        setSelectedClientID(null);
      }
    }
  };

  // 新增函数：检查选中的数据是否属于同一个client
  const validateSameClient = () => {
    if (selectedRentals.length === 0) return false;
    
    const selectedData = rentals.filter(rental => selectedRentals.includes(rental.rentid));
    const clientIDs = selectedData.map(rental => rental.clientID);
    const uniqueClientIDs = [...new Set(clientIDs)];
    
    return uniqueClientIDs.length === 1;
  };

  // 新增函数：批量删除
  const handleBatchDelete = async () => {

      // Scroll to top after submission
      window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth' // Optional: for a smooth scrolling animation
        });

    if (selectedRentals.length === 0) {
      setError("Tidak ada data yang dipilih");
      return;
    }

    if (!validateSameClient()) {
      
      setError("Hanya dapat menghapus data dari client yang sama");
      return;
    }

    setBatchLoading(true);
    setError("");

    try {
      // 循环删除每个选中的rental
      const deletePromises = selectedRentals.map(rentid => 
        fetch(`/api/rentals?rentId=${rentid}`, {
          method: "DELETE"
        })
      );

      const responses = await Promise.all(deletePromises);
      const hasError = responses.some(response => !response.ok);

      if (hasError) {
        throw new Error("Beberapa data gagal dihapus");
      }

      setSuccess(`${selectedRentals.length} data sewa berhasil dihapus`);
      setSelectedRentals([]);
      setSelectedClientID(null);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat hapus data");
    } finally {
      setBatchLoading(false);
    }
  };

  // 新增函数：打开批量编辑对话框
  const handleBatchEdit = () => {

      // Scroll to top after submission
      window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth' // Optional: for a smooth scrolling animation
        });

    if (selectedRentals.length === 0) {
      setError("Tidak ada data yang dipilih");
      return;
    }

    if (!validateSameClient()) {
      setError("Hanya dapat mengedit data dari client yang sama");
      return;
    }

    // 初始化批量编辑表单
    setBatchEditForm({
      datestart: "",
      dateend: "",
      txtsales: "",
      lnkreport: "",
      txtnotes: ""
    });
    
    setBatchEditDialogOpen(true);
  };

  // 新增函数：批量更新
  const handleBatchUpdate = async () => {
      // Scroll to top after submission
      window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'smooth' // Optional: for a smooth scrolling animation
        });
        
    if (selectedRentals.length === 0) return;

    setBatchLoading(true);
    setError("");
    setSuccess("");

    try {
      // 验证日期
      if (batchEditForm.datestart && batchEditForm.dateend) {
        if (new Date(batchEditForm.dateend) < new Date(batchEditForm.datestart)) {
          throw new Error("Tanggal selesai harus setelah tanggal mulai");
        }
      }

      // 循环更新每个选中的rental
      const updatePromises = selectedRentals.map(rentid => {
        const updateData: any = {};
        if (batchEditForm.datestart) updateData.datestart = new Date(batchEditForm.datestart).toISOString();
        if (batchEditForm.dateend) updateData.dateend = new Date(batchEditForm.dateend).toISOString();
        if (batchEditForm.txtsales !== undefined) updateData.txtsales = batchEditForm.txtsales;
        if (batchEditForm.lnkreport !== undefined) updateData.lnkreport = batchEditForm.lnkreport;
        if (batchEditForm.txtnotes !== undefined) updateData.txtnotes = batchEditForm.txtnotes;

        return fetch("/api/rentals", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rentid,
            ...updateData
          })
        });
      });

      const responses = await Promise.all(updatePromises);
      const hasError = responses.some(response => !response.ok);

      if (hasError) {
        throw new Error("Beberapa data gagal diupdate");
      }

      setSuccess(`${selectedRentals.length} data sewa berhasil diupdate`);
      setBatchEditDialogOpen(false);
      setSelectedRentals([]);
      setSelectedClientID(null);
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat update data");
    } finally {
      setBatchLoading(false);
    }
  };

  // 新增：当页面或筛选条件变化时，清空选择
  useEffect(() => {
    setSelectedRentals([]);
    setSelectedClientID(null);
  }, [currentPage, itemsPerPage, filteredRentals]);

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
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data...</p>
        </div>
      </div>
    )
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

        {/* Filter Component */}
        <RentalFilters 
          rentals={rentals} 
          onFilterChange={updateFilters}
          initialFilters={filters}
        />

        {/* 批量操作栏 */}
        {selectedRentals.length > 0 && (
          <div className="flex justify-between items-center mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <span className="text-sm font-medium text-blue-800">
                {selectedRentals.length} data dipilih
              </span>
              {selectedClientID && (
                <Badge variant="secondary" className="ml-2">
                  Client ID: {selectedClientID}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleBatchEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Batch
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={batchLoading}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    {batchLoading ? "Loading..." : "Hapus Batch"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Konfirmasi Hapus Batch</AlertDialogTitle>
                    <AlertDialogDescription>
                      Apakah Anda yakin ingin menghapus {selectedRentals.length} data sewa? 
                      Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleBatchDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Hapus
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}

        {/* Rentals Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Memuat data sewa...</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedRentals.length === currentAssets.length && currentAssets.length > 0}
                          onCheckedChange={handleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
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
                    {currentAssets.length > 0 ? (
                      currentAssets.map((rental) => (
                        <TableRow key={rental.rentid}>
                          <TableCell>
                            <Checkbox
                              checked={selectedRentals.includes(rental.rentid)}
                              onCheckedChange={() => handleSelectRental(rental.rentid, rental.clientID)}
                              aria-label={`Select rental ${rental.rentid}`}
                            />
                          </TableCell>
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
                                      <p className="text-sm text-gray-500">{rental.asset.txtCode}</p>
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
                                          Report {rental.client.txtCompany}    
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
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="datestart">Tanggal Mulai Sewa</Label>
                                          <Input
                                            id="datestart"
                                            type="date"
                                            value={editForm.datestart}
                                            onChange={(e) => {
                                              setEditForm(prev => ({ ...prev, datestart: e.target.value }))
                                              if (editForm.dateend && e.target.value > editForm.dateend) {
                                                setEditForm(prev => ({ ...prev, dateend: "" }))
                                              }
                                            }}
                                          />
                                          {editingRental && editForm.datestart !== format(new Date(editingRental.datestart), "yyyy-MM-dd") && (
                                              <Badge variant="secondary">Diubah</Badge>
                                            )}
                                        </div>

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
                                              setEditingRental(null)
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
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8">
                          <p className="text-gray-500">Tidak ada data sewa yang ditemukan</p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 批量编辑对话框 */}
        <Dialog open={batchEditDialogOpen} onOpenChange={setBatchEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Batch ({selectedRentals.length} data)</DialogTitle>
              <DialogDescription>
                Update informasi sewa aset untuk {selectedRentals.length} data yang dipilih
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batch-datestart">Tanggal Mulai Sewa</Label>
                  <Input
                    id="batch-datestart"
                    type="date"
                    value={batchEditForm.datestart}
                    onChange={(e) => {
                      setBatchEditForm(prev => ({ ...prev, datestart: e.target.value }));
                      if (batchEditForm.dateend && e.target.value > batchEditForm.dateend) {
                        setBatchEditForm(prev => ({ ...prev, dateend: "" }));
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch-dateend">Tanggal Selesai Sewa</Label>
                  <Input
                    id="batch-dateend"
                    type="date"
                    value={batchEditForm.dateend}
                    onChange={(e) => setBatchEditForm(prev => ({ ...prev, dateend: e.target.value }))}
                    min={batchEditForm.datestart || undefined}
                    disabled={!batchEditForm.datestart}
                  />
                  {!batchEditForm.datestart && (
                    <p className="text-sm text-red-500">Pilih tanggal mulai terlebih dahulu</p>
                  )}
                  {batchEditForm.datestart && batchEditForm.dateend && new Date(batchEditForm.dateend) < new Date(batchEditForm.datestart) && (
                    <p className="text-sm text-red-500">Tanggal selesai harus setelah tanggal mulai</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch-txtsales">Nama Sales</Label>
                <Input
                  id="batch-txtsales"
                  value={batchEditForm.txtsales}
                  onChange={(e) => setBatchEditForm(prev => ({ ...prev, txtsales: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch-lnkreport">Link Report</Label>
                <Input
                  id="batch-lnkreport"
                  value={batchEditForm.lnkreport}
                  onChange={(e) => setBatchEditForm(prev => ({ ...prev, lnkreport: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="batch-txtnotes">Catatan</Label>
                <Textarea
                  id="batch-txtnotes"
                  value={batchEditForm.txtnotes}
                  onChange={(e) => setBatchEditForm(prev => ({ ...prev, txtnotes: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setBatchEditDialogOpen(false)}>
                Batal
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    disabled={batchLoading || (batchEditForm.datestart && batchEditForm.dateend && new Date(batchEditForm.dateend) < new Date(batchEditForm.datestart))}
                  >
                    {batchLoading ? "Loading..." : "Update"}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Konfirmasi Update Batch</AlertDialogTitle>
                    <AlertDialogDescription>
                      Apakah Anda yakin ingin menyimpan perubahan pada {selectedRentals.length} data sewa?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        await handleBatchUpdate();
                        setBatchEditDialogOpen(false);
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

        {/* Pagination Component */}
        {totalPages > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredRentals.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
              showItemsPerPageSelector={true}
              showPageInfo={true}
            />
          </div>
        )}
      </div>
    </div>
  )
}