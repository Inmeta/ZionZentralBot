"use strict";
var spAuth = require("node-sp-auth");
var config = require("./config");
var nodeFetch = require("node-fetch");

global.Headers = nodeFetch.Headers;
global.Request = nodeFetch.Request;
global.Response = nodeFetch.Response;
global.fetch = nodeFetch;

var addInOptions = {
    clientId: "{ client id }",
    clientSecret: "{ client secret}"
};

var userCredentials = {
    password: config.pass,
    username: config.user,
};
var siteUrl = "https://inmetademo.sharepoint.com/";

var getAuthHeaders = function () {
    return spAuth.getAuth(siteUrl, userCredentials).then(function (response) {
        return new Promise(function (resolve) {
            var headers = response.headers;
            resolve(headers);
        });
    });
};

exports.getAuthHeaders = getAuthHeaders;
