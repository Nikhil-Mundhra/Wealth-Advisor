import type { Context, Hono, MiddlewareHandler } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import type { z } from 'zod';
import { readJsonBody } from '#core/http/read-json-body.ts';
import { parseContract } from '#core/http/validate-contract.ts';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface RouteContext<Body> {
  readonly c: Context;
  readonly body: Body;
}

export interface RouteDefinition {
  readonly method: HttpMethod;
  readonly path: string;
  readonly middlewares: readonly MiddlewareHandler[];
  readonly handler: (c: Context) => Promise<Response>;
}

interface BuilderState {
  readonly method: HttpMethod;
  readonly path: string;
  readonly middlewares: readonly MiddlewareHandler[];
  readonly bodySchema?: z.ZodType;
  readonly responseSchema?: z.ZodType;
  readonly successStatus: ContentfulStatusCode;
}

// Declarative route: RouteBuilder.post('/login').body(LoginRequest).responds(TokenPairResponse).handle(fn).
// The builder validates the request body and the response against their contracts, so handlers only map
// contract → command → use case → result. Each call returns a new builder; a builder is never mutated.
export class RouteBuilder<Body = undefined, Out = void> {
  private readonly state: BuilderState;

  private constructor(state: BuilderState) {
    this.state = state;
  }

  static get(path: string): RouteBuilder {
    return RouteBuilder.start('get', path);
  }

  static post(path: string): RouteBuilder {
    return RouteBuilder.start('post', path);
  }

  static put(path: string): RouteBuilder {
    return RouteBuilder.start('put', path);
  }

  static patch(path: string): RouteBuilder {
    return RouteBuilder.start('patch', path);
  }

  static delete(path: string): RouteBuilder {
    return RouteBuilder.start('delete', path);
  }

  private static start(method: HttpMethod, path: string): RouteBuilder {
    return new RouteBuilder({ method, path, middlewares: [], successStatus: 200 });
  }

  use(...middlewares: MiddlewareHandler[]): RouteBuilder<Body, Out> {
    return new RouteBuilder({ ...this.state, middlewares: [...this.state.middlewares, ...middlewares] });
  }

  body<S extends z.ZodType>(schema: S): RouteBuilder<z.output<S>, Out> {
    return new RouteBuilder({ ...this.state, bodySchema: schema });
  }

  // Without responds(), the handler returns nothing and the route answers 204.
  responds<S extends z.ZodType>(schema: S, status: ContentfulStatusCode = 200): RouteBuilder<Body, z.input<S>> {
    return new RouteBuilder({ ...this.state, responseSchema: schema, successStatus: status });
  }

  handle(handler: (context: RouteContext<Body>) => Promise<Out>): RouteDefinition {
    const { method, path, middlewares, bodySchema, responseSchema, successStatus } = this.state;
    return {
      method,
      path,
      middlewares,
      handler: async (c) => {
        const body = bodySchema ? parseContract(bodySchema, await readJsonBody(c)) : undefined;
        const out = await handler({ c, body: body as Body });
        if (!responseSchema) return c.body(null, 204);
        return c.json(parseContract(responseSchema, out), successStatus);
      },
    };
  }
}

export function mountRoutes(router: Hono, routes: readonly RouteDefinition[]): void {
  for (const route of routes) {
    // The variadic-handler overload of on() takes the path list form.
    router.on(route.method.toUpperCase(), [route.path], ...route.middlewares, route.handler);
  }
}
