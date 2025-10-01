"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
  Shield,
  MoreHorizontal,
  Package,
  Clock,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface AdminService {
  id: string;
  title: string;
  description: string;
  category: Category | string;
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

  const getCategoryName = (category: Category | string): string => {
    if (typeof category === "string") {
      return category;
    }
    return category?.name || "Unknown Category";
  };
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState<Category[]>([]);
  const [verifyingProviderId, setVerifyingProviderId] = useState<string | null>(
    null
  );
  const [unverifyingProviderId, setUnverifyingProviderId] = useState<
    string | null
  >(null);

  const kpiData = [
    {
      label: "Total Services",
      value: services.length,
      icon: Package,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      iconColor: "text-blue-600",
    },
    {
      label: "Active Services",
      value: services.filter((s) => s.status === "ACTIVE").length,
      icon: CheckCircle,
      color: "bg-emerald-500",
      bgColor: "bg-emerald-50",
      textColor: "text-emerald-700",
      iconColor: "text-emerald-600",
    },
    {
      label: "Pending Approval",
      value: services.filter((s) => s.status === "PENDING_APPROVAL").length,
      icon: Clock,
      color: "bg-amber-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-700",
      iconColor: "text-amber-600",
    },
  ];

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

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories?activeOnly=true");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      } else {
        console.error("Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.provider.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || service.status === statusFilter;
    const matchesCategory =
      categoryFilter === "all" ||
      getCategoryName(service.category) === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: {
        variant: "default" as const,
        className:
          "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200",
      },
      INACTIVE: {
        variant: "secondary" as const,
        className:
          "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200",
      },
      PENDING_APPROVAL: {
        variant: "outline" as const,
        className:
          "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100",
      },
      REJECTED: {
        variant: "destructive" as const,
        className: "bg-red-100 text-red-800 border-red-200 hover:bg-red-200",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig];

    return (
      <Badge variant={config.variant} className={config.className}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getProviderStatusBadge = (isVerified: boolean) => {
    return isVerified ? (
      <Badge
        variant="outline"
        className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
      >
        <Shield className="h-3 w-3 mr-1" />
        Verified
      </Badge>
    ) : (
      <Badge
        variant="outline"
        className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
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

  if (loading) {
    return (
      <div className="space-y-6">
        {/* KPI Cards Loading */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Table Loading */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="h-10 bg-muted rounded w-full md:w-80"></div>
              <div className="flex gap-4">
                <div className="h-10 bg-muted rounded w-32"></div>
                <div className="h-10 bg-muted rounded w-32"></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {kpiData.map((item, index) => (
          <Card key={index} className="relative overflow-hidden">
            <div
              className={`absolute top-0 right-0 w-20 h-20 ${item.color} opacity-10 rounded-bl-3xl`}
            ></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${item.textColor}`}>
                {item.label}
              </CardTitle>
              <div className={`p-2 rounded-lg ${item.bgColor}`}>
                <item.icon className={`h-4 w-4 ${item.iconColor}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${item.textColor}`}>
                {item.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Header & Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 focus:ring-2 focus:ring-primary/20 transition-all duration-150"
              />
            </div>
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                  <SelectItem value="PENDING_APPROVAL">
                    Pending Approval
                  </SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredServices.map((service, index) => (
                <TableRow
                  key={service.id}
                  className="hover:bg-muted/50 transition-colors duration-150"
                >
                  <TableCell className="py-4">
                    <div className="font-medium text-foreground">
                      {service.title}
                    </div>
                    <div className="text-sm text-muted-foreground truncate max-w-xs mt-1">
                      {service.description}
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="font-medium text-foreground">
                      {service.provider.name}
                    </div>
                    <div className="text-sm mt-1">
                      {getProviderStatusBadge(service.provider.isVerified)}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-foreground">
                    {getCategoryName(service.category)}
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="font-semibold text-foreground">
                      Rp {service.price.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    {getStatusBadge(service.status)}
                  </TableCell>
                  <TableCell className="py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-muted/80 transition-colors duration-150"
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {service.status === "PENDING_APPROVAL" && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleApproveService(service.id)}
                              className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" /> Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRejectService(service.id)}
                              className="text-red-700 hover:text-red-800 hover:bg-red-50"
                            >
                              <XCircle className="mr-2 h-4 w-4" /> Reject
                            </DropdownMenuItem>
                          </>
                        )}
                        {service.status !== "PENDING_APPROVAL" && (
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleStatus(service.id, service.status)
                            }
                            className="text-blue-700 hover:text-blue-800 hover:bg-blue-50"
                          >
                            {service.status === "ACTIVE"
                              ? "Deactivate"
                              : "Activate"}
                          </DropdownMenuItem>
                        )}
                        {!service.provider.isVerified ? (
                          <DropdownMenuItem
                            onClick={() =>
                              handleVerifyProvider(
                                service.provider.id,
                                service.provider.name
                              )
                            }
                            className="text-amber-700 hover:text-amber-800 hover:bg-amber-50"
                          >
                            <Shield className="mr-2 h-4 w-4" /> Verify Provider
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() =>
                              handleUnverifyProvider(
                                service.provider.id,
                                service.provider.name
                              )
                            }
                            className="text-slate-700 hover:text-slate-800 hover:bg-slate-50"
                          >
                            <Shield className="mr-2 h-4 w-4" /> Unverify
                            Provider
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-slate-700 hover:text-slate-800 hover:bg-slate-50">
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground text-lg font-medium">
                No services found
              </p>
              <p className="text-muted-foreground/70 text-sm mt-1">
                {searchQuery ||
                statusFilter !== "all" ||
                categoryFilter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "No services have been created yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminServices;
