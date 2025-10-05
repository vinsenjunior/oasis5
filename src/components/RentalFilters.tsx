// components/RentalFilters.tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Calendar, MapPin, Users, ChevronsUpDown } from "lucide-react"
import { format } from "date-fns"
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

// hide several filters
interface RentalFiltersProps {
  rentals: Rental[]
  onFilterChange: (filters: FilterState) => void
  initialFilters?: Partial<FilterState>
  hideClientFilter?: boolean    // New prop to hide client filter
  hideDateFilter?: boolean      // New prop to hide date filter
}

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

interface Client {
  clientID: number
  txtClient: string
  txtCompany: string
}

interface RentalFiltersProps {
  rentals: Rental[]
  onFilterChange: (filters: FilterState) => void
  initialFilters?: Partial<FilterState>
}

interface FilterState {
  clientID: string
  station: string
  status: string // all, active, expired
  mediaGroup: string      
  mediaSubGroup: string
  assetCode: string
  startDate: string 
  endDate: string     
}

export default function RentalFilters({ 
  rentals, 
  onFilterChange, 
  initialFilters,
  hideClientFilter = false,   // Default to false
  hideDateFilter = false      // Default to false
}: RentalFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    clientID: "",
    station: "",
    status: "all",
    mediaGroup: "",
    mediaSubGroup: "",
    assetCode: "",
    startDate: "",
    endDate: "",
    ...initialFilters
  })

  const [clientSearch, setClientSearch] = useState("")
  
  // Extract unique stations, clients, media groups, and media sub groups
  const [allStations, setAllStations] = useState<string[]>([])
  const [stations, setStations] = useState<string[]>([])
  const [mediaGroups, setMediaGroups] = useState<string[]>([])
  const [mediaSubGroups, setMediaSubGroups] = useState<string[]>([])
  const [clients, setClients] = useState<Client[]>([])

  // Initialize filter options
  useEffect(() => {
    if (rentals.length > 0) {
      const uniqueStations = [...new Set(rentals.map((rental: Rental) => rental.asset.txtStation))]
      const uniqueMediaGroups = [...new Set(rentals.map((rental: Rental) => rental.asset.txtMediaGroup))]
      const uniqueMediaSubGroups = [...new Set(rentals.map((rental: Rental) => rental.asset.txtMediaSubGroup))]
      
      const uniqueClients = rentals.reduce((acc: Client[], rental: Rental) => {
        if (!acc.find(c => c.clientID === rental.clientID)) {
          acc.push({
            clientID: rental.clientID,
            txtClient: rental.client.txtClient,
            txtCompany: rental.client.txtCompany || ""
          })
        }
        return acc
      }, [])
      
      setAllStations(uniqueStations)
      setStations(uniqueStations)
      setMediaGroups(uniqueMediaGroups)
      setMediaSubGroups(uniqueMediaSubGroups)
      setClients(uniqueClients)
    }
  }, [rentals])

  // NEW LOGIC: Update stations, media groups and sub groups when client changes
  useEffect(() => {
    if (filters.clientID) {
      // Filter rentals for the selected client
      const clientRentals = rentals.filter(rental => rental.clientID.toString() === filters.clientID)
      
      // Extract unique stations, media groups and sub groups for this client
      const clientStations = [...new Set(clientRentals.map(rental => rental.asset.txtStation))]
      const clientMediaGroups = [...new Set(clientRentals.map(rental => rental.asset.txtMediaGroup))]
      const clientMediaSubGroups = [...new Set(clientRentals.map(rental => rental.asset.txtMediaSubGroup))]
      
      setStations(clientStations)
      setMediaGroups(clientMediaGroups)
      setMediaSubGroups(clientMediaSubGroups)
      
      // Reset filters if they're no longer valid for this client
      if (filters.station && !clientStations.includes(filters.station)) {
        handleFilterChange("station", "")
      }
      
      if (filters.mediaGroup && !clientMediaGroups.includes(filters.mediaGroup)) {
        handleFilterChange("mediaGroup", "")
      }
      
      if (filters.mediaSubGroup && !clientMediaSubGroups.includes(filters.mediaSubGroup)) {
        handleFilterChange("mediaSubGroup", "")
      }
    } else {
      // Reset to all stations, media groups and sub groups when no client is selected
      setStations(allStations)
      setMediaGroups([...new Set(rentals.map(rental => rental.asset.txtMediaGroup))])
      setMediaSubGroups([...new Set(rentals.map(rental => rental.asset.txtMediaSubGroup))])
    }
  }, [filters.clientID, rentals, allStations])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }
  
  const removeFilter = (filterType: string) => {
    switch (filterType) {
      case "clientID":
        handleFilterChange("clientID", "")
        setClientSearch("")
        break
      case "station":
        handleFilterChange("station", "")
        break
      case "mediaGroup":
        handleFilterChange("mediaGroup", "")
        break
      case "mediaSubGroup":
        handleFilterChange("mediaSubGroup", "")
        break
      case "assetCode":
        handleFilterChange("assetCode", "")
        break
      case "status":
        handleFilterChange("status", "all")
        break
      case "dateRange":
        handleFilterChange("startDate", "")
        handleFilterChange("endDate", "")
        break
      default:
        break
    }
  }

  const clearFilters = () => {
    const newFilters = {
      clientID: "",
      station: "",
      mediaGroup: "",
      mediaSubGroup: "",
      status: "all",
      assetCode: "",
      startDate: "",
      endDate: ""
    }
    setFilters(newFilters)
    setClientSearch("")
    onFilterChange(newFilters)
  }

  return (
    <div className="space-y-4 mb-5">
      {/* Filter Section */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Search className="w-5 h-5" />
            Filter Data
          </h2>
          
        </div>
        
        <div className="flex flex-wrap gap-4 items-end">
          {/* Filter Client */}

         {/* hide if property set to true */}
         {!hideClientFilter && (
          <div className="min-w-[200px] flex-1">
            <Label className="text-sm">Client</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded="false"
                  className="w-full justify-between mt-1"
                >
                  {filters.clientID
                    ? clients.find(c => c.clientID.toString() === filters.clientID)?.txtClient
                    : (clientSearch || "Pilih client...")}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full max-w-md p-0 max-h-[60vh] overflow-y-auto">
                <Command>
                  <CommandInput
                    value={clientSearch}
                    onValueChange={(value) => {
                      const v = value.trim()
                      setClientSearch(value)
                      if (v === "") {
                        handleFilterChange("clientID", "")
                        return
                      }
                      const exact = clients.find(
                        (c) =>
                          c.txtClient.toLowerCase() === v.toLowerCase() ||
                          c.txtCompany.toLowerCase() === v.toLowerCase()
                      )
                      if (exact) {
                        handleFilterChange("clientID", exact.clientID.toString())
                      } else {
                        handleFilterChange("clientID", "")
                      }
                    }}
                    placeholder="Ketik nama client..."
                  />
                  <CommandList>
                    {(() => {
                      const q = clientSearch.trim().toLowerCase()
                      const filtered = q
                        ? clients.filter(
                            (c) =>
                              c.txtClient.toLowerCase().includes(q) ||
                              c.txtCompany.toLowerCase().includes(q)
                          )
                        : clients

                      if (filtered.length === 0) {
                        return <CommandEmpty>Tidak ada client ditemukan</CommandEmpty>
                      }

                      return (
                        <CommandGroup>
                          {filtered.map((client) => (
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
                                {client.txtCompany && (
                                  <span className="text-sm text-muted-foreground">
                                    {client.txtCompany}
                                  </span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )
                    })()}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
         )}

          {/* Filter Station */}
          <div className="min-w-[150px] flex-1">
            <Label className="text-sm">Stasiun</Label>
            <Select value={filters.station} onValueChange={(value) => handleFilterChange("station", value)}>
              <SelectTrigger className="mt-1">
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

          {/* Filter Kode Aset */}
          <div className="w-24 flex-none">
            <Label className="text-sm">Kode Aset</Label>
            <Input
              placeholder="Kode aset..."
              value={filters.assetCode}
              onChange={(e) => handleFilterChange("assetCode", e.target.value)}
              className="mt-1"
            />
          </div>
          
          {/* Filter Media Group */}
          <div className="min-w-[150px] flex-1">
            <Label className="text-sm">Media Group</Label>
            <Select value={filters.mediaGroup} onValueChange={(value) => handleFilterChange("mediaGroup", value)}>
              <SelectTrigger className="mt-1">
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

          {/* Filter Media Sub Group */}
          <div className="min-w-[150px] flex-1">
            <Label className="text-sm">Media Sub Group</Label>
            <Select value={filters.mediaSubGroup} onValueChange={(value) => handleFilterChange("mediaSubGroup", value)}>
              <SelectTrigger className="mt-1">
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

          {/* Filter Status */}
          <div className="min-w-[150px] flex-1">
            <Label className="text-sm">Status</Label>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Pilih status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="expired">Selesai</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Tanggal */}
          {/* Hide if property is true */}
          {!hideDateFilter && (
            <div className="min-w-[250px] flex-none date-picker-container">
              <Label className="text-sm">Periode Tanggal</Label>
              <div className="flex gap-1 mt-1">
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                  onClick={(e) => {
                    e.stopPropagation();
                    (e.target as HTMLInputElement).showPicker?.();
                  }}
                  className="w-full"
                  data-testid="start-date"
                />
                <span className="self-center text-gray-500">-</span>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => {
                    const selectedDate = e.target.value
                    if (filters.startDate && selectedDate < filters.startDate) {
                      return
                    }
                    handleFilterChange("endDate", selectedDate)
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    (e.target as HTMLInputElement).showPicker?.();
                  }}
                  min={filters.startDate || undefined}
                  className="w-full"
                  data-testid="end-date"
                />
              </div>
            </div>
          )}

          <div className="flex-1"><Button variant="default" onClick={clearFilters}>
            Hapus Filter
          </Button></div>
        </div>
      </div>

      {/* Active Filters */}
      <div className="flex flex-wrap justify-center items-center gap-2 align-middle">

        <span className="text-xs">Filter aktif : </span>

        {filters.clientID && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            Client: {clients.find(c => c.clientID.toString() === filters.clientID)?.txtClient}
            <button 
              onClick={() => {
                handleFilterChange("clientID", "")
                setClientSearch("")
              }}
              className="ml-1 hover:text-red-500"
            >
              ×
            </button>
          </Badge>
        )}
        
        {filters.station && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            Stasiun: {filters.station}
            <button 
              onClick={() => handleFilterChange("station", "")}
              className="ml-1 hover:text-red-500"
            >
              ×
            </button>
          </Badge>
        )}

        {filters.mediaGroup && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Media Group: {filters.mediaGroup}
            <button 
              onClick={() => handleFilterChange("mediaGroup", "")}
              className="ml-1 hover:text-red-500"
            >
              ×
            </button>
          </Badge>
        )}

        {filters.mediaSubGroup && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Media Sub Group: {filters.mediaSubGroup}
            <button 
              onClick={() => handleFilterChange("mediaSubGroup", "")}
              className="ml-1 hover:text-red-500"
            >
              ×
            </button>
          </Badge>
        )}

        {filters.assetCode && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Kode: {filters.assetCode}
            <button 
              onClick={() => handleFilterChange("assetCode", "")}
              className="ml-1 hover:text-red-500"
            >
              ×
            </button>
          </Badge>
        )}
        
        {filters.status !== "all" && (
          <Badge variant="secondary" className="flex items-center gap-1">
            Status: {filters.status === "active" ? "Aktif" : filters.status === "booked" ? "Booked" : "Selesai"}
            <button 
              onClick={() => handleFilterChange("status", "all")}
              className="ml-1 hover:text-red-500"
            >
              ×
            </button>
          </Badge>
        )}
        
        {filters.startDate && filters.endDate && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(filters.startDate), "dd/MM/yyyy")} - {format(new Date(filters.endDate), "dd/MM/yyyy")}
            <button 
              onClick={() => {
                handleFilterChange("startDate", "")
                handleFilterChange("endDate", "")
              }}
              className="ml-1 hover:text-red-500"
            >
              ×
            </button>
          </Badge>
        )}
      </div>
    </div>
  )
}
