// api/_utils/auth.ts
import jwt, { type JwtHeader, type SigningKeyCallback } from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const client = jwksClient({
  // This URL is dynamically constructed from environment variables
  // for security and flexibility. It must match your Auth0 application's settings.
  jwksUri: `https://pictocat-vib.us.auth0.com/.well-known/jwks.json`
});

function getKey(header: JwtHeader, callback: SigningKeyCallback): void {
  if (!header.kid) {
      return callback(new Error("No se encontró KID en la cabecera del JWT"));
  }
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// Interface for the decoded token payload
export interface DecodedToken {
  iss: string;
  sub: string;
  aud: string[];
  iat: number;
  exp: number;
  azp: string;
  scope: string;
  email?: string;
  'https://pictocat.vercel.app/roles'?: string[];
}

export const verifyToken = (authorizationHeader?: string): Promise<DecodedToken> => {
  return new Promise((resolve, reject) => {
    if (!authorizationHeader) {
      return reject(new Error('No se proporcionó cabecera de autorización.'));
    }

    const token = authorizationHeader.split(' ')[1];
    if (!token) {
      return reject(new Error('Token Bearer no encontrado.'));
    }
    
    // The audience and issuer must exactly match the configuration in your Auth0 API settings.
    jwt.verify(token, getKey, {
      audience: `https://pictocat.vercel.app/api`,
      issuer: `https://pictocat-vib.us.auth0.com/`,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) {
        return reject(err);
      }
      if (!decoded || typeof decoded === 'string') {
          return reject(new Error('No se pudo decodificar el token.'));
      }
      resolve(decoded as DecodedToken);
    });
  });
};