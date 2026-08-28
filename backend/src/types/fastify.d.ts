import "fastify";

export interface AccessTokenPayload {
  parentId: string;
}

declare module "fastify" {
  interface FastifyRequest {
    /** Set by middleware/verifyAuth.ts after a valid access token is verified. */
    parentId: string;
    /** Set by middleware/attachViewerLanguage.ts — the viewer's chosen native
     * language, used to pick which language catalog content is returned in
     * (see services/catalog.service.ts's pickLang()). Only set on routes that
     * register that preHandler (the public /catalog/* routes). */
    viewerLanguage: "vi" | "en" | "ja" | "ko";
    accessJwtVerify<T = AccessTokenPayload>(): Promise<T>;
    refreshJwtVerify<T = AccessTokenPayload>(): Promise<T>;
  }

  interface FastifyReply {
    accessJwtSign(payload: AccessTokenPayload): Promise<string>;
    refreshJwtSign(payload: AccessTokenPayload): Promise<string>;
  }
}
