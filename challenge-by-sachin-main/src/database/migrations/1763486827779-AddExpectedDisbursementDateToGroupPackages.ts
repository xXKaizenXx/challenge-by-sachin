import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddExpectedDisbursementDateToGroupPackages1763486827779 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('group_packages');
    const columnExists = table?.findColumnByName('expected_disbursement_date');

    if (!columnExists) {
      await queryRunner.addColumn(
        'group_packages',
        new TableColumn({
          name: 'expected_disbursement_date',
          type: 'date',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('group_packages');
    const columnExists = table?.findColumnByName('expected_disbursement_date');

    if (columnExists) {
      await queryRunner.dropColumn('group_packages', 'expected_disbursement_date');
    }
  }

}
