"use strict";
var sp_pnp_js = require("sp-pnp-js");
var AuthenticationHelper = require("./AuthenticationHelper");

/**
 * returns authentication headers or pnp object if passed
 */
// var getAuthHeaders = function(pnp) {
//   return new Promise(function(resolve, reject) {
//     // Get headers
//     return AuthenticationHelper.getAuthHeaders()
//         .then(function (headers) {
//           if(pnp)
//             pnp.setup ? pnp.setup({ headers: headers }) && resolve(pnp) : null; 
//           else
//             resolve(headers);
//         }).catch(e, function(e){
//           console.log(e);
//         });
//   })
// }

module.exports = AuthenticationHelper.getAuthHeaders;  