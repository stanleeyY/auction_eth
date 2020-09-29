import React, { Component } from 'react'
import './AuctionView.css'
import getWeb3 from "./utils/getWeb3";
import Auction from "./contracts/Auction.json";


class AuctionView extends Component
{
    state = {
        sender: '',
        highestBid: 0,
        accounts: [],
    }
    constructor(props) {
        super(props)

        this.state = {
            sender: '',
            highestBid: 0,
            accounts: [],
        }

        this.onClickBid = this.onClickBid.bind(this)
        this.onChangeAccount = this.onChangeAccount.bind(this)
    }

    _inputBidAmount = null

    
    componentDidMount = async () => {
        try {
          // Get network provider and web3 instance.
          const web3 = await getWeb3();
          
          const highestBid = 100;
          // Use web3 to get the user's accounts.
          const accounts = await web3.eth.getAccounts();
    
          // Get the contract instance.
          const networkId = await web3.eth.net.getId();
          const deployedNetwork = Auction.networks[networkId];
          const instance = new web3.eth.Contract(
            Auction.abi,
            deployedNetwork && deployedNetwork.address,
          );

    
          this.setState({ web3, accounts, contract: instance, highestBid, }, this.runExample);
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
  
        this.setState({ highestBid: response });
      };

  /*  componentDidMount() {
        Auction.setProvider(this.props.web3.currentProvider)

        this.props.web3.eth.getAccounts((err, accs) => {
            this.setState({
                sender: accs[0],
                accounts: accs,
            })
        })
    }*/

    onClickBid() {
        const bidAmount = this._inputBidAmount.value

        Auction.deployed().placeBid({ from: this.state.sender, value: bidAmount, gas: 2000000 }).then(result => {
            console.log('bid result = ', result)
        })
    }

    onChangeAccount(evt) {
        this.setState({ sender: evt.target.value })
    }

    render() {
        return (
            <div>
                <div>Current price: {this.state.highestBid}</div>

                <div>
                    <input type="text" ref={ x => this._inputBidAmount = x } />
                    <button onClick={this.onClickBid}>Bid</button>
                </div>

                <select onChange={this.onChangeAccount}>
                    {this.state.accounts.map(acct => <option key={acct} value={acct}>{acct}</option>)}
                </select>
            </div>
        )
    }
}

export default AuctionView
