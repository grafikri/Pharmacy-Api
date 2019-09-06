export interface Pharmacy {
  name?: string
  coordinate?: Coordinate
  address?: string
  phone?: string
}

export interface Coordinate {
  lat: number
  lng: number
}
