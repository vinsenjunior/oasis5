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
import { Calendar, MapPin, Users, Clock, Check, X } from "lucide-react"
import { format, addDays, isWithinInterval, parseISO } from "date-fns"

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
}

interface Client {
  clientID: number
  txtClient: string
  txtCompany: string
}

interface Rental {
  rentid: number
  assetID: string
  datestart: string
  dateend: string
  asset: Asset
  client: Client
}

export default function BookingPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()
  
  const [assets, setAssets] = useState<Asset[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [rentals, setRentals] = useState<Rental[]>([])
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([])
  
  const [bookingData, setBookingData] = useState({
    startDate: "",
    endDate: "",
    clientID: "",
    salesName: "",
    notes: ""
  })
  
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [checkingAvailability, setCheckingAvailability] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [step, setStep] = useState(1) // 1: Select dates, 2: Select assets, 3: Confirm booking

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated")
    const role = localStorage.getItem("userRole")
    
    if (!isAuthenticated || (role !== "admin" && role !== "sales")) {
      router.push("/login")
      return
    }
    
    setUserRole(role)
    fetchData()
  }, [router])

  useEffect(() => {
    if (bookingData.startDate && bookingData.endDate) {
      checkAvailability()
    }
  }, [bookingData.startDate, bookingData.endDate, assets, rentals])

  const fetchData = async () => {
    try {
      const [assetsResponse, clientsResponse, rentalsResponse] = await Promise.all([
        fetch("/api/assets"),
        fetch("/api/clients"),
        fetch("/api/rentals")
      ])

      const assetsData = await assetsResponse.json()
      const clientsData = await clientsResponse.json()
      const rentalsData = await rentalsResponse.json()

      setAssets(assetsData)
      setClients(clientsData)
      setRentals(rentalsData)
    } catch (error) {
      console.error("Error fetching data:", error)
      setError("Gagal memuat data")
    }
  }

  const checkAvailability = () => {
    if (!bookingData.startDate || !bookingData.endDate) return

    setCheckingAvailability(true)
    
    try {
      const start = new Date(bookingData.startDate)
      const end = new Date(bookingData.endDate)
      
      const available = assets.filter(asset => {
        const isBooked = rentals.some(rental => {
          const rentalStart = new Date(rental.datestart)
          const rentalEnd = new Date(rental.dateend)
          
          return (
            rental.assetID === asset.assetID &&
            (
              isWithinInterval(start, { start: rentalStart, end: rentalEnd }) ||
              isWithinInterval(end, { start: rentalStart, end: rentalEnd }) ||
              isWithinInterval(rentalStart, { start, end }) ||
              isWithinInterval(rentalEnd, { start, end })
            )
          )
        })
        
        return !isBooked
      })
      
      setAvailableAssets(available)
    } catch (error) {
      console.error("Error checking availability:", error)
    } finally {
      setCheckingAvailability(false)
    }
  }

  const handleDateChange = (field: string, value: string) => {
    setBookingData(prev => ({ ...prev, [field]: value }))
    
    // Auto-set end date to 7 days after start date
    if (field === "startDate" && value) {
      const startDate = new Date(value)
      const endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 7)
      setBookingData(prev => ({ 
        ...prev, 
        endDate: endDate.toISOString().split('T')[0] 
      }))
    }
  }

  const toggleAssetSelection = (assetID: string) => {
    setSelectedAssets(prev => 
      prev.includes(assetID) 
        ? prev.filter(id => id !== assetID)
        : [...prev, assetID]
    )
  }

  const handleBookingSubmit = async () => {
    if (selectedAssets.length === 0) {
      setError("Pilih minimal satu aset untuk booking")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      // Create booking for each selected asset
      for (const assetID of selectedAssets) {
        const bookingPayload = {
          assetID,
          clientID: parseInt(bookingData.clientID),
          datestart: bookingData.startDate,
          dateend: bookingData.endDate,
          txtsales: bookingData.salesName,
          txtnotes: bookingData.notes
        }

        const response = await fetch("/api/rentals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bookingPayload)
        })

        if (!response.ok) {
          throw new Error("Gagal membuat booking")
        }
      }

      setSuccess("Booking berhasil dibuat!")
      // Reset form
      setBookingData({
        startDate: "",
        endDate: "",
        clientID: "",
        salesName: "",
        notes: ""
      })
      setSelectedAssets([])
      setStep(1)
      
    } catch (err) {
      setError("Terjadi kesalahan saat membuat booking")
    } finally {
      setLoading(false)
    }
  }

  const getAssetsByStation = () => {
    const stationGroups = availableAssets.reduce((acc, asset) => {
      if (!acc[asset.txtStation]) {
        acc[asset.txtStation] = []
      }
      acc[asset.txtStation].push(asset)
      return acc
    }, {} as Record<string, Asset[]>)

    return stationGroups
  }

  if (!userRole) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Booking Aset Media</h1>
            <p className="text-gray-600">Booking aset media iklan yang tersedia</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Kembali ke Dashboard
          </Button>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNumber}
                </div>
                <span className={`ml-2 text-sm ${
                  step >= stepNumber ? 'text-blue-600 font-medium' : 'text-gray-500'
                }`}>
                  {stepNumber === 1 ? 'Pilih Tanggal' : stepNumber === 2 ? 'Pilih Aset' : 'Konfirmasi'}
                </span>
                {stepNumber < 3 && (
                  <div className={`w-16 h-1 mx-4 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
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

        {/* Step 1: Select Dates */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Pilih Tanggal Booking
              </CardTitle>
              <CardDescription>Pilih tanggal mulai dan akhir untuk booking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Tanggal Mulai</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={bookingData.startDate}
                    onChange={(e) => handleDateChange("startDate", e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Tanggal Akhir</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={bookingData.endDate}
                    onChange={(e) => handleDateChange("endDate", e.target.value)}
                    min={bookingData.startDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              <div className="mt-6">
                <Button 
                  onClick={() => setStep(2)}
                  disabled={!bookingData.startDate || !bookingData.endDate}
                  className="w-full"
                >
                  Lanjut ke Pemilihan Aset
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Assets */}
        {step === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Pilih Aset yang Tersedia
                </CardTitle>
                <CardDescription>
                  {bookingData.startDate} - {bookingData.endDate}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {checkingAvailability ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memeriksa ketersediaan aset...</p>
                  </div>
                ) : availableAssets.length === 0 ? (
                  <div className="text-center py-8">
                    <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600">Tidak ada aset tersedia untuk tanggal yang dipilih</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(getAssetsByStation()).map(([station, stationAssets]) => (
                      <div key={station}>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          {station}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {stationAssets.map((asset) => (
                            <Card 
                              key={asset.assetID} 
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                selectedAssets.includes(asset.assetID) 
                                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                                  : 'hover:shadow-lg'
                              }`}
                              onClick={() => toggleAssetSelection(asset.assetID)}
                            >
                              <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <h4 className="font-medium">{asset.txtCode}</h4>
                                    <p className="text-xs text-gray-500">{asset.kodetitik}</p>
                                    <p className="text-sm text-gray-600">{asset.txtMediaGroup}</p>
                                  </div>
                                  {selectedAssets.includes(asset.assetID) && (
                                    <Check className="w-5 h-5 text-green-600" />
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <Badge variant="outline" className="text-xs">
                                    {asset.txtMediaSubGroup}
                                  </Badge>
                                  <p className="text-xs text-gray-500">
                                    Qty: {asset.intQty}
                                  </p>
                                </div>
                                {asset.txtDesc && (
                                  <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                                    {asset.txtDesc}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Kembali
                  </Button>
                  <Button 
                    onClick={() => setStep(3)}
                    disabled={selectedAssets.length === 0}
                  >
                    Lanjut ke Konfirmasi ({selectedAssets.length} aset)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Confirm Booking */}
        {step === 3 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Detail Booking
                </CardTitle>
                <CardDescription>Konfirmasi detail booking Anda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* <div className="space-y-2">
                    <Label>Client</Label>
                    <Select 
                      value={bookingData.clientID} 
                      onValueChange={(value) => setBookingData(prev => ({ ...prev, clientID: value }))}
                    >
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
                  </div> */}
                  
                  <div className="space-y-2">
                      <Label htmlFor="client">Client</Label>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                            >
                              {formData.clientID
                                ? clients.find(c => c.clientID.toString() === formData.clientID)?.txtClient
                                : "Pilih atau cari client"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0">
                            <Command>
                              <CommandInput placeholder="Cari client..." />
                              <CommandEmpty>Client tidak ditemukan.</CommandEmpty>
                              <CommandGroup>
                                {clients.map(client => (
                                  <CommandItem
                                    key={client.clientID}
                                    value={client.txtClient}
                                    onSelect={() =>
                                      handleInputChange("clientID", client.clientID.toString())
                                    }
                                  >
                                    {client.txtClient}{" "}
                                    {client.txtCompany && `(${client.txtCompany})`}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => router.push("/manage-clients")}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                  <div className="space-y-2">
                    <Label>Nama Sales</Label>
                    <Input
                      placeholder="Nama sales"
                      value={bookingData.salesName}
                      onChange={(e) => setBookingData(prev => ({ ...prev, salesName: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Tanggal Mulai</Label>
                    <Input value={bookingData.startDate} readOnly className="bg-gray-100" />
                  </div>

                  <div className="space-y-2">
                    <Label>Tanggal Akhir</Label>
                    <Input value={bookingData.endDate} readOnly className="bg-gray-100" />
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label>Catatan</Label>
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded-md min-h-[100px]"
                    placeholder="Catatan tambahan"
                    value={bookingData.notes}
                    onChange={(e) => setBookingData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>

                <div className="mt-6">
                  <h4 className="font-medium mb-2">Aset yang Dipilih ({selectedAssets.length})</h4>
                  <div className="space-y-2">
                    {selectedAssets.map(assetID => {
                      const asset = assets.find(a => a.assetID === assetID)
                      return asset ? (
                        <div key={assetID} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium">{asset.txtCode}</span>
                            <span className="text-sm text-gray-500 ml-2">({asset.kodetitik})</span>
                            <span className="text-sm text-gray-600 ml-2">- {asset.txtStation}</span>
                          </div>
                          <Badge variant="outline">{asset.txtMediaGroup}</Badge>
                        </div>
                      ) : null
                    })}
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Kembali
                  </Button>
                  <Button 
                    onClick={handleBookingSubmit}
                    disabled={!bookingData.clientID || loading}
                  >
                    {loading ? "Memproses..." : "Konfirmasi Booking"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}