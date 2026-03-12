import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Like, Repository } from 'typeorm';
import { ClientService } from '../client/client.service';
import { GroupPackageService } from '../group-package/group-package.service';
import { CenterService } from '../center/center.service';
import { BankService } from '../bank/bank.service';
import { LoanService } from '../loan/loan.service';
import { LanguageService } from '../language/language.service';
import { ClientEntity, Province } from '../client/entities/client.entity';
import { GroupPackageEntity } from '../group-package/entities/group-package.entity';
import { Center } from '../center/entities/center.entity';
import { BankEntity } from '../bank/entities/bank.entity';
import { LoanEntity } from '../loan/entities/loan.entity';
import { Language } from '../language/entities/language.entity';
import * as fs from 'fs';
import { parse } from 'csv-parse';
import { CreateClientDto } from '../client/dto';
import { UserEntity } from '../user/user.entity';
import { GroupEntity } from '../group/entities/group.entity';
import { GroupService } from '../group/group.service';
import { LoanTable } from '../loan-table/entities/loan-table.entity';
import { CreateLoanDto } from '../loan/dto';
import { ClientApplicationDto } from '../loan/dto/create-loan.dto';
import { CreateGroupDto } from '../group/dto/create-group.dto';
import { parse as parseDate } from 'date-fns';
import {
  CenterMeetingDates,
  WeekNumber,
  WeekDay,
} from '../center-meeting-dates/entities/center-meeting-dates.entity';
import { OfficeEntity } from '../office/entities/office.entity';
import { RoleType } from '../../constants';
import { generateHash } from '../../common/utils';
import {
  Client,
  ensureSpaceBeforeTrailingNumber,
  flattenLoansToGroups,
  Group,
  LOANS_DATA,
} from './data';
import { StatusEntity } from '../status/entities/status.entity';
import { updateLoanTableByAmount } from '../loan-table/loan-table.seeder';

type RECORD = {
  group: string;
  firstname: string;
  lastname: string;
  national_id: string;
  bank: string;
  account: string;
  principal: string;
  phone: string;
  disbursment: string;
};

@Injectable()
export class SeederService {
  constructor(
    private readonly clientService: ClientService,
    private readonly groupPackageService: GroupPackageService,
    private readonly centerService: CenterService,
    private readonly bankService: BankService,
    private readonly loanService: LoanService,
    private readonly languageService: LanguageService,
    @InjectRepository(ClientEntity)
    private readonly clientRepository: Repository<ClientEntity>,
    @InjectRepository(GroupPackageEntity)
    private readonly groupPackageRepository: Repository<GroupPackageEntity>,
    @InjectRepository(Center)
    private readonly centerRepository: Repository<Center>,
    @InjectRepository(GroupEntity)
    private readonly groupRepository: Repository<GroupEntity>,
    private readonly groupService: GroupService,
    @InjectRepository(BankEntity)
    private readonly bankRepository: Repository<BankEntity>,
    @InjectRepository(LoanEntity)
    private readonly loanRepository: Repository<LoanEntity>,
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(Province)
    private readonly provinceRepository: Repository<Province>,
    @InjectRepository(LoanTable)
    private readonly loanTableRepository: Repository<LoanTable>,
    @InjectRepository(CenterMeetingDates)
    private readonly centerMeetingDatesRepository: Repository<CenterMeetingDates>,
    @InjectRepository(OfficeEntity)
    private readonly officeRepository: Repository<OfficeEntity>,
    private readonly entityManager: EntityManager,
    private readonly dataSource: DataSource, // Add DataSource injection
  ) {}

  async seed6MonthsLoanTable(): Promise<string> {
    await updateLoanTableByAmount(this.dataSource);
    return 'Loan products seeded successfully.';
  }

