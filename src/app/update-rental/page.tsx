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

interface RentalData {
  rentid: number
  assetID: string
  clientID: number
  datestart: string
  dateend: string
  txtsales: string
  lnkreport: string
  txtnotes: string
  asset: {
    txtStation: string
    txtCode: string
    txtMediaGroup: string
    txtMediaSubGroup: string
  }
  client: {
    txtClient: string
    txtCompany: string
  }
}

interface ClientOption {
  clientID: number
  txtClient: string
  txtCompany: string
}

export default function UpdateRentalPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const router = useRouter()
  
  const [rentals, setRentals] = useState<RentalData[]>([])
  const [filteredRentals, setFilteredRentals] = useState<RentalData[]>([])
  const [clients, setClients] = useState<ClientOption[]>([])
  
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [selectedRentId, setSelectedRentId] = useState<string>("")
  const [selectedRental, setSelectedRental] = useState<RentalData | null>(null)
  
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

  useEffect(() => {
    if (selectedClient) {
      const filtered = rentals.filter(rental => rental.clientID.toString() === selectedClient)
      setFilteredRentals(filtered)
      setSelectedRentId("")
      setSelectedRental(null)
    } else {
      setFilteredRentals(rentals)
      setSelectedRentId("")
      setSelectedRental(null)
    }
  }, [selectedClient, rentals])

  useEffect(() => {
    if (selectedRentId) {
      const rental = rentals.find(r => r.rentid.toString() === selectedRentId)
      setSelectedRental(rental || null)
    } else {
      setSelectedRental(null)
    }
  }, [selectedRentId, rentals])

  const fetchData = async () => {
    try {
      // Fetch rentals with joined data
      const rentalsResponse = await fetch("/api/rentals")
      const rentalsData = await rentalsResponse.json()
      setRentals(rentalsData)
      setFilteredRentals(rentalsData)
      
      // Extract unique clients from rentals
      const uniqueClients = rentalsData.reduce((acc: ClientOption[], rental: RentalData) => {
        if (!acc.find(c => c.clientID === rental.clientID)) {
          acc.push({
            clientID: rental.clientID,
            txtClient: rental.client.txtClient,
            txtCompany: rental.client.txtCompany
          })
        }
        return acc
      }, [])
      setClients(uniqueClients)
      
    } catch (err) {
      setError("Gagal memuat data")
    }
  }

  const handleSave = async () => {
    if (!selectedRental) return
    
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch(`/api/rentals`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rentid: selectedRental.rentid,
          // Add any fields that can be updated
          txtsales: selectedRental.txtsales,
          lnkreport: selectedRental.lnkreport,
          txtnotes: selectedRental.txtnotes
        })
      })

      if (!response.ok) {
        throw new Error("Gagal update data sewa")
      }

      setSuccess("Data sewa berhasil diupdate")
      await fetchData() // Refresh data
      
    } catch (err) {
      setError("Terjadi kesalahan saat update data")
    } finally {
      setLoading(false)
    }
  }

  if (!userRole) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Update Data Sewa</h1>
            <p className="text-gray-600">Update data penyewaan aset media iklan</p>
          </div>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Kembali ke Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Form Update Data Sewa</CardTitle>
            <CardDescription>Pilih client dan rental ID untuk update data</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
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
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
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
                  <Label htmlFor="rentID">Rent ID</Label>
                  <Select value={selectedRentId} onValueChange={setSelectedRentId} disabled={!selectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Rent ID" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredRentals.map((rental) => (
                        <SelectItem key={rental.rentid} value={rental.rentid.toString()}>
                          {rental.rentid} - {rental.asset.txtCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedRental && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tanggal Mulai</Label>
                      <Input 
                        value={selectedRental.datestart} 
                        readOnly 
                        className="bg-gray-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tanggal Akhir</Label>
                      <Input 
                        value={selectedRental.dateend} 
                        readOnly 
                        className="bg-gray-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Sales</Label>
                      <Input 
                        value={selectedRental.txtsales || ""} 
                        onChange={(e) => setSelectedRental({
                          ...selectedRental,
                          txtsales: e.target.value
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Link Report</Label>
                      <Input 
                        value={selectedRental.lnkreport || ""} 
                        onChange={(e) => setSelectedRental({
                          ...selectedRental,
                          lnkreport: e.target.value
                        })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Catatan</Label>
                    <textarea
                      className="w-full p-2 border border-gray-300 rounded-md min-h-[100px]"
                      value={selectedRental.txtnotes || ""}
                      onChange={(e) => setSelectedRental({
                        ...selectedRental,
                        txtnotes: e.target.value
                      })}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Assets</h3>
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Stasiun</TableHead>
                              <TableHead>Kode Aset</TableHead>
                              <TableHead>Media Group</TableHead>
                              <TableHead>Media Sub Group</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow>
                              <TableCell>{selectedRental.asset.txtStation}</TableCell>
                              <TableCell>{selectedRental.asset.txtCode}</TableCell>
                              <TableCell>{selectedRental.asset.txtMediaGroup}</TableCell>
                              <TableCell>{selectedRental.asset.txtMediaSubGroup}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={loading}>
                      {loading ? "Loading..." : "Save"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}