import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import http from "node:http";
import https from "node:https";
import { storage } from "./storage";
import { z } from "zod";

const normalizeUrl = (value: string | undefined, fallback: string) => {
  if (!value) return fallback;
  return value.trim().replace(/\/$/, "");
};

const createReverseProxy =
  (baseUrl: string) =>
  (req: Request, res: Response) => {
    const targetUrl = new URL(req.url ?? "", baseUrl);
    const client = targetUrl.protocol === "https:" ? https : http;
    const proxyReq = client.request(
      {
        hostname: targetUrl.hostname,
        port: targetUrl.port
          ? Number(targetUrl.port)
          : targetUrl.protocol === "https:"
          ? 443
          : 80,
        path: `${targetUrl.pathname}${targetUrl.search}`,
        method: req.method,
        headers: {
          ...req.headers,
          host: targetUrl.host,
        },
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
        proxyRes.pipe(res);
      },
    );

    proxyReq.on("error", (error) => {
      console.error("[API PROXY] error forwarding request", error);
      if (!res.headersSent) {
        res.writeHead(502, { "Content-Type": "text/plain" });
      }
      res.end("Bad gateway");
    });

    req.on("aborted", () => proxyReq.destroy());
    req.pipe(proxyReq);
  };

export async function registerRoutes(app: Express): Promise<Server> {
  const backendUrl = normalizeUrl(
    process.env.ADMIN_BACKEND_URL ?? process.env.VITE_APP_API_URL,
    "limpeja-backend-production-5956.up.railway.app",
  );
  const useMockApi = process.env.ADMIN_USE_MOCK_API === "1";

  if (!useMockApi) {
    app.use("/api", createReverseProxy(backendUrl));
  } else {
    // Dashboard metrics
    app.get("/api/dashboard/metrics", async (req, res) => {
      try {
        const metrics = await storage.getDashboardMetrics();
        res.json(metrics);
      } catch (error) {
        console.error("[Mock API] Failed to fetch dashboard metrics", error);
        res.status(500).json({ message: "Failed to fetch dashboard metrics" });
      }
    });

    // Get all providers
    app.get("/api/providers", async (req, res) => {
      try {
        const providers = await storage.getProviders();
        res.json(providers);
      } catch (error) {
        console.error("[Mock API] Failed to fetch providers", error);
        res.status(500).json({ message: "Failed to fetch providers" });
      }
    });

    // Get providers by verification status
    app.get("/api/providers/status/:status", async (req, res) => {
      try {
        const { status } = req.params;
        const validStatuses = [
          "PENDING_DOCUMENTS_UPLOAD",
          "PENDING_MANUAL_REVIEW",
          "APPROVED",
          "REJECTED",
          "BLOCKED",
        ];

        if (!validStatuses.includes(status)) {
          return res.status(400).json({ message: "Invalid verification status" });
        }

        const providers = await storage.getProvidersByStatus(status as any);
        res.json(providers);
      } catch (error) {
        console.error("[Mock API] Failed to fetch providers by status", error);
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
        console.error("[Mock API] Failed to fetch provider", error);
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
          verificationStatus: z
            .enum(["PENDING_DOCUMENTS_UPLOAD", "PENDING_MANUAL_REVIEW", "APPROVED", "REJECTED", "BLOCKED"])
            .optional(),
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
        console.error("[Mock API] Failed to update provider", error);
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
        console.error("[Mock API] Failed to fetch activities", error);
        res.status(500).json({ message: "Failed to fetch activities" });
      }
    });

    // Get verification queue (pending providers)
    app.get("/api/verification-queue", async (req, res) => {
      try {
        const pendingDocuments = await storage.getProvidersByStatus("PENDING_DOCUMENTS_UPLOAD");
        const pendingReview = await storage.getProvidersByStatus("PENDING_MANUAL_REVIEW");

        const queue = [...pendingDocuments, ...pendingReview].sort((a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
        );

        res.json(queue);
      } catch (error) {
        console.error("[Mock API] Failed to fetch verification queue", error);
        res.status(500).json({ message: "Failed to fetch verification queue" });
      }
    });
  }

  const httpServer = createServer(app);
  return httpServer;
}
