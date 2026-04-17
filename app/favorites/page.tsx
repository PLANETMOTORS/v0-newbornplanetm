"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Trash2, Share2, Bell, Car, Clock, TrendingDown } from "lucide-react"
import Link from "next/link"
import { useFavorites } from "@/contexts/favorites-context"

export default function FavoritesPage() {
  const { favorites, removeFavorite } = useFavorites()
  const [notifications, setNotifications] = useState<Record<string, boolean>>({})

  const toggleNotification = (id: string) => {
    setNotifications(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-8 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
                Saved Vehicles
              </h1>
              <p className="text-muted-foreground">
                {favorites.length} vehicle{favorites.length !== 1 ? 's' : ''} saved
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/inventory">
                <Car className="w-4 h-4 mr-2" />
                Browse More
              </Link>
            </Button>
          </div>

          {favorites.length === 0 ? (
            <Card className="p-12 text-center">
              <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No saved vehicles</h2>
              <p className="text-muted-foreground mb-6">
                Start browsing our inventory and save vehicles you&apos;re interested in.
              </p>
              <Button asChild>
                <Link href="/inventory">Browse Inventory</Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {favorites.map((vehicle) => (
                <Card key={vehicle.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Image */}
                      <div className="relative md:w-72 aspect-video md:aspect-auto bg-muted">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                          <Car className="w-12 h-12 text-primary/50" />
                        </div>
                        {vehicle.originalPrice && vehicle.price < vehicle.originalPrice && (
                          <Badge className="absolute top-3 left-3 bg-green-500">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            Price Drop
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div>
                            <Link href={`/vehicles/${vehicle.id}`} className="hover:text-primary transition-colors">
                              <h3 className="text-xl font-semibold">
                                {vehicle.year} {vehicle.make} {vehicle.model}
                              </h3>
                            </Link>
                            <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                              <span>{vehicle.mileage.toLocaleString()} km</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Saved {new Date(vehicle.savedAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              ${vehicle.price.toLocaleString()}
                            </div>
                            {vehicle.originalPrice && vehicle.price < vehicle.originalPrice && (
                              <div className="text-sm text-muted-foreground line-through">
                                ${vehicle.originalPrice.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t">
                          <Button asChild>
                            <Link href={`/vehicles/${vehicle.id}`}>View Details</Link>
                          </Button>
                          <Button variant="outline" asChild>
                            <Link href="/schedule">Schedule Test Drive</Link>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => toggleNotification(vehicle.id)}
                            className={notifications[vehicle.id] ? "text-primary" : ""}
                          >
                            <Bell className={`w-4 h-4 ${notifications[vehicle.id] ? "fill-current" : ""}`} />
                          </Button>
                          <Button variant="outline" size="icon">
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => removeFavorite(vehicle.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Tips */}
          {favorites.length > 0 && (
            <Card className="mt-8 p-6 bg-primary/5 border-primary/20">
              <h3 className="font-semibold mb-2">Pro Tips</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>Click the bell icon to get notified of price drops</li>
                <li>Compare up to 3 vehicles side-by-side in the Compare tool</li>
                <li>Schedule a test drive early - popular vehicles sell fast!</li>
              </ul>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
