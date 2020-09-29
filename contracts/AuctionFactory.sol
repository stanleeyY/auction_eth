pragma solidity ^0.5.7;

import {Oracle} from './Oracle.sol';

contract AuctionFactory {
    Oracle oracle;
    mapping(uint => Auction) auctions;
    uint auctionNum = 1;

    
    event AuctionCreated(address auctionContract, address owner, uint numAuctions, address[] allAuctions);
    event getAddress(address);
    event getBlockNumber(uint);
    
    event track(address,uint, uint, string, address);
    event LogBid(address bidder, uint bid, address highestBidder, uint highestBid);
    event LogWithdrawal(address withdrawer, address withdrawalAccount, uint amount);
    event LogCanceled();
    event LogOwnerEnd();

    event AuctionCnt(uint cnt);

    
    struct Auction {
        // static
        address owner;
        uint bidIncrement;
        uint endBid;
        string product;
    
        // state
        bool canceled;
        bool ownerEnd;
        address highestBidder;
        uint highestBid;
        uint bidNum;
        mapping(address => uint256) fundsByBidder;
        bool ownerHasWithdrawn;
    }
    

    constructor()public {
    }

    function createAuction(uint endBid, address _oracle, string calldata _product) external returns(uint) {
        auctionNum++;
        
        oracle = Oracle(_oracle);
        
        auctions[auctionNum].owner = msg.sender;

        auctions[auctionNum].endBid= endBid;
        auctions[auctionNum].canceled = false;
        auctions[auctionNum].ownerEnd = false;

        auctions[auctionNum].product = _product;

        
        //emit getAddress(address(newAuction));
        
        oracle.operationCallback(msg.sender, "Created a new Auction!", auctionNum);
        oracle.newAuctionCallback(auctionNum, _product);
        
        return auctionNum;
    }
    

    
    function placeBid(uint auctionID)external
        payable
        onlyBeforeEnd(auctionID)
        onlyNotCanceled(auctionID)
        onlyNotOwner(auctionID)
        onlyNotOwnerEnd(auctionID)
        enoughAmount(auctionID)
        largerThanBefore(auctionID)
        returns (bool success) 
    { 
        auctions[auctionID].highestBidder = msg.sender;
        
        
        auctions[auctionID].highestBid=msg.value;
        auctions[auctionID].fundsByBidder[auctions[auctionID].highestBidder]+= auctions[auctionID].highestBid;
    
        oracle.operationCallback(msg.sender, "Placed a Bid!", auctionID);
        auctions[auctionID].bidNum++;
        emit LogBid(msg.sender, msg.value, auctions[auctionID].highestBidder, auctions[auctionID].fundsByBidder[auctions[auctionID].highestBidder]);
        emit AuctionCnt(auctions[auctionID].bidNum);
        return true;
    }
    
    function endAuction(uint auctionID)
        onlyOwner(auctionID)
        onlyBeforeEnd(auctionID)
        onlyNotCanceled(auctionID)
        onlyNotOwnerEnd(auctionID)
        external
        returns (bool success)
    {
        auctions[auctionID].ownerEnd = true;
        oracle.operationCallback(msg.sender, "End an Auction", auctionID);
        emit LogOwnerEnd();
        return true;
    }
    

    function cancelAuction(uint auctionID)
        onlyOwner(auctionID)
        onlyBeforeEnd(auctionID)
        onlyNotCanceled(auctionID)
        onlyNotOwnerEnd(auctionID)

        external
        returns (bool success)
    {
        auctions[auctionID].canceled = true;
        oracle.operationCallback(msg.sender, "Canceled an Auction", auctionID);
        emit LogCanceled();
        return true;
    }
    
    /// Withdraw a bid that was overbid.
    function withdraw(uint auctionID)
        onlyEndedOrCanceled(auctionID)
        notWithdrawYet(auctionID)
        external
        returns (bool success)
    {
        //this function is runned by frontend when it has triggered as auction ended or canceled by a user
        address withdrawalAccount;
        uint withdrawalAmount;

        if (auctions[auctionID].canceled) {
            //withdraw the money if it is canceled
            withdrawalAccount = msg.sender;
            withdrawalAmount = auctions[auctionID].fundsByBidder[withdrawalAccount];
        } else {
            if (msg.sender == auctions[auctionID].owner) {
                //only owner can withdraw the highestBidder money
                withdrawalAccount = auctions[auctionID].highestBidder;
                withdrawalAmount = auctions[auctionID].fundsByBidder[auctions[auctionID].highestBidder];
                auctions[auctionID].ownerHasWithdrawn = true;
                
            } else if(msg.sender == auctions[auctionID].highestBidder){
                
                withdrawalAccount = msg.sender;
                withdrawalAmount = auctions[auctionID].fundsByBidder[withdrawalAccount] - auctions[auctionID].highestBid;
                
                require(withdrawalAmount>=0, "You are highest bidderm And no $ to withdraw");

            }
            else {
                //others except the highest bidder can get the money
                withdrawalAccount = msg.sender;
                withdrawalAmount = auctions[auctionID].fundsByBidder[withdrawalAccount];
            }
        }
        if (!msg.sender.send(withdrawalAmount)) revert();

        emit LogWithdrawal(msg.sender, withdrawalAccount, withdrawalAmount);
        auctions[auctionID].fundsByBidder[withdrawalAccount] = 0;   //if it has refunded, reset the money as 0 so that it won't compute this function again
        oracle.operationCallback(withdrawalAccount, "Withdrawed Money", auctionID);
        return true;
    }
    
    function getIsEnd(uint auctionID) external view returns (bool){   //determine if it is ended
        require(auctionID<=auctionNum, "Please Input auctionID");
        
        if(auctions[auctionID].ownerEnd||auctions[auctionID].canceled||auctions[auctionID].bidNum>=auctions[auctionID].endBid){
            return true;
        }
        return false;
    }
    
    function getIsCancel(uint auctionID) external view returns (bool){   //determine if it is ended
        require(auctionID<=auctionNum, "Please Input auctionID");
        
        return auctions[auctionID].canceled;
    }
    
    
    function getHighestBid(uint auctionID)external
        view
        returns (uint)
    {
        return auctions[auctionID].fundsByBidder[auctions[auctionID].highestBidder];
    }
    
    
    function getHighestBidderAddress(uint auctionID)external
        view
        returns (address)
    {
        return auctions[auctionID].highestBidder;
    }
    
    function getBidNum(uint auctionID)external
        view
        returns (uint)
    {
        return auctions[auctionID].bidNum;
    }
    
    function getOwnerAddress(uint auctionID)external
        view
        returns (address)
    {
        return auctions[auctionID].owner;
    }
    
    function getlatestID()external
        view
        returns (uint)
    {
        return auctionNum;
    }
    
    
    
    function getProductName(uint auctionID)external
        view
        returns (string memory)
    {
        return auctions[auctionID].product;
    }


    modifier onlyOwner(uint auctionID) {
        if (msg.sender != auctions[auctionID].owner ) revert();
        _;
    }

    modifier onlyNotOwner(uint auctionID) {
        if (msg.sender == auctions[auctionID].owner ) revert();
        _;
    }

    modifier enoughAmount(uint auctionID){
        if(msg.sender.balance< auctions[auctionID].fundsByBidder[auctions[auctionID].highestBidder] + msg.value) revert(); //check if the user has sufficient amount to bid
        _;
    }

    modifier largerThanBefore(uint auctionID){
        if(msg.value<= auctions[auctionID].fundsByBidder[auctions[auctionID].highestBidder])revert();
        _;
    }

    modifier onlyBeforeEnd(uint auctionID) {
        if (auctions[auctionID].bidNum > auctions[auctionID].endBid) revert();
        _;
    }

    modifier onlyNotCanceled(uint auctionID) {
        if (auctions[auctionID].canceled) revert();
        _;
    }
    
    modifier onlyNotOwnerEnd(uint auctionID) {
        if (auctions[auctionID].ownerEnd) revert();
        _;
    }

    modifier onlyEndedOrCanceled(uint auctionID) {
        require((auctions[auctionID].bidNum >= auctions[auctionID].endBid)|| auctions[auctionID].canceled || auctions[auctionID].ownerEnd, "It is not end or cancel" );
        _;
    }
    
    modifier notHighestBidder(uint auctionID){
        if(msg.sender== auctions[auctionID].highestBidder) revert();
        _;
    }
    
    modifier notWithdrawYet(uint auctionID){    //check if the user is withdrawn or not
        if((auctions[auctionID].owner!=msg.sender&&auctions[auctionID].fundsByBidder[msg.sender]==0)||(auctions[auctionID].owner==msg.sender&&auctions[auctionID].fundsByBidder[auctions[auctionID].highestBidder]!=0)) revert();
        _;
    }
}





