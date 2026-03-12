export class LoanOfficerMetricsDto {
  /**
   * Number of centers assigned to the loan officer
   */
  centersCount: number;

  /**
   * Number of groups with an active loan
   */
  activeGroupsCount: number;

  /**
   * Number of dormant groups (groups without active loans)
   */
  dormantGroupsCount: number;

  /**
   * Number of active clients (clients with loans)
   */
  activeClientsCount: number;

  /**
   * Number of dormant clients (clients without loans)
   */
  dormantClientsCount: number;

  /**
   * Number of active loan packages
   */
  activeLoanPackagesCount: number;

  /**
   * Principal amount of active loan packages
   */
  principalAmountOfActiveLoanPackages: number;

  constructor(partial: Partial<LoanOfficerMetricsDto>) {
    Object.assign(this, partial);
  }
}

export class LoanOfficerMetricsResponseDto {
  message: string;
  data: LoanOfficerMetricsDto;
  
  static from(data: LoanOfficerMetricsDto): LoanOfficerMetricsResponseDto {
    const response = new LoanOfficerMetricsResponseDto();
    response.data = data;
    return response;
  }
}