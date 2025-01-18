import { Customer } from '@prisma/client';
import ISqlServer from '../models/interfaces/ISqlServer';
import jwt from 'jsonwebtoken';
import { Roles } from '../globals/enums';

class CustomerServices {
  private db: ISqlServer;
  constructor(_db: ISqlServer) {
    this.db = _db;
  }

  generateToken(data: Pick<Customer, 'id' | 'email'>): string {
    const token = jwt.sign({ ...data, role: Roles.customer }, String(process.env.JWT_SECRET), { expiresIn: '10 d' });
    return token;
  }

  async customerExists(email: string): Promise<boolean> {
    if ((await this.db.getVendorCount(email)) >= 1) return true;
    return false;
  }
}

export default CustomerServices;