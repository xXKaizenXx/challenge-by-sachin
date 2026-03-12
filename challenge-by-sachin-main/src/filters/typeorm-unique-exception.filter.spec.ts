import { ArgumentsHost } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { TypeOrmUniqueExceptionFilter } from './typeorm-unique-exception.filter';

describe('TypeOrmUniqueExceptionFilter', () => {
  let filter: TypeOrmUniqueExceptionFilter;
  let mockResponse: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new TypeOrmUniqueExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as any;
  });

  it('should handle national ID number unique constraint violation', () => {
    const exception = new QueryFailedError(
      'INSERT INTO clients (national_id_number) VALUES ($1)',
      ['1234567890'],
      new Error('duplicate key value violates unique constraint'),
    );
    (exception as any).code = '23505';
    (exception as any).detail =
      'Key (national_id_number)=(1234567890) already exists.';

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(409);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 409,
      message: 'A client with this national ID number already exists',
      error: 'Conflict',
    });
  });

  it('should handle mobile number unique constraint violation', () => {
    const exception = new QueryFailedError(
      'INSERT INTO clients (mobile_number) VALUES ($1)',
      ['+260977123456'],
      new Error('duplicate key value violates unique constraint'),
    );
    (exception as any).code = '23505';
    (exception as any).detail =
      'Key (mobile_number)=(+260977123456) already exists.';

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(409);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 409,
      message: 'A client with this mobile number already exists',
      error: 'Conflict',
    });
  });

  it('should handle email address unique constraint violation', () => {
    const exception = new QueryFailedError(
      'INSERT INTO clients (email_address) VALUES ($1)',
      ['john@example.com'],
      new Error('duplicate key value violates unique constraint'),
    );
    (exception as any).code = '23505';
    (exception as any).detail =
      'Key (email_address)=(john@example.com) already exists.';

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(409);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 409,
      message: 'A client with this email address already exists',
      error: 'Conflict',
    });
  });

  it('should handle generic unique constraint violation', () => {
    const exception = new QueryFailedError(
      'INSERT INTO clients (unknown_field) VALUES ($1)',
      ['value'],
      new Error('duplicate key value violates unique constraint'),
    );
    (exception as any).code = '23505';
    (exception as any).detail = 'Key (unknown_field)=(value) already exists.';

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(409);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 409,
      message: 'Duplicate field value violates unique constraint',
      error: 'Conflict',
    });
  });

  it('should handle non-unique constraint errors as 500', () => {
    const exception = new QueryFailedError(
      'INSERT INTO clients (invalid_field) VALUES ($1)',
      ['value'],
      new Error('column "invalid_field" does not exist'),
    );
    (exception as any).code = '42703';

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      statusCode: 500,
      message: 'Internal server error',
      error: 'InternalServerError',
    });
  });
});
