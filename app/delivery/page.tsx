"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, MapPin, Clock, CheckCircle, Calculator } from "lucide-react"
import { BreadcrumbJsonLd } from "@/components/seo/json-ld"
import { DEALERSHIP_LOCATION, DEALERSHIP_ADDRESS_FULL } from "@/lib/constants/dealership"

// Planet Motors shipping location: L4C 1G7, Richmond Hill, Ontario


// Delivery pricing tiers based on distance from Richmond Hill, ON (L4C 1G7)
// Updated transportation rules:
// 0-300 km: FREE
// 301-499 km: $0.70/km
// 500-999 km: $0.75/km
// 1000-2000 km: $0.80/km
// 2001-9999 km: $0.65/km (bulk rate for long distance)
// Max delivery distance: 9,999 km
const MAX_DELIVERY_DISTANCE = 9999


const DELIVERY_TIERS = [
  { minKm: 0, maxKm: 300, cost: 0, label: "FREE" },
  { minKm: 301, maxKm: 499, costPerKm: 0.70, label: "$0.70/km" },
  { minKm: 500, maxKm: 999, costPerKm: 0.75, label: "$0.75/km" },
  { minKm: 1000, maxKm: 2000, costPerKm: 0.80, label: "$0.80/km" },
  { minKm: 2001, maxKm: 9999, costPerKm: 0.65, label: "$0.65/km" }
]