  async readCsvFile(): Promise<any[]> {
    const path = require('path');
    const filePath = path.join(process.cwd(), 'Lusaka.csv');
    // console.log('filePath: ', filePath);
    return new Promise((resolve, reject) => {
      const records: RECORD[] = [];
      fs.createReadStream(filePath)
        .pipe(parse({ columns: true, trim: true }))
        .on('data', async (data: RECORD) => {
          return records.push(data);
        })
        .on('end', () => resolve(records))
        .on('error', (err) => reject(err));
    });
  }

  async seed(id: string) {
    try {
      const center = await this.centerRepository.findOne({
        where: { id },
      });
      const user = await this.userRepository.findOne({
        where: { id: center?.user },
      });
      const language = await this.languageRepository.findOne({
        where: { name: 'Sesotho' },
      });
      const province = await this.provinceRepository.findOne({
        where: { name: 'Free State' },
      });

      const bank = await this.bankRepository.findOne({
        where: { name: 'Capitec Bank' },
      });

      const records = await this.readCsvFile();

      const groupByGroup = this.groupByGroup(records);

      const keysss = Object.keys(groupByGroup);
      // console.log('keysss', keysss);
      for (const key of keysss) {
        const date = parseDate(
          groupByGroup[key][0]?.disbursment,
          'dd-MMM-yy',
          new Date(),
        );
        const formattedDisbursementDate = `${date.getFullYear()}-${String(
          date.getMonth() + 1,
        ).padStart(2, '0')}-${String(date.getDate()).padStart(
          2,
          '0',
        )}T00:00:00.000Z`;
        const clients: ClientEntity[] = [];
        const loanPayload: CreateLoanDto = {
          clientApplications: [],
          groupId: '',
          loanOfficerId: '',
          loanProduct: '',
          status: '',
          targetDisbursementDate: '',
          totalLoanAmount: 0,
          createdAt: formattedDisbursementDate,
        };
        for (const record of groupByGroup[key]) {
          const date_of_birth = this.extractDateOfBirth(record.national_id);
          const createClientDto: CreateClientDto = {
            firstName: record.firstname,
            lastName: record.lastname,
            dateOfBirth: date_of_birth,
            nationalIdNumber: record.national_id,
            mobileNumber: record.phone,
            address: {
              province: 'Free State',
              district: 'Lusaka',
            },
            gender: 'female',
            proofOfAddress: 'proof_of_address.img',
            nationalId: 'national_id.img',
            bankAccountNumber: record.account,
            bankId: bank?.id,
            centerId: center?.id,
            languageId: language?.id,
            province: province?.id,
          };
          const client = await this.clientService.create(createClientDto, user);
          clients.push(client);
          const loanTable = await this.loanTableRepository.findOne({
            where: {
              loanAmount: parseInt(
                record.principal.replace('R', '').replace(',', ''),
              ),
            },
          });

          const loan: ClientApplicationDto = {
            clientId: client.id,
            loanAmount: parseInt(
              record?.principal.replace('R', '').replace(',', ''),
            ),
            businessType: 'SME',
            loanTableId: loanTable?.id,
          };
          loanPayload.clientApplications.push(loan);

          loanPayload.totalLoanAmount =
            loanPayload.totalLoanAmount +
            parseInt(record?.principal.replace('R', '').replace(',', ''));
        }

        loanPayload.createdAt = formattedDisbursementDate;
        loanPayload.loanOfficerId = user?.id;
        loanPayload.loanProduct = '4 months business loan';
        loanPayload.status = 'Pending';
        loanPayload.targetDisbursementDate = formattedDisbursementDate;

        const groupDto: CreateGroupDto = {
          name: key?.toLowerCase(),
          clients: clients.map((cl) => cl.id),
          groupLeaderId: clients[0]?.id,
          centerId: center?.id,
        };
        const group = await this.groupService.create(groupDto, user);

        loanPayload.groupId = group.id;
        const loanPackage = await this.loanService.create(loanPayload, user);
        // console.log('GROUP ID', group.id, 'package', loanPackage);
        console.log('TARGET DISBURSMENE', formattedDisbursementDate);
        console.log('----END');
      }
    } catch (error) {
      console.log('ERROR', error);
    }

    // const client = await this.clientService.create(createClientDto, center.user);
    // console.log('client: ', client);
  }

