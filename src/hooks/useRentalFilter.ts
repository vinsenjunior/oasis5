// hooks/useRentalFilter.ts
import { useState, useEffect } from 'react'

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

export function useRentalFilter(rentals: Rental[], initialFilters?: Partial<FilterState>) {
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

  const [filteredRentals, setFilteredRentals] = useState<Rental[]>([])

  useEffect(() => {
    applyFilters()
  }, [filters, rentals])

  const applyFilters = () => {
    let filtered = rentals

    // Filter client
    if (filters.clientID) {
      filtered = filtered.filter(rental => rental.clientID.toString() === filters.clientID)
    }

    // Filter station
    if (filters.station) {
      filtered = filtered.filter(rental => rental.asset.txtStation === filters.station)
    }
    
    // Filter media group
    if (filters.mediaGroup) {
      filtered = filtered.filter(rental => rental.asset.txtMediaGroup === filters.mediaGroup)
    }
    
    // Filter media sub group
    if (filters.mediaSubGroup) {
      filtered = filtered.filter(rental => rental.asset.txtMediaSubGroup === filters.mediaSubGroup)
    }
    
    // Filter kode aset
    if (filters.assetCode) {
      filtered = filtered.filter((rental) =>
        rental.asset.txtCode
          .toLowerCase()
          .includes(filters.assetCode.toLowerCase())
      )
    }

    // Filter status
    if (filters.status !== "all") {
      const today = new Date()
      if (filters.status === "active") {
        filtered = filtered.filter(rental => {
          if (!rental.datestart || !rental.dateend) return false
          const start = new Date(rental.datestart)
          const end = new Date(rental.dateend)
          return end >= today && start <= today
        })
      } else if (filters.status === "expired") {
        filtered = filtered.filter(rental => {
          if (!rental.dateend) return false
          const end = new Date(rental.dateend)
          return end < today
        })
      } else if (filters.status === "booked") {
        filtered = filtered.filter(rental => {
          if (!rental.datestart) return false
          const start = new Date(rental.datestart)
          return start > today
        })
      }
    }

    // Filter periode tanggal
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate)
      const endDate = new Date(filters.endDate)
      
      // Set jam ke 00:00:00 untuk startDate dan 23:59:59 untuk endDate
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(23, 59, 59, 999)
      
      filtered = filtered.filter(rental => {
        // Lewati jika tanggal rental kosong
        if (!rental.datestart || !rental.dateend) return false
        
        const rentalStart = new Date(rental.datestart)
        const rentalEnd = new Date(rental.dateend)
        
        // Cek apakah periode rental tumpang tindih dengan periode filter
        return rentalStart <= endDate && rentalEnd >= startDate
      })
    }

    setFilteredRentals(filtered)
  }

  const updateFilters = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const clearFilters = () => {
    setFilters({
      clientID: "",
      station: "",
      mediaGroup: "",
      mediaSubGroup: "",
      status: "all",
      assetCode: "",
      startDate: "",
      endDate: ""
    })
  }

  return {
    filters,
    filteredRentals,
    updateFilters,
    clearFilters
  }
}
