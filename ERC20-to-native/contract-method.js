const BRIDGE_WALLET = process.env.BRIDGE_WALLET;
const ORIGIN_TOKEN_CONTRACT_ADDRESS = process.env.ORIGIN_TOKEN_CONTRACT_ADDRESS;
const DESTINATION_TOKEN_CONTRACT_ADDRESS =
    process.env.DESTINATION_TOKEN_CONTRACT_ADDRESS;



// Handle event resive on erc20 side destination
const ERC20Transfer = async (provider, contract, amount, sender) => {
    try {
        console.log("sending erc20 on bsc chain");
        console.log("amount :>> ", amount);
        //console.log("contract.options.address :>> ", contract.options.address);
        const trx = contract.methods.unlockTokens( amount, sender);

        const gas = await trx.estimateGas({ from: BRIDGE_WALLET });
        console.log("gas :>> ", gas);
        const gasPrice = await provider.eth.getGasPrice();
        console.log("gasPrice :>> ", gasPrice);
        const data = trx.encodeABI();
        console.log("data :>> ", data);
        const nonce = await provider.eth.getTransactionCount(BRIDGE_WALLET);

        console.log("nonce :>> ", nonce);

        const trxData = {
            // trx is sent from the bridge wallet
            from: BRIDGE_WALLET,
            // destination of the transaction is the ERC20 token address
            to: DESTINATION_TOKEN_CONTRACT_ADDRESS,
            data,
            // hardcoded gasPrice as estimation is not correct
            gas,
            gasPrice,
            nonce,
        };

        console.log("Transaction ready to be sent");

        const receipt = await provider.eth.sendTransaction(trxData);
        console.log(`Transaction sent, hash is ${receipt.transactionHash}`);
        console.log(
            `erc20 resived > You can see this transaction in ${process.env.DESTINATION_EXPLORER}${receipt.transactionHash}`,
        );
        return true;
    } catch (err) {
        console.error("Error  > ", err);
        return false;
    }
};



//resive in erc20 send to native side 
const nativeTransfer = async (provider, contract, amount, sender) => {
    try {
        console.log("send native etpos ");
        console.log("amount :>> ", amount);
        console.log("contract.options.address :>> ", contract.options.address);
        const trx = contract.methods.withdraw(sender, amount)

        const gas = await trx.estimateGas({ from: BRIDGE_WALLET });
        console.log("gas :>> ", gas);
        const gasPrice = await provider.eth.getGasPrice();
        console.log("gasPrice :>> ", gasPrice);
        const data = trx.encodeABI();
        console.log("data :>> ", data);
        const nonce = await provider.eth.getTransactionCount(BRIDGE_WALLET);

        console.log("nonce :>> ", nonce);

        const trxData = {
            // trx is sent from the bridge wallet
            from: BRIDGE_WALLET,
            // destination of the transaction is the ERC20 token address
            to: ORIGIN_TOKEN_CONTRACT_ADDRESS,
            data,
            // hardcoded gasPrice as estimation is not correct
            gas,
            gasPrice,
            nonce,
        };

        console.log("Transaction ready to be sent");

        const receipt = await provider.eth.sendTransaction(trxData);
        console.log(`Transaction sent, hash is ${receipt.transactionHash}`);
        console.log(
            `etpos resived > You can see this transaction in ${process.env.ORIGIN_EXPLORER}${receipt.transactionHash}`,
        );
        return true;
    } catch (err) {
        console.error("Error  > ", err);
        return false;
    }
};



module.exports = {
    nativeTransfer,
    ERC20Transfer,
    
};