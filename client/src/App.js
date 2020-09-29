import React, { Component } from "react";
import Auction from "./contracts/Auction.json";
import AuctionFactory from "./contracts/AuctionFactory.json";
import getWeb3 from "./utils/getWeb3";
import Oracle from "./contracts/Oracle.json";
import "./App.css";
import { runInThisContext } from "vm";
import { get } from "https";
import { tmpdir } from "os";
var AppSelf;


class AuctionListView extends Component {
    state = {
        web3: null,
        currentAccount: '',
        currentAccountBalance: 0,
        currentAccountBids: {},
        accounts: [],
        auctions: [],
        auctionEventListeners: {},
        AuctionContract: [],
        FactoryContract: null,
        OracleResolverContract: null,
        AucCon: []
    };
    constructor(props) {
        super(props)

        this.state = {
            currentAccount: '',
            currentAccountBalance: 0,
            currentAccountBids: {},
            accounts: [],
            auctionsAddress: [],
            auctions: [],
            auctionEventListeners: {},
            AucCon: [],
            AuctionContract: [],
            FactoryContract: null,
            OracleResolverContract: null,
            auction_bidnum: '',
            auction_endbid: '',
            auction_highestbidder: "",
            auction_highestbid: "",
            auction_state: '',
            auction_bidincrement: 0,
            auctions_: null,
            auction_bidvalue: '',
            auction_latestbid: '',
            auction_latestbidder: '',
            auction_id: 0,
            auction_owner: '',
            contractInstance: null,
            auction_int: 1, //default
            productName: null,
            arr_product: [],
            arr_productNo: [],
            chk_highest: null,
            auction_cancel: 0,
            
        }

        this.onChangeAccount = this.onChangeAccount.bind(this)
        this.onClickCreateAuction = this.onClickCreateAuction.bind(this)
        this.getAllAuctions = this.getAllAuctions.bind(this)
        this.getAuction = this.getAuction.bind(this)
        this.cancelAuction = this.cancelAuction.bind(this)
        this.getAccountBids = this.getAccountBids.bind(this)
        this.onLogBid = this.onLogBid.bind(this)
        this.onClickBid = this.onClickBid.bind(this)
        this.onBidSubmit = this.onBidSubmit.bind(this)
        this.onClickCheckAuction = this.onClickCheckAuction.bind(this)
        this.onClickWithdraw = this.onClickWithdraw.bind(this)
        this.onClickCancel = this.onClickCancel.bind(this)
        this.onClickEndGame = this.onClickEndGame.bind(this)
    }

    _inputReserve = null
    _inputBidIncrement = null
    _inputStartBlock = null
    _inputEndBlock = null
    _inputBidAmount = null
    _auction_no = null
    _productName = null
    _bidProductNo = null
    _mybid = null;


    componentDidMount = async () => {
        AppSelf = this;
        try {

            const web3 = await getWeb3();

            const currentAccountBalance = 10;

            const accounts = await web3.eth.getAccounts();

            const networkId = await web3.eth.net.getId();

            const FactorydeployedNetwork = AuctionFactory.networks[networkId];
            const Factoryinstance = new web3.eth.Contract(
                AuctionFactory.abi,
                FactorydeployedNetwork && FactorydeployedNetwork.address,
            );

            const OracledeployedNetwork = Oracle.networks[networkId];
            const Oracleinstance = new web3.eth.Contract(
                Oracle.abi,
                OracledeployedNetwork && OracledeployedNetwork.address,
            );

            this.setState({ web3: web3, accounts: accounts, currentAccountBalance: currentAccountBalance, FactoryContract: Factoryinstance, OracleContract: Oracleinstance, });
        } catch (error) {

            alert(
                `Failed to load web3, accounts, or contract. Check console for details.`,
            );
            console.error(error);
        }
    };

    runExample = async () => {
        const { accounts, contract } = this.state;

        await contract.methods.placeBid().send({ from: accounts[0] });

        const response = await contract.methods.getHighestBid().call();

        this.setState({ currentAccountBalance: response });
    };

    onChangeAccount(evt) {
        //alert(evt.target.value);
        this.setCurrentAccount(evt.target.value);
    }

