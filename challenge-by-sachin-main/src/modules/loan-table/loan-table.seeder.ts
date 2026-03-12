import { DataSource } from 'typeorm';
import { LoanTable } from './entities/loan-table.entity';

type Row = {
  loanAmount: number;
  applicationFee: number;
  totalInterest: number;
  serviceFee: number;
  installment: number;
  maximumApplicationFee: number;
};

export async function updateLoanTableByAmount(dataSource: DataSource) {

  const rows: Row[] = [
    { loanAmount: 1000, applicationFee: 156.7063259, totalInterest: 103.2936741, serviceFee: 0, installment: 210, maximumApplicationFee: 316.25 },
    { loanAmount: 1500, applicationFee: 235.0594889, totalInterest: 154.9405111, serviceFee: 0, installment: 315, maximumApplicationFee: 373.75 },
    { loanAmount: 2000, applicationFee: 313.4126519, totalInterest: 206.5873481, serviceFee: 0, installment: 420, maximumApplicationFee: 431.25 },
    { loanAmount: 2500, applicationFee: 391.7658148, totalInterest: 258.2341852, serviceFee: 0, installment: 525, maximumApplicationFee: 488.75 },
    { loanAmount: 3000, applicationFee: 470.1189778, totalInterest: 309.8810222, serviceFee: 0, installment: 630, maximumApplicationFee: 546.25 },
    { loanAmount: 3500, applicationFee: 548.4721408, totalInterest: 359.4318011, serviceFee: 0, installment: 735, maximumApplicationFee: 603.75 },
    { loanAmount: 4000, applicationFee: 626.8253037, totalInterest: 408.5467056, serviceFee: 0, installment: 840, maximumApplicationFee: 661.25 },
    { loanAmount: 4500, applicationFee: 705.1784667, totalInterest: 457.6616102, serviceFee: 0, installment: 945, maximumApplicationFee: 718.75 },
    { loanAmount: 5000, applicationFee: 776.25, totalInterest: 515.8181221, serviceFee: 1.321979654, installment: 1050, maximumApplicationFee: 776.25 },
    { loanAmount: 5500, applicationFee: 833.75, totalInterest: 565.6027753, serviceFee: 5.107870787, installment: 1155, maximumApplicationFee: 833.75 },
    { loanAmount: 6000, applicationFee: 891.25, totalInterest: 615.3874285, serviceFee: 8.89376192, installment: 1260, maximumApplicationFee: 891.25 },
    { loanAmount: 6500, applicationFee: 948.75, totalInterest: 665.1720817, serviceFee: 12.67965305, installment: 1365, maximumApplicationFee: 948.75 },
    { loanAmount: 7000, applicationFee: 1006.25, totalInterest: 714.9567349, serviceFee: 16.46554419, installment: 1470, maximumApplicationFee: 1006.25 },
    { loanAmount: 7500, applicationFee: 1063.75, totalInterest: 764.7413881, serviceFee: 20.25143532, installment: 1575, maximumApplicationFee: 1063.75 },
    { loanAmount: 8000, applicationFee: 1121.25, totalInterest: 814.5260413, serviceFee: 24.03732645, installment: 1680, maximumApplicationFee: 1121.25 },
    { loanAmount: 8500, applicationFee: 1178.75, totalInterest: 864.3106945, serviceFee: 27.82321758, installment: 1785, maximumApplicationFee: 1178.75 },
    { loanAmount: 9000, applicationFee: 1236.25, totalInterest: 914.0953477, serviceFee: 31.60910872, installment: 1885, maximumApplicationFee: 1236.25 },
    { loanAmount: 9500, applicationFee: 1293.75, totalInterest: 963.8800009, serviceFee: 35.39499985, installment: 1985, maximumApplicationFee: 1293.75 },
    { loanAmount: 10000, applicationFee: 1351.25, totalInterest: 1013.664654, serviceFee: 39.18089098, installment: 2080, maximumApplicationFee: 1351.25 },
    { loanAmount: 10500, applicationFee: 1408.75, totalInterest: 1063.449307, serviceFee: 42.96678212, installment: 2185, maximumApplicationFee: 1408.75 },
    { loanAmount: 11000, applicationFee: 1466.25, totalInterest: 1113.233961, serviceFee: 46.75267325, installment: 2310, maximumApplicationFee: 1466.25 },
    { loanAmount: 11500, applicationFee: 1523.75, totalInterest: 1163.018614, serviceFee: 50.53856438, installment: 2415, maximumApplicationFee: 1523.75 },
    { loanAmount: 12000, applicationFee: 1581.25, totalInterest: 1212.803267, serviceFee: 54.32445552, installment: 2520, maximumApplicationFee: 1581.25 },
    { loanAmount: 12500, applicationFee: 1638.75, totalInterest: 1262.58792, serviceFee: 58.11034665, installment: 2625, maximumApplicationFee: 1638.75 },
    { loanAmount: 13000, applicationFee: 1696.25, totalInterest: 1312.372573, serviceFee: 61.89623778, installment: 2730, maximumApplicationFee: 1696.25 },
    { loanAmount: 13500, applicationFee: 1753.75, totalInterest: 1362.157227, serviceFee: 65.68212891, installment: 2835, maximumApplicationFee: 1753.75 },
    { loanAmount: 14000, applicationFee: 1811.25, totalInterest: 1411.94188, serviceFee: 69.46802005, installment: 2940, maximumApplicationFee: 1811.25 },
    { loanAmount: 14500, applicationFee: 1868.75, totalInterest: 1461.726533, serviceFee: 28.25391118, installment: 3000, maximumApplicationFee: 1868.75 },
    { loanAmount: 15000, applicationFee: 1926.25, totalInterest: 1511.511186, serviceFee: 27.03980231, installment: 3100, maximumApplicationFee: 1926.25 },
    { loanAmount: 15500, applicationFee: 1983.75, totalInterest: 1561.295839, serviceFee: 25.82569345, installment: 3200, maximumApplicationFee: 1983.75 },
    { loanAmount: 16000, applicationFee: 2041.25, totalInterest: 1611.080493, serviceFee: 24.61158458, installment: 3300, maximumApplicationFee: 2041.25 },
    { loanAmount: 16500, applicationFee: 2098.75, totalInterest: 1660.865146, serviceFee: 23.39747571, installment: 3400, maximumApplicationFee: 2098.75 },
    { loanAmount: 17000, applicationFee: 2156.25, totalInterest: 1710.649799, serviceFee: 22.18336685, installment: 3500, maximumApplicationFee: 2156.25 },
    { loanAmount: 17500, applicationFee: 2213.75, totalInterest: 1760.434452, serviceFee: 20.96925798, installment: 3600, maximumApplicationFee: 2213.75 },
    { loanAmount: 18000, applicationFee: 2271.25, totalInterest: 1810.219105, serviceFee: 19.75514911, installment: 3700, maximumApplicationFee: 2271.25 },
    { loanAmount: 18500, applicationFee: 2328.75, totalInterest: 1860.003759, serviceFee: 18.54104024, installment: 3800, maximumApplicationFee: 2328.75 },
    { loanAmount: 19000, applicationFee: 2386.25, totalInterest: 1909.788412, serviceFee: 17.32693138, installment: 3900, maximumApplicationFee: 2386.25 },
    { loanAmount: 19500, applicationFee: 2443.75, totalInterest: 1959.573065, serviceFee: 16.11282251, installment: 4000, maximumApplicationFee: 2443.75 },
    { loanAmount: 20000, applicationFee: 2501.25, totalInterest: 2009.357718, serviceFee: 14.89871364, installment: 4100, maximumApplicationFee: 2501.25 },
  ];

  await dataSource.transaction(async (manager) => {
    await manager
      .createQueryBuilder()
      .insert()
      .into(LoanTable)
      .values(
        rows.map((r) => ({
          loanAmount: r.loanAmount,
          applicationFee: r.applicationFee,
          totalInterest: r.totalInterest,
          serviceFee: r.serviceFee,
          installment: r.installment,
          maximumApplicationFee: Math.round(r.maximumApplicationFee), // int column
          termLength: 6,
          termUnit: 'months',
        })),
      )
      // key point: NO UPDATE, just skip conflicts
      .orIgnore()
      .execute();
  });

  console.log(`LoanTable updated: ${rows.length} rows processed.`);
}