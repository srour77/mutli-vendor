import { RequestHandler } from 'express';
import ISqlServer from '../models/interfaces/ISqlServer';
import { Product, Vendor } from '@prisma/client';
import { APIResponse } from '../globals/types';
import { StatusCodes } from 'http-status-codes';
import { Roles } from '../globals/enums';

class ProductController {
  private db: ISqlServer;

  constructor(_db: ISqlServer) {
    this.db = _db;
  }

  create: RequestHandler<any, APIResponse & { productId?: number }, Omit<Product, 'id'>> = async (req, res, next) => {
    const {
      [Roles.vendor]: { id }
    } = res.locals;
    req.body.vendorId = id;
    req.body.year = new Date(req.body.year);
    req.body.specs = JSON.stringify(req.body.specs)
    const productId = await this.db.createProduct(req.body);
    res.status(StatusCodes.CREATED).json({ message: 'success', success: true, productId });
  };

  update: RequestHandler<{ id: string }, APIResponse, Omit<Product, 'id'>> = async (req, res, next) => {
    const {
      [Roles.vendor]: { id }
    } = res.locals;
    const { specs } = req.body;
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: 'invalid product id', success: false });
      return;
    }

    if ((await this.db.getVendorIdByProductId(productId)) !== id) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: 'invalid product id', success: false });
      return;
    }
    if (specs && Object.getOwnPropertyNames(specs).length > 0) req.body.specs = JSON.stringify(specs);
    await this.db.updateProduct(productId, req.body);
    res.status(StatusCodes.OK).json({ message: 'success', success: true });
  };

  delete: RequestHandler<{ id: string }, APIResponse> = async (req, res, next) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: 'invalid product id', success: false });
      return;
    }
    await this.db.deleteProduct(productId);
    res.status(StatusCodes.OK).json({ message: 'success', success: true });
  };

  getById: RequestHandler<{ id: string }, APIResponse & { product?: Product | null }> = async (req, res, next) => {
    const productId = parseInt(req.params.id);
    if (isNaN(productId)) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: 'invalid product id', success: false });
      return;
    }
    const product = await this.db.getProductById(productId);
    res.status(StatusCodes.OK).json({ message: 'success', success: true, product });
  };

  getByName: RequestHandler<{ name: string }, APIResponse & { products?: Array<Pick<Product, 'id' | 'name' | 'price'>> }> = async (req, res, next) => {
    const { name } = req.params;
    const products = await this.db.getProductsByName(name);
    res.status(StatusCodes.OK).json({ message: 'success', success: true, products });
  };

  getByVendorId: RequestHandler<{ id: string }, APIResponse & { products?: Array<Product> }> = async (req, res, next) => {
    const vendorId = parseInt(req.params.id);
    if (isNaN(vendorId)) {
      res.status(StatusCodes.BAD_REQUEST).json({ message: 'invalid product id', success: false });
      return;
    }
    const products = await this.db.getProductsByVendorId(vendorId);
    res.status(StatusCodes.OK).json({ message: 'success', success: true, products });
  };

  getAllProducts: RequestHandler<any, APIResponse & { products: Array<Product> }> = async (req, res, next) => {
    const products = await this.db.getAllProducts();
    res.status(StatusCodes.OK).json({ message: 'success', success: true, products });
  };

  searchProduct: RequestHandler<any, APIResponse & { products?: Array<Pick<Product, 'id' | 'name' | 'desc' | 'price' | 'stock' | 'isNew'>> }, any, any> = async (req, res, next) => {
    const { category, isNew, minPrice, maxPrice, vendorId } = req.query;

    const keys = Object.keys(req.query).filter(k => !['category', 'isNew', 'minPrice', 'maxPrice', 'vendorId'].includes(k));

    let specs: any = {};
    if (keys.length) {
      keys.forEach(k => {
        specs[k] = req.query[k];
      });
    } else specs = undefined;

    const products = await this.db.searchProducts({ category: String(category), isNew, minPrice, maxPrice, vendorId, specs });

    res.status(StatusCodes.OK).json({ message: 'success', success: true, products });
  };
}

export default ProductController;
