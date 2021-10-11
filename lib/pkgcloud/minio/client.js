/*
 * client.js: Base client from which all Minio clients inherit from
 *
 * (C) 2021 Saurabh Kashyap & the Contributors.
 *
 */

var util = require("util"),
  Minio = require("minio"),
  base = require("../core/base");

// var userAgent = Minio.util.userAgent();
var Client = (exports.Client = function(options) {
  var self = this;

  base.Client.call(this, options);

  options = options || {};

  // Allow overriding serversUrl in child classes
  this.provider = "minio";
  this.endpoint = options.endpoint;
  this.port = option.port;
  this.useSSL = option.useSSL;
  this.sessionToken = option.sessionToken;
  this.pathStyle = options.pathStyle;
  this.sessionToken = options.sessionToken;
  this.credentials = options.credentials;
  this.partSize = option.partSize || "100mb";
  this.securityGroup = options.securityGroup;
  this.securityGroupId = options.securityGroupId;
  this.version = options.version || "2014-06-15";
  this.protocol = options.protocol || "https://";

  // support either key/accessKey syntax
  this.config.key = this.config.key || options.accessKey;
  this.config.keyId = this.config.keyId || options.accessKeyId;

  this._minioConfig = {
    accessKeyId: this.config.keyId,
    secretAccessKey: this.config.key,
    region: options.region,
    port: option.port,
    useSSL: option.useSSL,
    pathStyle: options.pathStyle,
    sessionToken: options.sessionToken,
    credentials: options.credentials,
    partSize: option.partSize || "100mb"
  };

  // TODO think about a proxy option for pkgcloud
  // enable forwarding to mock test server
  if (options.serversUrl) {
    this._minioConfig.httpOptions = {
      proxy: this.protocol + options.serversUrl
    };
  }

  if (options.endpoint) {
    this._minioConfig.endpoint = new Minio.Endpoint(options.endpoint);
  }

  this.userAgent = util.format("%s %s", self.getUserAgent(), userAgent);

  // Setup a custom user agent for pkgcloud
  // Minio.util.userAgent = function() {
  //   return self.userAgent;
  // };

  if (!this.before) {
    this.before = [];
  }
});

util.inherits(Client, base.Client);

Client.prototype._toArray = function toArray(obj) {
  if (typeof obj === "undefined") {
    return [];
  }

  return Array.isArray(obj) ? obj : [obj];
};

Client.prototype.failCodes = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Resize not allowed",
  404: "Item not found",
  409: "Build in progress",
  413: "Over Limit",
  415: "Bad Media Type",
  500: "Fault",
  503: "Service Unavailable"
};

Client.prototype.successCodes = {
  200: "OK",
  201: "Created",
  202: "Accepted",
  203: "Non-authoritative information",
  204: "No content"
};
