import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  private validateMinMaxValues(dto: CreateProductDto | UpdateProductDto): void {
    // Validate amount range
    if (dto.minAmount !== undefined && dto.maxAmount !== undefined) {
      if (dto.minAmount >= dto.maxAmount) {
        throw new BadRequestException(
          'Maximum amount must be greater than minimum amount',
        );
      }
    }

    // Validate term range
    if (dto.termMinMonths !== undefined && dto.termMaxMonths !== undefined) {
      if (dto.termMinMonths >= dto.termMaxMonths) {
        throw new BadRequestException(
          'Maximum term must be greater than minimum term',
        );
      }
    }
  }

  async create(createProductDto: CreateProductDto): Promise<Product> {
    this.validateMinMaxValues(createProductDto);

    // All fields from DTO, including isActive, termLength, and termUnit, are handled by repository.create
    const product = this.productRepository.create(createProductDto);
    return await this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return await this.productRepository.find({
      order: { productId: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { productId: id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    this.validateMinMaxValues(updateProductDto);

    // All fields from DTO, including isActive, termLength, and termUnit, are handled by Object.assign
    Object.assign(product, updateProductDto);

    return await this.productRepository.save(product);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);

    await this.productRepository.remove(product);
  }
}
