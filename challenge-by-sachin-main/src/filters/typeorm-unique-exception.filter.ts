import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

const UNIQUE_VIOLATION_CODE = '23505';

const uniqueFieldsMessages: Record<string, string> = {
  // Client-specific unique fields (more specific first)
  national_id_number: 'A client with this national ID number already exists',
  mobile_number: 'A client with this mobile number already exists',
  email_address: 'A client with this email address already exists',
  bank_account_number: 'A client with this bank  account number already exists',
  // Generic field mappings (more specific first)
  nationalIdNumber: 'A client with this national ID number already exists',
  mobileNumber: 'A client with this mobile number already exists',
  emailAddress: 'A client with this email address already exists',
  bankAccountNumber: 'A client with this bank account number already exists',
  // Group-specific unique fields
  system_name: 'A group with this system name already exists',
  name: 'A group with this name already exists',
  // Generic fields (less specific last)
  username: 'Username already exists',
  email: 'Email already exists',
  phone: 'Phone number already exists',
};

@Catch(QueryFailedError)
export class TypeOrmUniqueExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    console.log('exception', exception);
    if ((exception as any).code === UNIQUE_VIOLATION_CODE) {
      const detail = (exception as any).detail || '';
      const table = (exception as any).table || '';

      // Check for specific field matches in the detail message
      for (const [field, message] of Object.entries(uniqueFieldsMessages)) {
        if (
          detail.includes(field) ||
          detail.includes(field.replace(/([A-Z])/g, '_$1').toLowerCase())
        ) {
          return response.status(409).json({
            statusCode: 409,
            message,
            error: 'Conflict',
          });
        }
      }
      console.log('detail', detail);

      // If no specific field match, provide a generic message
      return response.status(409).json({
        statusCode: 409,
        message: 'Duplicate field value violates unique constraint',
        error: 'Conflict',
      });
    }

    // For other QueryFailedErrors, fallback to 500
    return response.status(500).json({
      statusCode: 500,
      message: 'Internal server error',
      error: 'InternalServerError',
    });
  }
}
