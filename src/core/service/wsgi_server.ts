import { tools } from "..";
import { root } from "../http";
import { NotFound, ProxyFix } from "./middleware";

async function applicationUnproxied(req: any, res: any) {
  if (global.processing) {
    return (new NotFound(res, 'Debug is in proccess.\n'))(req, res);
  }
  return root(req, res);
}

export function application(req, res) {
  if (tools.config.options['proxyMode'] && req.hasHeader('X-Forwarded-Host')) {
    return (new ProxyFix(applicationUnproxied))(req, res);
  }
  else {
    return applicationUnproxied(req, res);
  }
}