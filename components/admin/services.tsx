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
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  Shield,
} from "lucide-react";

interface AdminService {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  status: "ACTIVE" | "INACTIVE" | "PENDING_APPROVAL" | "REJECTED";
  provider: {
    id: string;
    name: string;
    email: string;
    isVerified: boolean;
  };
  _count: {
    bookings: number;
  };
  createdAt: string;
}

function AdminServices() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [verifyingProviderId, setVerifyingProviderId] = useState<string | null>(
    null
  );
  const [unverifyingProviderId, setUnverifyingProviderId] = useState<
    string | null
  >(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/services?limit=100");
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

  useEffect(() => {
    fetchServices();
  }, []);

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.provider.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || service.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" || service.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    const variants: {
      [key: string]: "default" | "secondary" | "destructive" | "outline";
    } = {
      ACTIVE: "default",
      INACTIVE: "secondary",
      PENDING_APPROVAL: "outline",
      REJECTED: "destructive",
    };

    const colors = {
      ACTIVE: "text-green-700",
      INACTIVE: "text-gray-700",
      PENDING_APPROVAL: "text-yellow-700",
      REJECTED: "text-red-700",
    };

    return (
      <Badge
        variant={variants[status]}
        className={colors[status as keyof typeof colors]}
      >
        {status}
      </Badge>
    );
  };

  const getProviderStatusBadge = (isVerified: boolean) => {
    return isVerified ? (
      <Badge
        variant="outline"
        className="text-green-700 border-green-300 bg-green-50"
      >
        <Shield className="h-3 w-3 mr-1" />
        Verified
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="text-red-700 border-red-300 bg-red-50"
      >
        <Shield className="h-3 w-3 mr-1" />
        Unverified
      </Badge>
    );
  };

  const handleApproveService = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACTIVE" }),
      });

      if (response.ok) {
        // Refetch services to get updated list
        await fetchServices();
        alert("Service approved successfully!");
      } else {
        alert("Failed to approve service");
      }
    } catch (error) {
      console.error("Error approving service:", error);
      alert("Failed to approve service");
    }
  };

  const handleRejectService = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" }),
      });

      if (response.ok) {
        // Refetch services to get updated list
        await fetchServices();
        alert("Service rejected successfully!");
      } else {
        alert("Failed to reject service");
      }
    } catch (error) {
      console.error("Error rejecting service:", error);
      alert("Failed to reject service");
    }
  };

  const handleToggleStatus = async (
    serviceId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Refetch services to get updated list
        await fetchServices();
      } else {
        alert("Failed to update service status");
      }
    } catch (error) {
      console.error("Error updating service status:", error);
      alert("Failed to update service status");
    }
  };

  const handleVerifyProvider = async (
    providerId: string,
    providerName: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to verify ${providerName}? This action will mark the provider as verified and allow them to access all provider features.`
      )
    ) {
      return;
    }

    try {
      setVerifyingProviderId(providerId);
      const response = await fetch(`/api/users/${providerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: true }),
      });

      if (response.ok) {
        // Refetch services to get updated list
        await fetchServices();
        alert(`${providerName} has been verified successfully!`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Failed to verify provider");
      }
    } catch (error) {
      console.error("Error verifying provider:", error);
      alert("Failed to verify provider. Please try again.");
    } finally {
      setVerifyingProviderId(null);
    }
  };

  const handleUnverifyProvider = async (
    providerId: string,
    providerName: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to unverify ${providerName}? This action will remove their verified status and may limit their access to certain provider features.`
      )
    ) {
      return;
    }

    try {
      setUnverifyingProviderId(providerId);
      const response = await fetch(`/api/users/${providerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: false }),
      });

      if (response.ok) {
        // Refetch services to get updated list
        await fetchServices();
        alert(`${providerName} has been unverified successfully!`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Failed to unverify provider");
      }
    } catch (error) {
      console.error("Error unverifying provider:", error);
      alert("Failed to unverify provider. Please try again.");
    } finally {
      setUnverifyingProviderId(null);
    }
  };

  const categories = [
    "all",
    ...Array.from(new Set(services.map((s) => s.category))),
  ];

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
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
          <h2 className="text-2xl font-bold">Service Management</h2>
          <p className="text-gray-600">Moderate and manage platform services</p>
        </div>
      </div>

      {/* Filters */}
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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
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

      {/* Services Table */}
      <Card>
        <CardHeader>
          <CardTitle>Services ({filteredServices.length})</CardTitle>
          <CardDescription>
            Manage service listings and approvals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredServices.map((service) => (
              <div key={service.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium">{service.title}</h3>
                      {getStatusBadge(service.status)}
                      {getProviderStatusBadge(service.provider.isVerified)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {service.description}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Category: {service.category}</span>
                      <span>Price: Rp {service.price.toLocaleString()}</span>
                      <span>Bookings: {service._count.bookings}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Provider: {service.provider.name} (
                      {service.provider.email})
                    </div>
                    <div className="text-xs text-gray-400">
                      Created:{" "}
                      {new Date(service.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    {service.status === "PENDING_APPROVAL" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveService(service.id)}
                          className="text-green-700 hover:text-green-800 hover:bg-green-50 border-green-300"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectService(service.id)}
                          className="text-red-700 hover:text-red-800 hover:bg-red-50 border-red-300"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}

                    {!service.provider.isVerified ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleVerifyProvider(
                            service.provider.id,
                            service.provider.name
                          )
                        }
                        disabled={verifyingProviderId === service.provider.id}
                        className="text-blue-700 hover:text-blue-800 hover:bg-blue-50 border-blue-300"
                      >
                        {verifyingProviderId === service.provider.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-700 border-t-transparent mr-1" />
                        ) : (
                          <Shield className="h-4 w-4 mr-1" />
                        )}
                        Verify
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleUnverifyProvider(
                            service.provider.id,
                            service.provider.name
                          )
                        }
                        disabled={unverifyingProviderId === service.provider.id}
                        className="text-orange-700 hover:text-orange-800 hover:bg-orange-50 border-orange-300"
                      >
                        {unverifyingProviderId === service.provider.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-700 border-t-transparent mr-1" />
                        ) : (
                          <Shield className="h-4 w-4 mr-1" />
                        )}
                        Unverify
                      </Button>
                    )}

                    {service.status !== "PENDING_APPROVAL" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleToggleStatus(service.id, service.status)
                        }
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredServices.length === 0 && (
            <p className="text-center text-gray-500 py-8">No services found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminServices;
