//
// Sample Intelligent.li application using Meteor
// 

//certificates for accessing ili
var clientPem = process.env.CERT || Assets.getText('client.pem');
var keyPem = process.env.KEY || Assets.getText('client.pem');
var caPem = Assets.getText('intelligent.li-ca.crt');
var WebSocket = Meteor.require('ws');

Meteor.startup(function () {
  ili.Api.instance.certs = { cert: clientPem, key: keyPem, ca: caPem }; 
  ili.Api.instance.start();
});
