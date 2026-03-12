import { v1 as uuid } from 'uuid';
import { Readable } from 'stream';
import * as config from 'config';

const spaceConfig = config.get('spaces');
import * as AWS from 'aws-sdk';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

interface IFile extends Express.Multer.File {
  name?: string;
}

export class GeneratorProvider {
  static uuid(): string {
    return uuid();
  }

  static fileName(ext: string): string {
    return GeneratorProvider.uuid() + ext;
  }

  static async s3FileUpload(
    file: IFile,
    folder?: string,
  ): Promise<AWS.S3.ManagedUpload.SendData> {
    try {
      file['name'] = GeneratorProvider.fileName(extname(file.originalname));
      const s3 = new AWS.S3({
        accessKeyId: spaceConfig.access_id,
        secretAccessKey: spaceConfig.secret_key,
        endpoint: spaceConfig.endpoint,
        region: spaceConfig.region,
      });

      const fileContent = Readable.from(file.buffer);

      const params = {
        Bucket: spaceConfig.bucket_name,
        Key: folder ? `${folder}/${file.name}` : file.name,
        Body: fileContent,
        ACL: 'public-read',
        ContentType: file.mimetype,
        ContentDisposition: 'inline',
      };

      const response = await s3.upload(params).promise();
      console.log('response', response);
      return response;
    } catch (err) {
      console.error('S3 Upload Error:', err);
      console.error('S3 Config:', {
        endpoint: spaceConfig.endpoint,
        region: spaceConfig.region,
        bucket: spaceConfig.bucket_name,
        accessKeyPresent: !!spaceConfig.access_id,
        secretKeyPresent: !!spaceConfig.secret_key,
      });
      throw new BadRequestException(`File upload failed: ${err.message}`);
    }
  }

  static getS3PublicUrl(key: string): string {
    if (!key) {
      throw new TypeError('key is required');
    }

    // Use the spaces config instead of environment variables
    return `https://${spaceConfig.bucket_name}.${spaceConfig.region}.digitaloceanspaces.com/${key}`;
  }

  static getS3Key(publicUrl: string): string {
    if (!publicUrl) {
      throw new TypeError('key is required');
    }

    // Updated regex pattern for DigitalOcean Spaces
    const exec = new RegExp(
      `(?<=https://${spaceConfig.bucket_name}.${spaceConfig.region}.digitaloceanspaces.com/).*`,
    ).exec(publicUrl);

    if (!exec) {
      throw new TypeError('publicUrl is invalid');
    }

    return exec[0];
  }

  static generateVerificationCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  static generatePassword(): string {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = lowercase.toUpperCase();
    const numbers = '0123456789';

    let text = '';

    for (let i = 0; i < 4; i++) {
      text += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
      text += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
      text += numbers.charAt(Math.floor(Math.random() * numbers.length));
    }

    return text;
  }

  /**
   * generate random string
   * @param length
   */
  static generateRandomString(length: number): string {
    return Math.random()
      .toString(36)
      .replace(/[^\dA-Za-z]+/g, '')
      .slice(0, Math.max(0, length));
  }
}
