var SimpleStorage = artifacts.require("./SimpleStorage.sol");
var Oracle = artifacts.require("./Oracle.sol");
var OracleResolver = artifacts.require("./OracleResolver.sol");
//var Auction = artifacts.require("./Auction.sol");
var AuctionFactory = artifacts.require("./AuctionFactory.sol");

  module.exports = function(deployer) {

    deployer.deploy(SimpleStorage);
    deployer.deploy(Oracle);
    deployer.deploy(OracleResolver);
    deployer.deploy(AuctionFactory);

};