  async seedLanguages() {
    try {
      const languagesData = [
        'Afrikaans',
        'English',
        'isiNdebele',
        'isiXhosa',
        'isiZulu',
        'Sepedi',
        'Sesotho',
        'Setswana',
        'siSwati',
        'Tshivenda',
        'Xitsonga',
      ];

      const createdLanguages = [];

      for (const languageName of languagesData) {
        // Check if language already exists
        const existingLanguage = await this.languageRepository.findOne({
          where: { name: languageName },
        });

        if (!existingLanguage) {
          // Create new language
          const newLanguage = this.languageRepository.create({
            name: languageName,
          });
          const savedLanguage = await this.languageRepository.save(newLanguage);
          createdLanguages.push(savedLanguage);
        }
      }

      if (createdLanguages.length > 0) {
        return `Successfully seeded ${
          createdLanguages.length
        } new languages: ${createdLanguages.map((l) => l.name).join(', ')}`;
      } else {
        return 'All languages already exist, no new languages were created';
      }
    } catch (error) {
      console.error('Error seeding languages:', error);
      throw error;
    }
  }

  extractDateOfBirth(id: string): Date {
    // Extract the first 6 digits
    const datePart = id.substring(0, 6);

    // Split into components
    const yearPart = datePart.substring(0, 2);
    const monthPart = datePart.substring(2, 4);
    const dayPart = datePart.substring(4, 6);

    // Convert to numbers
    const year = parseInt(yearPart, 10);
    const month = parseInt(monthPart, 10) - 1; // Months are 0-indexed in JS Date
    const day = parseInt(dayPart, 10);

    // Determine full year (assuming 1900s for years >= 50, 2000s otherwise)
    const fullYear = year >= 50 ? 1900 + year : 2000 + year;

    // Create and return Date object
    return new Date(fullYear, month, day + 1);
  }

  // Example usage:
  // const dob = extractDateOfBirth("6806110922089");
  // console.log(dob.toDateString());

  groupByGroup(data: RECORD[]): Record<string, RECORD[]> {
    return data.reduce((acc: Record<string, RECORD[]>, current) => {
      const group = current.group;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(current);
      return acc;
    }, {});
  }

  async seedMeetingDaysData() {
    try {
      const meetingDatesData = [
        { week: WeekNumber.ONE, day: WeekDay.MONDAY },
        { week: WeekNumber.ONE, day: WeekDay.TUESDAY },
        { week: WeekNumber.ONE, day: WeekDay.WEDNESDAY },
        { week: WeekNumber.ONE, day: WeekDay.THURSDAY },
        { week: WeekNumber.ONE, day: WeekDay.FRIDAY },
        { week: WeekNumber.TWO, day: WeekDay.MONDAY },
        { week: WeekNumber.TWO, day: WeekDay.TUESDAY },
        { week: WeekNumber.TWO, day: WeekDay.WEDNESDAY },
        { week: WeekNumber.TWO, day: WeekDay.THURSDAY },
        { week: WeekNumber.TWO, day: WeekDay.FRIDAY },
      ];

      // Check if data already exists to avoid duplicates
      const existingData = await this.centerMeetingDatesRepository.find();
      if (existingData.length > 0) {
        return 'Center meeting dates data already exists, skipping seeding...';
      }

      // Create and save the meeting dates
      const createdMeetingDates = await this.centerMeetingDatesRepository.save(
        meetingDatesData.map((data) =>
          this.centerMeetingDatesRepository.create(data),
        ),
      );
      return `Successfully seeded ${createdMeetingDates} center meeting dates`;
    } catch (error) {
      console.error('Error seeding center meeting dates:', error);
      throw error;
    }
  }

