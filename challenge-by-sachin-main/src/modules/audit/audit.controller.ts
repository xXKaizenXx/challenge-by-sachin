import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService, AuditQueryOptions } from './audit.service';
import { AuditContextService } from './audit-context.service';
import { Audit } from './entities/audit.entity';
import { PageResponseDto } from '../../common/dtos/page-response.dto';
import { PageOptionsDto } from '../../common/dtos/page-options.dto';
import { AuditAwareAuthGuard } from '../../guards/audit-aware-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { AuditStatus } from '../../constants/audit-status';
import { AuditRoles } from '../../decorators/audit-roles.decorator';
import { RoleType } from '../../constants/role-type';
import { Order } from 'src/constants';
import { AuditFilterDto } from './dtos/audit-filter.dto';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(AuditAwareAuthGuard, RolesGuard)
@Controller('api/v1/audit')
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly auditContextService: AuditContextService,
  ) {}

  @Get()
  @AuditRoles(RoleType.SUPER_USER, RoleType.IT, RoleType.REGIONAL_MANAGER, RoleType.BRANCH_MANAGER)
  @ApiOperation({ summary: 'Get audit trails with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Audit trails retrieved successfully',
    type: PageResponseDto<Audit>,
  })
  async findAuditTrails(@Query() filter: AuditFilterDto): Promise<PageResponseDto<Audit>> {
    // Convert date strings to Date objects and set defaults for pagination
    const options: AuditQueryOptions = {
      ...filter,
      startDate: filter.startDate ? new Date(filter.startDate) : undefined,
      endDate: filter.endDate ? new Date(filter.endDate) : undefined,
      order: filter.order || Order.DESC,
      skip: filter.skip,
      page: filter.page && filter.page > 0 ? filter.page : 1,
      take: filter.take && filter.take > 0 && filter.take <= 100 ? filter.take : 20,
    };
    return this.auditService.findAuditTrails(options);
  }

  // @Get('entity/:auditableType/:auditableId')
  // @ApiOperation({ summary: 'Get audit trail for a specific entity' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Entity audit trail retrieved successfully',
  //   type: PageResponseDto<Audit>,
  // })
  // async getEntityAuditTrail(
  //   @Param('auditableType') auditableType: string,
  //   @Param('auditableId') auditableId: string,
  //   @Query() options: PageOptionsDto,
  // ): Promise<PageResponseDto<Audit>> {
  //   return this.auditService.getEntityAuditTrail(auditableType, auditableId, options);
  // }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user activity audit trail' })
  @ApiResponse({
    status: 200,
    description: 'User activity retrieved successfully',
    type: PageResponseDto<Audit>,
  })
  async getUserActivity(
    @Param('userId') userId: string,
    @Query() options: PageOptionsDto,
  ): Promise<PageResponseDto<Audit>> {
    return this.auditService.getUserActivity(userId, options);
  }

  // @Get('statistics')
  // @AuditRoles(RoleType.SUPER_USER, RoleType.IT, RoleType.REGIONAL_MANAGER, RoleType.BRANCH_MANAGER)
  // @ApiOperation({ summary: 'Get audit statistics' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Audit statistics retrieved successfully',
  // })
  // async getAuditStatistics(
  //   @Query('startDate') startDate?: string,
  //   @Query('endDate') endDate?: string,
  // ) {
  //   const start = startDate ? new Date(startDate) : undefined;
  //   const end = endDate ? new Date(endDate) : undefined;
  //   return this.auditService.getAuditStatistics(start, end);
  // }

  

  // @Get('export')
  // @ApiOperation({ summary: 'Export audit data' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Audit data exported successfully',
  //   type: [Audit],
  // })
  // async exportAuditData(@Query() options: AuditQueryOptions): Promise<Audit[]> {
  //   return this.auditService.exportAuditData(options);
  // }

  
}