// FSA (Forward Sortation Area) distances from Richmond Hill, ON (L4C 1G7)
// These are approximate driving distances in km
const CITY_DISTANCES: { [key: string]: { km: number; city: string; province: string } } = {
  // Ontario - GTA & Surrounding
  "L4C": { km: 0, city: "Richmond Hill", province: "ON" },
  "L4B": { km: 5, city: "Richmond Hill", province: "ON" },
  "L4S": { km: 8, city: "Richmond Hill", province: "ON" },
  "L4E": { km: 10, city: "Aurora", province: "ON" },
  "L3R": { km: 8, city: "Markham", province: "ON" },
  "L3P": { km: 12, city: "Markham", province: "ON" },
  "L3T": { km: 5, city: "Thornhill", province: "ON" },
  "L6A": { km: 15, city: "Maple", province: "ON" },
  "L6B": { km: 18, city: "Maple", province: "ON" },
  "L6C": { km: 20, city: "Vaughan", province: "ON" },
  "L4L": { km: 18, city: "Woodbridge", province: "ON" },
  "L4J": { km: 12, city: "Concord", province: "ON" },
  "L4K": { km: 10, city: "Concord", province: "ON" },
  "M1B": { km: 30, city: "Scarborough", province: "ON" },
  "M2J": { km: 15, city: "North York", province: "ON" },
  "M3H": { km: 18, city: "North York", province: "ON" },
  "M4K": { km: 22, city: "Toronto", province: "ON" },
  "M5V": { km: 28, city: "Toronto Downtown", province: "ON" },
  "M5G": { km: 25, city: "Toronto", province: "ON" },
  "M6H": { km: 25, city: "Toronto", province: "ON" },
  "L5B": { km: 35, city: "Mississauga", province: "ON" },
  "L5M": { km: 40, city: "Mississauga", province: "ON" },
  "L5N": { km: 42, city: "Mississauga", province: "ON" },
  "L7A": { km: 50, city: "Brampton", province: "ON" },
  "L6P": { km: 45, city: "Brampton", province: "ON" },
  "L6R": { km: 48, city: "Brampton", province: "ON" },
  "L6S": { km: 50, city: "Brampton", province: "ON" },
  "L6T": { km: 52, city: "Brampton", province: "ON" },
  "L6V": { km: 55, city: "Brampton", province: "ON" },
  "L6W": { km: 50, city: "Brampton", province: "ON" },
  "L6X": { km: 48, city: "Brampton", province: "ON" },
  "L6Y": { km: 52, city: "Brampton", province: "ON" },
  "L6Z": { km: 55, city: "Brampton", province: "ON" },
  "L7C": { km: 60, city: "Caledon", province: "ON" },
  
  // Ontario - Southwestern (N postal codes)
  "N0A": { km: 200, city: "Haldimand County", province: "ON" },
  "N0B": { km: 85, city: "Wellington County", province: "ON" },
  "N0C": { km: 120, city: "Grey County", province: "ON" },
  "N0E": { km: 150, city: "Brant County", province: "ON" },
  "N0G": { km: 140, city: "Huron County", province: "ON" },
  "N0H": { km: 180, city: "Bruce County", province: "ON" },
  "N0J": { km: 200, city: "Middlesex County", province: "ON" },
  "N0K": { km: 160, city: "Perth County", province: "ON" },
  "N0L": { km: 220, city: "Elgin County", province: "ON" },
  "N0M": { km: 240, city: "Lambton County", province: "ON" },
  "N0N": { km: 280, city: "Chatham-Kent", province: "ON" },
  "N0P": { km: 320, city: "Tilbury (Elgin County)", province: "ON" },  // Tilbury - 319-324 km actual distance
  "N0R": { km: 350, city: "Essex County", province: "ON" },
  "N1A": { km: 100, city: "Dufferin County", province: "ON" },
  "N1G": { km: 80, city: "Guelph", province: "ON" },
  "N1H": { km: 82, city: "Guelph", province: "ON" },
  "N1K": { km: 85, city: "Guelph", province: "ON" },
  "N1L": { km: 88, city: "Guelph", province: "ON" },
  "N2A": { km: 100, city: "Kitchener", province: "ON" },
  "N2B": { km: 102, city: "Kitchener", province: "ON" },
  "N2C": { km: 105, city: "Kitchener", province: "ON" },
  "N2E": { km: 108, city: "Kitchener", province: "ON" },
  "N2G": { km: 100, city: "Kitchener", province: "ON" },
  "N2H": { km: 98, city: "Kitchener", province: "ON" },
  "N2J": { km: 95, city: "Waterloo", province: "ON" },
  "N2K": { km: 92, city: "Waterloo", province: "ON" },
  "N2L": { km: 90, city: "Waterloo", province: "ON" },
  "N2M": { km: 105, city: "Kitchener", province: "ON" },
  "N2N": { km: 108, city: "Kitchener", province: "ON" },
  "N2P": { km: 110, city: "Kitchener", province: "ON" },
  "N2R": { km: 95, city: "Waterloo", province: "ON" },
  "N2T": { km: 93, city: "Waterloo", province: "ON" },
  "N2V": { km: 90, city: "Waterloo", province: "ON" },
  "N3A": { km: 115, city: "Cambridge", province: "ON" },
  "N3C": { km: 118, city: "Cambridge", province: "ON" },
  "N3H": { km: 120, city: "Cambridge", province: "ON" },
  "N3R": { km: 150, city: "Brantford", province: "ON" },
  "N3S": { km: 152, city: "Brantford", province: "ON" },
  "N3T": { km: 155, city: "Brantford", province: "ON" },
  "N3V": { km: 158, city: "Brantford", province: "ON" },
  "N4B": { km: 130, city: "Woodstock", province: "ON" },
  "N4G": { km: 135, city: "Woodstock", province: "ON" },
  "N4K": { km: 140, city: "Owen Sound", province: "ON" },
  "N4S": { km: 135, city: "Woodstock", province: "ON" },
  "N4T": { km: 138, city: "Woodstock", province: "ON" },
  "N5A": { km: 175, city: "St. Thomas", province: "ON" },
  "N5C": { km: 180, city: "London", province: "ON" },
  "N5R": { km: 178, city: "St. Thomas", province: "ON" },
  "N5V": { km: 185, city: "London", province: "ON" },
  "N5W": { km: 188, city: "London", province: "ON" },
  "N5X": { km: 182, city: "London", province: "ON" },
  "N5Y": { km: 180, city: "London", province: "ON" },
  "N5Z": { km: 183, city: "London", province: "ON" },
  "N6A": { km: 185, city: "London", province: "ON" },
  "N6B": { km: 188, city: "London", province: "ON" },
  "N6C": { km: 190, city: "London", province: "ON" },
  "N6E": { km: 192, city: "London", province: "ON" },
  "N6G": { km: 185, city: "London", province: "ON" },
  "N6H": { km: 187, city: "London", province: "ON" },
  "N6J": { km: 190, city: "London", province: "ON" },
  "N6K": { km: 192, city: "London", province: "ON" },
  "N6L": { km: 195, city: "London", province: "ON" },
  "N6M": { km: 198, city: "London", province: "ON" },
  "N6N": { km: 195, city: "London", province: "ON" },
  "N6P": { km: 192, city: "London", province: "ON" },
  "N7A": { km: 260, city: "Sarnia", province: "ON" },
  "N7G": { km: 250, city: "Strathroy", province: "ON" },
  "N7L": { km: 225, city: "Stratford", province: "ON" },
  "N7M": { km: 228, city: "Stratford", province: "ON" },
  "N7S": { km: 265, city: "Sarnia", province: "ON" },
  "N7T": { km: 268, city: "Sarnia", province: "ON" },
  "N7V": { km: 270, city: "Sarnia", province: "ON" },
  "N7W": { km: 272, city: "Sarnia", province: "ON" },
  "N7X": { km: 275, city: "Sarnia", province: "ON" },
  "N8A": { km: 350, city: "Chatham", province: "ON" },
  "N8H": { km: 310, city: "Wallaceburg", province: "ON" },
  "N8M": { km: 315, city: "Chatham", province: "ON" },
  "N8N": { km: 320, city: "Chatham", province: "ON" },
  "N8P": { km: 325, city: "Chatham", province: "ON" },
  "N8R": { km: 328, city: "Chatham", province: "ON" },
  "N8S": { km: 330, city: "Chatham", province: "ON" },
  "N8T": { km: 332, city: "Chatham", province: "ON" },
  "N8V": { km: 380, city: "Windsor", province: "ON" },
  "N8W": { km: 378, city: "Windsor", province: "ON" },
  "N8X": { km: 375, city: "Windsor", province: "ON" },
  "N8Y": { km: 372, city: "Windsor", province: "ON" },
  "N9A": { km: 380, city: "Windsor", province: "ON" },
  "N9B": { km: 382, city: "Windsor", province: "ON" },
  "N9C": { km: 385, city: "Windsor", province: "ON" },
  "N9E": { km: 378, city: "Windsor", province: "ON" },
  "N9G": { km: 375, city: "Windsor", province: "ON" },
  "N9H": { km: 390, city: "Tecumseh", province: "ON" },
  "N9J": { km: 385, city: "Windsor", province: "ON" },
  "N9K": { km: 388, city: "Windsor", province: "ON" },
  "N9V": { km: 400, city: "Leamington", province: "ON" },
  "N9Y": { km: 410, city: "Kingsville", province: "ON" },
  
  // Ontario - Hamilton/Niagara (L postal codes)
  "L0R": { km: 70, city: "Niagara Region", province: "ON" },
  "L0S": { km: 110, city: "Niagara Region", province: "ON" },
  "L1A": { km: 50, city: "Ajax", province: "ON" },
  "L1B": { km: 52, city: "Ajax", province: "ON" },
  "L1C": { km: 48, city: "Whitby", province: "ON" },
  "L1E": { km: 55, city: "Oshawa", province: "ON" },
  "L1G": { km: 60, city: "Oshawa", province: "ON" },
  "L1H": { km: 62, city: "Oshawa", province: "ON" },
  "L1J": { km: 65, city: "Oshawa", province: "ON" },
  "L1K": { km: 68, city: "Oshawa", province: "ON" },
  "L1L": { km: 70, city: "Oshawa", province: "ON" },
  "L1M": { km: 55, city: "Pickering", province: "ON" },
  "L1N": { km: 50, city: "Whitby", province: "ON" },
  "L1P": { km: 52, city: "Whitby", province: "ON" },
  "L1R": { km: 55, city: "Whitby", province: "ON" },
  "L1S": { km: 45, city: "Pickering", province: "ON" },
  "L1T": { km: 48, city: "Ajax", province: "ON" },
  "L1V": { km: 50, city: "Pickering", province: "ON" },
  "L1W": { km: 52, city: "Pickering", province: "ON" },
  "L1X": { km: 55, city: "Pickering", province: "ON" },
  "L1Y": { km: 58, city: "Pickering", province: "ON" },
  "L1Z": { km: 50, city: "Ajax", province: "ON" },
  "L2A": { km: 130, city: "Fort Erie", province: "ON" },
  "L2E": { km: 125, city: "Niagara Falls", province: "ON" },
  "L2G": { km: 128, city: "Niagara Falls", province: "ON" },
  "L2H": { km: 130, city: "Niagara Falls", province: "ON" },
  "L2J": { km: 135, city: "Niagara Falls", province: "ON" },
  "L2M": { km: 110, city: "St. Catharines", province: "ON" },
  "L2N": { km: 108, city: "St. Catharines", province: "ON" },
  "L2P": { km: 112, city: "St. Catharines", province: "ON" },
  "L2R": { km: 115, city: "St. Catharines", province: "ON" },
  "L2S": { km: 118, city: "St. Catharines", province: "ON" },
  "L2T": { km: 120, city: "St. Catharines", province: "ON" },
  "L2V": { km: 122, city: "St. Catharines", province: "ON" },
  "L2W": { km: 125, city: "St. Catharines", province: "ON" },
  "L3B": { km: 120, city: "Welland", province: "ON" },
  "L3C": { km: 122, city: "Welland", province: "ON" },
  "L3K": { km: 140, city: "Port Colborne", province: "ON" },
  "L3M": { km: 100, city: "Grimsby", province: "ON" },
  "L3S": { km: 105, city: "Thorold", province: "ON" },
  "L8E": { km: 75, city: "Hamilton", province: "ON" },
  "L8G": { km: 78, city: "Hamilton", province: "ON" },
  "L8H": { km: 80, city: "Hamilton", province: "ON" },
  "L8J": { km: 82, city: "Hamilton", province: "ON" },
  "L8K": { km: 85, city: "Hamilton", province: "ON" },
  "L8L": { km: 88, city: "Hamilton", province: "ON" },
  "L8M": { km: 78, city: "Hamilton", province: "ON" },
  "L8N": { km: 76, city: "Hamilton", province: "ON" },
  "L8P": { km: 75, city: "Hamilton", province: "ON" },
  "L8R": { km: 78, city: "Hamilton", province: "ON" },
  "L8S": { km: 80, city: "Hamilton", province: "ON" },
  "L8T": { km: 82, city: "Hamilton", province: "ON" },
  "L8V": { km: 85, city: "Hamilton", province: "ON" },
  "L8W": { km: 88, city: "Hamilton", province: "ON" },
  "L9A": { km: 90, city: "Hamilton", province: "ON" },
  "L9B": { km: 92, city: "Hamilton", province: "ON" },
  "L9C": { km: 88, city: "Hamilton", province: "ON" },
  "L9G": { km: 85, city: "Hamilton", province: "ON" },
  "L9H": { km: 82, city: "Hamilton", province: "ON" },
  "L9K": { km: 80, city: "Hamilton", province: "ON" },
  
  // Ontario - Eastern (K postal codes)
  "K1A": { km: 450, city: "Ottawa", province: "ON" },
  "K1B": { km: 455, city: "Ottawa", province: "ON" },
  "K1C": { km: 460, city: "Ottawa", province: "ON" },
  "K1E": { km: 458, city: "Ottawa", province: "ON" },
  "K1G": { km: 452, city: "Ottawa", province: "ON" },
  "K1H": { km: 448, city: "Ottawa", province: "ON" },
  "K1J": { km: 455, city: "Ottawa", province: "ON" },
  "K1K": { km: 458, city: "Ottawa", province: "ON" },
  "K1L": { km: 460, city: "Ottawa", province: "ON" },
  "K1M": { km: 445, city: "Ottawa", province: "ON" },
  "K1N": { km: 448, city: "Ottawa", province: "ON" },
  "K1P": { km: 450, city: "Ottawa", province: "ON" },
  "K1R": { km: 452, city: "Ottawa", province: "ON" },
  "K1S": { km: 455, city: "Ottawa", province: "ON" },
  "K1T": { km: 458, city: "Ottawa", province: "ON" },
  "K1V": { km: 460, city: "Ottawa", province: "ON" },
  "K1W": { km: 462, city: "Ottawa", province: "ON" },
  "K1X": { km: 465, city: "Ottawa", province: "ON" },
  "K1Y": { km: 448, city: "Ottawa", province: "ON" },
  "K1Z": { km: 450, city: "Ottawa", province: "ON" },
  "K2A": { km: 452, city: "Ottawa", province: "ON" },
  "K2B": { km: 455, city: "Ottawa", province: "ON" },
  "K2C": { km: 458, city: "Ottawa", province: "ON" },
  "K2E": { km: 460, city: "Ottawa", province: "ON" },
  "K2G": { km: 462, city: "Ottawa", province: "ON" },
  "K2H": { km: 455, city: "Ottawa", province: "ON" },
  "K2J": { km: 458, city: "Ottawa", province: "ON" },
  "K2K": { km: 445, city: "Kanata", province: "ON" },
  "K2L": { km: 448, city: "Kanata", province: "ON" },
  "K2M": { km: 450, city: "Kanata", province: "ON" },
  "K2P": { km: 452, city: "Ottawa", province: "ON" },
  "K2R": { km: 455, city: "Ottawa", province: "ON" },
  "K2S": { km: 440, city: "Stittsville", province: "ON" },
  "K2T": { km: 442, city: "Kanata", province: "ON" },
  "K2V": { km: 445, city: "Kanata", province: "ON" },
  "K2W": { km: 448, city: "Kanata", province: "ON" },
  "K7G": { km: 350, city: "Brockville", province: "ON" },
  "K7K": { km: 280, city: "Kingston", province: "ON" },
  "K7L": { km: 282, city: "Kingston", province: "ON" },
  "K7M": { km: 285, city: "Kingston", province: "ON" },
  "K7P": { km: 288, city: "Kingston", province: "ON" },
  "K8A": { km: 200, city: "Belleville", province: "ON" },
  "K8N": { km: 205, city: "Belleville", province: "ON" },
  "K8P": { km: 208, city: "Belleville", province: "ON" },
  "K8R": { km: 210, city: "Belleville", province: "ON" },
  "K8V": { km: 215, city: "Trenton", province: "ON" },
  "K9A": { km: 130, city: "Peterborough", province: "ON" },
  "K9H": { km: 132, city: "Peterborough", province: "ON" },
  "K9J": { km: 135, city: "Peterborough", province: "ON" },
  "K9K": { km: 138, city: "Peterborough", province: "ON" },
  "K9L": { km: 140, city: "Peterborough", province: "ON" },
  
  // Ontario - Northern (P postal codes)
  "P0A": { km: 350, city: "Parry Sound District", province: "ON" },
  "P0B": { km: 400, city: "Nipissing District", province: "ON" },
  "P0C": { km: 200, city: "Muskoka District", province: "ON" },
  "P0E": { km: 450, city: "Sudbury District", province: "ON" },
  "P0G": { km: 350, city: "Parry Sound", province: "ON" },
  "P0H": { km: 380, city: "North Bay Area", province: "ON" },
  "P0J": { km: 500, city: "Temiskaming", province: "ON" },
  "P0K": { km: 550, city: "Cochrane District", province: "ON" },
  "P0L": { km: 700, city: "Algoma District", province: "ON" },
  "P0M": { km: 400, city: "Sudbury District", province: "ON" },
  "P0N": { km: 450, city: "Sudbury District", province: "ON" },
  "P0P": { km: 500, city: "Algoma District", province: "ON" },
  "P0R": { km: 750, city: "Thunder Bay District", province: "ON" },
  "P0S": { km: 800, city: "Thunder Bay District", province: "ON" },
  "P0T": { km: 1400, city: "Kenora District", province: "ON" },
  "P0V": { km: 1500, city: "Rainy River District", province: "ON" },
  "P0W": { km: 1200, city: "Kenora District", province: "ON" },
  "P0X": { km: 1300, city: "Kenora District", province: "ON" },
  "P1A": { km: 340, city: "North Bay", province: "ON" },
  "P1B": { km: 345, city: "North Bay", province: "ON" },
  "P1C": { km: 348, city: "North Bay", province: "ON" },
  "P1H": { km: 220, city: "Huntsville", province: "ON" },
  "P1L": { km: 180, city: "Bracebridge", province: "ON" },
  "P1P": { km: 200, city: "Gravenhurst", province: "ON" },
  "P2A": { km: 250, city: "Orillia", province: "ON" },
  "P2B": { km: 255, city: "Orillia", province: "ON" },
  "P3A": { km: 400, city: "Sudbury", province: "ON" },
  "P3B": { km: 405, city: "Sudbury", province: "ON" },
  "P3C": { km: 408, city: "Sudbury", province: "ON" },
  "P3E": { km: 410, city: "Sudbury", province: "ON" },
  "P3G": { km: 415, city: "Sudbury", province: "ON" },
  "P3L": { km: 420, city: "Sudbury", province: "ON" },
  "P3N": { km: 425, city: "Sudbury", province: "ON" },
  "P3P": { km: 430, city: "Sudbury", province: "ON" },
  "P3Y": { km: 435, city: "Sudbury", province: "ON" },
  "P4N": { km: 550, city: "Timmins", province: "ON" },
  "P4P": { km: 555, city: "Timmins", province: "ON" },
  "P4R": { km: 560, city: "Timmins", province: "ON" },
  "P5A": { km: 480, city: "Elliot Lake", province: "ON" },
  "P5E": { km: 520, city: "Blind River", province: "ON" },
  "P5N": { km: 600, city: "Chapleau", province: "ON" },
  "P6A": { km: 680, city: "Sault Ste. Marie", province: "ON" },
  "P6B": { km: 685, city: "Sault Ste. Marie", province: "ON" },
  "P6C": { km: 690, city: "Sault Ste. Marie", province: "ON" },
  "P7A": { km: 1400, city: "Thunder Bay", province: "ON" },
  "P7B": { km: 1405, city: "Thunder Bay", province: "ON" },
  "P7C": { km: 1410, city: "Thunder Bay", province: "ON" },
  "P7E": { km: 1415, city: "Thunder Bay", province: "ON" },
  "P7G": { km: 1420, city: "Thunder Bay", province: "ON" },
  "P7J": { km: 1425, city: "Thunder Bay", province: "ON" },
  "P7K": { km: 1430, city: "Thunder Bay", province: "ON" },
  "P8N": { km: 1600, city: "Dryden", province: "ON" },
  "P8T": { km: 1800, city: "Fort Frances", province: "ON" },
  "P9A": { km: 1900, city: "Kenora", province: "ON" },
  "P9N": { km: 1950, city: "Kenora", province: "ON" },
  
  // Quebec (G, H, J postal codes)
  "G1A": { km: 800, city: "Quebec City", province: "QC" },
  "G1B": { km: 805, city: "Quebec City", province: "QC" },
  "G1C": { km: 810, city: "Quebec City", province: "QC" },
  "G1E": { km: 815, city: "Quebec City", province: "QC" },
  "G1G": { km: 820, city: "Quebec City", province: "QC" },
  "G1H": { km: 800, city: "Quebec City", province: "QC" },
  "G1J": { km: 798, city: "Quebec City", province: "QC" },
  "G1K": { km: 795, city: "Quebec City", province: "QC" },
  "G1L": { km: 792, city: "Quebec City", province: "QC" },
  "G1M": { km: 790, city: "Quebec City", province: "QC" },
  "G1N": { km: 788, city: "Quebec City", province: "QC" },
  "G1P": { km: 785, city: "Quebec City", province: "QC" },
  "G1R": { km: 782, city: "Quebec City", province: "QC" },
  "G1S": { km: 780, city: "Quebec City", province: "QC" },
  "G1T": { km: 778, city: "Quebec City", province: "QC" },
  "G1V": { km: 775, city: "Quebec City", province: "QC" },
  "G1W": { km: 772, city: "Quebec City", province: "QC" },
  "G1X": { km: 770, city: "Quebec City", province: "QC" },
  "G1Y": { km: 768, city: "Quebec City", province: "QC" },
  "G2A": { km: 810, city: "Quebec City", province: "QC" },
  "G2B": { km: 815, city: "Quebec City", province: "QC" },
  "G2C": { km: 820, city: "Quebec City", province: "QC" },
  "G2E": { km: 825, city: "Quebec City", province: "QC" },
  "G2G": { km: 830, city: "Quebec City", province: "QC" },
  "G2J": { km: 835, city: "Quebec City", province: "QC" },
  "G2K": { km: 840, city: "Quebec City", province: "QC" },
  "G2L": { km: 845, city: "Quebec City", province: "QC" },
  "G2M": { km: 850, city: "Quebec City", province: "QC" },
  "G2N": { km: 855, city: "Quebec City", province: "QC" },
  "H1A": { km: 550, city: "Montreal", province: "QC" },
  "H1B": { km: 555, city: "Montreal", province: "QC" },
  "H1C": { km: 560, city: "Montreal", province: "QC" },
  "H1E": { km: 565, city: "Montreal", province: "QC" },
  "H1G": { km: 545, city: "Montreal", province: "QC" },
  "H1H": { km: 548, city: "Montreal", province: "QC" },
  "H1J": { km: 550, city: "Montreal", province: "QC" },
  "H1K": { km: 552, city: "Montreal", province: "QC" },
  "H1L": { km: 555, city: "Montreal", province: "QC" },
  "H1M": { km: 558, city: "Montreal", province: "QC" },
  "H1N": { km: 560, city: "Montreal", province: "QC" },
  "H1P": { km: 545, city: "Montreal", province: "QC" },
  "H1R": { km: 548, city: "Montreal", province: "QC" },
  "H1S": { km: 550, city: "Montreal", province: "QC" },
  "H1T": { km: 552, city: "Montreal", province: "QC" },
  "H1V": { km: 555, city: "Montreal", province: "QC" },
  "H1W": { km: 558, city: "Montreal", province: "QC" },
  "H1X": { km: 545, city: "Montreal", province: "QC" },
  "H1Y": { km: 548, city: "Montreal", province: "QC" },
  "H1Z": { km: 550, city: "Montreal", province: "QC" },
  "H2A": { km: 540, city: "Montreal", province: "QC" },
  "H2B": { km: 542, city: "Montreal", province: "QC" },
  "H2C": { km: 545, city: "Montreal", province: "QC" },
  "H2E": { km: 548, city: "Montreal", province: "QC" },
  "H2G": { km: 540, city: "Montreal", province: "QC" },
  "H2H": { km: 538, city: "Montreal", province: "QC" },
  "H2J": { km: 535, city: "Montreal", province: "QC" },
  "H2K": { km: 532, city: "Montreal", province: "QC" },
  "H2L": { km: 530, city: "Montreal", province: "QC" },
  "H2M": { km: 545, city: "Montreal", province: "QC" },
  "H2N": { km: 548, city: "Montreal", province: "QC" },
  "H2P": { km: 545, city: "Montreal", province: "QC" },
  "H2R": { km: 542, city: "Montreal", province: "QC" },
  "H2S": { km: 540, city: "Montreal", province: "QC" },
  "H2T": { km: 538, city: "Montreal", province: "QC" },
  "H2V": { km: 535, city: "Montreal", province: "QC" },
  "H2W": { km: 532, city: "Montreal", province: "QC" },
  "H2X": { km: 530, city: "Montreal", province: "QC" },
  "H2Y": { km: 528, city: "Montreal", province: "QC" },
  "H2Z": { km: 530, city: "Montreal", province: "QC" },
  "H3A": { km: 540, city: "Montreal Downtown", province: "QC" },
  "H3B": { km: 542, city: "Montreal", province: "QC" },
  "H3C": { km: 545, city: "Montreal", province: "QC" },
  "H3E": { km: 548, city: "Montreal", province: "QC" },
  "H3G": { km: 540, city: "Montreal", province: "QC" },
  "H3H": { km: 538, city: "Montreal", province: "QC" },
  "H3J": { km: 535, city: "Montreal", province: "QC" },
  "H3K": { km: 532, city: "Montreal", province: "QC" },
  "H3L": { km: 545, city: "Montreal", province: "QC" },
  "H3M": { km: 548, city: "Montreal", province: "QC" },
  "H3N": { km: 545, city: "Montreal", province: "QC" },
  "H3P": { km: 542, city: "Montreal", province: "QC" },
  "H3R": { km: 540, city: "Montreal", province: "QC" },
  "H3S": { km: 538, city: "Montreal", province: "QC" },
  "H3T": { km: 535, city: "Montreal", province: "QC" },
  "H3V": { km: 532, city: "Montreal", province: "QC" },
  "H3W": { km: 530, city: "Montreal", province: "QC" },
  "H3X": { km: 528, city: "Montreal", province: "QC" },
  "H3Y": { km: 530, city: "Montreal", province: "QC" },
  "H3Z": { km: 532, city: "Montreal", province: "QC" },
  "H4A": { km: 545, city: "Montreal", province: "QC" },
  "H4B": { km: 548, city: "Montreal", province: "QC" },
  "H4C": { km: 545, city: "Montreal", province: "QC" },
  "H4E": { km: 542, city: "Montreal", province: "QC" },
  "H4G": { km: 540, city: "Montreal", province: "QC" },
  "H4H": { km: 538, city: "Montreal", province: "QC" },
  "H4J": { km: 535, city: "Montreal", province: "QC" },
  "H4K": { km: 532, city: "Montreal", province: "QC" },
  "H4L": { km: 530, city: "Montreal", province: "QC" },
  "H4M": { km: 528, city: "Montreal", province: "QC" },
  "H4N": { km: 530, city: "Montreal", province: "QC" },
  "H4P": { km: 532, city: "Montreal", province: "QC" },
  "H4R": { km: 535, city: "Montreal", province: "QC" },
  "H4S": { km: 538, city: "Montreal", province: "QC" },
  "H4T": { km: 540, city: "Montreal", province: "QC" },
  "H4V": { km: 542, city: "Montreal", province: "QC" },
  "H4W": { km: 545, city: "Montreal", province: "QC" },
  "H4X": { km: 548, city: "Montreal", province: "QC" },
  "H4Y": { km: 550, city: "Montreal", province: "QC" },
  "H4Z": { km: 552, city: "Montreal", province: "QC" },
  "J1A": { km: 620, city: "Sherbrooke", province: "QC" },
  "J1E": { km: 625, city: "Sherbrooke", province: "QC" },
  "J1G": { km: 630, city: "Sherbrooke", province: "QC" },
  "J1H": { km: 635, city: "Sherbrooke", province: "QC" },
  "J1J": { km: 640, city: "Sherbrooke", province: "QC" },
  "J1K": { km: 645, city: "Sherbrooke", province: "QC" },
  "J1L": { km: 650, city: "Sherbrooke", province: "QC" },
  "J1M": { km: 655, city: "Sherbrooke", province: "QC" },
  "J1N": { km: 660, city: "Sherbrooke", province: "QC" },
  "J1R": { km: 665, city: "Sherbrooke", province: "QC" },
  "J1S": { km: 670, city: "Sherbrooke", province: "QC" },
  "J4B": { km: 560, city: "Boucherville", province: "QC" },
  "J4G": { km: 565, city: "Longueuil", province: "QC" },
  "J4H": { km: 568, city: "Longueuil", province: "QC" },
  "J4J": { km: 570, city: "Longueuil", province: "QC" },
  "J4K": { km: 572, city: "Longueuil", province: "QC" },
  "J4L": { km: 575, city: "Longueuil", province: "QC" },
  "J4M": { km: 578, city: "Longueuil", province: "QC" },
  "J4N": { km: 580, city: "Longueuil", province: "QC" },
  "J4P": { km: 582, city: "Longueuil", province: "QC" },
  "J4R": { km: 585, city: "Longueuil", province: "QC" },
  "J4S": { km: 588, city: "Longueuil", province: "QC" },
  "J4T": { km: 590, city: "Longueuil", province: "QC" },
  "J4V": { km: 592, city: "Longueuil", province: "QC" },
  "J4W": { km: 595, city: "Longueuil", province: "QC" },
  "J4X": { km: 598, city: "Longueuil", province: "QC" },
  "J4Y": { km: 600, city: "Longueuil", province: "QC" },
  "J4Z": { km: 602, city: "Longueuil", province: "QC" },
  "J5A": { km: 580, city: "Laval", province: "QC" },
  "J5B": { km: 582, city: "Laval", province: "QC" },
  "J5C": { km: 585, city: "Laval", province: "QC" },
  "J5J": { km: 590, city: "Terrebonne", province: "QC" },
  "J5L": { km: 595, city: "Repentigny", province: "QC" },
  "J5M": { km: 598, city: "Repentigny", province: "QC" },
  "J5R": { km: 600, city: "Châteauguay", province: "QC" },
  "J5T": { km: 605, city: "Candiac", province: "QC" },
  "J5V": { km: 608, city: "La Prairie", province: "QC" },
  "J5W": { km: 610, city: "St-Jean-sur-Richelieu", province: "QC" },
  "J5X": { km: 612, city: "St-Jean-sur-Richelieu", province: "QC" },
  "J5Y": { km: 615, city: "St-Jean-sur-Richelieu", province: "QC" },
  "J5Z": { km: 618, city: "St-Jean-sur-Richelieu", province: "QC" },
  "J6A": { km: 580, city: "Salaberry-de-Valleyfield", province: "QC" },
  "J6E": { km: 575, city: "Joliette", province: "QC" },
  "J6J": { km: 585, city: "Châteauguay", province: "QC" },
  "J6K": { km: 588, city: "Châteauguay", province: "QC" },
  "J6N": { km: 590, city: "St-Hyacinthe", province: "QC" },
  "J6R": { km: 580, city: "Sorel-Tracy", province: "QC" },
  "J6S": { km: 585, city: "St-Eustache", province: "QC" },
  "J6T": { km: 588, city: "Vaudreuil-Dorion", province: "QC" },
  "J6V": { km: 590, city: "Vaudreuil-Dorion", province: "QC" },
  "J6W": { km: 592, city: "Vaudreuil-Dorion", province: "QC" },
  "J6X": { km: 595, city: "Vaudreuil-Dorion", province: "QC" },
  "J6Y": { km: 598, city: "Vaudreuil-Dorion", province: "QC" },
  "J6Z": { km: 600, city: "Vaudreuil-Dorion", province: "QC" },
  "J7A": { km: 565, city: "Lachute", province: "QC" },
  "J7B": { km: 560, city: "Blainville", province: "QC" },
  "J7C": { km: 558, city: "Blainville", province: "QC" },
  "J7E": { km: 555, city: "Blainville", province: "QC" },
  "J7G": { km: 550, city: "Mirabel", province: "QC" },
  "J7H": { km: 548, city: "Mirabel", province: "QC" },
  "J7J": { km: 545, city: "Mirabel", province: "QC" },
  "J7K": { km: 542, city: "Mirabel", province: "QC" },
  "J7L": { km: 540, city: "Mirabel", province: "QC" },
  "J7M": { km: 538, city: "St-Jérôme", province: "QC" },
  "J7N": { km: 535, city: "St-Jérôme", province: "QC" },
  "J7P": { km: 532, city: "St-Jérôme", province: "QC" },
  "J7R": { km: 540, city: "Boisbriand", province: "QC" },
  "J7T": { km: 545, city: "Boisbriand", province: "QC" },
  "J7V": { km: 548, city: "Ste-Thérèse", province: "QC" },
  "J7W": { km: 550, city: "Ste-Thérèse", province: "QC" },
  "J7X": { km: 552, city: "Ste-Thérèse", province: "QC" },
  "J7Y": { km: 555, city: "Ste-Thérèse", province: "QC" },
  "J7Z": { km: 530, city: "St-Jérôme", province: "QC" },
  
  // Other provinces - Major cities
  "V6B": { km: 4400, city: "Vancouver", province: "BC" },
  "V6C": { km: 4402, city: "Vancouver", province: "BC" },
  "V6E": { km: 4405, city: "Vancouver", province: "BC" },
  "V6G": { km: 4408, city: "Vancouver", province: "BC" },
  "V6H": { km: 4410, city: "Vancouver", province: "BC" },
  "V6J": { km: 4412, city: "Vancouver", province: "BC" },
  "V6K": { km: 4415, city: "Vancouver", province: "BC" },
  "V6M": { km: 4418, city: "Vancouver", province: "BC" },
  "V6N": { km: 4420, city: "Vancouver", province: "BC" },
  "V6P": { km: 4422, city: "Vancouver", province: "BC" },
  "V6R": { km: 4425, city: "Vancouver", province: "BC" },
  "V6S": { km: 4428, city: "Vancouver", province: "BC" },
  "V6T": { km: 4430, city: "Vancouver", province: "BC" },
  "V6Z": { km: 4400, city: "Vancouver", province: "BC" },
  "V5A": { km: 4420, city: "Burnaby", province: "BC" },
  "V5B": { km: 4422, city: "Burnaby", province: "BC" },
  "V5C": { km: 4425, city: "Burnaby", province: "BC" },
  "V5E": { km: 4428, city: "Burnaby", province: "BC" },
  "V5G": { km: 4430, city: "Burnaby", province: "BC" },
  "V5H": { km: 4432, city: "Burnaby", province: "BC" },
  "V5J": { km: 4435, city: "Burnaby", province: "BC" },
  "V5K": { km: 4438, city: "Vancouver", province: "BC" },
  "V5L": { km: 4440, city: "Vancouver", province: "BC" },
  "V5M": { km: 4442, city: "Vancouver", province: "BC" },
  "V5N": { km: 4445, city: "Vancouver", province: "BC" },
  "V5P": { km: 4448, city: "Vancouver", province: "BC" },
  "V5R": { km: 4450, city: "Vancouver", province: "BC" },
  "V5S": { km: 4452, city: "Vancouver", province: "BC" },
  "V5T": { km: 4455, city: "Vancouver", province: "BC" },
  "V5V": { km: 4458, city: "Vancouver", province: "BC" },
  "V5W": { km: 4460, city: "Vancouver", province: "BC" },
  "V5X": { km: 4462, city: "Vancouver", province: "BC" },
  "V5Y": { km: 4465, city: "Vancouver", province: "BC" },
  "V5Z": { km: 4468, city: "Vancouver", province: "BC" },
  "V7A": { km: 4430, city: "Richmond", province: "BC" },
  "V7B": { km: 4432, city: "Richmond", province: "BC" },
  "V7C": { km: 4435, city: "Richmond", province: "BC" },
  "V7E": { km: 4438, city: "Richmond", province: "BC" },
  "V7G": { km: 4415, city: "North Vancouver", province: "BC" },
  "V7H": { km: 4418, city: "North Vancouver", province: "BC" },
  "V7J": { km: 4420, city: "North Vancouver", province: "BC" },
  "V7K": { km: 4422, city: "North Vancouver", province: "BC" },
  "V7L": { km: 4425, city: "North Vancouver", province: "BC" },
  "V7M": { km: 4428, city: "North Vancouver", province: "BC" },
  "V7N": { km: 4430, city: "North Vancouver", province: "BC" },
  "V7P": { km: 4432, city: "North Vancouver", province: "BC" },
  "V7R": { km: 4435, city: "North Vancouver", province: "BC" },
  "V7S": { km: 4438, city: "West Vancouver", province: "BC" },
  "V7T": { km: 4440, city: "West Vancouver", province: "BC" },
  "V7V": { km: 4442, city: "West Vancouver", province: "BC" },
  "V7W": { km: 4445, city: "West Vancouver", province: "BC" },
  "V8K": { km: 4500, city: "Salt Spring Island", province: "BC" },
  "V8L": { km: 4480, city: "Sidney", province: "BC" },
  "V8N": { km: 4490, city: "Victoria", province: "BC" },
  "V8P": { km: 4495, city: "Victoria", province: "BC" },
  "V8R": { km: 4498, city: "Victoria", province: "BC" },
  "V8S": { km: 4500, city: "Victoria", province: "BC" },
  "V8T": { km: 4502, city: "Victoria", province: "BC" },
  "V8V": { km: 4505, city: "Victoria", province: "BC" },
  "V8W": { km: 4508, city: "Victoria", province: "BC" },
  "V8X": { km: 4510, city: "Victoria", province: "BC" },
  "V8Y": { km: 4512, city: "Victoria", province: "BC" },
  "V8Z": { km: 4515, city: "Victoria", province: "BC" },
  "V9A": { km: 4518, city: "Victoria", province: "BC" },
  "V9B": { km: 4520, city: "Victoria", province: "BC" },
  "V9C": { km: 4522, city: "Langford", province: "BC" },
  "V9E": { km: 4525, city: "Langford", province: "BC" },
  "T2P": { km: 3400, city: "Calgary", province: "AB" },
  "T2A": { km: 3410, city: "Calgary", province: "AB" },
  "T2B": { km: 3412, city: "Calgary", province: "AB" },
  "T2C": { km: 3415, city: "Calgary", province: "AB" },
  "T2E": { km: 3418, city: "Calgary", province: "AB" },
  "T2G": { km: 3420, city: "Calgary", province: "AB" },
  "T2H": { km: 3422, city: "Calgary", province: "AB" },
  "T2J": { km: 3425, city: "Calgary", province: "AB" },
  "T2K": { km: 3428, city: "Calgary", province: "AB" },
  "T2L": { km: 3430, city: "Calgary", province: "AB" },
  "T2M": { km: 3432, city: "Calgary", province: "AB" },
  "T2N": { km: 3398, city: "Calgary", province: "AB" },
  "T2R": { km: 3395, city: "Calgary", province: "AB" },
  "T2S": { km: 3392, city: "Calgary", province: "AB" },
  "T2T": { km: 3390, city: "Calgary", province: "AB" },
  "T2V": { km: 3388, city: "Calgary", province: "AB" },
  "T2W": { km: 3385, city: "Calgary", province: "AB" },
  "T2X": { km: 3382, city: "Calgary", province: "AB" },
  "T2Y": { km: 3380, city: "Calgary", province: "AB" },
  "T2Z": { km: 3378, city: "Calgary", province: "AB" },
  "T3A": { km: 3375, city: "Calgary", province: "AB" },
  "T3B": { km: 3372, city: "Calgary", province: "AB" },
  "T3C": { km: 3370, city: "Calgary", province: "AB" },
  "T3E": { km: 3368, city: "Calgary", province: "AB" },
  "T3G": { km: 3365, city: "Calgary", province: "AB" },
  "T3H": { km: 3362, city: "Calgary", province: "AB" },
  "T3J": { km: 3360, city: "Calgary", province: "AB" },
  "T3K": { km: 3358, city: "Calgary", province: "AB" },
  "T3L": { km: 3355, city: "Calgary", province: "AB" },
  "T3M": { km: 3352, city: "Calgary", province: "AB" },
  "T3N": { km: 3350, city: "Calgary", province: "AB" },
  "T3P": { km: 3348, city: "Calgary", province: "AB" },
  "T3R": { km: 3345, city: "Calgary", province: "AB" },
  "T5J": { km: 3100, city: "Edmonton", province: "AB" },
  "T5A": { km: 3110, city: "Edmonton", province: "AB" },
  "T5B": { km: 3108, city: "Edmonton", province: "AB" },
  "T5C": { km: 3105, city: "Edmonton", province: "AB" },
  "T5E": { km: 3102, city: "Edmonton", province: "AB" },
  "T5G": { km: 3100, city: "Edmonton", province: "AB" },
  "T5H": { km: 3098, city: "Edmonton", province: "AB" },
  "T5K": { km: 3095, city: "Edmonton", province: "AB" },
  "T5L": { km: 3092, city: "Edmonton", province: "AB" },
  "T5M": { km: 3090, city: "Edmonton", province: "AB" },
  "T5N": { km: 3088, city: "Edmonton", province: "AB" },
  "T5P": { km: 3085, city: "Edmonton", province: "AB" },
  "T5R": { km: 3082, city: "Edmonton", province: "AB" },
  "T5S": { km: 3080, city: "Edmonton", province: "AB" },
  "T5T": { km: 3078, city: "Edmonton", province: "AB" },
  "T5V": { km: 3075, city: "Edmonton", province: "AB" },
  "T5W": { km: 3072, city: "Edmonton", province: "AB" },
  "T5X": { km: 3070, city: "Edmonton", province: "AB" },
  "T5Y": { km: 3068, city: "Edmonton", province: "AB" },
  "T5Z": { km: 3065, city: "Edmonton", province: "AB" },
  "T6A": { km: 3100, city: "Edmonton", province: "AB" },
  "T6B": { km: 3102, city: "Edmonton", province: "AB" },
  "T6C": { km: 3105, city: "Edmonton", province: "AB" },
  "T6E": { km: 3108, city: "Edmonton", province: "AB" },
  "T6G": { km: 3110, city: "Edmonton", province: "AB" },
  "T6H": { km: 3112, city: "Edmonton", province: "AB" },
  "T6J": { km: 3115, city: "Edmonton", province: "AB" },
  "T6K": { km: 3118, city: "Edmonton", province: "AB" },
  "T6L": { km: 3120, city: "Edmonton", province: "AB" },
  "T6M": { km: 3122, city: "Edmonton", province: "AB" },
  "T6N": { km: 3125, city: "Edmonton", province: "AB" },
  "T6P": { km: 3128, city: "Edmonton", province: "AB" },
  "T6R": { km: 3130, city: "Edmonton", province: "AB" },
  "T6S": { km: 3132, city: "Edmonton", province: "AB" },
  "T6T": { km: 3135, city: "Edmonton", province: "AB" },
  "T6V": { km: 3138, city: "Edmonton", province: "AB" },
  "T6W": { km: 3140, city: "Edmonton", province: "AB" },
  "T6X": { km: 3142, city: "Edmonton", province: "AB" },
  "R3C": { km: 2100, city: "Winnipeg", province: "MB" },
  "R2C": { km: 2105, city: "Winnipeg", province: "MB" },
  "R2E": { km: 2108, city: "Winnipeg", province: "MB" },
  "R2G": { km: 2110, city: "Winnipeg", province: "MB" },
  "R2H": { km: 2112, city: "Winnipeg", province: "MB" },
  "R2J": { km: 2115, city: "Winnipeg", province: "MB" },
  "R2K": { km: 2118, city: "Winnipeg", province: "MB" },
  "R2L": { km: 2120, city: "Winnipeg", province: "MB" },
  "R2M": { km: 2122, city: "Winnipeg", province: "MB" },
  "R2N": { km: 2125, city: "Winnipeg", province: "MB" },
  "R2P": { km: 2128, city: "Winnipeg", province: "MB" },
  "R2R": { km: 2130, city: "Winnipeg", province: "MB" },
  "R2V": { km: 2132, city: "Winnipeg", province: "MB" },
  "R2W": { km: 2095, city: "Winnipeg", province: "MB" },
  "R2X": { km: 2092, city: "Winnipeg", province: "MB" },
  "R2Y": { km: 2090, city: "Winnipeg", province: "MB" },
  "R3A": { km: 2100, city: "Winnipeg", province: "MB" },
  "R3B": { km: 2098, city: "Winnipeg", province: "MB" },
  "R3E": { km: 2095, city: "Winnipeg", province: "MB" },
  "R3G": { km: 2092, city: "Winnipeg", province: "MB" },
  "R3H": { km: 2090, city: "Winnipeg", province: "MB" },
  "R3J": { km: 2088, city: "Winnipeg", province: "MB" },
  "R3K": { km: 2085, city: "Winnipeg", province: "MB" },
  "R3L": { km: 2095, city: "Winnipeg", province: "MB" },
  "R3M": { km: 2098, city: "Winnipeg", province: "MB" },
  "R3N": { km: 2100, city: "Winnipeg", province: "MB" },
  "R3P": { km: 2102, city: "Winnipeg", province: "MB" },
  "R3R": { km: 2105, city: "Winnipeg", province: "MB" },
  "R3S": { km: 2108, city: "Winnipeg", province: "MB" },
  "R3T": { km: 2110, city: "Winnipeg", province: "MB" },
  "R3V": { km: 2112, city: "Winnipeg", province: "MB" },
  "R3W": { km: 2115, city: "Winnipeg", province: "MB" },
  "R3X": { km: 2118, city: "Winnipeg", province: "MB" },
  "R3Y": { km: 2120, city: "Winnipeg", province: "MB" },
  "S4P": { km: 2500, city: "Regina", province: "SK" },
  "S4R": { km: 2505, city: "Regina", province: "SK" },
  "S4S": { km: 2508, city: "Regina", province: "SK" },
  "S4T": { km: 2510, city: "Regina", province: "SK" },
  "S4V": { km: 2512, city: "Regina", province: "SK" },
  "S4W": { km: 2515, city: "Regina", province: "SK" },
  "S4X": { km: 2518, city: "Regina", province: "SK" },
  "S4Y": { km: 2520, city: "Regina", province: "SK" },
  "S4Z": { km: 2522, city: "Regina", province: "SK" },
  "S7H": { km: 2700, city: "Saskatoon", province: "SK" },
  "S7J": { km: 2702, city: "Saskatoon", province: "SK" },
  "S7K": { km: 2705, city: "Saskatoon", province: "SK" },
  "S7L": { km: 2708, city: "Saskatoon", province: "SK" },
  "S7M": { km: 2710, city: "Saskatoon", province: "SK" },
  "S7N": { km: 2712, city: "Saskatoon", province: "SK" },
  "S7P": { km: 2715, city: "Saskatoon", province: "SK" },
  "S7R": { km: 2718, city: "Saskatoon", province: "SK" },
  "S7S": { km: 2720, city: "Saskatoon", province: "SK" },
  "S7T": { km: 2722, city: "Saskatoon", province: "SK" },
  "S7V": { km: 2725, city: "Saskatoon", province: "SK" },
  "S7W": { km: 2728, city: "Saskatoon", province: "SK" },
  "B3J": { km: 1800, city: "Halifax", province: "NS" },
  "B3A": { km: 1805, city: "Halifax", province: "NS" },
  "B3E": { km: 1808, city: "Halifax", province: "NS" },
  "B3G": { km: 1810, city: "Halifax", province: "NS" },
  "B3H": { km: 1812, city: "Halifax", province: "NS" },
  "B3K": { km: 1798, city: "Halifax", province: "NS" },
  "B3L": { km: 1795, city: "Halifax", province: "NS" },
  "B3M": { km: 1792, city: "Halifax", province: "NS" },
  "B3N": { km: 1790, city: "Halifax", province: "NS" },
  "B3P": { km: 1788, city: "Halifax", province: "NS" },
  "B3R": { km: 1785, city: "Halifax", province: "NS" },
  "B3S": { km: 1782, city: "Halifax", province: "NS" },
  "B3T": { km: 1780, city: "Halifax", province: "NS" },
  "B3V": { km: 1778, city: "Halifax", province: "NS" },
  "E1C": { km: 1400, city: "Moncton", province: "NB" },
  "E1A": { km: 1405, city: "Moncton", province: "NB" },
  "E1B": { km: 1408, city: "Moncton", province: "NB" },
  "E1E": { km: 1410, city: "Moncton", province: "NB" },
  "E1G": { km: 1412, city: "Moncton", province: "NB" },
  "E1H": { km: 1415, city: "Moncton", province: "NB" },
  "E2A": { km: 1350, city: "Fredericton", province: "NB" },
  "E2E": { km: 1352, city: "Fredericton", province: "NB" },
  "E2G": { km: 1355, city: "Fredericton", province: "NB" },
  "E2H": { km: 1358, city: "Fredericton", province: "NB" },
  "E2J": { km: 1360, city: "Fredericton", province: "NB" },
  "E2K": { km: 1362, city: "Fredericton", province: "NB" },
  "E2L": { km: 1365, city: "Saint John", province: "NB" },
  "E2M": { km: 1368, city: "Saint John", province: "NB" },
  "E2N": { km: 1370, city: "Saint John", province: "NB" },
  "E2P": { km: 1372, city: "Saint John", province: "NB" },
  "E2R": { km: 1375, city: "Saint John", province: "NB" },
  "E2S": { km: 1378, city: "Saint John", province: "NB" },
  "A1C": { km: 2200, city: "St. John's", province: "NL" },
  "A1A": { km: 2205, city: "St. John's", province: "NL" },
  "A1B": { km: 2208, city: "St. John's", province: "NL" },
  "A1E": { km: 2210, city: "St. John's", province: "NL" },
  "A1G": { km: 2212, city: "St. John's", province: "NL" },
  "A1H": { km: 2215, city: "St. John's", province: "NL" },
  "A1K": { km: 2218, city: "St. John's", province: "NL" },
  "A1N": { km: 2220, city: "St. John's", province: "NL" },
  "A1S": { km: 2222, city: "St. John's", province: "NL" },
  "A1V": { km: 2225, city: "St. John's", province: "NL" },
  "A1W": { km: 2228, city: "St. John's", province: "NL" },
  "A1X": { km: 2230, city: "St. John's", province: "NL" },
  "A1Y": { km: 2232, city: "St. John's", province: "NL" },
  "C1A": { km: 2000, city: "Charlottetown", province: "PE" },
  "C1B": { km: 2005, city: "Charlottetown", province: "PE" },
  "C1C": { km: 2008, city: "Charlottetown", province: "PE" },
  "C1E": { km: 2010, city: "Charlottetown", province: "PE" },
  
  // Territories
  "X0A": { km: 4500, city: "Nunavut", province: "NU" },
  "X0B": { km: 4800, city: "Nunavut", province: "NU" },
  "X0C": { km: 5000, city: "Nunavut", province: "NU" },
  "X0E": { km: 4200, city: "Northwest Territories", province: "NT" },
  "X0G": { km: 4400, city: "Northwest Territories", province: "NT" },
  "X1A": { km: 4300, city: "Yellowknife", province: "NT" },
  "Y1A": { km: 5200, city: "Whitehorse", province: "YT" },
  "Y0A": { km: 5500, city: "Yukon", province: "YT" },
  "Y0B": { km: 5800, city: "Yukon", province: "YT" }
}