  async seedProvinces() {
    try {
      const provincesData = [
        'Eastern Cape',
        'Free State',
        'Gauteng',
        'KwaZulu-Natal',
        'Limpopo',
        'Mpumalanga',
        'Northern Cape',
        'North West',
        'Western Cape',
      ];

      console.log('check on this client');
      const createdProvinces = [];

      for (const provinceName of provincesData) {
        // Check if province already exists
        const existingProvince = await this.provinceRepository.findOne({
          where: { name: provinceName },
        });

        if (!existingProvince) {
          // Create new province
          const newProvince = this.provinceRepository.create({
            name: provinceName,
          });
          const savedProvince = await this.provinceRepository.save(newProvince);
          createdProvinces.push(savedProvince);
        }
      }

      if (createdProvinces.length > 0) {
        return `Successfully seeded ${
          createdProvinces.length
        } new provinces: ${createdProvinces.map((p) => p.name).join(', ')}`;
      } else {
        return 'All provinces already exist, no new provinces were created';
      }
    } catch (error) {
      console.error('Error seeding provinces:', error);
      throw error;
    }
  }

  async seedBanks() {
    try {
      const banksData = [
        { name: 'Standard Bank', branchCode: '051001' },
        { name: 'Absa', branchCode: '632005' },
        { name: 'First National Bank (FNB)', branchCode: '250655' },
        { name: 'Nedbank', branchCode: '198765' },
        { name: 'Capitec Bank', branchCode: '470010' },
        { name: 'Investec', branchCode: '580105' },
        { name: 'African Bank', branchCode: '430000' },
        { name: 'Bidvest Bank', branchCode: '462005' },
        { name: 'Discovery Bank', branchCode: '679000' },
        { name: 'TymeBank', branchCode: '678910' },
      ];

      const createdBanks = [];

      for (const bankData of banksData) {
        // Check if bank already exists by branch code (unique field)
        const existingBank = await this.bankRepository.findOne({
          where: { branchCode: bankData.branchCode },
        });

        if (!existingBank) {
          // Create new bank
          const newBank = this.bankRepository.create(bankData);
          const savedBank = await this.bankRepository.save(newBank);
          createdBanks.push(savedBank);
        }
      }

      if (createdBanks.length > 0) {
        return `Successfully seeded ${
          createdBanks.length
        } new banks: ${createdBanks.map((b) => b.name).join(', ')}`;
      } else {
        return 'All banks already exist, no new banks were created';
      }
    } catch (error) {
      console.error('Error seeding banks:', error);
      throw error;
    }
  }

  async seedAllData() {
    const results = await this.seedMeetingDaysData();
    const results1 = await this.seedHeadOffice();
    const results2 = await this.seedProvinces();
    const results3 = await this.seedLanguages();
    const results4 = await this.seedBanks();
    const results5 = await this.seedLoanTable();
    const results6 = await this.seedSuperUser();
    return {
      results,
      results1,
      results2,
      results3,
      results4,
      results5,
      results6,
    };
  }

  //function that creates head office if head office does not exist
  async seedHeadOffice() {
    try {
      // Check if there's already an office without a parentId (head office)
      const existingHeadOffice = await this.officeRepository.findOne({
        where: { parent: null },
      });

      if (existingHeadOffice) {
        return `Head office already exists: ${existingHeadOffice.name}`;
      }

      // Check if there's already an office named "Head Office"
      const existingOfficeWithName = await this.officeRepository.findOne({
        where: { name: 'Head Office' },
      });

      if (existingOfficeWithName) {
        return `An office named "Head Office" already exists but has a parent. Head office should not have a parent.`;
      }

      // Create the head office
      const headOfficeData = {
        name: 'Head Office',
        openingDate: new Date().toISOString(),
        parent: null, // Head office has no parent
      };

      const newHeadOffice = this.officeRepository.create(headOfficeData);
      const savedHeadOffice = await this.officeRepository.save(newHeadOffice);

      return `Successfully created head office: ${savedHeadOffice.name}`;
    } catch (error) {
      console.error('Error seeding head office:', error);
      throw error;
    }
  }

