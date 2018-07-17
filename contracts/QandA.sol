pragma solidity ^0.4.24;

import "./SpitballToken.sol";
    
contract QAndA {
   
    struct QuestionData {
        uint256 price;
        address qOwner;
        uint256 answerCounter;
        uint256 totalUpVotes;
        mapping (string => AnswersData) answers;
        mapping (uint => string) answersIndex; 
    }

    struct AnswersData{
        string aid;
        address Address;
        address[] upVoteAddr;
    }

    mapping (uint256 => QuestionData) public id;


    SpitballToken public tokenReward;
  
   
    event AnswerAccepted(address indexed from, address indexed to, uint256 value);
    event NewQuestion (address qOwner, uint256 price);
    event NewAnswer (string answerId);
   
    constructor 
    (
      address _addressOfTokenUsedAsReward
    ) 
      public 
    {
        tokenReward = SpitballToken(_addressOfTokenUsedAsReward);
    }


    function destroy(uint256 _qId) private {  
        for(uint i = 0; i < id[_qId].answerCounter;i++) {

            for(uint j = 0; j < id[_qId].answers[id[_qId].answersIndex[i]].upVoteAddr.length; j++) {
                delete(id[_qId].answers[id[_qId].answersIndex[i]].upVoteAddr[j]);
            }

            delete(id[_qId].answers[id[_qId].answersIndex[i]]);
        }

        delete(id[_qId]);
    }


   

    function submitNewQuestion (uint256 _qId, bytes _signature, uint256 _price, uint256 _fee, uint256 _nonce)
     public {
        address from = getFrom(_price, _fee, _nonce, _signature);

        QuestionData memory data = QuestionData(_price, from, 0, 0);
        id[_qId] = data;
        tokenReward.approvePreSigned(_signature, address(this), _price, _fee, _nonce);
        tokenReward.transferFrom(from, address(this), _price);
        emit NewQuestion (from, _price);
    }

    function submitNewAnswer 
    (
        uint256 _qId,
        string _answerId,
        bytes _signature, 
        uint256 _fee, 
        uint256 _nonce
    ) 
      public
    {   
       
        if(id[_qId].price > 0){
            address from = getFrom(id[_qId].price, _fee, _nonce, _signature);
            address[] memory tempUpVote = new address[](0);
            AnswersData memory data = AnswersData(_answerId, from, tempUpVote);
            id[_qId].answers[_answerId] = data;
            id[_qId].answerCounter = SafeMath.add(1, id[_qId].answerCounter);
            emit NewAnswer(_answerId);
        }
    }
  

    function approveAnswer
    (
        uint256 _qId, 
        string _answerId, 
        address _winner,
        bytes _signature,
        uint256 _fee, 
        uint256 _nonce
       
    ) 
      public 
    {
        address from = getFrom(id[_qId].price, _fee, _nonce, _signature);
        require(from == id[_qId].qOwner);
        require(id[_qId].answers[_answerId].Address == _winner);
        tokenReward.transfer(_winner, id[_qId].price);
        
        uint256 ratio = SafeMath.div(id[_qId].totalUpVotes, id[_qId].answers[_answerId].upVoteAddr.length);
        uint256 price = SafeMath.div(id[_qId].price,2);

        if(id[_qId].answers[_answerId].upVoteAddr.length > 0) {
            for(uint256 i = 0; i < id[_qId].answers[_answerId].upVoteAddr.length; i++) {  
                tokenReward.transfer(
                    id[_qId].answers[_answerId].upVoteAddr[i],
                    SafeMath.mul(ratio, price)
                );
            }
        }
        destroy(_qId); 
    }
  

    function returnFoundsToUser (uint256 _qId, bytes _signature, uint256 _value, uint256 _fee, uint256 _nonce) public {
        address from = getFrom(_value, _fee, _nonce, _signature);
        require(from == id[_qId].qOwner);
        
        tokenReward.transfer(from, id[_qId].price);
        destroy(_qId); 
    }
  

    function spreadFounds (uint256 _qId, bytes _signature, uint256 _value, uint256 _fee, uint256 _nonce) public {
        address from = getFrom(_value, _fee, _nonce, _signature);
        require(from == id[_qId].qOwner);

        for (uint i = 0; i < id[_qId].answerCounter;i++) {
            for (uint j = 0; j < id[_qId].answers[id[_qId].answersIndex[i]].upVoteAddr.length; j++) {
                if(id[_qId].answers[id[_qId].answersIndex[i]].upVoteAddr.length > 0) {
                    uint256 amount = SafeMath.mul(SafeMath.div(id[_qId].answers[id[_qId].answersIndex[i]].upVoteAddr.length, id[_qId].answerCounter), id[_qId].price);
                    tokenReward.transfer(from, amount);
                }
            }
        }
        destroy(_qId);
    }
  

    function upVote(
        uint256 _qId, 
        string _answerId,
        bytes _signature, 
        uint256 _fee, 
        uint256 _nonce
        )
    public {
        uint256 value = SafeMath.div(id[_qId].price,2);
        address from = getFrom(value, _fee, _nonce, _signature);
       
        require(keccak256(abi.encodePacked(id[_qId].answers[_answerId].aid)) == keccak256(abi.encodePacked(_answerId)));
        require(id[_qId].answers[_answerId].Address != from);
            
        id[_qId].answers[_answerId].upVoteAddr.push(from);
        id[_qId].totalUpVotes = SafeMath.add(id[_qId].totalUpVotes, 1);
      
        tokenReward.approvePreSigned(_signature, address(this), value, _fee, _nonce);
        tokenReward.transferFrom(from, address(this), value);
        
    }
  
    function getFrom (uint256 _price, uint256 _fee, uint256 _nonce, bytes _signature) private view returns (address)
    {
        bytes32 hashedTx = tokenReward.approvePreSignedHashing(tokenReward, address(this), _price, _fee, _nonce);
        address from = tokenReward.recover(hashedTx, _signature);
        return from;
    }


    function getUpVoteList (uint256 _qId, string _answerId) public view returns (bytes32[] memory a){
        bytes32[] memory addresses = new bytes32[](id[_qId].answers[_answerId].upVoteAddr.length);
        for(uint256 i = 0; i < id[_qId].answers[_answerId].upVoteAddr.length; i++){
            addresses[i] = bytes32(id[_qId].answers[_answerId].upVoteAddr[i]);
        }
        return addresses;
    }

    function getPrice (uint256 _qId) public view returns (uint256)
    {
        return id[_qId].price;
    }

    function getUpVote (uint256 _qId, string _answerId) public view returns (address)
    {
        return id[_qId].answers[_answerId].upVoteAddr[id[_qId].answers[_answerId].upVoteAddr.length-1];
    }
}
