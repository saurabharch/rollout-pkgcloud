/*
 * client.js: Storage client for Minio S3
 *
 * (C) 2021 Saurabh Kashyap & the Contributors.
 *
 */

var util = require("util"),
  Minio = require("minio"),
  minio = require("../../client"),
  _ = require("lodash");

var Client = (exports.Client = function(options) {
  minio.Client.call(this, options);

  _.extend(this, require("./containers"));
  _.extend(this, require("./files"));

  this.s3 = new Minio.Client(this._minioConfig);
});

util.inherits(Client, minio.Client);
