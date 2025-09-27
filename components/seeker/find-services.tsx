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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, MapPin, Clock, Calendar, Search, Filter } from "lucide-react";

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  price: number;
  duration?: number;
  location?: string;
  images?: string[];
  status: "ACTIVE" | "INACTIVE" | "PENDING_APPROVAL";
  provider: {
    id: string;
    name: string;
    profileImage?: string;
    location?: string;
    isVerified?: boolean;
    rating?: number;
    reviews: Array<{
      id: string;
      rating: number;
      comment?: string;
      createdAt: string;
    }>;
  };
  _count: {
    bookings: number;
    favoritedBy: number;
  };
  createdAt: string;
  updatedAt: string;
}

export function SeekerFindServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedServiceForBooking, setSelectedServiceForBooking] =
    useState<Service | null>(null);
  const [bookingForm, setBookingForm] = useState({
    scheduledDate: "",
    scheduledTime: "",
    notes: "",
    location: "",
  });
  const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services?limit=50");
        if (response.ok) {
          const data = await response.json();
          setServices(data);
        } else {
          console.error("Failed to fetch services");
          setServices([]);
        }
      } catch (error) {
        console.error("Error fetching services:", error);
        setServices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || service.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case "price":
        return a.price - b.price;
      case "rating":
        return (b.provider.rating || 0) - (a.provider.rating || 0);
      case "popular":
        return b._count.bookings - a._count.bookings;
      default:
        return 0;
    }
  });

  const handleBookService = (service: Service) => {
    setSelectedServiceForBooking(service);
    setBookingForm({
      scheduledDate: "",
      scheduledTime: "",
      notes: "",
      location: "",
    });
    setIsBookingDialogOpen(true);
  };

  const handleBookingSubmit = async () => {
    if (!selectedServiceForBooking) return;

    try {
      setIsBookingSubmitting(true);
      const scheduledDateTime = `${bookingForm.scheduledDate}T${bookingForm.scheduledTime}:00.000Z`;
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: selectedServiceForBooking.id,
          scheduledAt: scheduledDateTime,
          notes: bookingForm.notes,
          location: bookingForm.location,
        }),
      });

      if (response.ok) {
        setIsBookingDialogOpen(false);
        setSelectedServiceForBooking(null);
        alert("Booking request sent successfully!");
      } else {
        const error = await response.json();
        alert(`Booking failed: ${error.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Booking failed. Please try again.");
    } finally {
      setIsBookingSubmitting(false);
    }
  };

  const categories = [
    "all",
    ...Array.from(new Set(services.map((s) => s.category))),
  ];

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
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
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search services..."
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
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Services Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedServices.map((service) => (
          <Card key={service.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <CardDescription>{service.category}</CardDescription>
                </div>
                <Badge
                  variant={
                    service.status === "ACTIVE" ? "default" : "secondary"
                  }
                >
                  {service.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {service.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {service.location || "Online"}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {service.duration ? `${service.duration}min` : "Flexible"}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1 text-yellow-500" />
                    <span className="font-medium">
                      {service.provider.rating || "N/A"}
                    </span>
                    <span className="text-gray-500 ml-1">
                      ({service.provider.reviews.length} reviews)
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      Rp {service.price.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">per service</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>by {service.provider.name}</span>
                  {service.provider.isVerified && (
                    <Badge variant="outline" className="text-xs">
                      Verified
                    </Badge>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={() => handleBookService(service)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedServices.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">
              No services found matching your criteria.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Service</DialogTitle>
            <DialogDescription>
              Schedule your service with{" "}
              {selectedServiceForBooking?.provider.name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={bookingForm.scheduledDate}
                onChange={(e) =>
                  setBookingForm((prev) => ({
                    ...prev,
                    scheduledDate: e.target.value,
                  }))
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="time" className="text-right">
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={bookingForm.scheduledTime}
                onChange={(e) =>
                  setBookingForm((prev) => ({
                    ...prev,
                    scheduledTime: e.target.value,
                  }))
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location" className="text-right">
                Location
              </Label>
              <Input
                id="location"
                placeholder="Service location"
                value={bookingForm.location}
                onChange={(e) =>
                  setBookingForm((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Additional notes for the provider"
                value={bookingForm.notes}
                onChange={(e) =>
                  setBookingForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBookingDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBookingSubmit}
              disabled={isBookingSubmitting}
            >
              {isBookingSubmitting ? "Booking..." : "Confirm Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
