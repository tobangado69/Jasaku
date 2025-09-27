# Jasaku - Service Marketplace Platform PRD

**Version:** 1.0  
**Date:** September 2024  
**Product Manager:** [Your Name]  
**Status:** Draft  

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Product Overview](#product-overview)
3. [Market Research & Context](#market-research--context)
4. [User Personas & Target Market](#user-personas--target-market)
5. [Core Features & Requirements](#core-features--requirements)
6. [Technical Architecture](#technical-architecture)
7. [User Journey & Flow](#user-journey--flow)
8. [Success Metrics](#success-metrics)
9. [Roadmap & Timeline](#roadmap--timeline)
10. [Risk Assessment](#risk-assessment)

---

## Executive Summary

**Jasaku** is a service marketplace platform that connects service providers with service seekers across Indonesia. The platform enables service providers to offer their services while allowing seekers to search, book, and pay for services according to their needs.

### Key Value Propositions
- **For Service Seekers:** Easy discovery, transparent pricing, secure payments, reliable service providers
- **For Service Providers:** Expanded market reach, streamlined booking management, secure payments, portfolio showcase
- **For Admin:** Comprehensive platform monitoring, user management, transaction oversight

---

## Product Overview

### Vision Statement
To become Indonesia's leading trusted service marketplace that empowers local service providers and simplifies service discovery for consumers.

### Mission Statement
Connecting skilled service providers with customers who need their services through a transparent, secure, and efficient digital platform.

### Product Goals
1. Create a trusted environment for service transactions
2. Increase income opportunities for service providers
3. Provide convenient access to quality services for consumers
4. Build a sustainable ecosystem with proper dispute resolution

---

## Market Research & Context

### Market Landscape
Based on research, Indonesia's service marketplace industry shows significant growth potential:

**Market Drivers:**
- **Digital Adoption:** Indonesia has 285+ million people with mobile-first behavior
- **Urbanization:** Rapid urban growth increases demand for on-demand services
- **Economic Factors:** Growing middle class and dual-income households
- **Time Constraints:** Busy professionals seeking convenient service solutions

**Competitive Analysis:**
- **Gojek:** Established super-app with services like GoMassage, GoClean
- **ServisHero:** Focused on home services across Southeast Asia (discontinued in Malaysia, focusing on Singapore/Thailand)
- **UrbanClap (Urban Company):** International player with strong presence in India
- **Local Players:** Various smaller local service providers and booking platforms

**Market Opportunity:**
- The global handyman services market is projected to grow at 10.2% CAGR
- Indonesia's service sector growing with digitalization trends
- Gap exists for comprehensive local service marketplace

---

## User Personas & Target Market

### Primary Personas

#### 1. Service Seeker (Primary Target)
**Demographics:**
- Age: 25-45 years
- Location: Urban areas (Jakarta, Surabaya, Bandung, Medan)
- Income: Middle to upper-middle class
- Tech Savvy: Comfortable with mobile apps and digital payments

**Characteristics:**
- Busy professionals or working parents
- Value convenience and time-saving
- Willing to pay premium for reliable service
- Prefer transparent pricing and reviews

**Pain Points:**
- Difficulty finding reliable service providers
- Lack of transparent pricing
- Concerns about service quality and trustworthiness
- Limited availability during convenient times

#### 2. Service Provider (Primary Target)
**Demographics:**
- Age: 22-50 years
- Skills: Various technical and service skills
- Experience: Independent contractors, small business owners
- Tech Adoption: Basic to intermediate digital literacy

**Characteristics:**
- Seeking additional income opportunities
- Want to expand customer base
- Need professional platform to showcase services
- Desire secure payment processing

**Pain Points:**
- Limited marketing reach
- Difficulty managing bookings and schedules
- Payment collection challenges
- Building trust with new customers

#### 3. Platform Administrator
**Responsibilities:**
- User management and verification
- Transaction monitoring
- Dispute resolution
- Platform analytics and reporting

---

## Core Features & Requirements

### 1. Authentication & Profile Management

#### Service Seeker Features:
- **Registration/Login:**
  - Email/phone registration
  - Social media login (Google, Facebook)
  - OTP verification
- **Profile Management:**
  - Personal information
  - Address management
  - Preferences and saved services
  - Payment method management

#### Service Provider Features:
- **Enhanced Registration:**
  - Business verification process
  - Skill/service category selection
  - Document upload (ID, certificates)
- **Professional Profile:**
  - Service portfolio with photos
  - Pricing structure
  - Availability calendar
  - Skills and certifications
  - Customer reviews and ratings

### 2. Service Management

#### For Service Providers:
- **Service Catalog:**
  - Service category selection (Cleaning, Repair, Installation, etc.)
  - Service description and pricing
  - Photo/video portfolio
  - Package deals and promotions
- **Availability Management:**
  - Calendar integration
  - Working hours configuration
  - Holiday/unavailable periods
- **Order Management:**
  - New order notifications
  - Accept/decline requests
  - Order status updates

### 3. Search & Discovery

#### Search Functionality:
- **Location-based search** (GPS integration)
- **Category filtering:**
  - Home Services (Cleaning, Repair, Installation)
  - Personal Services (Beauty, Fitness, Tutoring)
  - Professional Services (Photography, IT Support)
- **Advanced Filters:**
  - Price range
  - Rating and reviews
  - Availability
  - Distance from location
- **Search Results:**
  - Provider profiles with ratings
  - Pricing information
  - Availability indicator
  - Portfolio preview

### 4. Booking & Order Management

#### Booking Flow:
1. **Service Selection:**
   - Choose service category
   - Select specific service provider
   - Review pricing and availability
2. **Appointment Scheduling:**
   - Calendar view with available slots
   - Date and time selection
   - Recurring service options
3. **Order Confirmation:**
   - Service details summary
   - Cost breakdown
   - Contact information
   - Special instructions field

#### Order Statuses:
- Pending (awaiting provider confirmation)
- Confirmed (provider accepted)
- In Progress (service being performed)
- Completed (service finished, pending payment)
- Cancelled
- Disputed

### 5. Communication System

#### In-App Chat:
- **Real-time messaging** between provider and seeker
- **Media sharing** (photos, documents)
- **Order-specific conversations**
- **Automated notifications** for booking updates
- **Multi-language support** (Bahasa Indonesia, English)

### 6. Payment System

#### Payment Methods (Indonesian Focus):
- **E-wallets:**
  - GoPay
  - OVO
  - DANA
  - ShopeePay
  - LinkAja
- **Bank Transfer:**
  - Virtual Accounts (BCA, BNI, Mandiri, BRI)
  - Internet Banking
- **QRIS Integration** (universal QR payment)
- **Credit/Debit Cards** (Visa, Mastercard)

#### Escrow System:
- **Payment Hold:** Funds held until service completion
- **Service Verification:** Payment released after customer confirmation
- **Dispute Protection:** Automatic refund if service not delivered
- **Provider Protection:** Guaranteed payment for completed services

#### Pricing Structure:
- **Transaction Fee:** 3-5% per completed transaction
- **Payment Processing:** 2.9% + Rp 2,000 per transaction
- **Premium Listings:** Monthly subscription for featured placement

### 7. Review & Rating System

#### Rating Features:
- **5-star rating system**
- **Written reviews with photos**
- **Service-specific ratings** (punctuality, quality, communication)
- **Provider response to reviews**
- **Verified purchase badges**
- **Helpful votes on reviews**

#### Trust & Safety:
- **Identity verification** for all users
- **Background checks** for service providers
- **Insurance options** for high-value services
- **Dispute resolution** process

### 8. Dashboard & Analytics

#### Service Seeker Dashboard:
- Order history and status
- Saved providers and favorites
- Payment history
- Reviews written
- Support tickets

#### Service Provider Dashboard:
- **Business Analytics:**
  - Revenue tracking
  - Order statistics
  - Customer acquisition metrics
- **Order Management:**
  - Incoming requests
  - Schedule calendar
  - Customer communication
- **Financial Management:**
  - Earnings summary
  - Payment history
  - Tax reporting tools

#### Admin Dashboard:
- **User Management:**
  - User verification and approval
  - Account status management
  - Ban/suspend functionality
- **Transaction Monitoring:**
  - Payment tracking
  - Dispute management
  - Refund processing
- **Platform Analytics:**
  - Growth metrics
  - Revenue reporting
  - User engagement stats
- **Content Management:**
  - Service category management
  - Promotional content
  - System announcements

---

## Technical Architecture

### Frontend Stack
- **Framework:** Next.js 15 (latest stable)
- **Styling:** Tailwind CSS v4.0 (stable version expected Jan 2025)
- **UI Components:** shadcn/ui
- **State Management:** React Context + Zustand
- **Type Safety:** TypeScript

### Backend Stack
- **API:** Next.js 15 API routes (Edge Runtime)
- **Database:** PostgreSQL 17 (latest stable)
- **ORM:** Prisma
- **Authentication:** NextAuth.js
- **File Storage:** AWS S3 / Google Cloud Storage
- **Real-time:** Socket.io for chat functionality

### Infrastructure
- **Deployment:** Vercel / AWS / Google Cloud
- **Database Management:** pgAdmin
- **Reverse Proxy:** Traefik
- **CDN:** CloudFlare
- **Monitoring:** Sentry, Analytics

### Third-Party Integrations
- **Payment Gateway:** Midtrans / Xendit
- **Maps:** Google Maps API
- **SMS/Email:** Twilio / SendGrid
- **Push Notifications:** Firebase Cloud Messaging
- **Image Processing:** Sharp / Cloudinary

---

## User Journey & Flow

### Service Seeker Journey

#### 1. Discovery Phase
1. **Landing Page** → Browse categories or search
2. **Search Results** → Filter and compare providers
3. **Provider Profile** → Review portfolio, ratings, pricing

#### 2. Booking Phase
4. **Service Selection** → Choose specific service
5. **Schedule** → Pick date/time from available slots
6. **Payment** → Secure payment through escrow
7. **Confirmation** → Receive booking confirmation

#### 3. Service Phase
8. **Communication** → Chat with provider if needed
9. **Service Delivery** → Provider completes service
10. **Completion** → Confirm satisfaction and release payment
11. **Review** → Rate and review the service

### Service Provider Journey

#### 1. Onboarding Phase
1. **Registration** → Create account and verify identity
2. **Profile Setup** → Add services, portfolio, pricing
3. **Verification** → Admin approval process

#### 2. Business Operations
4. **Service Management** → Update availability, pricing
5. **Order Reception** → Receive and accept/decline orders
6. **Service Delivery** → Complete service for customer
7. **Payment Collection** → Receive payment after completion

---

## Success Metrics

### Primary KPIs
- **Monthly Active Users (MAU)**
- **Transaction Volume (GMV)**
- **Provider Acquisition Rate**
- **Customer Retention Rate**
- **Average Order Value (AOV)**

### Secondary KPIs
- **Search-to-Book Conversion Rate**
- **Provider Response Time**
- **Customer Satisfaction Score (CSAT)**
- **Payment Success Rate**
- **Dispute Resolution Time**

### Business Metrics
- **Revenue per Transaction**
- **Customer Acquisition Cost (CAC)**
- **Lifetime Value (LTV)**
- **Provider Utilization Rate**
- **Platform Fee Revenue**

---

## Roadmap & Timeline

### Phase 1: MVP (Months 1-4)
**Core Features:**
- User registration and authentication
- Basic search and booking
- Payment integration (QRIS, major e-wallets)
- Simple chat system
- Basic admin panel

**Target:** 100 service providers, 1,000 customers

### Phase 2: Enhanced Features (Months 5-8)
**Additional Features:**
- Advanced search filters
- Review and rating system
- Provider dashboard analytics
- Multi-language support
- Mobile app (React Native)

**Target:** 500 service providers, 5,000 customers

### Phase 3: Scale & Optimize (Months 9-12)
**Growth Features:**
- Subscription services
- Premium provider listings
- Advanced dispute resolution
- Marketing automation
- API for partners

**Target:** 2,000 service providers, 20,000 customers

### Phase 4: Market Expansion (Year 2)
**Expansion Features:**
- Multiple city support
- Corporate services B2B
- Service provider financing
- Advanced analytics
- Third-party integrations

---

## Risk Assessment

### Technical Risks
- **Payment Integration Complexity**
  - *Mitigation:* Use established payment gateways (Midtrans/Xendit)
- **Scalability Challenges**
  - *Mitigation:* Cloud-native architecture with auto-scaling
- **Data Security**
  - *Mitigation:* Implement SOC 2 compliance, encryption

### Business Risks
- **Competition from Established Players**
  - *Mitigation:* Focus on specific niches and superior UX
- **Provider Acquisition Difficulty**
  - *Mitigation:* Competitive commission rates, marketing support
- **Trust and Safety Issues**
  - *Mitigation:* Robust verification, insurance options, dispute resolution

### Market Risks
- **Economic Downturn Impact**
  - *Mitigation:* Focus on essential services, flexible pricing
- **Regulatory Changes**
  - *Mitigation:* Legal compliance team, government relations
- **Technology Adoption Barriers**
  - *Mitigation:* Simple UX, offline support options

---

## Next Steps

1. **Stakeholder Alignment** - Review and approve PRD
2. **Technical Architecture Review** - Validate tech stack decisions
3. **Design System Creation** - Develop UI/UX guidelines
4. **Development Team Assembly** - Recruit frontend/backend developers
5. **Partnership Negotiations** - Payment gateway, insurance providers
6. **MVP Development Start** - Begin Phase 1 implementation

---

**Document Status:** Draft v1.0  
**Next Review Date:** [Date]  
**Approved By:** [Stakeholder Names]