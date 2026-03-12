import * as fs from 'fs';
import { parse } from 'csv-parse';

export async function readCsvFile(): Promise<any[]> {
  const path = require('path');
  const filePath = path.join(process.cwd(), 'Lusaka.csv');
  console.log('filePath: ', filePath);
  return new Promise((resolve, reject) => {
    const records: any[] = [];
    fs.createReadStream(filePath)
      .pipe(parse({ columns: true, trim: true }))
      .on('data', (data) => {
        console.log('data', data);

        return records.push(data);
      })
      .on('end', () => resolve(records))
      .on('error', (err) => reject(err));
    console.log('records: ', records);
  });
}
