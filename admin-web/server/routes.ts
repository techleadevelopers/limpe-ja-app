import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProviderSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard metrics
  app.get("/api/dashboard/metrics", async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Get all providers
  app.get("/api/providers", async (req, res) => {
    try {
      const providers = await storage.getProviders();
      res.json(providers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch providers" });
    }
  });

  // Get providers by verification status
  app.get("/api/providers/status/:status", async (req, res) => {
    try {
      const { status } = req.params;
      const validStatuses = ["PENDING_DOCUMENTS_UPLOAD", "PENDING_MANUAL_REVIEW", "APPROVED", "REJECTED", "BLOCKED"];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid verification status" });
      }
      
      const providers = await storage.getProvidersByStatus(status as any);
      res.json(providers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch providers by status" });
    }
  });

  // Get single provider
  app.get("/api/providers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const provider = await storage.getProvider(id);
      
      if (!provider) {
        return res.status(404).json({ message: "Provider not found" });
      }
      
      res.json(provider);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch provider" });
    }
  });

  // Update provider (for approval/rejection/blocking)
  app.patch("/api/providers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Validate the update data
      const updateSchema = z.object({
        verificationStatus: z.enum(["PENDING_DOCUMENTS_UPLOAD", "PENDING_MANUAL_REVIEW", "APPROVED", "REJECTED", "BLOCKED"]).optional(),
        rejectionReason: z.string().optional(),
      });
      
      const validatedData = updateSchema.parse(updateData);
      const updatedProvider = await storage.updateProvider(id, validatedData);
      
      if (!updatedProvider) {
        return res.status(404).json({ message: "Provider not found" });
      }

      // Create activity log
      let activityDescription = "";
      if (validatedData.verificationStatus === "APPROVED") {
        activityDescription = `Provider approved: ${updatedProvider.name}`;
      } else if (validatedData.verificationStatus === "REJECTED") {
        activityDescription = `Provider rejected: ${updatedProvider.name}`;
      } else if (validatedData.verificationStatus === "BLOCKED") {
        activityDescription = `Provider blocked: ${updatedProvider.name}`;
      }
      
      if (activityDescription) {
        await storage.createActivity({
          type: "PROVIDER_STATUS_CHANGE",
          description: activityDescription,
          entityId: id,
          entityType: "PROVIDER",
          status: validatedData.verificationStatus,
        });
      }
      
      res.json(updatedProvider);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update provider" });
    }
  });

  // Get recent activities
  app.get("/api/activities", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await storage.getActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  // Get verification queue (pending providers)
  app.get("/api/verification-queue", async (req, res) => {
    try {
      const pendingDocuments = await storage.getProvidersByStatus("PENDING_DOCUMENTS_UPLOAD");
      const pendingReview = await storage.getProvidersByStatus("PENDING_MANUAL_REVIEW");
      
      const queue = [...pendingDocuments, ...pendingReview].sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
      
      res.json(queue);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch verification queue" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