  //function that inserts data into the loan-table table
  async seedLoanTable() {
    try {
      const loanTableData = [
        {
          loanAmount: 1000,
          applicationFee: 109.78,
          totalInterest: 70.22,
          serviceFee: 0,
          installment: 295,
          maximumApplicationFee: 275,
        },
        {
          loanAmount: 1500,
          applicationFee: 164.67,
          totalInterest: 105.33,
          serviceFee: 0,
          installment: 443,
          maximumApplicationFee: 325,
        },
        {
          loanAmount: 2000,
          applicationFee: 219.56,
          totalInterest: 140.44,
          serviceFee: 0,
          installment: 590,
          maximumApplicationFee: 375,
        },
        {
          loanAmount: 2500,
          applicationFee: 274.45,
          totalInterest: 175.55,
          serviceFee: 0,
          installment: 738,
          maximumApplicationFee: 425,
        },
        {
          loanAmount: 3000,
          applicationFee: 329.34,
          totalInterest: 210.66,
          serviceFee: 0,
          installment: 885,
          maximumApplicationFee: 475,
        },
        {
          loanAmount: 3500,
          applicationFee: 384.23,
          totalInterest: 245.77,
          serviceFee: 0,
          installment: 1033,
          maximumApplicationFee: 525,
        },
        {
          loanAmount: 4000,
          applicationFee: 439.12,
          totalInterest: 280.88,
          serviceFee: 0,
          installment: 1180,
          maximumApplicationFee: 575,
        },
        {
          loanAmount: 4500,
          applicationFee: 494.01,
          totalInterest: 315.99,
          serviceFee: 0,
          installment: 1328,
          maximumApplicationFee: 625,
        },
        {
          loanAmount: 5000,
          applicationFee: 548.9,
          totalInterest: 351.1,
          serviceFee: 0,
          installment: 1475,
          maximumApplicationFee: 675,
        },
        {
          loanAmount: 5500,
          applicationFee: 603.79,
          totalInterest: 386.21,
          serviceFee: 0,
          installment: 1623,
          maximumApplicationFee: 725,
        },
        {
          loanAmount: 6000,
          applicationFee: 658.68,
          totalInterest: 421.32,
          serviceFee: 0,
          installment: 1770,
          maximumApplicationFee: 775,
        },
        {
          loanAmount: 6500,
          applicationFee: 713.57,
          totalInterest: 456.43,
          serviceFee: 0,
          installment: 1918,
          maximumApplicationFee: 825,
        },
        {
          loanAmount: 7000,
          applicationFee: 768.46,
          totalInterest: 491.54,
          serviceFee: 0,
          installment: 2065,
          maximumApplicationFee: 875,
        },
        {
          loanAmount: 7500,
          applicationFee: 823.35,
          totalInterest: 526.65,
          serviceFee: 0,
          installment: 2213,
          maximumApplicationFee: 925,
        },
        {
          loanAmount: 8000,
          applicationFee: 878.24,
          totalInterest: 561.76,
          serviceFee: 0,
          installment: 2360,
          maximumApplicationFee: 975,
        },
        {
          loanAmount: 8500,
          applicationFee: 933.13,
          totalInterest: 596.87,
          serviceFee: 0,
          installment: 2508,
          maximumApplicationFee: 1025,
        },
        {
          loanAmount: 9000,
          applicationFee: 988.02,
          totalInterest: 631.98,
          serviceFee: 0,
          installment: 2655,
          maximumApplicationFee: 1075,
        },
        {
          loanAmount: 9500,
          applicationFee: 1042.91,
          totalInterest: 667.09,
          serviceFee: 0,
          installment: 2803,
          maximumApplicationFee: 1125,
        },
        {
          loanAmount: 10000,
          applicationFee: 1097.8,
          totalInterest: 702.2,
          serviceFee: 0,
          installment: 2950,
          maximumApplicationFee: 1175,
        },
        {
          loanAmount: 10500,
          applicationFee: 1152.69,
          totalInterest: 737.31,
          serviceFee: 0,
          installment: 3098,
          maximumApplicationFee: 1225,
        },
        {
          loanAmount: 11000,
          applicationFee: 1207.58,
          totalInterest: 772.42,
          serviceFee: 0,
          installment: 3245,
          maximumApplicationFee: 1275,
        },
        {
          loanAmount: 11500,
          applicationFee: 1262.47,
          totalInterest: 807.53,
          serviceFee: 0,
          installment: 3393,
          maximumApplicationFee: 1325,
        },
        {
          loanAmount: 12000,
          applicationFee: 1317.36,
          totalInterest: 842.64,
          serviceFee: 0,
          installment: 3540,
          maximumApplicationFee: 1375,
        },
        {
          loanAmount: 12500,
          applicationFee: 1372.25,
          totalInterest: 877.75,
          serviceFee: 0,
          installment: 3688,
          maximumApplicationFee: 1425,
        },
        {
          loanAmount: 13000,
          applicationFee: 1427.14,
          totalInterest: 912.86,
          serviceFee: 0,
          installment: 3835,
          maximumApplicationFee: 1475,
        },
        {
          loanAmount: 13500,
          applicationFee: 1482.03,
          totalInterest: 947.97,
          serviceFee: 0,
          installment: 3983,
          maximumApplicationFee: 1525,
        },
        {
          loanAmount: 14000,
          applicationFee: 1536.92,
          totalInterest: 983.08,
          serviceFee: 0,
          installment: 4130,
          maximumApplicationFee: 1575,
        },
        {
          loanAmount: 14500,
          applicationFee: 1591.81,
          totalInterest: 1018.19,
          serviceFee: 0,
          installment: 4278,
          maximumApplicationFee: 1625,
        },
        {
          loanAmount: 15000,
          applicationFee: 1646.7,
          totalInterest: 1053.3,
          serviceFee: 0,
          installment: 4425,
          maximumApplicationFee: 1675,
        },
        {
          loanAmount: 15500,
          applicationFee: 1701.59,
          totalInterest: 1088.41,
          serviceFee: 0,
          installment: 4573,
          maximumApplicationFee: 1725,
        },
        {
          loanAmount: 16000,
          applicationFee: 1756.48,
          totalInterest: 1123.52,
          serviceFee: 0,
          installment: 4720,
          maximumApplicationFee: 1775,
        },
        {
          loanAmount: 16500,
          applicationFee: 1811.37,
          totalInterest: 1158.63,
          serviceFee: 0,
          installment: 4868,
          maximumApplicationFee: 1825,
        },
        {
          loanAmount: 17000,
          applicationFee: 1866.26,
          totalInterest: 1193.74,
          serviceFee: 0,
          installment: 5015,
          maximumApplicationFee: 1875,
        },
        {
          loanAmount: 17500,
          applicationFee: 1921.15,
          totalInterest: 1228.85,
          serviceFee: 0,
          installment: 5163,
          maximumApplicationFee: 1925,
        },
        {
          loanAmount: 18000,
          applicationFee: 1975,
          totalInterest: 1263.96,
          serviceFee: 0.287892599,
          installment: 5310,
          maximumApplicationFee: 1975,
        },
        {
          loanAmount: 18500,
          applicationFee: 2025,
          totalInterest: 1299.07,
          serviceFee: 1.588059855,
          installment: 5310,
          maximumApplicationFee: 2025,
        },
        {
          loanAmount: 19000,
          applicationFee: 2075,
          totalInterest: 1334.18,
          serviceFee: 2.88822711,
          installment: 5605,
          maximumApplicationFee: 2075,
        },
        {
          loanAmount: 19500,
          applicationFee: 2125,
          totalInterest: 1369.29,
          serviceFee: 4.188394366,
          installment: 5753,
          maximumApplicationFee: 2125,
        },
        {
          loanAmount: 20000,
          applicationFee: 2175,
          totalInterest: 1404.4,
          serviceFee: 5.488561621,
          installment: 5900,
          maximumApplicationFee: 2175,
        },
      ];

      const createdLoanTableEntries = [];

      for (const loanData of loanTableData) {
        // Check if loan table entry already exists by loan amount
        const existingLoanTable = await this.loanTableRepository.findOne({
          where: { loanAmount: loanData.loanAmount },
        });

        if (!existingLoanTable) {
          // Create new loan table entry
          const newLoanTable = this.loanTableRepository.create(loanData);
          const savedLoanTable = await this.loanTableRepository.save(
            newLoanTable,
          );
          createdLoanTableEntries.push(savedLoanTable);
        }
      }

      if (createdLoanTableEntries.length > 0) {
        return `Successfully seeded ${
          createdLoanTableEntries.length
        } new loan table entries for amounts: ${createdLoanTableEntries
          .map((lt) => lt.loanAmount)
          .join(', ')}`;
      } else {
        return 'All loan table entries already exist, no new entries were created';
      }
    } catch (error) {
      console.error('Error seeding loan table:', error);
      throw error;
    }
  }

