const Web3 = require('web3')

//load env file
require('dotenv').config()

const {
  mintTokens,
  approveForBurn,
  burnTokens,
  transferToEthWallet,
} = require('./contract-method')//('./contract-methods.js')

const ORIGIN_TOKEN_CONTRACT_ADDRESS = process.env.ORIGIN_TOKEN_CONTRACT_ADDRESS
const DESTINATION_TOKEN_CONTRACT_ADDRESS =
  process.env.DESTINATION_TOKEN_CONTRACT_ADDRESS
const BRIDGE_WALLET = process.env.BRIDGE_WALLET

const BRIDGE_WALLET_KEY = process.env.BRIDGE_PRIV_KEY

const CHSD_ABIJSON = require("./ABI/etp20.json");//('./ChainstackDollars.json')
const QCHSD_ABIJSON = require("./ABI/erc20.json");//('./DChainstackDollars.json')

const handleEthEvent = async (event, provider, contract) => {
  console.log('handleEthEvent')
  //const { from, to, value } = event.returnValues
  const { amount, sender, receiver } = event.returnValues;
  /*console.log('to :>> ', to)
  console.log('from :>> ', from)
  console.log('value :>> ', value) */

  
  console.log('============================')

  /*if (to == BRIDGE_WALLET) {
    console.log('Transfer is a bridge back')
    return
  }*/
  if (BRIDGE_WALLET == BRIDGE_WALLET ) {
    console.log('Tokens locked on bridge contract! Time to bridge!')

    try {
      const tokensMinted = await mintTokens(provider, contract, amount, sender)
      if (!tokensMinted) return
      console.log('🌈🌈🌈🌈🌈 Bridge to destination completed')
    } catch (err) {
      console.error('Error processing transaction', err)
      // TODO: return funds
    }
  } else {
    console.log('Another transfer')
  }
}

const handleDestinationEvent = async (
  event,
  provider,
  contract,
  providerDest,
  contractDest
) => {
  //const { from, to, value } = event.returnValues
  const { sender, to, amount } = event.returnValues;
  console.log('handleDestinationEvent')
  /*console.log('to :>> ', to)
  console.log('from :>> ', from)
  console.log('value :>> ', value) */ 
  console.log('============================')

  if ( sender == process.env.WALLET_ZERO) {
    console.log('Tokens minted')
    return
  }

  if (BRIDGE_WALLET == BRIDGE_WALLET && to != sender) {
    console.log(
      'Tokens burn on etpos chain! Time to bridge back!'
    )

    try {
      // we need to approve burn, then burn
      /*const tokenBurnApproved = await approveForBurn(
        providerDest,
        contractDest,
        value
      )
      if (!tokenBurnApproved) return
      console.log('Tokens approved to be burnt')
      const tokensBurnt = await burnTokens(providerDest, contractDest, value)

      if (!tokensBurnt) return
      console.log(
        'Tokens burnt on destination, time to transfer tokens in ETH side'
      ) */
      const transferBack = await transferToEthWallet(
        provider,
        contract,
        amount, //value,
        sender, //from
      )
      if (!transferBack) return

      console.log('Tokens transfered to ETH wallet')
      console.log('🌈🌈🌈🌈🌈 Bridge back operation completed')
    } catch (err) {
      console.error('Error processing transaction', err)
      // TODO: return funds
    }
  } else {
    console.log('Something else triggered Transfer event')
  }
}

const main = async () => {
  const originWebSockerProvider = new Web3(process.env.ORIGIN_WSS_ENDPOINT)
  const destinationWebSockerProvider = new Web3(
    process.env.DESTINATION_WSS_ENDPOINT
  )
  // adds account to sign transactions
  originWebSockerProvider.eth.accounts.wallet.add(BRIDGE_WALLET_KEY)
  destinationWebSockerProvider.eth.accounts.wallet.add(BRIDGE_WALLET_KEY)

  const oriNetworkId = await originWebSockerProvider.eth.net.getId()
  const destNetworkId = await destinationWebSockerProvider.eth.net.getId()

  console.log('oriNetworkId :>> ', oriNetworkId)
  console.log('destNetworkId :>> ', destNetworkId)

  const originTokenContract = new originWebSockerProvider.eth.Contract(
    CHSD_ABIJSON.abi,
    ORIGIN_TOKEN_CONTRACT_ADDRESS
  )

  const destinationTokenContract =
    new destinationWebSockerProvider.eth.Contract(
      QCHSD_ABIJSON.abi,
      DESTINATION_TOKEN_CONTRACT_ADDRESS
    )

  let options = {
    filter: {
    //   value: ['1000', '1337'], //Only get events where transfer value was 1000 or 1337
    value: ["0.0000000001"],
    },
    fromBlock: "latest", //Number || "earliest" || "pending" || "latest"
    // toBlock: 'latest',
  }

  originTokenContract.events
   /* .Transfer*/.BridgeBurn(options)
    .on('data', async (event) => {
      await handleDestinationEvent (
        event,
        destinationWebSockerProvider,
        destinationTokenContract
      )
    })
    .on('error', (err) => {
      console.error('Error: ', err)
    })
  console.log(`Waiting for Transfer events on ${ORIGIN_TOKEN_CONTRACT_ADDRESS}`)

  destinationTokenContract.events
    /*.Transfer*/ .TokensLocked(options)
    .on('data', async (event) => {
        await handleEthEvent(
            event,
            originWebSockerProvider,
            originTokenContract,
          )
    })
    .on('error', (err) => {
      console.error('Error: ', err)
    })

  console.log(
    `Waiting for Transfer events on ${DESTINATION_TOKEN_CONTRACT_ADDRESS}`
  )
}

main()
