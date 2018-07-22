const helpers = require('./helpers');
const ethUtil = require('ethereumjs-util')
const should =  helpers.should;
const duration = helpers.duration;
const latestTime = helpers.latestTime;
const BigNumber = helpers.BigNumber;
const timeTravelTo = helpers.timeTravelTo;
const EVMThrow = helpers.EVMThrow;
const ether = helpers.ether;
const buyTokens = helpers.buyTokens;
const advanceBlock = helpers.advanceBlock;


const Crowdsale = artifacts.require('./../contracts/Crowdsale.sol');
const SpitballToken = artifacts.require("./../contracts/SpitballToken.sol");
const Database = artifacts.require("./../contracts/ERC865Database.sol");


const formattedAddress = (address) => {
  return  Buffer.from(ethUtil.stripHexPrefix(address), 'hex');
};
const formattedInt = (int) => {
  return ethUtil.setLengthLeft(int, 32);
};
const formattedBytes32 = (bytes) => {
  return ethUtil.addHexPrefix(bytes.toString('hex'));
};
const hashedTightPacked = (args) => {
  return ethUtil.sha3(Buffer.concat(args));
};


const fundingGoal = 10000;
const saleDuration = 1000;
const etherCost = 1000000000000000000;


contract('Crowdsale', ([alice, bob, charlie, damiens, owner]) => {
  let database, token, crowdsale;
  let saleDurationTimestamp;

  before(async () => {
    await advanceBlock()
  })


  beforeEach(async () => {
    database = await Database.new({from: owner});
    token = await SpitballToken.new(database.address, {from: owner});
    crowdsale = await Crowdsale.new(owner, fundingGoal, saleDuration, etherCost, token.address, {from:owner});
    saleDurationTimestamp = latestTime() + duration.minutes(saleDuration);
  	await token.mint(crowdsale.address, fundingGoal * etherCost, {from: owner});
  	await crowdsale.addAddressToWhitelist(alice, {from : owner});
  	await crowdsale.addAddressToWhitelist(bob, {from : owner});
  	await crowdsale.addAddressToWhitelist(charlie, {from : owner});
  	await crowdsale.addAddressToWhitelist(damiens, {from : owner});
    await crowdsale.addAddressToWhitelist(owner, {from: owner});
  });

  describe('When considering the crowdsale has all predefined features: ', () => {
  	
  	it('should have a beneficiary', async () => {
  		let _beneficiary = await crowdsale.beneficiary();
  		_beneficiary.should.be.equal(owner);
  	})

  	it('should have a funding goal', async () => {
  		let _fundingGoal = (await crowdsale.fundingGoal()).toNumber();
  		_fundingGoal.should.be.equal(etherCost * fundingGoal);
  	});

  	it('should have a sale duration', async () => {
  		let _saleDuration = (await crowdsale.deadline()).toNumber();
  		_saleDuration.should.be.equal(saleDurationTimestamp);
  	});

  	it('should have a ether cost', async () => {
  		let _etherCost = (await crowdsale.price()).toNumber();
  		_etherCost.should.be.equal(etherCost);
  	});

  	it('should have a SpitballToken address as a token supply', async () => {
  		let _tokenAddress = (await crowdsale.tokenReward());
  		_tokenAddress.should.be.equal(token.address);
  	})

  	it('should have a supply', async () => {
  		let balance = (await token.balanceOf(crowdsale.address)).toNumber();
  		balance.should.be.equal(fundingGoal * etherCost);
  	});
  });


  describe('When considering that payment function are working: ', () => {

  	it('should accept payment and transfer tokens to contributor before crowdsale closed and funding goal reached', async () => {
  		const contributionSum = 10 * etherCost;
  		await crowdsale.buyTokens({value: contributionSum, from: alice});

  		let balance = (await token.balanceOf(alice)).toNumber();
  		balance.should.be.equal(10);
  	});


  	it('should not accept payment after the deadline', async () => {
  		const afterTheDeadline = latestTime() + duration.minutes(1000);
  		await timeTravelTo(afterTheDeadline);

  		const contributionSum = 10 * etherCost;

  		try {
  			await crowdsale.buyTokens({value: contributionSum, from: alice});	
  		} catch (err) {}
  	});


  	describe('it should: ', () => {

  		it(`set crowdsale to closed and funding goal won't be reached in case of 10 ETH total contribution`, async () => {
  			const contributionSum = 10 * etherCost;
  			const afterTheDeadline = latestTime() + duration.minutes(1000);

  			await crowdsale.buyTokens({value: contributionSum, from: alice});
  			await timeTravelTo(afterTheDeadline);
  			await crowdsale.checkGoalReached();

  			const _fundingGoalReached = await crowdsale.fundingGoalReached();
  			const _crowdsaleClosed = await crowdsale.crowdsaleClosed();

  			_fundingGoalReached.should.be.equal(false);
  			_crowdsaleClosed.should.be.equal(true); 
  		});

  		it('set crowdsale to closed and funding goal will be reached in case of 10000 ETH total contribution', async () => {
  			const contributionSum = 10000 * etherCost;
  			const afterTheDeadline = latestTime() + duration.minutes(1000);

  			await crowdsale.buyTokens({value: contributionSum, from: alice});
  			await timeTravelTo(afterTheDeadline);
  			await crowdsale.checkGoalReached();

  			const _fundingGoalReached = await crowdsale.fundingGoalReached();
  			const _crowdsaleClosed = await crowdsale.crowdsaleClosed();

  			_fundingGoalReached.should.be.equal(true);
  			_crowdsaleClosed.should.be.equal(true); 
  		});
  	});
  });


  describe('When considering that withdraw is working', () => {

  	it('should transfer funds to beneficiary', async () => {
  		const contributionSum = 10000 * etherCost;
  		const afterTheDeadline = latestTime() + duration.minutes(1000);

  		const beneficiaryBalance = (await web3.eth.getBalance(owner)).toNumber();

  		await crowdsale.buyTokens({value: contributionSum, from: alice});
  		await timeTravelTo(afterTheDeadline);
  		await crowdsale.checkGoalReached();
  		await crowdsale.safeWithdrawal({from: owner});

  		const beneficiaryBalanceAfterWithdraw = (await web3.eth.getBalance(owner)).toNumber();
  		const amountRaised = (await crowdsale.amountRaised()).toNumber();

  		beneficiaryBalanceAfterWithdraw.should.be.equal(beneficiaryBalance + amountRaised);
  	});
  }); 
});
