# Partner node setup guide

Abstract: in this manual we will walk through the process of implementing a new geth (ethereum node) and connect it to the Spitball2.0 network. The os asume to be linux ubuntu but the set up will work on any os.

You will need root privileges for the installation. 
If using windows just open the prompt as administrator.
If using ubuntu or dublin distribution os type use sudo before each command.

Download and install the stable version of Geth. for more information: https://github.com/ethereum/go-ethereum/wiki/Installation-Instructions-for-Ubuntu
For windows:
https://github.com/ethereum/go-ethereum/wiki/Installation-Instructions-for-Windows

After installation you will have a new directory called <installation path>.ethereum.
Go to <installation path>.ethereum:
	cd <installation path>.ethereum

Create a new genesis.json file, copy the genesis.json content from Spitball github repository and save it. You can use any text editor (nano, vim, etc..)
Spitball github repository  - https://github.com/Cloudents/Spitball/blob/master

Start Geth:
	geth --datadir ./datadir init genesis.json
Create new account:
	geth --datadir ./datadir account new

Then run:
geth --datadir=./datadir --bootnodes="enode://db7d6769782ddbff59f8c5f0710bb45e5ebc8fe40ee0a7d266926e83f345b381ece1e9ae3f163c41a885c1b0e338f4286e90f949fb4289899ef2df346c3dee16@13.73.176.147:30301" --networkid 51190 console
You can check the peer was established by:
	admin.peers.
If the output do not look like “[]” then the connection was established.

To start mining type: miner.start(1) when 1 means run one mining thread.
