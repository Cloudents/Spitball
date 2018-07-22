const Token = artifacts.require("./../contracts/SpitballToken.sol");
const Database = artifacts.require("./../contracts/ERC865Database.sol");
const Crowdsale = artifacts.require("./../contracts/Crowdsale.sol");
const QandA = artifacts.require("./../contracts/QandA.sol");

module.exports = function(deployer, network, accounts) {
  let database, token, crowdsale, qanda;

  const owner = accounts[4];
  const fundingGoalMin = 1000;
  //const fundingGoalMax = 2000;
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

        deployer.deploy(Crowdsale, owner, fundingGoalMin, duration, etherCost, tokenAddress)
        .then((instance) => {

          crowdsale = instance

          console.log(`Crowdsale: ${instance.address}`);
        })
        .then((instance) => {
          deployer.deploy(QandA, tokenAddress)
          .then((instance) => {

            qanda = instance
  
            console.log(`QandA: ${instance.address}`);
          })
        });
        
      });
  });
};