export default function DeliveryPage() {
  const [postalCode, setPostalCode] = useState("")
  const [deliveryEstimate, setDeliveryEstimate] = useState<{
    distance: number
    cost: number
    city: string
    province: string
    deliveryDays: string
  } | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const calculateDelivery = () => {
    setIsCalculating(true)
    
    setTimeout(() => {
      // Extract FSA (first 3 characters) for lookup
      const fsa = postalCode.replaceAll(/\s/g, "").substring(0, 3).toUpperCase()
      
      // Find matching city or estimate distance
      const city = CITY_DISTANCES[fsa]?.city ?? "Your Area"
      const province = CITY_DISTANCES[fsa]?.province ?? ""

      let distance: number
      if (CITY_DISTANCES[fsa]) {
        distance = CITY_DISTANCES[fsa].km
      } else {
        // Estimate based on first letter (province indicator)
        const firstLetter = fsa[0]
        const provinceDistances: { [key: string]: number } = {
          "A": 2200, // NL - Newfoundland and Labrador
          "B": 1800, // NS - Nova Scotia
          "C": 2000, // PE - Prince Edward Island
          "E": 1400, // NB - New Brunswick
          "G": 800,  // QC - Eastern Quebec (Quebec City area)
          "H": 550,  // QC - Montreal area
          "J": 580,  // QC - Western Quebec (suburbs)
          "K": 350,  // ON - Eastern Ontario (Ottawa area)
          "L": 60,   // ON - Central Ontario (GTA)
          "M": 30,   // ON - Toronto
          "N": 200,  // ON - Southwestern Ontario
          "P": 500,  // ON - Northern Ontario
          "R": 2100, // MB - Manitoba
          "S": 2600, // SK - Saskatchewan
          "T": 3300, // AB - Alberta
          "V": 4400, // BC - British Columbia
          "X": 4500, // NT/NU - Northwest Territories/Nunavut
          "Y": 5200  // YT - Yukon
        }
        distance = provinceDistances[firstLetter] || 1000
      }

      // Calculate cost based on tier
      let cost = 0
      for (const tier of DELIVERY_TIERS) {
        if (distance >= tier.minKm && distance <= tier.maxKm) {
          if (tier.cost !== undefined) {
            cost = tier.cost
          } else if (tier.costPerKm) {
            // Cost is calculated on the full distance (multiply entire distance by tier rate)
            cost = Math.round(distance * tier.costPerKm)
          }
          break
        }
      }
      // If distance exceeds max, cap it and show message
      if (distance > MAX_DELIVERY_DISTANCE) {
        distance = MAX_DELIVERY_DISTANCE
        cost = Math.round(distance * 0.65)
      }

      // Estimate delivery days
      const deliveryDays = distance <= 300 ? "1-2 business days"
        : distance <= 1000 ? "3-5 business days"
        : distance <= 2500 ? "5-7 business days"
        : "7-10 business days"

      setDeliveryEstimate({ distance, cost, city, province, deliveryDays })
      setIsCalculating(false)
    }, 1500)
  }

  const formatPostalCode = (value: string) => {
    const cleaned = value.replaceAll(/\s/g, "").toUpperCase()
    if (cleaned.length <= 3) return cleaned
    return cleaned.substring(0, 3) + " " + cleaned.substring(3, 6)
  }

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Delivery", url: "/delivery" }]} />
      <Header />

      <main id="main-content" tabIndex={-1}>
        {/* Hero Section */}
        <section className="bg-primary py-16">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground">Nationwide Delivery</Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.01em] md:tracking-[-0.02em] text-primary-foreground mb-4">
              Nationwide Delivery
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              We deliver anywhere in Canada. Enter your postal code to calculate your delivery cost.
            </p>
          </div>
        </section>

        {/* Calculator Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Delivery Cost Calculator
                  </CardTitle>
                  <CardDescription>
                    Enter your postal code to see delivery cost and estimated arrival time
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter Postal Code (e.g., M5V 1K4)"
                        value={postalCode}
                        onChange={(e) => setPostalCode(formatPostalCode(e.target.value))}
                        maxLength={7}
                        className="text-lg uppercase"
                      />
                    </div>
                    <Button 
                      onClick={calculateDelivery}
                      disabled={postalCode.replaceAll(/\s/g, "").length < 3 || isCalculating}
                      size="lg"
                    >
                      {isCalculating ? "Calculating..." : "Calculate"}
                    </Button>
                  </div>

                  {/* Origin Info */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <MapPin className="h-4 w-4" />
                    <span>Shipping from: <strong>{DEALERSHIP_ADDRESS_FULL}</strong></span>
                  </div>

                  {/* Result */}
                  {deliveryEstimate && (
                    <div className="border rounded-lg p-6 bg-gradient-to-br from-primary/5 to-accent/5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Delivering to</p>
                          <p className="text-xl font-semibold">
                            {deliveryEstimate.city}{deliveryEstimate.province && `, ${deliveryEstimate.province}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Distance</p>
                          <p className="text-xl font-semibold">{deliveryEstimate.distance.toLocaleString()} km</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="bg-background p-4 rounded-lg text-center">
                          <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <p className="text-sm text-muted-foreground">Delivery Cost</p>
                          <p className="text-2xl font-bold text-primary">
                            {deliveryEstimate.cost === 0 ? (
                              <span className="text-green-600">FREE</span>
                            ) : (
                              `$${deliveryEstimate.cost.toLocaleString()}`
                            )}
                          </p>
                        </div>
                        <div className="bg-background p-4 rounded-lg text-center">
                          <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <p className="text-sm text-muted-foreground">Estimated Arrival</p>
                          <p className="text-2xl font-bold">{deliveryEstimate.deliveryDays}</p>
                        </div>
                      </div>

                      {deliveryEstimate.cost === 0 && (
                        <div className="mt-4 flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-semibold">You qualify for FREE delivery!</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Delivery Pricing</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Transparent pricing based on distance from our Richmond Hill, Ontario location
            </p>
            
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { range: "0 - 300 km", price: "FREE", examples: "Toronto, Hamilton, Barrie, Oshawa", highlight: true },
                  { range: "301 - 499 km", price: "$0.70/km", examples: "Ottawa, Kingston, London, Sudbury" },
                  { range: "500 - 999 km", price: "$0.75/km", examples: "Montreal, Quebec City, Thunder Bay" },
                  { range: "1,000 - 2,000 km", price: "$0.80/km", examples: "Halifax, Winnipeg, Moncton" },
                  { range: "2,001 - 5,000 km", price: "$0.65/km", examples: "Calgary, Edmonton, Regina, Vancouver" }
                ].map((tier) => (
                  <Card key={tier.range} className={tier.highlight ? "border-green-500 bg-green-50" : ""}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm text-muted-foreground">{tier.range}</span>
                        <Badge variant={tier.highlight ? "default" : "secondary"} className={tier.highlight ? "bg-green-600" : ""}>
                          {tier.price}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{tier.examples}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground mt-6">
                Long-distance deliveries (2,001+ km) qualify for our reduced bulk rate of $0.65/km
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Enclosed Transport</h3>
                <p className="text-muted-foreground text-sm">
                  All vehicles are transported in enclosed carriers for maximum protection.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Fully Insured</h3>
                <p className="text-muted-foreground text-sm">
                  Complete insurance coverage during transport for your peace of mind.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Scheduled Delivery</h3>
                <p className="text-muted-foreground text-sm">
                  Choose a delivery time that works for you. Evening and weekend options available.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
