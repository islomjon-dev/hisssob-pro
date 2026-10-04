import Dexie, { type Table } from 'dexie';
import { User, Category, Product, Sale, Settings } from '../types';

export class HissobDatabase extends Dexie {
  users!: Table<User, string>;
  categories!: Table<Category, string>;
  products!: Table<Product, string>;
  sales!: Table<Sale, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('HissobProDB');
    this.version(1).stores({
      users: 'id, email',
      categories: 'id, userId, name',
      products: 'id, userId, name, barcode, categoryId',
      sales: 'id, userId, saleNumber, createdAt',
      settings: 'id, userId',
    });
  }
}

export const db = new HissobDatabase();
