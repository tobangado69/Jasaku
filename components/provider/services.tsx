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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryId?: string; // For editing with new category system
  subcategory?: string;
  price: number;
  duration?: number;
  status: "ACTIVE" | "INACTIVE" | "PENDING_APPROVAL";
  images?: string[];
  location?: string;
  _count: {
    bookings: number;
  };
  createdAt: string;
  updatedAt: string;
}

export function ProviderServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for creating new service
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    subcategory: "",
    price: "",
    duration: "",
    location: "",
  });

  // State for categories and custom category creation
  const [categories, setCategories] = useState<any[]>([]);
  const [isCreatingCustomCategory, setIsCreatingCustomCategory] =
    useState(false);
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [customCategoryDescription, setCustomCategoryDescription] =
    useState("");

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    subcategory: "",
    price: "",
    duration: "",
    location: "",
  });
  const [isEditingCustomCategory, setIsEditingCustomCategory] = useState(false);
  const [editCustomCategoryName, setEditCustomCategoryName] = useState("");
  const [editCustomCategoryDescription, setEditCustomCategoryDescription] =
    useState("");

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services/provider");
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

  // Fetch categories
  useEffect(() => {
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

    fetchCategories();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: {
      [key: string]: "default" | "secondary" | "destructive" | "outline";
    } = {
      ACTIVE: "default",
      INACTIVE: "secondary",
      PENDING_APPROVAL: "outline",
    };

    const colors = {
      ACTIVE: "text-green-700",
      INACTIVE: "text-gray-700",
      PENDING_APPROVAL: "text-yellow-700",
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
        setServices((prev) =>
          prev.map((service) =>
            service.id === serviceId
              ? { ...service, status: newStatus as any }
              : service
          )
        );
      } else {
        alert("Failed to update service status");
      }
    } catch (error) {
      console.error("Error updating service status:", error);
      alert("Failed to update service status");
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setServices((prev) =>
          prev.filter((service) => service.id !== serviceId)
        );
        alert("Service deleted successfully!");
      } else {
        alert("Failed to delete service");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
      alert("Failed to delete service");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      categoryId: "",
      subcategory: "",
      price: "",
      duration: "",
      location: "",
    });
    setIsCreatingCustomCategory(false);
    setCustomCategoryName("");
    setCustomCategoryDescription("");
  };

  const resetEditForm = () => {
    setEditFormData({
      title: "",
      description: "",
      categoryId: "",
      subcategory: "",
      price: "",
      duration: "",
      location: "",
    });
    setIsEditingCustomCategory(false);
    setEditCustomCategoryName("");
    setEditCustomCategoryDescription("");
  };

  const handleEditInputChange = (field: string, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateService = async () => {
    // Validate required fields
    if (!formData.title.trim()) {
      alert("Please enter a service title");
      return;
    }
    if (!formData.description.trim()) {
      alert("Please enter a service description");
      return;
    }
    if (!formData.categoryId || formData.categoryId === "create-new") {
      alert("Please select a valid category");
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      alert("Please enter a valid price");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          categoryId: formData.categoryId,
          subcategory: formData.subcategory || undefined,
          price: parseFloat(formData.price),
          duration: formData.duration ? parseInt(formData.duration) : undefined,
          location: formData.location || undefined,
        }),
      });

      if (response.ok) {
        const newService = await response.json();
        setServices((prev) => [newService, ...prev]);
        setIsCreateDialogOpen(false);
        resetForm();
        alert(
          "Service created successfully! It will be reviewed before going live."
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || "Failed to create service");
      }
    } catch (error) {
      console.error("Error creating service:", error);
      alert("Failed to create service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCustomCategory = async () => {
    if (!customCategoryName.trim()) {
      alert("Please enter a category name");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/categories/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: customCategoryName.trim(),
          description: customCategoryDescription.trim() || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setCategories((prev) => [...prev, result.category]);
        setFormData((prev) => ({ ...prev, categoryId: result.category.id }));
        setIsCreatingCustomCategory(false);
        setCustomCategoryName("");
        setCustomCategoryDescription("");
        alert(
          `Custom category "${result.category.name}" created successfully! It has been selected for your service.`
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.existingCategory) {
          // Category already exists, use it
          setFormData((prev) => ({
            ...prev,
            categoryId: errorData.existingCategory.id,
          }));
          setIsCreatingCustomCategory(false);
          setCustomCategoryName("");
          setCustomCategoryDescription("");
          alert(
            `Category "${errorData.existingCategory.name}" already exists and has been selected.`
          );
        } else {
          alert(errorData.error || "Failed to create custom category");
        }
      }
    } catch (error) {
      console.error("Error creating custom category:", error);
      alert("Failed to create custom category. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditService = async () => {
    if (!editingService) return;

    // Validate required fields
    if (!editFormData.title.trim()) {
      alert("Please enter a service title");
      return;
    }
    if (!editFormData.description.trim()) {
      alert("Please enter a service description");
      return;
    }
    if (!editFormData.categoryId || editFormData.categoryId === "create-new") {
      alert("Please select a valid category");
      return;
    }
    if (!editFormData.price || parseFloat(editFormData.price) <= 0) {
      alert("Please enter a valid price");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/services/${editingService.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editFormData.title.trim(),
          description: editFormData.description.trim(),
          categoryId: editFormData.categoryId,
          subcategory: editFormData.subcategory || undefined,
          price: parseFloat(editFormData.price),
          duration: editFormData.duration
            ? parseInt(editFormData.duration)
            : undefined,
          location: editFormData.location || undefined,
        }),
      });

      if (response.ok) {
        const updatedService = await response.json();
        setServices((prev) =>
          prev.map((service) =>
            service.id === editingService.id
              ? {
                  ...service,
                  ...updatedService,
                  category: updatedService.category?.name || service.category,
                }
              : service
          )
        );
        setIsEditDialogOpen(false);
        setEditingService(null);
        resetEditForm();
        alert("Service updated successfully!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Update service error:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
          requestData: {
            categoryId: editFormData.categoryId,
            title: editFormData.title,
            description: editFormData.description,
          },
        });

        const errorMessage =
          errorData.error ||
          (response.status === 400
            ? "Invalid data provided. Please check your inputs."
            : response.status === 404
            ? "Service not found."
            : response.status === 403
            ? "You don't have permission to edit this service."
            : "Failed to update service. Please try again.");

        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error updating service:", error);
      alert("Failed to update service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCustomCategory = async () => {
    if (!editCustomCategoryName.trim()) {
      alert("Please enter a category name");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/categories/custom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editCustomCategoryName.trim(),
          description: editCustomCategoryDescription.trim() || undefined,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setCategories((prev) => [...prev, result.category]);
        setEditFormData((prev) => ({
          ...prev,
          categoryId: result.category.id,
        }));
        setIsEditingCustomCategory(false);
        setEditCustomCategoryName("");
        setEditCustomCategoryDescription("");
        alert(
          `Custom category "${result.category.name}" created successfully! It has been selected for your service.`
        );
      } else {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.existingCategory) {
          setEditFormData((prev) => ({
            ...prev,
            categoryId: errorData.existingCategory.id,
          }));
          setIsEditingCustomCategory(false);
          setEditCustomCategoryName("");
          setEditCustomCategoryDescription("");
          alert(
            `Category "${errorData.existingCategory.name}" already exists and has been selected.`
          );
        } else {
          alert(errorData.error || "Failed to create custom category");
        }
      }
    } catch (error) {
      console.error("Error creating custom category:", error);
      alert("Failed to create custom category. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (service: Service) => {
    // Find the category ID for this service
    const category = categories.find((cat) => cat.name === service.category);

    // If no category found by name, try to find by categoryId or use empty string
    let categoryId = "";
    if (category) {
      categoryId = category.id;
    } else if (service.categoryId) {
      // Check if the categoryId exists in our categories list
      const categoryById = categories.find(
        (cat) => cat.id === service.categoryId
      );
      categoryId = categoryById ? categoryById.id : "";
    }

    setEditFormData({
      title: service.title,
      description: service.description,
      categoryId: categoryId,
      subcategory: service.subcategory || "",
      price: service.price.toString(),
      duration: service.duration?.toString() || "",
      location: service.location || "",
    });
    setEditingService(service);
    setIsEditDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          <h2 className="text-2xl font-bold">My Services</h2>
          <p className="text-gray-600">Manage your service offerings</p>
        </div>
        <Dialog
          open={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Service</DialogTitle>
              <DialogDescription>
                Add a new service to your offerings. Your service will be
                reviewed before going live.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Title *
                </Label>
                <Input
                  id="title"
                  placeholder="Service title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">
                  Category *
                </Label>
                <div className="col-span-3 space-y-2">
                  <Select
                    value={
                      formData.categoryId === "create-new"
                        ? ""
                        : formData.categoryId
                    }
                    onValueChange={(value) => {
                      if (value === "create-new") {
                        setIsCreatingCustomCategory(true);
                        handleInputChange("categoryId", "create-new");
                      } else {
                        setIsCreatingCustomCategory(false);
                        handleInputChange("categoryId", value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="create-new"
                        className="text-blue-600 font-medium"
                      >
                        + Create New Category
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {isCreatingCustomCategory && (
                    <div className="space-y-2 p-3 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="customCategoryName" className="text-sm">
                          New Category Name *
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsCreatingCustomCategory(false)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Cancel
                        </Button>
                      </div>
                      <Input
                        id="customCategoryName"
                        placeholder="Enter category name"
                        value={customCategoryName}
                        onChange={(e) => setCustomCategoryName(e.target.value)}
                      />
                      <Input
                        placeholder="Optional description"
                        value={customCategoryDescription}
                        onChange={(e) =>
                          setCustomCategoryDescription(e.target.value)
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateCustomCategory}
                        disabled={!customCategoryName.trim() || isSubmitting}
                      >
                        {isSubmitting ? "Creating..." : "Create Category"}
                      </Button>
                    </div>
                  )}

                  {formData.categoryId === "create-new" &&
                    !isCreatingCustomCategory && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCreatingCustomCategory(true)}
                      >
                        Create New Category
                      </Button>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="subcategory" className="text-right">
                  Subcategory
                </Label>
                <Input
                  id="subcategory"
                  placeholder="Optional subcategory"
                  value={formData.subcategory}
                  onChange={(e) =>
                    handleInputChange("subcategory", e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Price (Rp) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">
                  Duration (hours)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="Optional"
                  value={formData.duration}
                  onChange={(e) =>
                    handleInputChange("duration", e.target.value)
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
                  value={formData.location}
                  onChange={(e) =>
                    handleInputChange("location", e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Detailed service description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  className="col-span-3"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateService} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Service"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Service Dialog */}
        <Dialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
              setEditingService(null);
              resetEditForm();
            }
          }}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
              <DialogDescription>
                Update your service details. Changes will be reviewed before
                going live.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-title" className="text-right">
                  Title *
                </Label>
                <Input
                  id="edit-title"
                  placeholder="Service title"
                  value={editFormData.title}
                  onChange={(e) =>
                    handleEditInputChange("title", e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-category" className="text-right">
                  Category *
                </Label>
                <div className="col-span-3 space-y-2">
                  <Select
                    value={
                      editFormData.categoryId === "create-new"
                        ? ""
                        : editFormData.categoryId
                    }
                    onValueChange={(value) => {
                      if (value === "create-new") {
                        setIsEditingCustomCategory(true);
                        handleEditInputChange("categoryId", "create-new");
                      } else {
                        setIsEditingCustomCategory(false);
                        handleEditInputChange("categoryId", value);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                      <SelectItem
                        value="create-new"
                        className="text-blue-600 font-medium"
                      >
                        + Create New Category
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {isEditingCustomCategory && (
                    <div className="space-y-2 p-3 border rounded-lg bg-gray-50">
                      <div className="flex items-center gap-2">
                        <Label
                          htmlFor="editCustomCategoryName"
                          className="text-sm"
                        >
                          New Category Name *
                        </Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsEditingCustomCategory(false)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Cancel
                        </Button>
                      </div>
                      <Input
                        id="editCustomCategoryName"
                        placeholder="Enter category name"
                        value={editCustomCategoryName}
                        onChange={(e) =>
                          setEditCustomCategoryName(e.target.value)
                        }
                      />
                      <Input
                        placeholder="Optional description"
                        value={editCustomCategoryDescription}
                        onChange={(e) =>
                          setEditCustomCategoryDescription(e.target.value)
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleEditCustomCategory}
                        disabled={
                          !editCustomCategoryName.trim() || isSubmitting
                        }
                      >
                        {isSubmitting ? "Creating..." : "Create Category"}
                      </Button>
                    </div>
                  )}

                  {editFormData.categoryId === "create-new" &&
                    !isEditingCustomCategory && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingCustomCategory(true)}
                      >
                        Create New Category
                      </Button>
                    )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-subcategory" className="text-right">
                  Subcategory
                </Label>
                <Input
                  id="edit-subcategory"
                  placeholder="Optional subcategory"
                  value={editFormData.subcategory}
                  onChange={(e) =>
                    handleEditInputChange("subcategory", e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-price" className="text-right">
                  Price (Rp) *
                </Label>
                <Input
                  id="edit-price"
                  type="number"
                  placeholder="0"
                  value={editFormData.price}
                  onChange={(e) =>
                    handleEditInputChange("price", e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-duration" className="text-right">
                  Duration (hours)
                </Label>
                <Input
                  id="edit-duration"
                  type="number"
                  placeholder="Optional"
                  value={editFormData.duration}
                  onChange={(e) =>
                    handleEditInputChange("duration", e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-location" className="text-right">
                  Location
                </Label>
                <Input
                  id="edit-location"
                  placeholder="Service location"
                  value={editFormData.location}
                  onChange={(e) =>
                    handleEditInputChange("location", e.target.value)
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-description" className="text-right">
                  Description *
                </Label>
                <Textarea
                  id="edit-description"
                  placeholder="Detailed service description"
                  value={editFormData.description}
                  onChange={(e) =>
                    handleEditInputChange("description", e.target.value)
                  }
                  className="col-span-3"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button onClick={handleEditService} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Service"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <CardDescription>{service.category}</CardDescription>
                </div>
                {getStatusBadge(service.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {service.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">
                    Rp {service.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-gray-500">
                    {service._count.bookings} bookings
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openEditDialog(service)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleToggleStatus(service.id, service.status)
                    }
                  >
                    {service.status === "ACTIVE" ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteService(service.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">
              No services found. Create your first service!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
