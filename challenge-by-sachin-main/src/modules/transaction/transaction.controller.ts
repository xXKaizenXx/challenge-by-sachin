import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Auth } from 'src/decorators';
import { ReverseTransactionDto } from './dto/reverse-transaction.dto';
import { UserEntity } from '../user/user.entity';
import { RoleType } from 'src/constants';

interface AuthRequest extends Request {
  user: UserEntity;
}

@ApiTags('Transaction')
@Controller('api/v1/transactions/')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Auth()
  @Post('repayments')
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({
    status: 201,
    description: 'Transaction created successfully.',
  })
  async create(@Body() createTransactionDto: CreateTransactionDto, @Req() req) {
    const data = await this.transactionService.create(
      createTransactionDto,
      req.user,
    );
    return {
      message: 'Transaction created successfully.',
      status: 'success',
      data,
    };
  }


@Auth([RoleType.BRANCH_MANAGER, RoleType.SUPER_USER, RoleType.IT])
   @Post('reverse')
  async reverseTransaction(
    @Body() dto: ReverseTransactionDto,
    @Req() req: AuthRequest,
  ) {
    // Assuming user is attached to request by the auth guard
    const user = req.user;
    dto.user = user;;

    // Attach the user to DTO
    dto.user = user;

    const reversalTx = await this.transactionService.reverseTransaction(dto, user);
    return {
      message: `Transaction ${dto.transactionId} reversed successfully`,
      reversalTransaction: reversalTx,
    };
  }
}
