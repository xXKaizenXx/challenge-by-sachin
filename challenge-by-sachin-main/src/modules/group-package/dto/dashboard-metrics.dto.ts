export class DashboardMetricsDto {
  amountInArrears: number; // Overdue Loans → Amount in Arrears (Principal Overdue)
  portfolioValue: number;      // Loan Book
  totalExpected: number; // Total Expected
  par1Ratio: number;     // PAR(1) ratio (%)
  par1Value: number;     // PAR(1)
  par30Ratio: number;    // PAR(30) ratio (%)
  par30Value: number;     // PAR(30)

}