    setCurrentAccount(account) {
        this.state.web3.eth.defaultAccount = account

        this.getAccountBids(account).then(currentAccountBids => {
            this.setState({
                currentAccount: account,
                currentAccountBalance: (this.state.web3.eth.getBalance(account), 'ether').toString(),
                currentAccountBids,
            })
            console.log(this.state.currentAccount);
        })
    }

    getAccountBids(account) {
        const getBidPromises = this.state.auctions.map(auction => {
            return auction.contract.fundsByBidder.call(account).then(bid => {
                return { auction: auction.address, bid }
            })
        })

        return Promise.all(getBidPromises).then(results => {
            let currentAccountBids = {}
            for (let x of results) {
                currentAccountBids[x.auction] = this.state.web3.fromWei(x.bid, 'ether').toString()
            }
            return currentAccountBids
        })
    }

    async onClickCreateAuction() {
        let web3 = this.state.web3;
        let appState = this.state;
        console.log("account " + appState.currentAccount);
        console.log("productname = " + this._productName.value);

        console.log("log___ " + appState.OracleContract._address);
        let msg_addr = null;
        await this.state.FactoryContract.methods.createAuction(
            this._inputEndBlock.value,
            appState.OracleContract._address,
            this._productName.value
        ).send({ from: appState.currentAccount, gas: 4234567 }, async function (err, result) {
            msg_addr = result;
            if (err) alert(err);
        });


        console.log("resultttt : " + msg_addr);
        let auctions = [];
        let productname = [];
        await appState.OracleContract.getPastEvents("newAuctionBoth", { fromBlock: 0, toBlock: "latest" }).then(function (events) {
            for (let i = 0; i < events.length; i++) {
                let ouput_int = events[i].returnValues[0]
                let ouput_name = events[i].returnValues[1]
                console.log(events[i].returnValues)
                //auctions.push(new web3.eth.Contract(Auction.abi, ouput_int));
                auctions.push(ouput_int);
                productname.push(ouput_name);
            }
        });

        let latest_id;

        await this.state.FactoryContract.methods.getlatestID().call({ from: this.state.currentAccount, gas: 4234567 }, async function (err, result) {
            latest_id = result;
            if (err) alert(err);
        });

        console.log("latest_id = " + latest_id);

        console.log("logggggg " + auctions);
        console.log("product list " + productname);
        let flag_owner;
        await this.state.FactoryContract.methods.getOwnerAddress(latest_id).call({ from: this.state.currentAccount, gas: 4234567 }, async function (err, result) {
            flag_owner = result;
            if (err) alert(err);
        });

        console.log("flagowner = " + flag_owner);

        let flag_isEnd;
        await this.state.FactoryContract.methods.getIsEnd(latest_id).call({ from: this.state.currentAccount, gas: 4234567 }, async function (err, result) {
            flag_isEnd = result;
            if (err) alert(err);
        });

        console.log("flag_isEnd = " + flag_isEnd);


        this.setState({
            auction_bidnum: 0, auction_endbid: 10,
            auction_highestbid: 0, currentAccountBalance: 100, auction_latestbidder: msg_addr, auction_owner: flag_owner, auction_state: flag_isEnd,
            productName: this._productName.value, auction_endbid: this._inputEndBlock.value, arr_product:productname, arr_productNo: auctions, 
        });

        // return tmp;
    }

    //check auction
    async onClickCheckAuction() {
        console.log("auctionnnnnnnn : " + this._auction_no.value);
        let int_auction = this._auction_no.value;
/*
        let flag_owner;
        await this.state.FactoryContract.methods.getOwnerAddress(int_auction).call({ from: this.state.currentAccount, gas: 4234567 }, async function (err, result) {
            flag_owner = result;
            if (err) alert(err);
        });
        //alert(flag_owner);

        console.log("chk_flagowner = " + flag_owner);

        let flag_isEnd;
        await this.state.FactoryContract.methods.getIsEnd(int_auction).call({ from: this.state.currentAccount, gas: 4234567 }, async function (err, result) {
            flag_isEnd = result;
            if (err) alert(err);
        });
*/
        let get_highestbidder;
    
        await this.state.FactoryContract.methods.getHighestBidderAddress(int_auction).call({ from: this.state.currentAccount, gas: 4234567 }, async function (err, result) {
            get_highestbidder = result;
            if (err) alert(err);
        });

        console.log("chk_flag_isEnd = " + get_highestbidder);


        this.setState({ auction_int: int_auction, chk_highest: get_highestbidder, });

        console.log("auction_int = " + this.state.auction_int);
    }

