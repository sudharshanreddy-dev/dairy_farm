import Joi from 'joi';

export const milkSchema = Joi.object({
  cattleId: Joi.number().required(),
  date: Joi.date().iso().required(),
  morningYield: Joi.number().min(0).required(),
  eveningYield: Joi.number().min(0).required(),
  quality: Joi.string().allow('', null),
  notes: Joi.string().allow('', null)
});

export const healthSchema = Joi.object({
  cattleId: Joi.number().required(),
  date: Joi.date().iso().required(),
  condition: Joi.string().required(),
  treatment: Joi.string().allow('', null),
  vetName: Joi.string().allow('', null),
  status: Joi.string().valid('Ongoing', 'Recovered', 'Critical').default('Ongoing'),
  cost: Joi.number().min(0).default(0),
  notes: Joi.string().allow('', null)
});

export const inventorySchema = Joi.object({
  itemName: Joi.string().required(),
  category: Joi.string().required(),
  quantity: Joi.number().min(0).required(),
  unit: Joi.string().required(),
  minQuantity: Joi.number().min(0).default(0),
  costPerUnit: Joi.number().min(0).default(0),
  expiryDate: Joi.date().iso().allow(null),
  notes: Joi.string().allow('', null)
});

export const saleSchema = Joi.object({
  date: Joi.date().iso().required(),
  buyerName: Joi.string().allow('', null),
  quantityLiters: Joi.number().positive().required(),
  pricePerLiter: Joi.number().positive().required(),
  totalAmount: Joi.number().min(0).optional(),
  paymentStatus: Joi.string().valid('Paid', 'Pending').default('Paid'),
  notes: Joi.string().allow('', null)
});
