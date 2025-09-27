// User Types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "SEEKER" | "PROVIDER" | "ADMIN";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  createdAt: string;
  profileImage?: string;
  location?: string;
  isVerified?: boolean;
  lastLogin?: string;
}

// Service Types
export interface Service {
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

// Booking Types
export interface Booking {
  id: string;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  scheduledAt: string;
  completedAt?: string;
  notes?: string;
  totalAmount: number;
  service: {
    id: string;
    title: string;
    category: string;
    images?: string[];
  };
  provider: {
    id: string;
    name: string;
    profileImage?: string;
    phone?: string;
    location?: string;
  };
  customer: {
    id: string;
    name: string;
    profileImage?: string;
    phone?: string;
  };
  payment?: {
    id: string;
    status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "REFUNDED";
    amount: number;
    paymentMethod: string;
    transactionId?: string;
  };
  review?: {
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Payment Types
export interface Payment {
  id: string;
  amount: number;
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "REFUNDED";
  paymentMethod: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
  booking: {
    id: string;
    service: {
      id: string;
      title: string;
      provider: {
        id: string;
        name: string;
        email: string;
        avatar?: string;
      };
    };
    customer: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
    scheduledDate: string;
    status: string;
  };
}

// Dashboard Stats Types
export interface DashboardStats {
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  totalEarnings: number;
  monthlyEarnings: number;
  averageRating: number;
  totalReviews: number;
  activeServices: number;
  totalServices: number;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Form Types
export interface ServiceFormData {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  price: string;
  duration: string;
  location: string;
  images: string[];
}

export interface BookingFormData {
  scheduledDate: string;
  scheduledTime: string;
  notes: string;
  location: string;
}

export interface UserFormData {
  name: string;
  email: string;
  phone: string;
  role: "SEEKER" | "PROVIDER" | "ADMIN";
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
}

export interface RefundFormData {
  reason: string;
  amount: string;
}

// Filter Types
export interface FilterOptions {
  searchQuery: string;
  category: string;
  status: string;
  dateRange?: {
    start: string;
    end: string;
  };
  priceRange?: {
    min: number;
    max: number;
  };
}

// Navigation Types
export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: number;
}

export interface SidebarConfig {
  provider: NavItem[];
  seeker: NavItem[];
  admin: NavItem[];
}