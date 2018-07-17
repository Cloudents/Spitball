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

const alicePrivateKey = Buffer.from('2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501200', 'hex');
const damiensPrivateKey = Buffer.from('2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501203', 'hex');

contract('SpitballToken', ([alice, bob, charlie, damiens, owner]) => {
  let database, token;

  const name = "Spitball Token";
  const symbol = "SBL";
  const decimals = 18;
  let whiteListTransfer = true;


  before(async () => {
    await advanceBlock()
  })


  beforeEach(async () => {
    database = await Database.new({from: owner});
    token = await SpitballToken.new(database.address, {from: owner});
  });


  describe('When considering the token has all predefined features: ', () => {

    beforeEach(async () => {
      await token.setWhitelistedOnly(true, {from: owner });
    })

    it('should have name', async () => {
      const _name = await database.name();
      _name.should.be.equal(name);
    });

    it('should have symbol', async () => {
      const _symbol = await database.symbol();
      _symbol.should.be.equal(symbol);
    });

    it('should have decimals', async () => {
      const _decimals = (await database.decimals()).toNumber();
      _decimals.should.be.equal(decimals);
    });

    it('should have accept transfers through whitelist only', async () => {
      const _whiteListTransfer = await database.isTransferWhitelistOnly();
      _whiteListTransfer.should.be.equal(whiteListTransfer);
    });
  });


  describe(`When considering the token in his whitelisted transfer phase,`, () => {
   
    beforeEach(async () => {
      await token.setWhitelistedOnly(true, {from: owner});
    });


    describe(`with Alice being the only user whitelisted`, () => {

      beforeEach(async () => {
        await token.mint(alice, 1200, {from: owner});
        await token.mint(bob, 1000, {from: owner});
        await token.whitelistUserForTransfers(alice, {from: owner});
      });


      describe(`it should fail when:`, () => {

        it('Bob transfers to Alice', async () => {

          try {
            await token.transfer(alice, 100, {from: bob});
          } catch (error) {}

          let balance = (await token.balanceOf(bob)).toNumber();
          balance.should.be.equal(1000);
        });

      });


      describe(`it should succeed when:`, () => {

        it('Alice transfers to Bob', async () => {
          await token.transfer(bob, 100, {from: alice});

          let balance = (await token.balanceOf(bob)).toNumber();
          balance.should.be.equal(1100);
        });


        it('Bob transfers to Alice once the whitelist phase is disabled', async () => {
          await token.setWhitelistedOnly(false, {from: owner});
          await token.transfer(alice, 100, {from: bob});

          let balance = (await token.balanceOf(alice)).toNumber();
          balance.should.be.equal(1300);
        });

      });

    });
  });


  describe(`When considering pre-paid transfers,`, () => {
    
    beforeEach(async () => {
      await token.mint(alice, 1200, {from: owner});
    });


    describe(`if Charlie performs a transaction T, transfering 100 tokens from Alice to Bob (fee=10)`, () => {
      
      beforeEach(async () => {
        const nonce = 32;
        const from = alice;
        const to = bob;
        const delegate = charlie;
        const fee = 10;
        const amount = 100;

        const components = [
          Buffer.from('48664c16', 'hex'),
          formattedAddress(token.address),
          formattedAddress(to),
          formattedInt(amount),
          formattedInt(fee),
          formattedInt(nonce)
        ];
        
        const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
        const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);

        await token.transferPreSigned(
          sig,
          to,
          amount,
          fee,
          nonce, 
          {from: charlie}
        ).should.be.fulfilled;
      });


      describe(`it should:`, () => {


        it('decrements Alice balance of 1090', async () => {
           let balance = (await token.balanceOf(alice)).toNumber();
           balance.should.be.equal(1090);
        });


        it('increments Bob balance of 100', async () => {
          let balance = (await token.balanceOf(bob)).toNumber();
          balance.should.be.equal(100);
        });


        it('increments Charlie balance of 10', async () => {
          let balance = (await token.balanceOf(charlie)).toNumber();
          balance.should.be.equal(10);
        });


        it('fails if Damiens tries to replay the same transaction', async () => {
          const nonce = 32;
          const from = alice;
          const to = bob;
          const delegate = charlie;
          const fee = 10;
          const amount = 100;

          const components = [
            Buffer.from('48664c16', 'hex'),
            formattedAddress(token.address),
            formattedAddress(to),
            formattedInt(amount),
            formattedInt(fee),
            formattedInt(nonce)
          ];

          const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
          const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);

          try {
            const tx = await token.transferPreSigned(
              sig,
              to,
              amount,
              fee,
              nonce, 
              {from: charlie}
            );

            tx.receipt.status.should.be.equal('0x00');

          } catch (error) {}
        });
      });
    });
  });


  describe(`When considering pre-paid approval,`, () => {

    beforeEach(async () => {
      await token.mint(alice, 1200, {from: owner});
      await token.mint(damiens, 1200, {from: owner});
    });


    describe(`if Charlie performs a transaction T, approving Damiens to spend 100 tokens on behalf of Alice to Bob (fee=10)`, () => {
      beforeEach(async () => {
        const nonce = 32;
        const from = alice;
        const to = bob;
        const delegate = charlie;
        const spender = damiens;
        const fee = 10;
        const amount = 100;

        const components = [
          Buffer.from('f7ac9c2e', 'hex'),
          formattedAddress(token.address),
          formattedAddress(spender),
          formattedInt(amount),
          formattedInt(fee),
          formattedInt(nonce)
        ];

        const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
        const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);

        await token.approvePreSigned(
          sig,
          spender,
          amount,
          fee,
          nonce,
          {from: charlie}
        );
      });


      describe(`it should:`, () => {

        it('decrements Alice balance to 1190', async () => {
          let balance = (await token.balanceOf(alice)).toNumber();
          balance.should.be.equal(1190);
        });


        it('increment Charlie balance to 10', async () => {
          let balance = (await token.balanceOf(charlie)).toNumber();
          balance.should.be.equal(10);
        });
      });


      describe(`when Damiens is sending 100 tokens from Alice to Bob`, () => {

        beforeEach(async () => {
          await token.transferFrom(alice, bob, 100, {from: damiens});
        });

        describe(`it should:`, () => {

          it('decrement Alice balance to 1090', async () => {
            let balance = (await token.balanceOf(alice)).toNumber();
            balance.should.be.equal(1090);
          });


          it('increment Bob balance to 100', async () => {
            let balance = (await token.balanceOf(bob)).toNumber();
            balance.should.be.equal(100);
          });
        });
      });


      describe(`when Charlie performs the same pre-signed transaction (fee=10)`, () => {

        beforeEach(async () => {
          const nonce = 33;
          const from = alice;
          const to = bob;
          const delegate = charlie;
          const spender = damiens;
          const fee = 10;
          const amount = 100;

          const components = [
            Buffer.from('b7656dc5', 'hex'),
            formattedAddress(token.address),
            formattedAddress(from),
            formattedAddress(to),
            formattedInt(amount),
            formattedInt(fee),
            formattedInt(nonce)
          ];

          const vrs = ethUtil.ecsign(hashedTightPacked(components), damiensPrivateKey);
          const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);

          const tx = await token.transferFromPreSigned(
            sig,
            from,
            to,
            amount,
            fee,
            nonce, 
            {from: charlie}
          );
        });


        describe(`it should:`, () => {

          it('decrement Alice balance to 1100', async () => {
            let balance = (await token.balanceOf(alice)).toNumber();
            balance.should.be.equal(1090);
          });


          it('increment Bob balance to 100', async () => {
            let balance = (await token.balanceOf(bob)).toNumber();
            balance.should.be.equal(100);
          });


          it('decrement Damiens balance to 1190', async () => {
            let balance = (await token.balanceOf(damiens)).toNumber();
            balance.should.be.equal(1190);
          });


          it('increment Charlie balance to 20', async () => {
            let balance = (await token.balanceOf(charlie)).toNumber();
            balance.should.be.equal(20);
          });
        });
      });


      describe(`when Charlie performs a pre-signed transaction aiming at increasing of 1000 an existing allowance from Alice for Damiens (fee=10)`, () => {

        beforeEach(async () => {
          const nonce = 33;
          const from = alice;
          const to = bob;
          const delegate = charlie;
          const spender = damiens;
          const fee = 10;
          const amount = 1000;

          const components = [
            Buffer.from('a45f71ff', 'hex'),
            formattedAddress(token.address),
            formattedAddress(spender),
            formattedInt(amount),
            formattedInt(fee),
            formattedInt(nonce)
          ];

          const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
          const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);

          try {
            const tx = await token.increaseApprovalPreSigned(
              sig,
              spender,
              amount,
              fee,
              nonce, 
              {from: charlie}
            );
          } catch (error) {}
        });


        describe(`it should:`, () => {

          it('decrement Alice balance to 1180', async () => {
            let balance = (await token.balanceOf(alice)).toNumber();
            balance.should.be.equal(1180);
          });


          it('increment Charlie balance to 20', async () => {
            let balance = (await token.balanceOf(charlie)).toNumber();
            balance.should.be.equal(20);
          });
        });


        describe(`when Damiens is sending 1000 tokens from Alice to Bob`, () => {

          beforeEach(async () => {
            await token.transferFrom(alice, bob, 1000, {from: damiens});
          });

          describe(`it should:`, () => {

            it('decrement Alice balance to 180', async () => {
              let balance = (await token.balanceOf(alice)).toNumber();
              balance.should.be.equal(180);
            });


            it('increment Bob balance to 1000', async () => {
              let balance = (await token.balanceOf(bob)).toNumber();
              balance.should.be.equal(1000);
            });
          });
        });


        describe(`when Charlie performs the same pre-signed transaction (fee=10)`, () => {

          beforeEach(async () => {
            const nonce = 33;
            const from = alice;
            const to = bob;
            const delegate = charlie;
            const spender = damiens;
            const fee = 10;
            const amount = 1000;

            const components = [
              Buffer.from('b7656dc5', 'hex'),
              formattedAddress(token.address),
              formattedAddress(from),
              formattedAddress(to),
              formattedInt(amount),
              formattedInt(fee),
              formattedInt(nonce)
            ];

            const vrs = ethUtil.ecsign(hashedTightPacked(components), damiensPrivateKey);
            const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);

            const tx = await token.transferFromPreSigned(
              sig,
              from,
              to,
              amount,
              fee,
              nonce, 
              {from: charlie}
            );
          });


          describe(`it should:`, () => {

            it('decrement Alice balance to 180', async () => {
              let balance = (await token.balanceOf(alice)).toNumber();
              balance.should.be.equal(180);
            });


            it('increment Bob balance to 1000', async () => {
              let balance = (await token.balanceOf(bob)).toNumber();
              balance.should.be.equal(1000);
            });


            it('decrement Damiens balance to 1190', async () => {
              let balance = (await token.balanceOf(damiens)).toNumber();
              balance.should.be.equal(1190);
            });


            it('increment Charlie balance to 30', async () => {
              let balance = (await token.balanceOf(charlie)).toNumber();
              balance.should.be.equal(30);
            });
          });
        });
      });


      describe(`when Charlie performs a pre-signed transaction aiming at decreasing of 90 an existing allowance from Alice for Damiens (fee=10, new allowance = 10)`, () => {
        beforeEach(async () => {
          const nonce = 33;
          const from = alice;
          const to = bob;
          const delegate = charlie;
          const spender = damiens;
          const fee = 10;
          const amount = 90;

          const components = [
            Buffer.from('59388d78', 'hex'),
            formattedAddress(token.address),
            formattedAddress(spender),
            formattedInt(amount),
            formattedInt(fee),
            formattedInt(nonce)
          ];

          const vrs = ethUtil.ecsign(hashedTightPacked(components), alicePrivateKey);
          const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);

          try {
            const tx = await token.decreaseApprovalPreSigned(
              sig,
              spender,
              amount,
              fee,
              nonce, 
              {from: charlie}
            ).should.be.fulfilled;
          } catch (error) {}
        });


        describe(`it should:`, () => {

          it('decrement Alice balance to 1180', async () => {
            let balance = (await token.balanceOf(alice)).toNumber();
            balance.should.be.equal(1180);
          });


          it('increment Charlie balance to 20', async () => {
            let balance = (await token.balanceOf(charlie)).toNumber();
            balance.should.be.equal(20);
          });
        });


        describe(`when Damiens is sending 10 tokens from Alice to Bob`, () => {

          beforeEach(async () => {
            await token.transferFrom(alice, bob, 10, {from: damiens});
          });


          describe(`it should:`, () => {

            it('decrement Alice balance to 1170', async () => {
              let balance = (await token.balanceOf(alice)).toNumber();
              balance.should.be.equal(1170);
            });


            it('increment Bob balance', async () => {
              let balance = (await token.balanceOf(bob)).toNumber();
              balance.should.be.equal(10);
            });
          });
        });


        describe(`when Damiens is sending 100 tokens from Alice to Bob`, () => {

          beforeEach(async () => {
            try {
              await token.transferFrom(alice, bob, 100, {from: damiens});
            } catch (error) {}
          });


          describe(`it should:`, () => {

            it('fail decrementing Alice balance to 1080, and still be 1180', async () => {
              let balance = (await token.balanceOf(alice)).toNumber();
              balance.should.be.equal(1180);
            });


            it('fail incrementing Bob balance', async () => {
              let balance = (await token.balanceOf(bob)).toNumber();
              balance.should.be.equal(0);
            });
          });
        });


        describe(`when Charlie performs a transaction pre-signed by Damiens, aiming at sending 10 from Alice to Bob (fee=10)`, () => {

          beforeEach(async () => {
            const nonce = 33;
            const from = alice;
            const to = bob;
            const delegate = charlie;
            const spender = damiens;
            const fee = 10;
            const amount = 10;

            const components = [
              Buffer.from('b7656dc5', 'hex'),
              formattedAddress(token.address),
              formattedAddress(from),
              formattedAddress(to),
              formattedInt(amount),
              formattedInt(fee),
              formattedInt(nonce)
            ];

            const vrs = ethUtil.ecsign(hashedTightPacked(components), damiensPrivateKey);
            const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);

            const tx = await token.transferFromPreSigned(
              sig,
              from,
              to,
              amount,
              fee,
              nonce, 
              {from: charlie}
            ).should.be.fulfilled;
          });


          describe(`it should:`, () => {

            it('decrement Alice balance to 1170', async () => {
              let balance = (await token.balanceOf(alice)).toNumber();
              balance.should.be.equal(1170);
            });


            it('increment Bob balance to 10', async () => {
              let balance = (await token.balanceOf(bob)).toNumber();
              balance.should.be.equal(10);
            });


            it('decrement Damiens balance to 1190', async () => {
              let balance = (await token.balanceOf(damiens)).toNumber();
              balance.should.be.equal(1190);
            });


            it('increment Charlie balance to 30', async () => {
              let balance = (await token.balanceOf(charlie)).toNumber();
              balance.should.be.equal(30);
            });
          });
        });


        describe(`when Charlie performs a transaction pre-signed by Damiens, aiming at sending 50 from Alice to Bob (fee=10)`, () => {

          beforeEach(async () => {
            const nonce = 33;
            const from = alice;
            const to = bob;
            const delegate = charlie;
            const spender = damiens;
            const fee = 10;
            const amount = 50;

            const components = [
              Buffer.from('b7656dc5', 'hex'),
              formattedAddress(token.address),
              formattedAddress(from),
              formattedAddress(to),
              formattedInt(amount),
              formattedInt(fee),
              formattedInt(nonce)
            ];

            const vrs = ethUtil.ecsign(hashedTightPacked(components), damiensPrivateKey);
            const sig = ethUtil.toRpcSig(vrs.v, vrs.r, vrs.s);

            try {
              const tx = await token.transferFromPreSigned(
                sig,
                from,
                to,
                amount,
                fee,
                nonce, 
                {from: charlie}
              );
            } catch (error) {}
          });


          describe(`it should`, () => {

            it('fail decrementing Alice balance to 1130, and still be 1180', async () => {
              let balance = (await token.balanceOf(alice)).toNumber();
              balance.should.be.equal(1180);
            });


            it('fail incrementing Bob balance to 50, and still be 0', async () => {
              let balance = (await token.balanceOf(bob)).toNumber();
              balance.should.be.equal(0);
            });


            it('fail incrementing Damiens balance to 1190, and still be 1200', async () => {
              let balance = (await token.balanceOf(damiens)).toNumber();
              balance.should.be.equal(1200);
            });


            it('fail incrementing Charlie balance to 30, and still be 20', async () => {
              let balance = (await token.balanceOf(charlie)).toNumber();
              balance.should.be.equal(20);
            });
          });
        });
      });
    });
  });
});
