import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Auth } from '../../decorators/http.decorators';
import { RoleType } from '../../constants';

@ApiTags('Product')
@Controller('api/v1/products')
@ApiBearerAuth()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Auth([RoleType.SUPER_USER])
  @ApiOperation({ summary: 'Create a new loan product (Super User only)' })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully.',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Super User access required.',
  })
  async create(
    @Body() createProductDto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return await this.productService.create(createProductDto);
  }

  @Get()
  @Auth([RoleType.SUPER_USER])
  @ApiOperation({ summary: 'Get all loan products (Super User only)' })
  @ApiResponse({
    status: 200,
    description: 'List of products.',
    type: [ProductResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Super User access required.',
  })
  async findAll(): Promise<ProductResponseDto[]> {
    return await this.productService.findAll();
  }

  @Get(':id')
  @Auth([RoleType.SUPER_USER])
  @ApiOperation({ summary: 'Get a loan product by ID (Super User only)' })
  @ApiResponse({
    status: 200,
    description: 'Product found.',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Super User access required.',
  })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ProductResponseDto> {
    return await this.productService.findOne(id);
  }

  @Patch(':id')
  @Auth([RoleType.SUPER_USER])
  @ApiOperation({ summary: 'Update a loan product by ID (Super User only)' })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully.',
    type: ProductResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Super User access required.',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return await this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @Auth([RoleType.SUPER_USER])
  @ApiOperation({ summary: 'Delete a loan product by ID (Super User only)' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Super User access required.',
  })
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.productService.remove(id);
  }
}
