/** @verp-module alias=root.widget */
import { PublicRoot, createPublicRoot } from "./public_root";

export default createPublicRoot(PublicRoot);

// Out:
// verp.define("@web/../lib/abc", async function (require) {
//   'use strict';
//   let __exports = {};
//   /** @verp-module alias=root.widget */
//   const { PublicRoot, createPublicRoot } = require("@web/../lib/public_root");

//   __exports[Symbol.for("default")] = createPublicRoot(PublicRoot);

//   return __exports;
// })

// verp.define("root.widget", async function (require) {
//   return require("@web/../lib/abc")[Symbol.for("default")];
// }) 
