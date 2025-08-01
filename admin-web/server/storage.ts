import { type User, type InsertUser, type Provider, type InsertProvider, type Service, type InsertService, type Booking, type InsertBooking, type Activity, type InsertActivity, type VerificationStatus } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Providers
  getProvider(id: string): Promise<Provider | undefined>;
  getProviders(): Promise<Provider[]>;
  getProvidersByStatus(status: VerificationStatus): Promise<Provider[]>;
  createProvider(provider: InsertProvider): Promise<Provider>;
  updateProvider(id: string, provider: Partial<Provider>): Promise<Provider | undefined>;
  
  // Services
  getServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  
  // Bookings
  getBookings(): Promise<Booking[]>;
  getBookingsByProvider(providerId: string): Promise<Booking[]>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, booking: Partial<Booking>): Promise<Booking | undefined>;
  
  // Activities
  getActivities(limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  
  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    activeUsers: number;
    approvedProviders: number;
    servicesBooked: number;
    totalRevenue: number;
    pendingVerifications: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private providers: Map<string, Provider>;
  private services: Map<string, Service>;
  private bookings: Map<string, Booking>;
  private activities: Map<string, Activity>;

  constructor() {
    this.users = new Map();
    this.providers = new Map();
    this.services = new Map();
    this.bookings = new Map();
    this.activities = new Map();
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample users
    const sampleUsers = [
      { id: randomUUID(), username: "admin", password: "admin123", email: "admin@limpeja.com", name: "Admin User", createdAt: new Date() },
      { id: randomUUID(), username: "user1", password: "pass123", email: "user1@example.com", name: "João Silva", createdAt: new Date() },
      { id: randomUUID(), username: "user2", password: "pass123", email: "user2@example.com", name: "Maria Santos", createdAt: new Date() },
    ];
    
    sampleUsers.forEach(user => this.users.set(user.id, user));

    // Sample providers
    const sampleProviders = [
      {
        id: randomUUID(),
        userId: sampleUsers[1].id,
        name: "Ana Costa",
        email: "ana.costa@example.com",
        phone: "+55 11 99999-9999",
        verificationStatus: "PENDING_MANUAL_REVIEW" as VerificationStatus,
        documentPhotoFrontUrl: "https://example.com/doc-front-1.jpg",
        documentPhotoBackUrl: "https://example.com/doc-back-1.jpg",
        selfieWithDocumentUrl: "https://example.com/selfie-1.jpg",
        rejectionReason: null,
        ocrResult: {
          name: "Ana Costa Silva",
          idNumber: "123.456.789-01",
          birthDate: "15/03/1985",
          confidence: 97.3
        },
        livenessResult: {
          status: "Passed",
          faceMatch: 94.7,
          livenessScore: 98.1,
          qualityScore: 89.5
        },
        fiveStarReviewCount: 23,
        monthlyBookingsCount: 45,
        totalEarnings: "2500.00",
        latitude: "-23.550520",
        longitude: "-46.633309",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        userId: sampleUsers[2].id,
        name: "Carlos Lima",
        email: "carlos.lima@example.com",
        phone: "+55 11 88888-8888",
        verificationStatus: "PENDING_DOCUMENTS_UPLOAD" as VerificationStatus,
        documentPhotoFrontUrl: null,
        documentPhotoBackUrl: null,
        selfieWithDocumentUrl: null,
        ocrResult: null,
        livenessResult: null,
        rejectionReason: null,
        fiveStarReviewCount: 15,
        monthlyBookingsCount: 32,
        totalEarnings: "1800.00",
        latitude: "-23.560520",
        longitude: "-46.643309",
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];
    
    sampleProviders.forEach(provider => this.providers.set(provider.id, provider));

    // Sample activities
    const sampleActivities = [
      {
        id: randomUUID(),
        type: "PROVIDER_REGISTRATION",
        description: "New provider registration: Ana Costa",
        entityId: sampleProviders[0].id,
        entityType: "PROVIDER",
        status: "PENDING",
        createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      },
      {
        id: randomUUID(),
        type: "BOOKING_COMPLETED",
        description: "Service booking completed: House Cleaning",
        entityId: null,
        entityType: "BOOKING",
        status: "COMPLETED",
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      },
      {
        id: randomUUID(),
        type: "DOCUMENT_VERIFICATION",
        description: "Document verification pending: Carlos Lima",
        entityId: sampleProviders[1].id,
        entityType: "PROVIDER",
        status: "PENDING",
        createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      },
      {
        id: randomUUID(),
        type: "PAYMENT_PROCESSED",
        description: "Payment processed: R$ 250.00 commission",
        entityId: null,
        entityType: "PAYMENT",
        status: "PROCESSED",
        createdAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      }
    ];
    
    sampleActivities.forEach(activity => this.activities.set(activity.id, activity));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }

  async getProvider(id: string): Promise<Provider | undefined> {
    return this.providers.get(id);
  }

  async getProviders(): Promise<Provider[]> {
    return Array.from(this.providers.values());
  }

  async getProvidersByStatus(status: VerificationStatus): Promise<Provider[]> {
    return Array.from(this.providers.values()).filter(provider => provider.verificationStatus === status);
  }

  async createProvider(insertProvider: InsertProvider): Promise<Provider> {
    const id = randomUUID();
    const provider: Provider = {
      ...insertProvider,
      id,
      phone: insertProvider.phone || null,
      verificationStatus: insertProvider.verificationStatus || "PENDING_DOCUMENTS_UPLOAD",
      documentPhotoFrontUrl: insertProvider.documentPhotoFrontUrl || null,
      documentPhotoBackUrl: insertProvider.documentPhotoBackUrl || null,
      selfieWithDocumentUrl: insertProvider.selfieWithDocumentUrl || null,
      ocrResult: insertProvider.ocrResult || null,
      livenessResult: insertProvider.livenessResult || null,
      rejectionReason: insertProvider.rejectionReason || null,
      fiveStarReviewCount: insertProvider.fiveStarReviewCount || 0,
      monthlyBookingsCount: insertProvider.monthlyBookingsCount || 0,
      totalEarnings: insertProvider.totalEarnings || "0.00",
      latitude: insertProvider.latitude || null,
      longitude: insertProvider.longitude || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.providers.set(id, provider);
    return provider;
  }

  async updateProvider(id: string, updateData: Partial<Provider>): Promise<Provider | undefined> {
    const provider = this.providers.get(id);
    if (!provider) return undefined;
    
    const updatedProvider = { ...provider, ...updateData, updatedAt: new Date() };
    this.providers.set(id, updatedProvider);
    return updatedProvider;
  }

  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = randomUUID();
    const service: Service = { 
      ...insertService, 
      id, 
      description: insertService.description || null,
      isActive: insertService.isActive !== undefined ? insertService.isActive : true,
      createdAt: new Date() 
    };
    this.services.set(id, service);
    return service;
  }

  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async getBookingsByProvider(providerId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.providerId === providerId);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = { 
      ...insertBooking, 
      id, 
      status: insertBooking.status || "PENDING",
      completedAt: null,
      createdAt: new Date() 
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBooking(id: string, updateData: Partial<Booking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;
    
    const updatedBooking = { ...booking, ...updateData };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  async getActivities(limit = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))
      .slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = { 
      ...insertActivity, 
      id, 
      status: insertActivity.status || null,
      entityId: insertActivity.entityId || null,
      entityType: insertActivity.entityType || null,
      createdAt: new Date() 
    };
    this.activities.set(id, activity);
    return activity;
  }

  async getDashboardMetrics() {
    const activeUsers = this.users.size;
    const approvedProviders = Array.from(this.providers.values()).filter(p => p.verificationStatus === "APPROVED").length;
    const servicesBooked = this.bookings.size;
    const totalRevenue = Array.from(this.bookings.values()).reduce((sum, booking) => {
      return sum + parseFloat(booking.commissionAmount || "0");
    }, 0);
    const pendingVerifications = Array.from(this.providers.values()).filter(p => 
      p.verificationStatus === "PENDING_DOCUMENTS_UPLOAD" || p.verificationStatus === "PENDING_MANUAL_REVIEW"
    ).length;

    return {
      activeUsers,
      approvedProviders,
      servicesBooked,
      totalRevenue,
      pendingVerifications,
    };
  }
}

export const storage = new MemStorage();
