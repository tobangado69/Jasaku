"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Star,
  Users,
  CheckCircle,
  ArrowRight,
  Play,
  Zap,
  Shield,
  Heart,
  Award,
  TrendingUp,
  Globe,
  MessageCircle,
  Calendar,
  DollarSign,
  Sparkles,
  ArrowDown,
  Quote,
  LogOut,
  User,
} from "lucide-react";
import { JSX, SVGProps } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function HomePage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const userRole = (user as any)?.role?.toLowerCase();
      switch (userRole) {
        case "admin":
          router.push("/admin");
          break;
        case "provider":
          router.push("/provider");
          break;
        case "seeker":
          router.push("/seeker");
          break;
        default:
          router.push("/seeker"); // Default fallback
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  const handleSignInClick = () => {
    if (isAuthenticated) {
      // If already authenticated, redirect to appropriate dashboard
      const userRole = (user as any)?.role?.toLowerCase();
      switch (userRole) {
        case "admin":
          router.push("/admin");
          break;
        case "provider":
          router.push("/provider");
          break;
        case "seeker":
          router.push("/seeker");
          break;
        default:
          router.push("/seeker");
      }
    } else {
      // If not authenticated, go to sign in page
      router.push("/auth/signin");
    }
  };

  const handleGetStartedClick = () => {
    if (isAuthenticated) {
      // If already authenticated, redirect to appropriate dashboard
      const userRole = (user as any)?.role?.toLowerCase();
      switch (userRole) {
        case "admin":
          router.push("/admin");
          break;
        case "provider":
          router.push("/provider");
          break;
        case "seeker":
          router.push("/seeker");
          break;
        default:
          router.push("/seeker");
      }
    } else {
      // If not authenticated, go to sign up page
      router.push("/auth/signup");
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Jasaku
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="#features"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              How it Works
            </Link>
            <Link
              href="#testimonials"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Reviews
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Pricing
            </Link>
          </nav>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>Welcome, {(user as any)?.name || "User"}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignInClick}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-300"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={handleSignInClick}>
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={handleGetStartedClick}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5"></div>
          <div className="container relative px-4 md:px-6 mx-auto">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center justify-center">
              <div className="space-y-8 text-center lg:text-left">
                <div className="space-y-4">
                  <div className="flex justify-center lg:justify-start">
                    <Badge
                      variant="secondary"
                      className="w-fit bg-blue-100 text-blue-700 border-blue-200"
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Trusted by 10,000+ users
                    </Badge>
                  </div>
                  <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                    {isAuthenticated
                      ? `Welcome back, ${(user as any)?.name || "User"}!`
                      : "Find the Perfect Service for Your Needs"}
                  </h1>
                  <p className="text-xl text-gray-600 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                    {isAuthenticated
                      ? "Ready to continue your journey? Access your dashboard to manage your services and bookings."
                      : "Connect with verified professionals and get high-quality services delivered right to your doorstep. From home cleaning to digital marketing, we've got you covered."}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                  <Button
                    size="lg"
                    onClick={handleGetStartedClick}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {isAuthenticated ? "Go to Dashboard" : "Start Your Journey"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Watch Demo
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-8 pt-8">
                  <div className="flex items-center space-x-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 border-2 border-white"
                        ></div>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      Join 10,000+ users
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">
                      4.9/5 rating
                    </span>
                  </div>
                </div>
              </div>

              <div className="relative flex justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl blur-3xl opacity-20"></div>
                <div className="relative bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 max-w-lg w-full">
                  <Carousel
                    className="w-full"
                    opts={{
                      loop: true,
                    }}
                  >
                    <CarouselContent>
                      <CarouselItem>
                        <div className="space-y-4">
                          <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
                            <div className="text-center">
                              <Users className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">
                                Professional Services
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-semibold">
                              Home Cleaning Service
                            </h3>
                            <p className="text-sm text-gray-600">
                              Professional cleaning for your home
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-green-600">
                                Rp 150,000
                              </span>
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm">4.9</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                      <CarouselItem>
                        <div className="space-y-4">
                          <div className="h-48 bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl flex items-center justify-center">
                            <div className="text-center">
                              <Zap className="h-12 w-12 text-green-600 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">
                                Digital Marketing
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-semibold">
                              Social Media Management
                            </h3>
                            <p className="text-sm text-gray-600">
                              Boost your online presence
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-green-600">
                                Rp 500,000
                              </span>
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm">4.8</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                      <CarouselItem>
                        <div className="space-y-4">
                          <div className="h-48 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
                            <div className="text-center">
                              <Heart className="h-12 w-12 text-purple-600 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">
                                Personal Care
                              </p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-semibold">Beauty & Wellness</h3>
                            <p className="text-sm text-gray-600">
                              Professional beauty services
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-bold text-green-600">
                                Rp 300,000
                              </span>
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm">4.9</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2" />
                    <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2" />
                  </Carousel>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white border-y">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  10,000+
                </div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  500+
                </div>
                <div className="text-sm text-gray-600">Verified Providers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  50+
                </div>
                <div className="text-sm text-gray-600">Service Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  99%
                </div>
                <div className="text-sm text-gray-600">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center text-center space-y-4 mb-16">
              <Badge
                variant="secondary"
                className="w-fit bg-blue-100 text-blue-700 border-blue-200"
              >
                <Award className="h-3 w-3 mr-1" />
                Why Choose Jasaku
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl max-w-4xl">
                Everything You Need to Get Started
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl">
                Our platform is designed to make finding and booking services as
                simple as possible, with features that put you in control.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">
                    Verified Providers
                  </h3>
                  <p className="text-gray-600">
                    All our service providers are thoroughly vetted and verified
                    to ensure you receive the highest quality service every
                    time.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                    <Zap className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">
                    Instant Booking
                  </h3>
                  <p className="text-gray-600">
                    Book services in just a few clicks. Our streamlined process
                    makes it easy to find and schedule exactly what you need.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">
                    Transparent Pricing
                  </h3>
                  <p className="text-gray-600">
                    No hidden fees or surprises. See exactly what you'll pay
                    upfront with our transparent pricing model.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                    <MessageCircle className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">24/7 Support</h3>
                  <p className="text-gray-600">
                    Our dedicated support team is always here to help you with
                    any questions or concerns you might have.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
                    <Calendar className="h-6 w-6 text-pink-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">
                    Flexible Scheduling
                  </h3>
                  <p className="text-gray-600">
                    Choose the time that works best for you. Our providers offer
                    flexible scheduling to fit your busy lifestyle.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                    <Globe className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">Wide Coverage</h3>
                  <p className="text-gray-600">
                    Services available across major cities. We're constantly
                    expanding to bring you more options wherever you are.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 lg:py-32 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center text-center space-y-4 mb-16">
              <Badge
                variant="secondary"
                className="w-fit bg-green-100 text-green-700 border-green-200"
              >
                <TrendingUp className="h-3 w-3 mr-1" />
                Simple Process
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl max-w-4xl">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl">
                Getting started is easy. Follow these simple steps to find and
                book the perfect service for your needs.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto text-white text-xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold">Browse Services</h3>
                <p className="text-gray-600">
                  Explore our wide range of services and find exactly what you
                  need. Filter by category, price, and location.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto text-white text-xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold">Choose Provider</h3>
                <p className="text-gray-600">
                  Compare providers, read reviews, and select the one that best
                  fits your requirements and budget.
                </p>
              </div>

              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto text-white text-xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-semibold">Book & Enjoy</h3>
                <p className="text-gray-600">
                  Book your service, make secure payment, and enjoy high-quality
                  service delivered right to your doorstep.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 lg:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center text-center space-y-4 mb-16">
              <Badge
                variant="secondary"
                className="w-fit bg-yellow-100 text-yellow-700 border-yellow-200"
              >
                <Star className="h-3 w-3 mr-1" />
                Customer Stories
              </Badge>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl max-w-4xl">
                What Our Customers Say
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl">
                Don't just take our word for it. Here's what our satisfied
                customers have to say about their experience with Jasaku.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-1 mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-blue-600 mb-4" />
                  <p className="text-gray-600 mb-6">
                    "Jasaku has completely transformed how I manage my home
                    services. The quality of providers is outstanding and the
                    booking process is so simple."
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                    <div>
                      <div className="font-semibold">Sarah Johnson</div>
                      <div className="text-sm text-gray-500">Homeowner</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-1 mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-green-600 mb-4" />
                  <p className="text-gray-600 mb-6">
                    "As a busy professional, I love how convenient Jasaku is. I
                    can book services on the go and trust that they'll be
                    delivered on time."
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-400 rounded-full"></div>
                    <div>
                      <div className="font-semibold">Michael Chen</div>
                      <div className="text-sm text-gray-500">
                        Business Owner
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center space-x-1 mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-purple-600 mb-4" />
                  <p className="text-gray-600 mb-6">
                    "The variety of services available is amazing. From cleaning
                    to digital marketing, I can find everything I need in one
                    place."
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"></div>
                    <div>
                      <div className="font-semibold">Emily Rodriguez</div>
                      <div className="text-sm text-gray-500">Entrepreneur</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-32 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center justify-center text-center space-y-8">
              <div className="space-y-4">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl text-white max-w-4xl">
                  {isAuthenticated
                    ? "Ready to Continue?"
                    : "Ready to Get Started?"}
                </h2>
                <p className="text-xl text-blue-100 max-w-3xl">
                  {isAuthenticated
                    ? "Access your dashboard to manage your services, bookings, and continue your journey with Jasaku."
                    : "Join thousands of satisfied customers who trust Jasaku for their service needs. Start your journey today and experience the difference."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={handleGetStartedClick}
                  className="bg-white text-blue-600 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {isAuthenticated ? "Go to Dashboard" : "Get Started Free"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push("/seeker/find-services")}
                  className="border-white/30 text-white bg-white/10 hover:bg-white hover:text-blue-600 hover:border-white transition-all duration-300"
                >
                  Browse Services
                </Button>
              </div>

              <div className="flex items-center justify-center space-x-8 pt-8">
                <div className="flex items-center space-x-2 text-blue-100">
                  <CheckCircle className="h-5 w-5" />
                  <span>No setup fees</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-100">
                  <CheckCircle className="h-5 w-5" />
                  <span>Cancel anytime</span>
                </div>
                <div className="flex items-center space-x-2 text-blue-100">
                  <CheckCircle className="h-5 w-5" />
                  <span>24/7 support</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Enhanced Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container px-4 md:px-6 py-16 mx-auto">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">Jasaku</span>
              </div>
              <p className="text-gray-400 max-w-sm">
                Connecting you with the best service providers to help you
                achieve your goals and make your life easier.
              </p>
              <div className="flex space-x-4">
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm">f</span>
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm">t</span>
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm">in</span>
                </div>
                <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm">ig</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Services</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Home Cleaning
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Digital Marketing
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Beauty & Wellness
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Home Repair
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Tutoring
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Press
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Safety
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; 2025 Jasaku. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <Globe className="h-4 w-4" />
                <span>English</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <DollarSign className="h-4 w-4" />
                <span>IDR</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
