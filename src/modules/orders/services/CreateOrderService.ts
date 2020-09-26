import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customerExists = await this.customersRepository.findById(customer_id);
    if (!customerExists) throw new AppError('Customer not found');

    const existentProds = await this.productsRepository.findAllById(products);
    if (!existentProds.length) throw new AppError('Ids not found');

    const existentProdIds = existentProds.map(prod => prod.id);
    const checkInexistentProds = products.filter(
      prod => !existentProdIds.includes(prod.id),
    );
    if (checkInexistentProds.length) {
      throw new AppError(`Could not find prod ${checkInexistentProds[0].id}`);
    }

    const findProdsWithNoQuantAvailable = products.filter(
      prod =>
        existentProds.filter(p => p.id === prod.id)[0].quantity < prod.quantity,
    );
    if (findProdsWithNoQuantAvailable.length) {
      throw new AppError(`The quantity is not available for some products.`);
    }

    const serializedProducts = products.map(prod => ({
      product_id: prod.id,
      quantity: prod.quantity,
      price: existentProds.filter(p => p.id === prod.id)[0].price,
    }));

    const order = await this.ordersRepository.create({
      customer: customerExists,
      products: serializedProducts,
    });

    const { order_products } = order;
    const orderProductsQuantity = order_products.map(prod => ({
      id: prod.product_id,
      quantity:
        existentProds.filter(p => p.id === prod.product_id)[0].quantity -
        prod.quantity,
    }));

    await this.productsRepository.updateQuantity(orderProductsQuantity);
    return order;
  }
}

export default CreateOrderService;
