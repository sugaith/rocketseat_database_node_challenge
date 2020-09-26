import {getRepository, Repository, In} from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const prod = await this.ormRepository.create({
      name,
      price,
      quantity,
    });
    await this.ormRepository.save(prod);
    return prod;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const prod = await this.ormRepository.findOne({
      where: {
        name,
      },
    });
    return prod;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const prodIds = products.map(prod => prod.id);
    const prods = await this.ormRepository.find({
      where: {
        id: In(prodIds),
      },
    });
    return prods;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    return this.ormRepository.save(products);
  }
}

export default ProductsRepository;
