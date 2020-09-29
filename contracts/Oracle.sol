pragma solidity ^0.5.7;

contract Oracle {
    address owner= msg.sender;
    address cbAddress; // callback address
    uint messagesNum = 0;
    uint[] Auctions;
    uint count=0;

    struct Msg{
        address sender;
        uint auction;
        string operation;
        uint Auctioncnt;
    }
    mapping(uint=>Msg) Msgs;
    mapping (address=>Msg) tmpmsgs;
    
    event newAuction(uint);
    event newAuctionName(string);
    event newAuctionBoth(uint,string);

    event newMsg(address,string, uint);
    event QueryAuctionsNum(uint);
    event QueryMsg(address, string , uint);
    event QueryMsgNum(uint);
    event QueryAuctions(uint);

    event checkMSGNUM(uint);
    event checkMSGNUM2222(uint);


    constructor ()public  {}

    function setCbAddress(address _cbAddress) external {
        cbAddress = _cbAddress;
    }
    
    function operationCallback(address _sender, string calldata _operation, uint auctionID)external returns (uint){
        Msg memory m;
        m.sender=_sender;
        m.auction = auctionID;
        m.operation = _operation;
        Msgs[messagesNum]=m;
        
        count++;
        if (msg.sender != owner && count%2==0)
        {
            messagesNum++;
        }
        
        emit checkMSGNUM(messagesNum);
        
        tmpmsgs[msg.sender].Auctioncnt = messagesNum;
        emit newMsg(_sender, _operation, auctionID);
        
        emit checkMSGNUM2222(messagesNum);
        
        return tmpmsgs[msg.sender].Auctioncnt;
    }
    
    function newAuctionCallback(uint auction, string calldata name)external{
        Auctions.push(auction);
        emit newAuction(auction);
        emit newAuctionName(name);
        
        emit newAuctionBoth(auction,name);
    }
    
    function getAuction(uint index)external returns(uint){
        emit QueryAuctions(Auctions[index]);
        
        return Auctions[index];
    }
    
    function getNumOfAuction()external returns(uint){
        emit QueryAuctionsNum(Auctions.length);
        return Auctions.length;

    }
    
    function getOperation(uint index)external returns(string memory){
        emit QueryMsg(Msgs[index].sender,Msgs[index].operation,Msgs[index].auction);
        return Msgs[index].operation;
    }

    function getNumOfOperation ()external returns(uint){
        emit QueryMsgNum(messagesNum);
        return messagesNum;
    }
    
}
