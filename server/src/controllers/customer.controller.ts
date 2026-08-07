import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync";
import * as customerService from "../services/customer.service";
import {
  createCustomerSchema,
  updateCustomerSchema,
  registerPaymentSchema,
  listCustomersQuerySchema,
} from "../schemas/customer.schema";
import { serializeDecimals } from "../utils/serialize";

export const list = catchAsync(async (req: Request, res: Response) => {
  const query = listCustomersQuerySchema.parse(req.query);
  const result = await customerService.listCustomers(query);
  res.json(serializeDecimals(result));
});

export const getOne = catchAsync(async (req: Request, res: Response) => {
  const customer = await customerService.getCustomer(req.params.id);
  res.json(serializeDecimals(customer));
});

export const create = catchAsync(async (req: Request, res: Response) => {
  const input = createCustomerSchema.parse(req.body);
  const customer = await customerService.createCustomer(req.user?.localId, input);
  res.status(201).json(serializeDecimals(customer));
});


export const update = catchAsync(async (req: Request, res: Response) => {
  const input = updateCustomerSchema.parse(req.body);
  const customer = await customerService.updateCustomer(req.params.id, input);
  res.json(serializeDecimals(customer));
});

export const registerPayment = catchAsync(async (req: Request, res: Response) => {
  const input = registerPaymentSchema.parse(req.body);
  const movement = await customerService.registerPayment(req.params.id, input, req.user!.id);
  res.status(201).json(serializeDecimals(movement));
});
