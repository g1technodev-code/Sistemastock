import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ApiError } from "../utils/apiError";

const EXCEL_MIMETYPES = [
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
];

const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!EXCEL_MIMETYPES.includes(file.mimetype)) {
      cb(new Error("El archivo debe ser un Excel (.xlsx)"));
      return;
    }
    cb(null, true);
  },
}).single("file");

export function uploadExcel(req: Request, res: Response, next: NextFunction) {
  multerUpload(req, res, (err: unknown) => {
    if (err) return next(ApiError.badRequest(err instanceof Error ? err.message : "Archivo inválido"));
    if (!req.file) return next(ApiError.badRequest("Debe subir un archivo Excel (.xlsx)"));
    next();
  });
}
