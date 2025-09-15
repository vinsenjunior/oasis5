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
import { Plus, Trash2, Upload } from "lucide-react"

const stations = [
  'Lebak Bulus', 'Fatmawati', 'Cipete Raya', 'Haji Nawi', 'Blok A', 
  'Blok M', 'ASEAN', 'Senayan', 'Istora Mandiri', 'Bendungan Hilir', 
  'Setiabudi', 'Dukuh Atas BNI', 'Bundaran HI'
]

const mediaGroups = ['Digital', 'Print', 'LED Screen', 'Billboard', 'Transit Media']
const mediaSubGroups = ['Indoor', 'Outdoor', 'Platform', 'Concourse', 'Exit', 'Entrance', 'Ticket Hall']

export default function InputAssetPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    txtStation: "",
    txtDesc: "",
    txtCode: "",
    kodetitik: "",
    txtMediaGroup: "",
    txtMediaSubGroup: "",
    intQty: 1,
    lnkMockup: "",
    numvisualW: "",
    numvisualH: "",
    numsizeW: "",
    numsizeH: "",
    numsizeD: "",
    numsizeSQM: "",
    numweightmedia: "",
    numweightstructure: "",
    numpoweract: "",
    numpowerest: "",
    txtpixelpitch: "",
    txtnotes: ""
  })
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    const role = localStorage.getItem("userRole")
    
    if (!isAuthenticated || role !== "busdev") {
      router.push("/login")
      return
    }
    
    setUserRole(role)
  }, [router])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-generate asset code and kode titik when station and media group are selected
    if (field === "txtStation" || field === "txtMediaGroup") {
      const station = field === "txtStation" ? value : formData.txtStation
      const mediaGroup = field === "txtMediaGroup" ? value : formData.txtMediaGroup
      
      if (station && mediaGroup) {
        const stationCode = station.toString().substring(0, 3).toUpperCase()
        const groupCode = mediaGroup.toString().substring(0, 3).toUpperCase()
        const randomNum = Math.floor(Math.random() * 99) + 1
        const randomPoint = Math.floor(Math.random() * 999) + 1
        const assetCode = `${stationCode}-${groupCode}-${String(randomNum).padStart(2, '0')}`
        // const kodeTitik = `${stationCode}-${groupCode}-${String(randomNum).padStart(2, '0')}-${randomPoint}`
        
        setFormData(prev => ({ 
          ...prev, 
          txtCode: assetCode,
          // kodetitik: kodeTitik
        }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Validate required fields
      const requiredFields = ['txtStation', 'txtCode', 'txtMediaGroup', 'txtMediaSubGroup']
      for (const field of requiredFields) {
        if (!formData[field as keyof typeof formData]) {
          setError(`Field ${field.replace('txt', '').replace(/([A-Z])/g, ' $1').toLowerCase()} harus diisi`)
          return
        }
      }

      const response = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Gagal menyimpan data aset")
      }

      setSuccess("Data aset berhasil disimpan")
      // Reset form
      setFormData({
        txtStation: "",
        txtDesc: "",
        txtCode: "",
        kodetitik: "",
        txtMediaGroup: "",
        txtMediaSubGroup: "",
        intQty: 1,
        lnkMockup: "",
        numvisualW: "",
        numvisualH: "",
        numsizeW: "",
        numsizeH: "",
        numsizeD: "",
        numsizeSQM: "",
        numweightmedia: "",
        numweightstructure: "",
        numpoweract: "",
        numpowerest: "",
        txtpixelpitch: "",
        txtnotes: ""
      })
      
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan saat menyimpan data")
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
            <h1 className="text-3xl font-bold">Input Data Aset</h1>
            <p className="text-gray-600">Tambah data aset media iklan baru</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Kembali ke Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Input Data Aset</CardTitle>
            <CardDescription>Isi data aset media iklan baru</CardDescription>
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

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informasi Dasar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="txtStation">Stasiun *</Label>
                    <Select 
                      value={formData.txtStation} 
                      onValueChange={(value) => handleInputChange("txtStation", value)}
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
                    <Label htmlFor="txtCode">Kode Aset *</Label>
                    <Input
                      id="txtCode"
                      placeholder="Kode aset (auto-generate)"
                      value={formData.txtCode}
                      onChange={(e) => handleInputChange("txtCode", e.target.value)}
                      readOnly={formData.txtStation && formData.txtMediaGroup}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kodetitik">Kode Titik</Label>
                    <Input
                      id="kodetitik"
                      placeholder="Kode titik"
                      value={formData.kodetitik}
                      onChange={(e) => handleInputChange("kodetitik", e.target.value)}
                      // readOnly={formData.txtStation && formData.txtMediaGroup}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="txtMediaGroup">Media Group *</Label>
                    <Select 
                      value={formData.txtMediaGroup} 
                      onValueChange={(value) => handleInputChange("txtMediaGroup", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih media group" />
                      </SelectTrigger>
                      <SelectContent>
                        {mediaGroups.map((group) => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="txtMediaSubGroup">Media Sub Group *</Label>
                    <Select 
                      value={formData.txtMediaSubGroup} 
                      onValueChange={(value) => handleInputChange("txtMediaSubGroup", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih media sub group" />
                      </SelectTrigger>
                      <SelectContent>
                        {mediaSubGroups.map((subGroup) => (
                          <SelectItem key={subGroup} value={subGroup}>
                            {subGroup}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="intQty">Quantity *</Label>
                    <Input
                      id="intQty"
                      type="number"
                      min="1"
                      value={formData.intQty}
                      onChange={(e) => handleInputChange("intQty", parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lnkMockup">Link Mockup</Label>
                    <Input
                      id="lnkMockup"
                      placeholder="URL gambar mockup"
                      value={formData.lnkMockup}
                      onChange={(e) => handleInputChange("lnkMockup", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="txtDesc">Deskripsi</Label>
                  <Textarea
                    id="txtDesc"
                    placeholder="Deskripsi aset"
                    value={formData.txtDesc}
                    onChange={(e) => handleInputChange("txtDesc", e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Physical Specifications */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Spesifikasi Fisik</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="numvisualW">Visual Width</Label>
                    <Input
                      id="numvisualW"
                      placeholder="Contoh: 5m"
                      value={formData.numvisualW}
                      onChange={(e) => handleInputChange("numvisualW", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numvisualH">Visual Height</Label>
                    <Input
                      id="numvisualH"
                      placeholder="Contoh: 3m"
                      value={formData.numvisualH}
                      onChange={(e) => handleInputChange("numvisualH", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numsizeW">Size Width</Label>
                    <Input
                      id="numsizeW"
                      placeholder="Contoh: 5.2m"
                      value={formData.numsizeW}
                      onChange={(e) => handleInputChange("numsizeW", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numsizeH">Size Height</Label>
                    <Input
                      id="numsizeH"
                      placeholder="Contoh: 3.1m"
                      value={formData.numsizeH}
                      onChange={(e) => handleInputChange("numsizeH", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numsizeD">Size Depth</Label>
                    <Input
                      id="numsizeD"
                      placeholder="Contoh: 0.5m"
                      value={formData.numsizeD}
                      onChange={(e) => handleInputChange("numsizeD", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numsizeSQM">Size SQM</Label>
                    <Input
                      id="numsizeSQM"
                      placeholder="Contoh: 15.5"
                      value={formData.numsizeSQM}
                      onChange={(e) => handleInputChange("numsizeSQM", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numweightmedia">Weight Media</Label>
                    <Input
                      id="numweightmedia"
                      placeholder="Contoh: 75.5kg"
                      value={formData.numweightmedia}
                      onChange={(e) => handleInputChange("numweightmedia", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numweightstructure">Weight Structure</Label>
                    <Input
                      id="numweightstructure"
                      placeholder="Contoh: 150kg"
                      value={formData.numweightstructure}
                      onChange={(e) => handleInputChange("numweightstructure", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numpoweract">Power Active</Label>
                    <Input
                      id="numpoweract"
                      placeholder="Contoh: 250W"
                      value={formData.numpoweract}
                      onChange={(e) => handleInputChange("numpoweract", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numpowerest">Power Estimation</Label>
                    <Input
                      id="numpowerest"
                      placeholder="Contoh: 300W"
                      value={formData.numpowerest}
                      onChange={(e) => handleInputChange("numpowerest", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="txtpixelpitch">Pixel Pitch</Label>
                    <Input
                      id="txtpixelpitch"
                      placeholder="Contoh: 3mm"
                      value={formData.txtpixelpitch}
                      onChange={(e) => handleInputChange("txtpixelpitch", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informasi Tambahan</h3>
                <div className="space-y-2">
                  <Label htmlFor="txtnotes">Catatan</Label>
                  <Textarea
                    id="txtnotes"
                    placeholder="Catatan tambahan tentang aset"
                    value={formData.txtnotes}
                    onChange={(e) => handleInputChange("txtnotes", e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? "Loading..." : "Simpan Aset"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}