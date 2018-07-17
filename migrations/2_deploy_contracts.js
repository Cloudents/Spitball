const Token = artifacts.require("./../contracts/SpitballToken.sol");
const Database = artifacts.require("./../contracts/ERC865Database.sol");
const Crowdsale = artifacts.require("./../contracts/Crowdsale.sol");


module.exports = function(deployer, network, accounts) {
  let database, token, crowdsale;

  const owner = accounts[4];
  const fundingGoal = 1000;
  const duration = 10080;
  const etherCost = 1000000000000000000;
  let tokenAddress;

  deployer.deploy(Database).then((instance) => {
  	database = instance;

  	console.log(`Database: ${database.address}`);

  	deployer.deploy(Token, database.address)
  		.then((instance) => {
      
        token = instance;
        tokenAddress = token.address;

  			console.log(`Token: ${instance.address}`);
  		})
      .then((instance) => {

        deployer.deploy(Crowdsale, owner, fundingGoal, duration, etherCost, tokenAddress)
        .then((instance) => {

          crowdsale = instance

          console.log(`Crowdsale: ${instance.address}`);
        })
      });
  });
};