  async seedSuperUser() {
    try {
      // Check if super user already exists
      const existingSuperUser = await this.userRepository.findOne({
        where: { email: 'superuser@mlfafrica.org' },
      });

      if (existingSuperUser) {
        return `Super user already exists: ${existingSuperUser.firstName} ${existingSuperUser.lastName}`;
      }

      // Get the head office (super user should be assigned to head office)
      const headOffice = await this.officeRepository.findOne({
        where: { parent: null },
      });

      if (!headOffice) {
        return 'Head office does not exist. Please create head office first.';
      }

      // Create super user data
      const superUserData = {
        firstName: 'System',
        lastName: 'System',
        email: 'superuser@mlfafrica.org',
        username: 'superuser',
        password: generateHash('Qwerty@123'),
        phone: '+260000000000', // Default phone number
        role: RoleType.SUPER_USER,
        office: headOffice,
      };

      // Create new super user
      const newSuperUser = this.userRepository.create(superUserData);
      const savedSuperUser = await this.userRepository.save(newSuperUser);

      return `Successfully created super user: ${savedSuperUser.firstName} ${savedSuperUser.lastName} (${savedSuperUser.email})`;
    } catch (error) {
      console.error('Error seeding super user:', error);
      throw error;
    }
  }

  async seedLoans() {
    try {
      const loansData = flattenLoansToGroups(LOANS_DATA);
      const results = loansData.map(async (loanData) => {
        const centerName = ensureSpaceBeforeTrailingNumber(
          loanData.center?.trim(),
        );
        console.log(
          'CENTER NAME INPUT',
          loanData.center,
          'CENTER NAME OUTPUT',
          centerName,
        );
        const center = await this.entityManager
          .createQueryBuilder(Center, 'center')
          .where('center.name ILIKE :name', { name: centerName })
          .getOne();

        const foundGroups = await this.findAllGroupsByNameAndCenter(
          center,
          loanData.groups,
        );

        return foundGroups;
      });

      await Promise.all(results);
      // return { ...found };
    } catch (error) {
      console.error('Error seeding loans:', error);
    }
  }