    onLogBid(err, resp) {
        console.log('LogBid ~>', resp.args)
        this.getAllAuctions();
        this.getAccountBids(this.state.currentAccount).then(currentAccountBids => {
            this.setState({ currentAccountBids })
        })
    }


    getAllAuctions() {
        return new Promise(async (resolve, reject) => {
            const web3 = await getWeb3();
            let tmp = this.state.auctions;
            console.log(tmp);
            //console.log(auctions);
            //let auctionsContract = new web3.eth.Contract(Auction.abi, )
            let AuctionFactory = this.state.FactoryContract;
            let currentAccount = this.state.currentAccount;
        })
    }

    getAuction() {
        console.log("address: " + this.state.auctionsAddress);
        const auction = this.state.auctionsAddress[0];
        let state = null;
        return new Promise(async (resolve, reject) => {
            await auction.getPastEvents("allInfo", { fromBlock: 0, toBlock: "latest" }).then(function (events) {
                state = events[events.length - 1].returnValues;
                resolve(state);
            });
        })
    }

    cancelAuction(auction) {
        auction.cancelAuction({ from: this.state.currentAccount }).then(_ => {
            this.getAllAuctions()
        })
    }

    async onClickBid() {
        let product_num = parseInt(this._bidProductNo.value);
        console.log("nummmm: " + product_num);
        let flag_placebid;
        await this.state.FactoryContract.methods.placeBid(product_num).send({ from: this.state.currentAccount, gas: 4234567, value: this._mybid.value }, async function (err, result) {
            flag_placebid = result;
            if (err) alert(err);
            //else alert(result);
        });
        console.log("flag: " + flag_placebid);

        let flag_highest;
        await this.state.FactoryContract.methods.getHighestBid(product_num).call({ from: this.state.currentAccount, gas: 4234567 }, async function (err, result) {
            flag_highest = result;
            if (err) alert(err);
            //else alert(result);
        });
        console.log("highest: " + flag_highest);

        let flag_highest_addr;
        await this.state.FactoryContract.methods.getHighestBidderAddress(product_num).call({ from: this.state.currentAccount, gas: 4234567 }, async function (err, result) {
            flag_highest_addr = result;
            if (err) alert(err);
            //else alert(result);
        });
        console.log("highest: " + flag_highest_addr);

        let flag_getBidNum;
        await this.state.FactoryContract.methods.getBidNum(product_num).call({ from: this.state.currentAccount, gas: 4234567 }, async function (err, result) {
            flag_getBidNum = result;
            if (err) alert(err);
            //else alert(result);
        });

        console.log("bidNum: " + flag_getBidNum);

        let latest_id;
        await this.state.FactoryContract.methods.getlatestID().call({ from: this.state.currentAccount, gas: 4234567 }, async function (err, result) {
            latest_id = result;
            if (err) alert(err);
        });

        let flag_isEnd;
        await this.state.FactoryContract.methods.getIsEnd(latest_id).call({ from: this.state.currentAccount, gas: 4234567 }, async function (err, result) {
            flag_isEnd = result;
            if (err) alert(err);
        });

        console.log("isEnd  " + flag_isEnd);


        this.setState({ auction_highestbid: flag_highest, auction_highestbidder: flag_highest_addr, auction_bidnum: flag_getBidNum, auction_state: flag_isEnd,});

    }

    async onClickWithdraw() {
        let productid = parseInt(this._bidProductNo.value);
        console.log("withdrawid = " + productid);

        let check_result;
        await this.state.FactoryContract.methods.withdraw(productid).call({ from: this.state.currentAccount, gas: 4234567 }, async function (err, result) {

            if (err) alert(err);
            
        });
    }

    async onClickCancel() {
        let productid = parseInt(this._bidProductNo.value);
        console.log("cancel = " + productid);

        let flag_cancel;
        await this.state.FactoryContract.methods.cancelAuction(productid).send({ from: this.state.currentAccount, gas: 4234567 }, async function (err, result) {
            flag_cancel = 1;
            if (err) alert(err);
        });

        console.log("cancel flag = " + flag_cancel);
        this.setState({ auction_cancel: flag_cancel, });
    }

