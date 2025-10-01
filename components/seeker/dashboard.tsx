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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Calendar,
  DollarSign,
  Heart,
  Star,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

interface SeekerDashboardStats {
  totalBookings: number;
  completedBookings: number;
  totalSpent: number;
  favoriteServices: number;
}

interface Service {
  id: string;
  title: string;
  category: { name: string };
  price: number;
  images: string[];
  provider: {
    name: string;
    profileImage?: string;
  };
  _count: {
    reviews: number;
  };
  averageRating: number;
}

export function SeekerDashboard() {
  const [stats, setStats] = useState<SeekerDashboardStats | null>(null);
  const [recommendedServices, setRecommendedServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, servicesRes] = await Promise.all([
          fetch("/api/dashboard?type=seeker"),
          fetch("/api/services?limit=10&sort=rating"),
        ]);

        if (statsRes.ok && servicesRes.ok) {
          const statsData = await statsRes.json();
          const servicesData = await servicesRes.json();
          setStats(statsData.stats);
          setRecommendedServices(servicesData);
        } else {
          console.error("Failed to fetch seeker dashboard data");
        }
      } catch (error) {
        console.error("Error fetching seeker dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-32"></div>
          </CardHeader>
          <CardContent>
            <div className="h-40 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const kpiData = [
    {
      label: "Total Bookings",
      value: stats?.totalBookings || 0,
      icon: Calendar,
    },
    {
      label: "Total Spent",
      value: `Rp ${(stats?.totalSpent || 0).toLocaleString()}`,
      icon: DollarSign,
    },
    {
      label: "Favorite Services",
      value: stats?.favoriteServices || 0,
      icon: Heart,
    },
    {
      label: "Completed",
      value: stats?.completedBookings || 0,
      icon: CheckCircle,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((item, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
              <item.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Recommended for You</CardTitle>
            <CardDescription>
              Top-rated services you might be interested in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent>
                {recommendedServices.map((service) => (
                  <CarouselItem
                    key={service.id}
                    className="md:basis-1/2 lg:basis-1/3"
                  >
                    <Card>
                      <CardContent className="p-4">
                        <img
                          src={
                            (service.images && service.images[0]) ||
                            "/placeholder.svg"
                          }
                          alt={service.title}
                          className="w-full h-40 object-cover rounded-lg mb-4"
                        />
                        <h3 className="font-semibold">{service.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {service.category.name}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="secondary">
                            Rp {service.price.toLocaleString()}
                          </Badge>
                          <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 mr-1" />
                            <span>
                              {service.averageRating.toFixed(1)} (
                              {service._count.reviews} reviews)
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
