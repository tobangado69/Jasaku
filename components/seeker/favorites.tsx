"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Star, MapPin, Heart, Calendar, Search, Filter, X } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  profileImage?: string;
  location?: string;
  isVerified?: boolean;
  rating?: number;
  reviewCount: number;
  services: Array<{
    id: string;
    title: string;
    category: string;
    price: number;
  }>;
  createdAt: string;
}

export function SeekerFavorites() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await fetch("/api/favorites");
        if (response.ok) {
          const favoriteProviders = await response.json();
          // Transform the data to match the expected interface
          const transformedProviders = favoriteProviders.map(
            (provider: any) => ({
              id: provider.id,
              name: provider.name,
              profileImage: provider.profileImage,
              location: provider.location,
              isVerified: provider.isVerified,
              rating: provider.averageRating,
              reviewCount: provider.totalReviews,
              services: provider.favoriteServices.map((service: any) => ({
                id: service.id,
                title: service.title,
                category: "General", // You might want to add category to the API response
                price: service.price,
              })),
              createdAt: new Date().toISOString(), // You might want to add this to the API response
            })
          );
          setProviders(transformedProviders);
        } else {
          console.error("Failed to fetch favorites");
          setProviders([]);
        }
      } catch (error) {
        console.error("Error fetching favorites:", error);
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  const filteredProviders = providers.filter((provider) => {
    const matchesSearch =
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.services.some((s) =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesCategory =
      categoryFilter === "all" ||
      provider.services.some((s) => s.category === categoryFilter);
    return matchesSearch && matchesCategory;
  });

  const categories = [
    "all",
    ...Array.from(
      new Set(providers.flatMap((p) => p.services.map((s) => s.category)))
    ),
  ];

  const handleRemoveFavorite = async (providerId: string) => {
    try {
      const response = await fetch(`/api/favorites?providerId=${providerId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        // Remove the provider from the local state
        setProviders((prev) =>
          prev.filter((provider) => provider.id !== providerId)
        );
        alert("Provider removed from favorites!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Failed to remove favorite");
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
      alert("Failed to remove favorite. Please try again.");
    }
  };

  const handleBookService = (
    provider: Provider,
    service: Provider["services"][0]
  ) => {
    // In a real app, this would redirect to booking page
    alert(`Booking ${service.title} from ${provider.name}`);
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Favorite Providers</h2>
          <p className="text-gray-600">Your saved service providers</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search providers or services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Providers Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 w-full">
        {filteredProviders.map((provider) => (
          <Card key={provider.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {provider.profileImage ? (
                      <img
                        src={provider.profileImage}
                        alt={provider.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="text-gray-500 font-medium">
                        {provider.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    )}
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center">
                      {provider.name}
                      {provider.isVerified && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Verified
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {provider.location}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveFavorite(provider.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1 text-yellow-500" />
                  <span className="font-medium">{provider.rating}</span>
                  <span className="text-gray-500 ml-1">
                    ({provider.reviewCount} reviews)
                  </span>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Services:</h4>
                  {provider.services.slice(0, 2).map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{service.title}</span>
                      <span className="font-medium">
                        Rp {service.price.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {provider.services.length > 2 && (
                    <p className="text-xs text-gray-500">
                      +{provider.services.length - 2} more services
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() =>
                      handleBookService(provider, provider.services[0])
                    }
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Service
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProviders.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Heart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No favorite providers found.</p>
            <p className="text-sm text-gray-400 mt-2">
              Start browsing services to add favorites!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
