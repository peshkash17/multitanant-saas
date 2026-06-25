import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

export function getJwtVerifyConfig(config: ConfigService): {
  secretOrKey: string;
  algorithms: ('HS256' | 'RS256')[];
} {
  const pubKeyPath = config.get<string>('JWT_PUBLIC_KEY_PATH');

  if (pubKeyPath && fs.existsSync(pubKeyPath)) {
    return {
      secretOrKey: fs.readFileSync(pubKeyPath, 'utf8'),
      algorithms: ['RS256'],
    };
  }

  return {
    secretOrKey: config.get<string>('JWT_SECRET', 'dev-secret-key'),
    algorithms: ['HS256'],
  };
}

export function getJwtSignConfig(config: ConfigService): {
  secret: string | Buffer;
  algorithm: 'HS256' | 'RS256';
} {
  const privKeyPath = config.get<string>('JWT_PRIVATE_KEY_PATH');

  if (privKeyPath && fs.existsSync(privKeyPath)) {
    return {
      secret: fs.readFileSync(privKeyPath),
      algorithm: 'RS256',
    };
  }

  return {
    secret: config.get<string>('JWT_SECRET', 'dev-secret-key'),
    algorithm: 'HS256',
  };
}
