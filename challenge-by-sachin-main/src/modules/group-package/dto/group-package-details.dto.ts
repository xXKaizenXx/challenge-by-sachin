import { ApiProperty } from '@nestjs/swagger';
import { GroupPackageEntity } from '../entities/group-package.entity';
import { BaseResponseDto } from '../../../common/dtos/base-response.dto';

interface OfficeDetails {
    id: string;
    name: string;
}

interface CenterDetails {
    id: string;
    name: string;
    centerCode: string;
    meetingDay?: string;
}
interface GroupDetails {
    id: string;
    name: string;
    systemName: string;
    // active: string;
    createdAt: Date;
    // meetingDay: string
    groupLeader
}

interface UserDetails {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    phone: string;
    email: string;
}

interface LoanDetails {
    id: string;
    principal: number;
    status: string;
    expectedDisbursementDate: Date;
    loanProductName: string;
    apr: number;
    applicationFee: number;
    serviceFee: number;
    totalInterest: number;
    interestBreakDown: object;
    numberOfRepayments: number;
    repaymentEvery: string;
    businessType: string;
    client: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        gender: string;
        nationalIdNumber: string;
        mobileNumber: string;
    } | null;
}

export class GroupPackageDetailsDto {
    @ApiProperty({ example: 'a1b2c3d4-5678-90ab-cdef-1234567890ab' })
    id: string;

    @ApiProperty({ example: 'g1h2i3j4-5678-90ab-cdef-1234567890ab' })
    groupId: string;

    @ApiProperty({ example: 'Group Alpha' })
    groupName: string;

    @ApiProperty({ example: 'u1v2w3x4-5678-90ab-cdef-1234567890ab' })
    userId: string;

    @ApiProperty({ example: 'loanofficer1' })
    username: string;

    @ApiProperty({ example: 'Pending' })
    status: string;

    @ApiProperty({ example: '2025-09-01T10:00:00.000Z' })
    createdAt: Date;

    @ApiProperty({ example: '2025-09-10T10:00:00.000Z' })
    updatedAt: Date;

    @ApiProperty({ example: 'branchmanager1', nullable: true })
    approvedBy?: string;

    @ApiProperty({ example: 1000 })
    amount: number;

    @ApiProperty({ example: 1100 })
    totalExpectedRepayment: number;

    @ApiProperty({ example: 'o1p2q3r4-5678-90ab-cdef-1234567890ab' })
    officeId: string;

    @ApiProperty({ type: () => Object })
    office: OfficeDetails;

    @ApiProperty({ type: () => Object })
    user: UserDetails;

    @ApiProperty({ type: () => Object })
    group: GroupDetails;

    @ApiProperty({ type: () => Object })
    center: CenterDetails;

    @ApiProperty({ 
        type: () => [Object],
        description: 'Array of loans with detailed product information, APR, and fees',
        example: [{
            id: 'loan-id',
            principal: 2500,
            status: 'Pending',
            expectedDisbursementDate: '2025-10-31',
            loanProductName: 'Microfinance Plus',
            apr: 24.5,
            applicationFee: 50,
            serviceFee: 25,
            totalInterest: 300,
            interestBreakDown: { monthly: 25 },
            numberOfRepayments: 12,
            repaymentEvery: 'Monthly',
            businessType: 'BS',
            client: {
                id: 'client-id',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                gender: 'male',
                nationalIdNumber: '1234567890',
                mobileNumber: '123-456-7890'
            }
        }]
    })
    loans: LoanDetails[];

    @ApiProperty({ 
        example: { dates: ['2025-10-10', '2025-11-10', '2025-12-10', '2026-01-10'] }, 
        nullable: true,
        description: 'Repayment schedule dates'
    })
    repaymentDates?: object;

    constructor(entity: GroupPackageEntity) {
        this.id = entity.id;
        this.groupId = entity.groupId;
        this.groupName = entity.groupName;
        this.userId = entity.userId;
        this.username = entity.username;
        this.status = entity.status;
        this.createdAt = entity.createdAt;
        this.updatedAt = entity.updatedAt;
        this.approvedBy = entity.approvedBy;
        this.amount = entity.amount;
        this.totalExpectedRepayment = entity.totalExpectedRepayment;
        this.officeId = entity.officeId;
        this.repaymentDates = entity.repaymentDates['dates'];

        // Office details
        this.office = entity.office ? {
            id: entity.office.id,
            name: entity.office.name,
        } : null;

        // User details
        this.user = entity.user ? {
            id: entity.user.id,
            username: entity.user.username,
            firstName: entity.user.firstName,
            lastName: entity.user.lastName,
            role: entity.user.role,
            phone: entity.user.phone,
            email: entity.user.email,
        } : null;

        // Group details (get from the first loan's group)
        const firstLoan = entity.loans?.[0];
        this.group = firstLoan?.group ? {
            id: firstLoan.group.id,
            name: firstLoan.group.name,
            systemName: firstLoan.group.systemName,
            groupLeader: firstLoan.group.groupLeader,
            createdAt: firstLoan.group.createdAt,
        } : null;

        // Center details (get from the group's center)
        this.center = firstLoan?.group?.center ? {
            id: firstLoan.group.center.id,
            name: firstLoan.group.center.name,
            centerCode: firstLoan.group.center.centerCode,
            meetingDay: firstLoan.group.center.meetingDates?.day
        } : null;

        // Loan details with product information and client data
        this.loans = entity.loans ? entity.loans.map(loan => ({
            id: loan.id,
            principal: loan.principal,
            expectedDisbursementDate: loan.expectedDisbursementDate,
            status: loan.status,
            loanProductName: loan.loanProductName,
            apr: loan.apr,
            applicationFee: loan.applicationFee,
            serviceFee: loan.serviceFee,
            totalInterest: loan.totalInterest,
            interestBreakDown: loan.interestBreakDown,
            numberOfRepayments: loan.numberOfRepayments,
            repaymentEvery: loan.repaymentEvery,
            businessType: loan.businessType,
            client: loan.client ? {
                id: loan.client.id,
                firstName: loan.client.firstName,
                lastName: loan.client.lastName,
                gender: loan.client.gender,
                email: loan.client.emailAddress,
                nationalIdNumber: loan.client.nationalIdNumber,
                mobileNumber: loan.client.mobileNumber
            } : null,
        })) : [];
    }
}

export class GroupPackageDetailsResponseDto extends BaseResponseDto<GroupPackageDetailsDto> {
    static fromGroupPackage(
        groupPackage: GroupPackageDetailsDto | null,
        message = 'Group package details retrieved successfully',
    ): GroupPackageDetailsResponseDto {
        return BaseResponseDto.from(
            groupPackage,
            !!groupPackage,
            message,
        ) as GroupPackageDetailsResponseDto;
    }
}