import { BulkClientCenterTransferDto } from './dto/bulk-client-center-transfer.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Request,
  UseFilters,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { PageMetaDto, PageOptionsDto } from 'src/common/dtos';
import { RoleType } from 'src/constants';
import { Auth } from 'src/decorators';
import { TypeOrmUniqueExceptionFilter } from 'src/filters/typeorm-unique-exception.filter';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import {
  ClientDto,
  MiniClientDto,
  MiniClientDtoListResponseDto,
} from './dto/client.dto';
import { ClientResponseDto } from './dto/client-response.dto';
import { ClientsResponseDto } from './dto/clients-response.dto';
import { RunCommandDto } from './dto/run-command.dto';
import { ClientService } from './client.service';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { UserEntity } from '../user/user.entity';
import { GeneratorProvider } from 'src/providers/generator.provider';

@ApiTags('Client')
@UseFilters(TypeOrmUniqueExceptionFilter)
@Controller('api/v1/clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) { }

  /**
   * Bulk transfer clients to another center (and optionally group).
   * Loan officers can only transfer their own clients; branch managers and IT can transfer any clients.
   * Only clients with no active or pending loans can be transferred.
   */
  @Auth([RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER, RoleType.IT, RoleType.SUPER_USER])
  @Post('bulk-transfer-center')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk transfer clients to another center' })
  @ApiResponse({ status: 200, description: 'Clients transferred successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  async bulkTransferClientsToCenter(
    @Body() bulkClientCenterTransferDto: BulkClientCenterTransferDto,
    @Req() req: any,
  ) {
    const user: UserEntity = req.user;
    return await this.clientService.bulkTransferClientsToCenter(user, bulkClientCenterTransferDto);
  }
  
  @Auth([RoleType.LOAN_OFFICER])
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'proofOfAddress', maxCount: 1 },
      { name: 'nationalId', maxCount: 1 },
    ])
  )
  @HttpCode(HttpStatus.CREATED)
  @Post()
  @ApiOperation({ summary: 'Create a new client with optional file uploads' })
  @ApiResponse({ status: 201, description: 'Client created successfully.' })
  async create(
    @UploadedFiles() files: {
      proofOfAddress?: Express.Multer.File[];
      nationalId?: Express.Multer.File[];
    },
    @Body() createClientDto: CreateClientDto,
    @Request() req,
  ): Promise<ClientResponseDto> {
    console.log('CLIENT: ', createClientDto);
    console.log('FILES: ', files);
    console.log('FILES proofOfAddress: ', files?.proofOfAddress);
    console.log('FILES nationalId: ', files?.nationalId);

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];

    // Handle proof of address upload if provided
    if (files?.proofOfAddress && files.proofOfAddress[0]) {
      const proofFile = files.proofOfAddress[0];
      console.log('Processing proofOfAddress file:', proofFile.originalname, proofFile.mimetype);
      
      if (!allowedTypes.includes(proofFile.mimetype)) {
        throw new BadRequestException(
          `Invalid proof of address file type. Allowed types: ${allowedTypes.join(', ')}`
        );
      }

      const proofUpload = await GeneratorProvider.s3FileUpload(
        proofFile,
        'client-documents/proof-of-address',
      );
      
      console.log('proofOfAddress upload successful:', proofUpload.Location);
      createClientDto.proofOfAddress = proofUpload.Location;
    }

    // Handle national ID upload if provided
    if (files?.nationalId && files.nationalId[0]) {
      const idFile = files.nationalId[0];
      console.log('Processing nationalId file:', idFile.originalname, idFile.mimetype);
      
      if (!allowedTypes.includes(idFile.mimetype)) {
        throw new BadRequestException(
          `Invalid national ID file type. Allowed types: ${allowedTypes.join(', ')}`
        );
      }

      const idUpload = await GeneratorProvider.s3FileUpload(
        idFile,
        'client-documents/national-id',
      );
      
      console.log('nationalId upload successful:', idUpload.Location);
      createClientDto.nationalId = idUpload.Location;
    }

    const client = await this.clientService.create(createClientDto, req.user);
    const clientDto = new ClientDto(client);
    const response = ClientResponseDto.from(
      clientDto,
      true,
      'Client created successfully',
    );
    return response;
  }

  @Auth()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all clients' })
  @ApiResponse({ status: 200, description: 'List of clients.' })
  async findAll(
    @Request() req,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<MiniClientDtoListResponseDto> {
    const [itemCount, data] = await this.clientService.findAll(
      req.user,
      pageOptionsDto,
    );
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const clients = data.map((client) => new MiniClientDto(client));
    const response = MiniClientDtoListResponseDto.from(
      clients,
      pageMetaDto,
      'Clients retrieved successfully',
    );

    return response;
  }


  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Transfer a client to another group' })
  @ApiResponse({ status: 200, description: 'Client transferred successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 404, description: 'Client or group not found.' })
  @Post(':clientId/transfer/:newGroupId')
  async transferClientToGroup(
    @Param('clientId') clientId: string,
    @Param('newGroupId') newGroupId: string,
    @Body() auditData: Partial<{ reason: string }>,
    @Req() req: any, // or proper type for request
  ) {
    const user: UserEntity = req.user; // injected by JWT guard
    return await this.clientService.transferToGroup(user, clientId, newGroupId, auditData);
  }


  @Auth()
  @Get('active')
  @HttpCode(HttpStatus.OK)
  async findActive(
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<ClientsResponseDto> {
    const [itemCount, data] = await this.clientService.findActive(
      pageOptionsDto,
    );
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const clients = data.map((client) => new ClientDto(client));
    const response = ClientsResponseDto.from(
      clients,
      pageMetaDto,
      'Active clients retrieved successfully',
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.BRANCH_MANAGER])
  @Get('blacklisted')
  @HttpCode(HttpStatus.OK)
  async findBlacklisted(
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<ClientsResponseDto> {
    const [itemCount, data] = await this.clientService.findBlacklisted(
      pageOptionsDto,
    );
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const clients = data.map((client) => new ClientDto(client));
    const response = ClientsResponseDto.from(
      clients,
      pageMetaDto,
      'Blacklisted clients retrieved successfully',
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER])
  @Get('deleted')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Find all soft deleted clients (paginated)' })
  @ApiResponse({ status: 200, description: 'List of soft deleted clients.' })
  async findDeleted(@Query() pageOptionsDto: PageOptionsDto): Promise<ClientsResponseDto> {
    const { data, meta } = await this.clientService.findDeleted(pageOptionsDto);
    const clientDtos = data.map((client) => new ClientDto(client));
    const response = new ClientsResponseDto();
    response.data = clientDtos;
    response.metaData = meta;
    response.success = true;
    response.message = 'Soft deleted clients retrieved successfully';
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.BRANCH_MANAGER])
  @Get('staff/:staffId')
  @HttpCode(HttpStatus.OK)
  async findByStaff(
    @Param('staffId') staffId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<ClientsResponseDto> {
    const [itemCount, data] = await this.clientService.findByStaff(
      staffId,
      pageOptionsDto,
    );
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const clients = data.map((client) => new ClientDto(client));
    const response = ClientsResponseDto.from(
      clients,
      pageMetaDto,
      'Clients by staff retrieved successfully',
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.BRANCH_MANAGER])
  @Get('office/:officeId')
  @HttpCode(HttpStatus.OK)
  async findByOffice(
    @Param('officeId') officeId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<ClientsResponseDto> {
    const [itemCount, data] = await this.clientService.findByOffice(
      officeId,
      pageOptionsDto,
    );
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const clients = data.map((client) => new ClientDto(client));
    const response = ClientsResponseDto.from(
      clients,
      pageMetaDto,
      'Clients by office retrieved successfully',
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Get('center/:centerId')
  @HttpCode(HttpStatus.OK)
  async findByCenter(
    @Param('centerId') centerId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<MiniClientDtoListResponseDto> {
    console.log('CENTER ID: ', centerId);
    const [itemCount, data] = await this.clientService.findByCenter(
      centerId,
      pageOptionsDto,
    );
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });

    const clients = data.map((client) => new MiniClientDto(client));
    const response = MiniClientDtoListResponseDto.from(
      clients,
      pageMetaDto,
      'Clients retrieved successfully',
    );

    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Get('group/:groupId')
  @HttpCode(HttpStatus.OK)
  async findByGroup(
    @Param('groupId') groupId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<ClientsResponseDto> {
    const [itemCount, data] = await this.clientService.findByGroup(
      groupId,
      pageOptionsDto,
    );
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const clients = data.map((client) => new ClientDto(client));
    const response = ClientsResponseDto.from(
      clients,
      pageMetaDto,
      'Clients by group retrieved successfully',
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Get('bank/:bankId')
  @HttpCode(HttpStatus.OK)
  async findByBank(
    @Param('bankId') bankId: string,
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<ClientsResponseDto> {
    const [itemCount, data] = await this.clientService.findByBank(
      bankId,
      pageOptionsDto,
    );
    const pageMetaDto = new PageMetaDto({ itemCount, pageOptionsDto });
    const clients = data.map((client) => new ClientDto(client));
    const response = ClientsResponseDto.from(
      clients,
      pageMetaDto,
      'Clients by bank retrieved successfully',
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Get('national-id/:nationalIdNumber')
  @HttpCode(HttpStatus.OK)
  async findByNationalId(
    @Param('nationalIdNumber') nationalIdNumber: string,
  ): Promise<ClientResponseDto> {
    const client = await this.clientService.findByNationalId(nationalIdNumber);
    if (!client) {
      throw new Error('Client not found');
    }
    const clientDto = new ClientDto(client);
    const response = ClientResponseDto.from(
      clientDto,
      true,
      'Client retrieved successfully',
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Get('mobile/:mobileNumber')
  @HttpCode(HttpStatus.OK)
  async findByMobileNumber(
    @Param('mobileNumber') mobileNumber: string,
  ): Promise<ClientResponseDto> {
    const client = await this.clientService.findByMobileNumber(mobileNumber);
    if (!client) {
      throw new Error('Client not found');
    }
    const clientDto = new ClientDto(client);
    const response = ClientResponseDto.from(
      clientDto,
      true,
      'Client retrieved successfully',
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Get('email/:emailAddress')
  @HttpCode(HttpStatus.OK)
  async findByEmail(
    @Param('emailAddress') emailAddress: string,
  ): Promise<ClientResponseDto> {
    const client = await this.clientService.findByEmail(emailAddress);
    if (!client) {
      throw new Error('Client not found');
    }
    const clientDto = new ClientDto(client);
    const response = ClientResponseDto.from(
      clientDto,
      true,
      'Client retrieved successfully',
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a client by ID' })
  @ApiResponse({ status: 200, description: 'Client found.' })
  @ApiResponse({ status: 404, description: 'Client not found.' })
  async findOne(@Param('id') id: string): Promise<ClientResponseDto> {
    const client = await this.clientService.findOne(id);
    const clientDto = new ClientDto(client);
    const response = ClientResponseDto.from(
      clientDto,
      true,
      'Client retrieved successfully',
    );
    return response;
  }

@Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'proofOfAddress', maxCount: 1 },
      { name: 'nationalId', maxCount: 1 },
    ])
  )
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a client by ID with optional file uploads' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'Client updated successfully.' })
  @ApiResponse({ status: 404, description: 'Client not found.' })
  async update(
    @Param('id') id: string,
    @UploadedFiles() files: {
      proofOfAddress?: Express.Multer.File[];
      nationalId?: Express.Multer.File[];
    },
    @Body() updateClientDto: UpdateClientDto,
    @Request() req,
  ): Promise<ClientResponseDto> {
    console.log('UPDATE CLIENT: ', updateClientDto);
    console.log('UPDATE FILES: ', files);
    console.log('UPDATE FILES proofOfAddress: ', files?.proofOfAddress);
    console.log('UPDATE FILES nationalId: ', files?.nationalId);

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];

    // Handle proof of address upload if provided
    if (files?.proofOfAddress && files.proofOfAddress[0]) {
      const proofFile = files.proofOfAddress[0];
      console.log('Processing update proofOfAddress file:', proofFile.originalname, proofFile.mimetype);
      
      if (!allowedTypes.includes(proofFile.mimetype)) {
        throw new BadRequestException(
          `Invalid proof of address file type. Allowed types: ${allowedTypes.join(', ')}`
        );
      }

      const proofUpload = await GeneratorProvider.s3FileUpload(
        proofFile,
        'client-documents/proof-of-address',
      );
      
      console.log('Update proofOfAddress upload successful:', proofUpload.Location);
      updateClientDto.proofOfAddress = proofUpload.Location;
    }

    // Handle national ID upload if provided
    if (files?.nationalId && files.nationalId[0]) {
      const idFile = files.nationalId[0];
      console.log('Processing update nationalId file:', idFile.originalname, idFile.mimetype);
      
      if (!allowedTypes.includes(idFile.mimetype)) {
        throw new BadRequestException(
          `Invalid national ID file type. Allowed types: ${allowedTypes.join(', ')}`
        );
      }

      const idUpload = await GeneratorProvider.s3FileUpload(
        idFile,
        'client-documents/national-id',
      );
      
      console.log('Update nationalId upload successful:', idUpload.Location);
      updateClientDto.nationalId = idUpload.Location;
    }

    const client = await this.clientService.update(id, updateClientDto);
    const clientDto = new ClientDto(client);
    const response = ClientResponseDto.from(
      clientDto,
      true,
      'Client updated successfully',
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  async activate(
    @Param('id') id: string,
    @Body() body: { activatedById: string },
  ): Promise<ClientResponseDto> {
    const client = await this.clientService.activate(id, body.activatedById);
    const clientDto = new ClientDto(client);
    const response = ClientResponseDto.from(
      clientDto,
      true,
      'Client activated successfully',
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param('id') id: string): Promise<ClientResponseDto> {
    const client = await this.clientService.deactivate(id);
    const clientDto = new ClientDto(client);
    const response = ClientResponseDto.from(
      clientDto,
      true,
      'Client deactivated successfully',
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Post(':id/blacklist')
  @HttpCode(HttpStatus.OK)
  async blacklist(@Param('id') id: string): Promise<ClientResponseDto> {
    const client = await this.clientService.blacklist(id);
    const clientDto = new ClientDto(client);
    const response = ClientResponseDto.from(
      clientDto,
      true,
      'Client blacklisted successfully',
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.LOAN_OFFICER, RoleType.BRANCH_MANAGER])
  @Post(':id/remove-from-blacklist')
  @HttpCode(HttpStatus.OK)
  async removeFromBlacklist(
    @Param('id') id: string,
  ): Promise<ClientResponseDto> {
    const client = await this.clientService.removeFromBlacklist(id);
    const clientDto = new ClientDto(client);
    const response = ClientResponseDto.from(
      clientDto,
      true,
      'Client removed from blacklist successfully',
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER, RoleType.BRANCH_MANAGER])
  @Post('run-command')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Run a command on a client' })
  @ApiResponse({ status: 200, description: 'Command executed successfully.' })
  @ApiResponse({ status: 404, description: 'Client not found.' })
  @ApiResponse({ status: 400, description: 'Invalid command.' })
  async runCommand(
    @Body() runCommandDto: RunCommandDto,
    @Request() req,
  ): Promise<ClientResponseDto> {
    const client = await this.clientService.runCommand(runCommandDto, req.user);
    const clientDto = new ClientDto(client);
    const response = ClientResponseDto.from(
      clientDto,
      true,
      `Client ${runCommandDto.command} command executed successfully`,
    );
    return response;
  }

  @Auth([RoleType.SUPER_USER])
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a client by ID' })
  @ApiResponse({ status: 200, description: 'Client deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Client not found.' })
  async remove(
    @Param('id') id: string,
    @Request() req,
  ): Promise<ClientResponseDto> {
    await this.clientService.remove(id);
    return ClientResponseDto.from(null, true, 'Client deleted successfully');
  }

  @Auth([RoleType.SUPER_USER])
  @Delete(':id/soft')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a client by ID' })
  @ApiResponse({ status: 200, description: 'Client soft deleted successfully.' })
  async softDelete(@Param('id') id: string): Promise<ClientResponseDto> {
    await this.clientService.softDelete(id);
    return ClientResponseDto.from(null, true, 'Client soft deleted successfully');
  }

  @Auth([RoleType.SUPER_USER])
  @Post(':id/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a soft deleted client by ID' })
  @ApiResponse({ status: 200, description: 'Client restored successfully.' })
  async restore(@Param('id') id: string): Promise<ClientResponseDto> {
    await this.clientService.restore(id);
    return ClientResponseDto.from(null, true, 'Client restored successfully');
  }
}