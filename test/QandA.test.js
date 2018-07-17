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


const QandA = artifacts.require('./../contracts/QandA.sol');
const SpitballToken = artifacts.require("./../contracts/SpitballToken.sol");
const Database = artifacts.require("./../contracts/ERC865Database.sol");

const alicePrivateKey = Buffer.from('2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501200', 'hex');
const bobPrivateKey = Buffer.from('2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501201', 'hex');
const damiensPrivateKey = Buffer.from('2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501203', 'hex');


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


contract('QandA', ([alice, bob, charlie, damiens, owner]) => {
	let database, token, qa, tokenToMint;

  before(async () => {
    await advanceBlock()
  })


  beforeEach(async () => {
    database = await Database.new({from: owner});
    token = await SpitballToken.new(database.address, {from: owner});
    qa = await QandA.new(token.address, {from: owner});

    tokenToMint = (await database.amountOfTokenToMint()).toNumber() / 2;
    await token.mint(qa.address, tokenToMint, {from: owner});

  });



   describe('When considering QandA should accept questions and answers', () => {

   	beforeEach(async () => {
   		await token.mint(alice, 200, {from: owner});
   		await token.mint(bob, 200, {from: owner});
      await token.mint(charlie, 200, {from: owner});
     });
 
     
		 it('should submit new question and add it data to mapping' , async () => {
     
		 	const questionId = 1;
      const nonce = 32;
      const from = alice;
      const delegate = damiens;
        
      const fee = 10;
      const amount = 100;
      
      const components = [
        Buffer.from('f7ac9c2e', 'hex'),
        formattedAddress(token.address),
        formattedAddress(qa.address),
        formattedInt(amount),
        formattedInt(fee),
        formattedInt(nonce)
      ];


      const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
      const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);



      const alicePrevBalance = (await token.balanceOf(alice)).toNumber();

		 	await qa.submitNewQuestion(questionId, sig, amount, fee, nonce, {from : damiens});//.should.be.fulfilled;
		 
		 	const allowance = (await token.allowance(qa.address, alice)).toNumber();
      const aliceCurrentBalance = (await token.balanceOf(alice)).toNumber();
  
		  aliceCurrentBalance.should.be.equal(alicePrevBalance - amount - fee);
    
     });
     
     
     it('should submit new answer and add it data to mapping' , async () => { 
          const _qId = 1;
          const _answerId = 'first';
          const fee = 10;
          const amount = 100;
          const nonce = 32;
          const components = [
            Buffer.from('f7ac9c2e', 'hex'),
            formattedAddress(token.address),
            formattedAddress(qa.address),
            formattedInt(amount),
            formattedInt(fee),
            formattedInt(nonce)
          ];
    
          const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
          const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);

          await qa.submitNewAnswer(_qId, _answerId, sig, fee, nonce, {from : damiens}).should.be.fulfilled;
     });
     

     it('shloud get price of question' , async () => {
      const questionId = 1;
      const nonce = 32;
      const from = alice;
      const delegate = damiens;
      const fee = 10;
      const amount = 100;
      const components = [
        Buffer.from('f7ac9c2e', 'hex'),
        formattedAddress(token.address),
        formattedAddress(qa.address),
        formattedInt(amount),
        formattedInt(fee),
        formattedInt(nonce)
      ];
      const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
      const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);

      const alicePrevBalance = (await token.balanceOf(alice)).toNumber();

		 	await qa.submitNewQuestion(questionId, sig, amount, fee, nonce, {from : damiens});//.should.be.fulfilled;
		 
		 	const allowance = (await token.allowance(qa.address, alice)).toNumber();
      const aliceCurrentBalance = (await token.balanceOf(alice)).toNumber();

      aliceCurrentBalance.should.be.equal(alicePrevBalance - amount - fee);
      
      const t = (await qa.getPrice(questionId)).toNumber();
      t.should.be.equal(100);
     });


     it('Shloud UpVote to answer' , async () => {
      const questionId = 1;
      const nonce = 33;
      const from = alice;
      const delegate = damiens;
      const fee = 10;
      const amount = 100;

      const components = [
        Buffer.from('f7ac9c2e', 'hex'),
        formattedAddress(token.address),
        formattedAddress(qa.address),
        formattedInt(amount),
        formattedInt(fee),
        formattedInt(nonce)
      ];

      const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
      const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);

      const alicePrevBalance = (await token.balanceOf(alice)).toNumber();

		 	await qa.submitNewQuestion(questionId, sig, amount, fee, nonce, {from : damiens});
		 
		 	const allowance = (await token.allowance(qa.address, alice)).toNumber();
      const aliceCurrentBalance = (await token.balanceOf(alice)).toNumber();

      aliceCurrentBalance.should.be.equal(alicePrevBalance - amount - fee);
      
     
      const _answerId = 'first';
      const components2 = [
        Buffer.from('f7ac9c2e', 'hex'),
        formattedAddress(token.address),
        formattedAddress(qa.address),
        formattedInt(amount),
        formattedInt(fee),
        formattedInt(nonce)
      ];

      const vrs2 = ethUtil.ecsign(hashedTightPacked(components2), damiensPrivateKey);
      const sig2 = ethUtil.toRpcSig(vrs2.v, vrs2.r, vrs2.s);

      await qa.submitNewAnswer(questionId, _answerId, sig2, fee, nonce, {from : damiens}).should.be.fulfilled;

      const nonce3 = 33;
      const components3 = [
        Buffer.from('f7ac9c2e', 'hex'),
        formattedAddress(token.address),
        formattedAddress(qa.address),
        formattedInt(amount/2),
        formattedInt(fee),
        formattedInt(nonce3)
      ];

      const vrs3 = ethUtil.ecsign(hashedTightPacked(components3), alicePrivateKey);
      const sig3 = ethUtil.toRpcSig(vrs3.v, vrs3.r, vrs3.s);
      await qa.upVote(questionId, _answerId, sig3, fee, nonce3, {from : damiens}).should.be.fulfilled;
      alice.should.be.equal(await qa.getUpVote(questionId, _answerId));
     });
   });

   describe('When considering QandA should reward winners', () => {

    beforeEach(async () => {
      await token.mint(alice, 200, {from: owner});
      await token.mint(bob, 200, {from: owner});
      await token.mint(charlie, 200, {from: owner});
    });

    it('Should approve answer and spread founds to winers',  async () => {
      const questionId = 1;
      const nonce = 33;
      const from = alice;
      const delegate = damiens;
      const fee = 10;
      const amount = 100;

      const components = [
        Buffer.from('f7ac9c2e', 'hex'),
        formattedAddress(token.address),
        formattedAddress(qa.address),
        formattedInt(amount),
        formattedInt(fee),
        formattedInt(nonce)
      ];

      const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
      const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
    
      await qa.submitNewQuestion(questionId, sig, amount, fee, nonce, {from : damiens});
       
      
      const bobPrevBalance = (await token.balanceOf(bob, {from : damiens})).toNumber();

      const _answerId = 'first';
      const components2 = [
        Buffer.from('f7ac9c2e', 'hex'),
        formattedAddress(token.address),
        formattedAddress(qa.address),
        formattedInt(amount),
        formattedInt(fee),
        formattedInt(nonce)
      ];

      const vrs2 = ethUtil.ecsign(hashedTightPacked(components2), bobPrivateKey);
      const sig2 = ethUtil.toRpcSig(vrs2.v, vrs2.r, vrs2.s);

      await qa.submitNewAnswer(questionId, _answerId, sig2, fee, nonce, {from : damiens}).should.be.fulfilled;
     
      const nonce3 = 33;
      const components3 = [
        Buffer.from('f7ac9c2e', 'hex'),
        formattedAddress(token.address),
        formattedAddress(qa.address),
        formattedInt(amount/2),
        formattedInt(fee),
        formattedInt(nonce3)
      ];

     
      const vrs3 = ethUtil.ecsign(hashedTightPacked(components3), alicePrivateKey);
      const sig3 = ethUtil.toRpcSig(vrs3.v, vrs3.r, vrs3.s);
      await qa.upVote(questionId, _answerId, sig3, fee, nonce3, {from : damiens});
    
      const nonce4 =34;
      const components4 = [
        Buffer.from('f7ac9c2e', 'hex'),
        formattedAddress(token.address),
        formattedAddress(qa.address),
        formattedInt(amount),
        formattedInt(fee),
        formattedInt(nonce4)
      ];
      const vrs4 = ethUtil.ecsign(hashedTightPacked(components4), alicePrivateKey);
      const sig4 = ethUtil.toRpcSig(vrs4.v, vrs4.r, vrs4.s);
      await qa.approveAnswer(questionId, _answerId, bob, sig4, fee, nonce4, {from : damiens}).should.be.fulfilled;

      (await token.balanceOf(bob)).toNumber().should.be.equal(bobPrevBalance + amount);
      (await token.balanceOf(alice)).toNumber().should.be.equal(80);
      });

      it('shold enable return founds to user option', async () => {

          const questionId = 1;
          const nonce = 33;
          const from = alice;
          const delegate = damiens;
          const fee = 10;
          const amount = 100;

          const components = [
            Buffer.from('f7ac9c2e', 'hex'),
            formattedAddress(token.address),
            formattedAddress(qa.address),
            formattedInt(amount),
            formattedInt(fee),
            formattedInt(nonce)
          ];
          const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
          const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);
          (await token.balanceOf(alice)).toNumber().should.be.equal(200);
          await qa.submitNewQuestion(questionId, sig, amount, fee, nonce, {from : damiens});
          (await token.balanceOf(alice)).toNumber().should.be.equal(90);

          const nonce2 = 34;
          const components2 = [
            Buffer.from('f7ac9c2e', 'hex'),
            formattedAddress(token.address),
            formattedAddress(qa.address),
            formattedInt(amount),
            formattedInt(fee),
            formattedInt(nonce2)
          ];
          const vrs2 = ethUtil.ecsign(hashedTightPacked(components2), alicePrivateKey);
          const sig2 = ethUtil.toRpcSig(vrs2.v, vrs2.r, vrs2.s);

          await qa.returnFoundsToUser(questionId, sig2, amount, fee, nonce2, {from : damiens}).should.be.fulfilled;;
          (await token.balanceOf(alice)).toNumber().should.be.equal(190);
          
      });
   });
});