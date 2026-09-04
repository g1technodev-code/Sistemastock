import { Router } from "express";
import { prisma } from "../config/prisma";

const router = Router();

// Public route to fetch products for a specific local
router.get("/:localId", async (req, res) => {
  try {
    const { localId } = req.params;

    const local = await prisma.local.findUnique({
      where: { id: localId },
      select: {
        name: true,
        businessSettings: {
          select: {
            businessName: true,
            logoUrl: true,
          }
        }
      }
    });

    if (!local) {
      return res.status(404).json({ error: "Local not found" });
    }

    const products = await prisma.product.findMany({
      where: {
        localId,
        isActive: true,
        currentStock: { gt: 0 }
      },
      select: {
        id: true,
        name: true,
        description: true,
        sellPrice: true,
        currentStock: true,
        imageUrl: true,
        category: {
          select: { name: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      local: {
        name: local.businessSettings?.businessName || local.name,
        logoUrl: local.businessSettings?.logoUrl || null,
      },
      products
    });
  } catch (error) {
    console.error("Error fetching catalog:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