    async onClickEndGame() {
        let productid = parseInt(this._bidProductNo.value);
        console.log("End = " + productid);

        await this.state.FactoryContract.methods.endAuction(productid).send({ from: this.state.currentAccount, gas: 4234567 }, async function (err, result) {
            if (!err) alert(result.toString());
         
        });

    }

    onBidSubmit = async (event) => {
        this.setState({ auction_highestbid: this._inputBidAmount.value });
    }


    onClickBid2(auction) {
        auction.contract.placeBid({ from: this.state.currentAccount, value: this.props.web3.toWei(this._inputBidAmount.value, 'ether') }).then(_ => {
            this.getAllAuctions()
        })
    }

    render() {
        let status;
        if(this.state.auction_state==true){
            if(this.state.auction_cancel==1){
                status = "Cancel";
            }
            else{
                status = "Finish";
            }
        
        }else{

                status = "Running";
                if(this.state.auction_cancel==1){
                    status = "Cancel";
                }
    
           
            }
        

        return (
            <div>
                <h1>Auctions</h1>

                <div className="form-create-auction">
                    <h2>Create auction</h2>
                    <div>
                        Product Name <input type="text" ref={x => this._productName = x} defaultValue={""} />
                    </div>
                    <div>
                        Bid increment <input type="text" ref={x => this._inputBidIncrement = x} defaultValue={10} />
                    </div>
                    <div>
                        End Bid <input type="text" ref={x => this._inputEndBlock = x} defaultValue={10} />
                    </div>
                    <button onClick={this.onClickCreateAuction}>Create Auction</button>
                </div>

                <div className="form-create-auction">
                    <h2>Check auction of Highest bidder</h2>
                    <div>
                        Auction <input type="num" ref={x => this._auction_no = x} defaultValue={1} />
                    </div>
                    <button onClick={this.onClickCheckAuction}>Check Auction</button>
                </div>


                <table>
                    <thead>
                        <tr>
                            <td>Product Name</td>
                            <td>Address</td>
                            <td>Bid Num</td>
                            <td>End Bid</td>
                            <td>Highest bid</td>
                            <td>Highest bidder</td>
                            <td>IsEnd</td>
                            <td>Your bid</td>
                            <td>Bid Product</td>
                            <td colSpan="4">Actions</td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>{this.state.productName}</td>
                            <td>{this.state.auction_owner}</td>
                            <td>{this.state.auction_bidnum}</td>
                            <td>{this.state.auction_endbid}</td>
                            <td>{this.state.auction_highestbid}</td>
                            <td>{this.state.auction_highestbidder}</td>
                            <td>{status}</td>
                            <td><input type="num" size="3" ref={x => this._mybid = x} defaultValue={""} /></td>
                            <td><input type="num" size="3" ref={x => this._bidProductNo = x} defaultValue={""} /></td>
                            <td><button onClick={() => this.onClickBid()}>Bid</button></td>
                            <td><button onClick={() => this.onClickWithdraw()}>Withdraw</button></td>
                            <td><button onClick={() => this.onClickCancel()}>Cancel</button></td>
                            <td><button onClick={() => this.onClickEndGame()}>End</button></td>
                        </tr>

                    </tbody>
                </table>

                <hr />

                <div>
                    Current account:
                    <select onChange={this.onChangeAccount}>
                        {this.state.accounts.map(acct => <option key={acct} value={acct}>{acct}</option>)}
                    </select>
                    <div>Balance: {this.state.currentAccountBalance}</div>
                </div>

                <hr />

                <div>Check Auction highest bidder:</div>
                {this.state.chk_highest}

                <hr />

                <div>
                    <table>
                        <thead>
                            <tr>
                                Product Name & Product No: 
                            </tr>

                        </thead>
                        <tbody>
                            <tr>
                                <td>
                                    <ul>
                                    {this.state.arr_product.map(item1 => (
                                        <li key={item1}>{item1}</li>
                                    ))}
                                    </ul>

                                </td>
                                <td>
                                    <ul>
                                    {this.state.arr_productNo.map(item => (
                                        <li key={item}>{item}</li>
                                    ))}
                                    </ul>

                                </td>
                            </tr>
                        </tbody>
                    </table>
                    
                </div>
            </div>
            
        )
    }
}

export default AuctionListView;