  async findAllGroupsByNameAndCenter(center: Center, groups: Group[]) {
    if (!center?.user) {
      console.log('not user: ', center);
      return 'not user';
    }
    const foundGroups = [];
    const notCreatedLoans = [];
    const user = await this.userRepository.findOne({
      where: {
        id: center?.user,
      },
    });

    const results = groups.map(async (group) => {
      const foundGroup = await this.entityManager
        .createQueryBuilder(GroupEntity, 'group')
        .where('group.name ILIKE :name', { name: group.group })
        .andWhere('group.center.id = :centerId', { centerId: center.id })
        .getOne();

      if (!foundGroup) {
        notCreatedLoans.push({
          group: group.group,
          center: center.name,
        });
      } else {
        const groupLoanApplication: CreateLoanDto = {
          clientApplications: await this.createClientLoanApplications(
            group.clients,
          ),
          groupId: foundGroup.id,
          loanOfficerId: center.user,
          loanProduct: '4 months business loan',
          status: 'Pending',
          targetDisbursementDate: new Date(
            group.clients[0]?.date,
          ).toDateString(),
          totalLoanAmount: group.clients.reduce(
            (acc, client) => acc + parseInt(client.amount),
            0,
          ),
          createdAt: new Date().toISOString(),
        };
        foundGroups.push(groupLoanApplication);
        console.log('GROUP LOAN APPLICATION', groupLoanApplication);
        await this.loanService.create(groupLoanApplication, user);
        console.log('LOAN CREATED', groupLoanApplication);
        return groupLoanApplication;
      }
    });

    await Promise.all(results);
    return {
      loansCreated: foundGroups,
      notCreatedLoans,
    };
  }

