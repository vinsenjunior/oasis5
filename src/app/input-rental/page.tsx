"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"

interface Client {
  clientID: number
  txtClient: string
  txtCompany: string
}

interface Asset {
  assetID: string
  txtStation: string
  txtCode: string
  kodetitik: string
  txtMediaGroup: string
  txtMediaSubGroup: string
}

interface RentalAsset {
  station: string
  assetCode: string
  mediaGroup: string
  mediaSubGroup: string
}

export default function InputRentalPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()
  
  const [clients, setClients] = useState<Client[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [stations, setStations] = useState<string[]>([])
  
  const [formData, setFormData] = useState({
    clientID: "",
    txtsales: "",
    datestart: "",
    dateend: "",
    txtnotes: ""
  })
  
  const [rentalAssets, setRentalAssets] = useState<RentalAsset[]>([
    { station: "", assetCode: "", mediaGroup: "", mediaSubGroup: "" }
  ])
  
  const [loading, setLoading] = useState(false)
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

  const fetchData = async () => {
    try {
      // Fetch clients
      const clientsResponse = await fetch("/api/clients")
      const clientsData = await clientsResponse.json()
      setClients(clientsData)
      
      // Fetch assets
      const assetsResponse = await fetch("/api/assets")
      const assetsData = await assetsResponse.json()
      setAssets(assetsData)
      
      // Extract unique stations
      const uniqueStations = [...new Set(assetsData.map((asset: Asset) => asset.txtStation))]
      setStations(uniqueStations)
    } catch (err) {
      setError("Gagal memuat data")
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-set end date to 30 days after start date
    if (field === "datestart" && value) {
      const startDate = new Date(value)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 30)
      setFormData(prev => ({ ...prev, dateend: endDate.toISOString().split('T')[0] }))
    }
  }

  const handleAssetChange = (index: number, field: string, value: string) => {
    const newAssets = [...rentalAssets]
    newAssets[index] = { ...newAssets[index], [field]: value }
    
    // If station changes, reset asset code and related fields
    if (field === "station") {
      newAssets[index].assetCode = ""
      newAssets[index].mediaGroup = ""
      newAssets[index].mediaSubGroup = ""
    }
    
    // If asset code changes, auto-fill media group and sub group
    if (field === "assetCode" && value) {
      const selectedAsset = assets.find(asset => asset.txtCode === value)
      if (selectedAsset) {
        newAssets[index].mediaGroup = selectedAsset.txtMediaGroup
        newAssets[index].mediaSubGroup = selectedAsset.txtMediaSubGroup
      }
    }
    
    setRentalAssets(newAssets)
  }

  const addAsset = () => {
    setRentalAssets([...rentalAssets, { station: "", assetCode: "", mediaGroup: "", mediaSubGroup: "" }])
  }

  const removeAsset = (index: number) => {
    if (rentalAssets.length > 1) {
      setRentalAssets(rentalAssets.filter((_, i) => i !== index))
    }
  }

  const getAssetCodesByStation = (station: string) => {
    return assets.filter(asset => asset.txtStation === station).map(asset => ({
      code: asset.txtCode,
      kodetitik: asset.kodetitik
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validate form
      if (!formData.clientID || !formData.datestart || !formData.dateend) {
        setError("Mohon lengkapi semua field yang wajib diisi")
        return
      }

      // Validate assets
      const validAssets = rentalAssets.filter(asset => asset.station && asset.assetCode)
      if (validAssets.length === 0) {
        setError("Mohon tambahkan minimal satu aset")
        return
      }

      // Create rental data for each asset
      for (const asset of validAssets) {
        const rentalData = {
          ...formData,
          assetID: assets.find(a => a.txtCode === asset.assetCode)?.assetID || "",
          clientID: parseInt(formData.clientID)
        }

        const response = await fetch("/api/rentals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rentalData)
        })

        if (!response.ok) {
          throw new Error("Gagal menyimpan data sewa")
        }
      }

      setSuccess("Data sewa berhasil disimpan")
      // Reset form
      setFormData({
        clientID: "",
        txtsales: "",
        datestart: "",
        dateend: "",
        txtnotes: ""
      })
      setRentalAssets([{ station: "", assetCode: "", mediaGroup: "", mediaSubGroup: "" }])
      
    } catch (err) {
      setError("Terjadi kesalahan saat menyimpan data")
    } finally {
      setLoading(false)
    }
  }

  if (!userRole) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Input Data Sewa</h1>
            <p className="text-gray-600">Tambah data penyewaan aset media iklan</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Kembali ke Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Input Data Sewa</CardTitle>
            <CardDescription>Isi data penyewaan aset media iklan</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Select value={formData.clientID} onValueChange={(value) => handleInputChange("clientID", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.clientID} value={client.clientID.toString()}>
                          {client.txtClient} {client.txtCompany && `(${client.txtCompany})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sales">Nama Sales</Label>
                  <Input
                    id="sales"
                    placeholder="Nama sales"
                    value={formData.txtsales}
                    onChange={(e) => handleInputChange("txtsales", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="datestart">Start Sewa</Label>
                  <Input
                    id="datestart"
                    type="date"
                    value={formData.datestart}
                    onChange={(e) => handleInputChange("datestart", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateend">Akhir Sewa</Label>
                  <Input
                    id="dateend"
                    type="date"
                    value={formData.dateend}
                    onChange={(e) => handleInputChange("dateend", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Note</Label>
                <Textarea
                  id="notes"
                  placeholder="Catatan tambahan"
                  value={formData.txtnotes}
                  onChange={(e) => handleInputChange("txtnotes", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Asset(s)</h3>
                  {/* <Button type="button" variant="outline" size="sm" onClick={addAsset}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Asset
                  </Button> */}
                </div>

                {rentalAssets.map((asset, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Stasiun</Label>
                        <Select 
                          value={asset.station} 
                          onValueChange={(value) => handleAssetChange(index, "station", value)}
                        >
                          <SelectTrigger>
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

                      <div className="space-y-2">
                        <Label>Kode Aset</Label>
                        <Select 
                          value={asset.assetCode} 
                          onValueChange={(value) => handleAssetChange(index, "assetCode", value)}
                          disabled={!asset.station}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kode aset" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAssetCodesByStation(asset.station).map(({ code, kodetitik }) => (
                              <SelectItem key={code} value={code}>
                                {kodetitik}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Media Group</Label>
                        <Input 
                          value={asset.mediaGroup} 
                          readOnly 
                          className="bg-gray-100"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Media Sub Group</Label>
                        <Input 
                          value={asset.mediaSubGroup} 
                          readOnly 
                          className="bg-gray-100"
                        />
                      </div>
                    </div>
                    
                    {rentalAssets.length > 1 && (
                      <div className="flex justify-end mt-4">
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeAsset(index)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Hapus
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
                <div className="flex justify-between items-center">
                  <Button type="button" variant="outline" size="sm" onClick={addAsset}>
                    <Plus className="w-4 h-4 mr-2" />
                    Tambah Asset
                  </Button>
                </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? "Loading..." : "Submit"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}