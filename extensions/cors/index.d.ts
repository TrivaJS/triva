/**
 * Type definitions for @trivajs/cors
 */

export interface CorsOptions {
  /**
   * Configures the Access-Control-Allow-Origin header
   * - string: Specific origin (e.g., 'https://example.com')
   * - string[]: Array of allowed origins
   * - RegExp: Pattern to match origins
   * - Function: Custom validation function
   * - '*': Allow all origins (default)
   */
  origin?: string | string[] | RegExp | ((origin: string) => boolean) | '*';

  /**
   * Configures the Access-Control-Allow-Methods header
   * Default: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE']
   */
  methods?: string[] | string;

  /**
   * Configures the Access-Control-Allow-Headers header
   * If not specified, reflects the request's Access-Control-Request-Headers
   */
  allowedHeaders?: string[];

  /**
   * Configures the Access-Control-Expose-Headers header
   * Default: []
   */
  exposedHeaders?: string[];

  /**
   * Configures the Access-Control-Allow-Credentials header
   * Default: false
   */
  credentials?: boolean;

  /**
   * Configures the Access-Control-Max-Age header (in seconds)
   * Default: null (not set)
   */
  maxAge?: number | null;

  /**
   * Pass the preflight request to the next handler instead of terminating
   * Default: false
   */
  preflightContinue?: boolean;

  /**
   * Status code to use for successful OPTIONS requests
   * Default: 204
   */
  optionsSuccessStatus?: number;
}

export type CorsMiddleware = (req: any, res: any, next: () => void) => void;

/**
 * Main CORS middleware factory
 * @param options - CORS configuration options
 * @returns Middleware function compatible with Triva
 */
export function cors(options?: CorsOptions): CorsMiddleware;

/**
 * Pre-configured CORS for development (allows all origins)
 * @returns Development mode CORS middleware
 */
export function corsDevMode(): CorsMiddleware;

/**
 * Pre-configured strict CORS (specific origin only)
 * @param origin - Single allowed origin
 * @returns Strict mode CORS middleware
 */
export function corsStrict(origin: string): CorsMiddleware;

/**
 * Pre-configured CORS for multiple origins
 * @param origins - Array of allowed origins
 * @returns Multi-origin CORS middleware
 */
export function corsMultiOrigin(origins: string[]): CorsMiddleware;

/**
 * Pre-configured CORS with dynamic origin validation
 * @param validator - Function that validates origin
 * @returns Dynamic validation CORS middleware
 */
export function corsDynamic(validator: (origin: string) => boolean): CorsMiddleware;

export default cors;