  async createClientLoanApplications(clients: Client[]) {
    const createdLoanApplications: ClientApplicationDto[] = [];

    const results = clients.map(async (client) => {
      const existingClient = await this.clientRepository.findOne({
        where: [
          { nationalIdNumber: client.nationalIdNumber },
          { bankAccountNumber: client.account },
          { mobileNumber: client.phone },
        ],
      });
      const loanTable = await this.loanTableRepository.findOne({
        where: {
          loanAmount: parseInt(client.amount),
        },
      });
      console.log('LOAN TABLE FOUND', loanTable);
      if (!loanTable) {
        console.log('Loan table not found for client: ', client.client);
      }

      const loanApplication: ClientApplicationDto = {
        clientId: existingClient.id,
        loanAmount: parseInt(client.amount),
        businessType: 'SME',
        loanTableId: loanTable.id,
      };

      createdLoanApplications.push(loanApplication);
    });

    await Promise.all(results);
    return createdLoanApplications;
  }
}

// rror seeding loans: TypeError: Cannot read properties of null (reading 'user')
//     at SeederService.findAllGroupsByNameAndCenter (/home/mark/.core_banking/core-banking-mini/src/modules/seeder/seeder.service.ts:927:20)
//     at /home/mark/.core_banking/core-banking-mini/src/modules/seeder/seeder.service.ts:907:40
//     at processTicksAndRejections (node:internal/process/task_queues:95:5)
//     at async Promise.all (index 14)
//     at SeederService.seedLoans (/home/mark/.core_banking/core-banking-mini/src/modules/seeder/seeder.service.ts:915:7)
//     at SeederController.seedLoans (/home/mark/.core_banking/core-banking-mini/src/modules/seeder/seeder.controller.ts:95:5)
//     at /home/mark/.core_banking/core-banking-mini/node_modules/@nestjs/core/router/router-execution-context.js:46:28
//     at /home/mark/.core_banking/core-ban

// Cannot read properties of null (reading 'user')
// at SeederService.findAllGroupsByNameAndCenter (/home/mark/.core_banking/core-banking-mini/src/modules/seeder/seeder.service.ts:924:40)
// at /home/mark/.core_banking/core-banking-mini/src/modules/seeder/seeder.service.ts:907:40
// at processTicksAndRejections (node:internal/process/task_queues:95:5)
// at async Promise.all (index 14)
// at SeederService.seedLoans (/home/mark/.core_banking/core-banking-mini/src/modules/seeder/seeder.service.ts:915:7)
// at SeederController.seedLoans (/home/mark/.core_banking/core-banking-mini/src/modules/seeder/seeder.controller.ts:95:5)
// at /home/mark/.core_banking/core-banking-mini/node_modules/@nestjs/core/router/router-execution-context.js:46:28
// at /home/mark/.core_banking/core-banking-mini/node_modul
