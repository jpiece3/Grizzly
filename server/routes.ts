import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { format } from "date-fns";
import type { RouteStop, InsertLocation, InsertRoute } from "@shared/schema";
import { randomUUID } from "crypto";
import { z } from "zod";
import {
  insertUserSchema,
  insertWorkLocationSchema,
} from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage() });

// Validation schemas
const clockInSchema = z.object({
  driverId: z.string().min(1, "Driver ID is required"),
  lat: z.number("Latitude must be a number"),
  lng: z.number("Longitude must be a number"),
  locationName: z.string().optional(),
});

const clockOutSchema = z.object({
  driverId: z.string().min(1, "Driver ID is required"),
  entryId: z.string().min(1, "Entry ID is required"),
  lat: z.number("Latitude must be a number"),
  lng: z.number("Longitude must be a number"),
  locationName: z.string().optional(),
});

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============ AUTH ROUTES ============
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // ============ USER ROUTES ============
  app.get("/api/users", async (_req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      return res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      return res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const validation = insertUserSchema.safeParse(req.body);
      
      if (!validation.success) {
        const errors = validation.error.flatten();
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.fieldErrors,
        });
      }

      const { name, phone, username, password, role } = validation.data;

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        name,
        phone: phone || null,
        username,
        password,
        role: role || "driver",
      });

      const { password: _, ...userWithoutPassword } = user;
      return res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Create user error:", error);
      return res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteUser(req.params.id);
      return res.status(204).send();
    } catch (error) {
      console.error("Delete user error:", error);
      return res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // ============ LOCATIONS (Delivery Stops) ROUTES ============
  app.get("/api/locations", async (_req: Request, res: Response) => {
    try {
      const locations = await storage.getAllLocations();
      return res.json(locations);
    } catch (error) {
      console.error("Get locations error:", error);
      return res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  app.post("/api/locations/upload", upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const csvContent = req.file.buffer.toString("utf-8");
      
      let records: any[];
      try {
        records = parse(csvContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });
      } catch (parseError) {
        return res.status(400).json({ message: "Invalid CSV format" });
      }

      if (records.length === 0) {
        return res.status(400).json({ message: "CSV file is empty" });
      }

      // Validate required columns
      const firstRow = records[0];
      if (!firstRow.address && !firstRow.Address) {
        return res.status(400).json({ message: "CSV must have 'address' column" });
      }
      if (!firstRow.customer_name && !firstRow.customerName && !firstRow["Customer Name"]) {
        return res.status(400).json({ message: "CSV must have 'customer_name' column" });
      }

      // Parse and create locations
      const locationsToCreate: InsertLocation[] = records.map((row: any) => ({
        address: row.address || row.Address || "",
        customerName: row.customer_name || row.customerName || row["Customer Name"] || "",
        serviceType: row.service_type || row.serviceType || row["Service Type"] || null,
        notes: row.notes || row.Notes || null,
        lat: row.lat ? parseFloat(row.lat) : null,
        lng: row.lng ? parseFloat(row.lng) : null,
        uploadDate: format(new Date(), "yyyy-MM-dd"),
      }));

      // Clear existing locations and add new ones
      await storage.clearLocations();
      await storage.clearRoutes();
      const createdLocations = await storage.createLocations(locationsToCreate);

      return res.status(201).json({
        message: `Uploaded ${createdLocations.length} locations`,
        count: createdLocations.length,
      });
    } catch (error) {
      console.error("Upload locations error:", error);
      return res.status(500).json({ message: "Failed to upload locations" });
    }
  });

  // ============ ROUTES ROUTES ============
  app.get("/api/routes", async (req: Request, res: Response) => {
    try {
      const { driverId } = req.query;
      
      if (driverId) {
        const routes = await storage.getRoutesByDriver(driverId as string);
        return res.json(routes);
      }

      const routes = await storage.getAllRoutes();
      return res.json(routes);
    } catch (error) {
      console.error("Get routes error:", error);
      return res.status(500).json({ message: "Failed to fetch routes" });
    }
  });

  app.post("/api/routes/generate", async (req: Request, res: Response) => {
    try {
      const { driverCount } = req.body;

      if (!driverCount || driverCount < 1 || driverCount > 10) {
        return res.status(400).json({ message: "Driver count must be between 1 and 10" });
      }

      // Get all locations
      const locations = await storage.getAllLocations();
      
      if (locations.length === 0) {
        return res.status(400).json({ message: "No locations to generate routes from" });
      }

      // Clear existing routes
      await storage.clearRoutes();

      // Divide locations among drivers
      const stopsPerDriver = Math.ceil(locations.length / driverCount);
      const createdRoutes: any[] = [];

      for (let i = 0; i < driverCount; i++) {
        const startIndex = i * stopsPerDriver;
        const endIndex = Math.min(startIndex + stopsPerDriver, locations.length);
        
        if (startIndex >= locations.length) break;

        const routeLocations = locations.slice(startIndex, endIndex);
        
        // Create route stops from locations
        const stops: RouteStop[] = routeLocations.map((loc, index) => ({
          id: randomUUID(),
          locationId: loc.id,
          address: loc.address,
          customerName: loc.customerName,
          serviceType: loc.serviceType || undefined,
          notes: loc.notes || undefined,
          lat: loc.lat || undefined,
          lng: loc.lng || undefined,
          sequence: index + 1,
        }));

        // Generate Google Maps URL with all stops
        const mapsUrl = generateGoogleMapsUrl(stops);

        // Estimate time (rough estimate: 10 min per stop + 5 min travel between)
        const estimatedTime = stops.length * 15;

        const route = await storage.createRoute({
          date: format(new Date(), "yyyy-MM-dd"),
          stopsJson: stops,
          routeLink: mapsUrl,
          totalDistance: null,
          estimatedTime,
          status: "draft",
          stopCount: stops.length,
          driverId: null,
          driverName: null,
        });

        createdRoutes.push(route);
      }

      return res.status(201).json(createdRoutes);
    } catch (error) {
      console.error("Generate routes error:", error);
      return res.status(500).json({ message: "Failed to generate routes" });
    }
  });

  app.patch("/api/routes/:id/assign", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { driverId, driverName } = req.body;

      const route = await storage.updateRoute(id, {
        driverId,
        driverName,
        status: "assigned",
      });

      return res.json(route);
    } catch (error) {
      console.error("Assign route error:", error);
      return res.status(500).json({ message: "Failed to assign route" });
    }
  });

  app.patch("/api/routes/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const route = await storage.updateRoute(id, req.body);
      return res.json(route);
    } catch (error) {
      console.error("Update route error:", error);
      return res.status(500).json({ message: "Failed to update route" });
    }
  });

  app.post("/api/routes/publish", async (_req: Request, res: Response) => {
    try {
      const routes = await storage.getAllRoutes();
      
      for (const route of routes) {
        if (route.status === "assigned") {
          await storage.updateRoute(route.id, { status: "published" });
        }
      }

      return res.json({ message: "Routes published successfully" });
    } catch (error) {
      console.error("Publish routes error:", error);
      return res.status(500).json({ message: "Failed to publish routes" });
    }
  });

  // ============ TIME ENTRIES ROUTES ============
  app.get("/api/time-entries", async (_req: Request, res: Response) => {
    try {
      const entries = await storage.getAllTimeEntries();
      return res.json(entries);
    } catch (error) {
      console.error("Get time entries error:", error);
      return res.status(500).json({ message: "Failed to fetch time entries" });
    }
  });

  app.get("/api/time-entries/today", async (req: Request, res: Response) => {
    try {
      const { driverId } = req.query;
      
      if (!driverId) {
        return res.status(400).json({ message: "Driver ID is required" });
      }

      const today = format(new Date(), "yyyy-MM-dd");
      const entry = await storage.getTodayEntryByDriver(driverId as string, today);

      if (!entry) {
        return res.status(404).json({ message: "No entry found for today" });
      }

      return res.json(entry);
    } catch (error) {
      console.error("Get today entry error:", error);
      return res.status(500).json({ message: "Failed to fetch today's entry" });
    }
  });

  app.post("/api/time-entries/clock-in", async (req: Request, res: Response) => {
    try {
      const validation = clockInSchema.safeParse(req.body);
      
      if (!validation.success) {
        const errors = validation.error.flatten();
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.fieldErrors,
        });
      }

      const { driverId, lat, lng, locationName } = validation.data;

      // Query all work locations and verify geofence
      const workLocations = await storage.getAllWorkLocations();
      
      if (workLocations.length > 0) {
        let isWithinGeofence = false;
        let closestDistance = Infinity;
        let closestLocationRadius = 0;

        for (const workLocation of workLocations) {
          const distance = calculateHaversineDistance(lat, lng, workLocation.lat, workLocation.lng);
          
          if (distance <= workLocation.radiusMeters) {
            isWithinGeofence = true;
            break;
          }
          
          // Track the closest location for error message
          if (distance < closestDistance) {
            closestDistance = distance;
            closestLocationRadius = workLocation.radiusMeters;
          }
        }

        if (!isWithinGeofence) {
          const distanceMeters = Math.round(closestDistance);
          const radiusMeters = closestLocationRadius;
          return res.status(400).json({
            message: `Clock-in not allowed. You are ${distanceMeters}m away from the nearest work location (required: within ${radiusMeters}m)`,
            distance: distanceMeters,
            requiredRadius: radiusMeters,
          });
        }
      }

      const today = format(new Date(), "yyyy-MM-dd");
      
      // Check if already clocked in today
      const existingEntry = await storage.getTodayEntryByDriver(driverId, today);
      if (existingEntry) {
        return res.status(409).json({ message: "Already clocked in today" });
      }

      const entry = await storage.createTimeEntry({
        driverId,
        date: today,
        clockInTime: new Date(),
        clockInLat: lat,
        clockInLng: lng,
        clockInLocationName: locationName || null,
        clockOutTime: null,
        clockOutLat: null,
        clockOutLng: null,
        clockOutLocationName: null,
      });

      return res.status(201).json(entry);
    } catch (error) {
      console.error("Clock in error:", error);
      return res.status(500).json({ message: "Failed to clock in" });
    }
  });

  app.post("/api/time-entries/clock-out", async (req: Request, res: Response) => {
    try {
      const validation = clockOutSchema.safeParse(req.body);
      
      if (!validation.success) {
        const errors = validation.error.flatten();
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.fieldErrors,
        });
      }

      const { driverId, entryId, lat, lng, locationName } = validation.data;

      // Query all work locations and verify geofence
      const workLocations = await storage.getAllWorkLocations();
      
      if (workLocations.length > 0) {
        let isWithinGeofence = false;
        let closestDistance = Infinity;
        let closestLocationRadius = 0;

        for (const workLocation of workLocations) {
          const distance = calculateHaversineDistance(lat, lng, workLocation.lat, workLocation.lng);
          
          if (distance <= workLocation.radiusMeters) {
            isWithinGeofence = true;
            break;
          }
          
          // Track the closest location for error message
          if (distance < closestDistance) {
            closestDistance = distance;
            closestLocationRadius = workLocation.radiusMeters;
          }
        }

        if (!isWithinGeofence) {
          const distanceMeters = Math.round(closestDistance);
          const radiusMeters = closestLocationRadius;
          return res.status(400).json({
            message: `Clock-out not allowed. You are ${distanceMeters}m away from the nearest work location (required: within ${radiusMeters}m)`,
            distance: distanceMeters,
            requiredRadius: radiusMeters,
          });
        }
      }

      const entry = await storage.updateTimeEntry(entryId, {
        clockOutTime: new Date(),
        clockOutLat: lat,
        clockOutLng: lng,
        clockOutLocationName: locationName || null,
      });

      return res.json(entry);
    } catch (error) {
      console.error("Clock out error:", error);
      return res.status(500).json({ message: "Failed to clock out" });
    }
  });

  // ============ WORK LOCATIONS ROUTES ============
  app.get("/api/work-locations", async (_req: Request, res: Response) => {
    try {
      const locations = await storage.getAllWorkLocations();
      return res.json(locations);
    } catch (error) {
      console.error("Get work locations error:", error);
      return res.status(500).json({ message: "Failed to fetch work locations" });
    }
  });

  app.post("/api/work-locations", async (req: Request, res: Response) => {
    try {
      const validation = insertWorkLocationSchema.safeParse(req.body);
      
      if (!validation.success) {
        const errors = validation.error.flatten();
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.fieldErrors,
        });
      }

      const { name, address, lat, lng, radiusMeters } = validation.data;

      const location = await storage.createWorkLocation({
        name,
        address,
        lat,
        lng,
        radiusMeters: radiusMeters || 100,
      });

      return res.status(201).json(location);
    } catch (error) {
      console.error("Create work location error:", error);
      return res.status(500).json({ message: "Failed to create work location" });
    }
  });

  app.delete("/api/work-locations/:id", async (req: Request, res: Response) => {
    try {
      await storage.deleteWorkLocation(req.params.id);
      return res.status(204).send();
    } catch (error) {
      console.error("Delete work location error:", error);
      return res.status(500).json({ message: "Failed to delete work location" });
    }
  });

  return httpServer;
}

// Helper function to generate Google Maps URL from stops
function generateGoogleMapsUrl(stops: RouteStop[]): string {
  if (stops.length === 0) return "";
  
  const baseUrl = "https://www.google.com/maps/dir/";
  
  // Use addresses for directions, URL encode them
  const encodedAddresses = stops.map(stop => 
    encodeURIComponent(stop.address)
  );
  
  return baseUrl + encodedAddresses.join("/");
}
