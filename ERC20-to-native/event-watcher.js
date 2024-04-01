const Web3 = require('web3');

//load env file
require('dotenv').config()

const { ERC20Transfer, nativeTransfer } = require('./contract-method');

//Token contract address
const ORIGIN_TOKEN_CONTRACT_ADDRESS = process.env.ORIGIN_TOKEN_CONTRACT_ADDRESS;
const DESTINATION_TOKEN_CONTRACT_ADDRESS = process.env.DESTINATION_TOKEN_CONTRACT_ADDRESS;

//Websocket provider
/*const originWebSockerProvider = new Web3.providers.WebsocketProvider(
    process.env.ORIGIN_WSS_ENDPOIN,
);
const destinationWebSockerProvider = new Web3.providers.WebsocketProvider(
    process.env.DESTINATION_WSS_ENDPOINT,
); */

//Wallet address and private keys
const BRIDGE_WALLET = process.env.BRIDGE_WALLET
const BRIDGE_WALLET_KEY = process.env.BRIDGE_PRIV_KEY


//smart contract ABI JSON
const native_ABI_JSON = require('./ABI/Nativeside.json')//('../ABI/Nativeside.json'); //origin
const erc20_ABI_JSON = require('./ABI/ERC20side.json');  //destination


//native side handle (ORIGIN)
const handlenativeside = async (event, provider, contract) => { 
    console.log("resivied native ")
    const { amount, sender, receiver } = event.returnValues;
    if (BRIDGE_WALLET == BRIDGE_WALLET ) {
        console.log('Tokens received on bridge from native chain! Time to bridge!')
    
        try {
          const tokensTransfer = await ERC20Transfer(provider, contract, amount, sender)
          if (!tokensTransfer) return
          console.log('🌈🌈🌈🌈🌈 Bridge to BEP20 on bsc destination completed')
        } catch (err) {
          console.error('Error processing transaction', err)
          // TODO: return funds
        }
      } else {
        console.log('Another transfer')
      }
};

//ERC20 side handle (destination)
const handleErc20side = async (event, provider, contract) => {
    console.log("resivied erc20 ")
    const { amount, sender, receiver } = event.returnValues;
    if (BRIDGE_WALLET == BRIDGE_WALLET ) {
        console.log('Tokens received on bridge from native chain! Time to bridge!')
    
        try {
          const tokensTransfer = await nativeTransfer(provider, contract, amount, sender)
          if (!tokensTransfer) return
          console.log('🌈🌈🌈🌈🌈 Bridge to etpos native origin completed')
        } catch (err) {
          console.error('Error processing transaction', err)
          // TODO: return funds
        }
      } else {
        console.log('Another transfer')
      }
 };


//main event watcher

const main = async () => {


    //Websocket provider for origin and destination networks
    const originWebSockerProvider = new Web3(process.env.ORIGIN_WSS_ENDPOINT);
    const destinationWebSockerProvider = new Web3(process.env.DESTINATION_WSS_ENDPOINT);


    // adds account to sign transactions
    originWebSockerProvider.eth.accounts.wallet.add(BRIDGE_WALLET_KEY);
    destinationWebSockerProvider.eth.accounts.wallet.add(BRIDGE_WALLET_KEY);


    //Token contract connect
    const originTokenContract = new originWebSockerProvider.eth.Contract(native_ABI_JSON.abi, process.env.ORIGIN_TOKEN_CONTRACT_ADDRESS);
    const destinationTokenContract = new destinationWebSockerProvider.eth.Contract(erc20_ABI_JSON.abi, process.env.DESTINATION_TOKEN_CONTRACT_ADDRESS);

    //watching events option
    let options = {
        filter: {
            //   value: ['1000', '1337'], //Only get events where transfer value was 1000 or 1337
            value: ["0.0000000001"],
        },
        fromBlock: "latest", //Number || "earliest" || "pending" || "latest"
        // toBlock: 'latest',
    }


    //origin token contract event (native side)
    originTokenContract.events.Received(options).on('data', async (event) => {
        await handlenativeside(
            event,
            destinationWebSockerProvider,
            destinationTokenContract
        )
    })
        .on('error', (err) => {
            console.error('Error: ', err)
        })
    console.log(`Waiting for Transfer events on ${ORIGIN_TOKEN_CONTRACT_ADDRESS}`)

    //destination token contract event (ERC20 side)
    destinationTokenContract.events.TokensLocked(options).on('data', async (event) => {
            await handleErc20side(
                event,
                originWebSockerProvider,
                originTokenContract,
                //destinationWebSockerProvider,
                //destinationTokenContract
            )
        })
        .on('error', (err) => {
            console.error('Error: ', err)
        })

    console.log(
        `Waiting for Transfer events on ${DESTINATION_TOKEN_CONTRACT_ADDRESS}`
    )


};

main();