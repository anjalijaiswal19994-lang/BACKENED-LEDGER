const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")
const mongoose = require("mongoose") // for session creation

/**
 * - Create a new transaction
 * The 10-step transfer flow:
 * 1. validate request
 * 2. validate idempotency key
 * 3. check account status
 * 4. Derive sender balance from ledger
 * 5. create transaction (PENDING)
 * 6. create DEBIT ledger entry
 * 7. create CREDIT ledger entry
 * 8. Mark transaction COMPLETED
 * 9. Commit mongodb session
 * 10. send email notification
 */

async function createTransaction(req, res) {
    /**
     * 1.validate request
     */
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "fromAccount, toAccount, account and idempotencyKeyare required"
        })
    }

    const fromuserAccount = await accountModel.findOne({
        _id: fromAccount,
    })

    const touserAccount = await accountModel.findOne({
        _id: toAccount,
    })
    if (!fromuserAccount || !touserAccount) {
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount"
        })
    }

    /**
     * validate idempotency key
     */

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })
    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })
        }
        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is still processing"
            })
        }
        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(500).json({
                message: "Transaction processing failed please retry"
            })
        }
        if (isTransactionAlreadyExists.status === "REVERSED") {
            return res.status(500).json({
                message: "Transaction was reversed please retry"
            })
        }
    }
    /**
     * check account status
     */
    if (fromuserAccount.status !== "ACTIVE" || touserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both fromuserAccount and touserAccount must be ACTIVE to process transaction"
        })
    }
    /**
     * 4. Derive sender balance from ledger
     */
    const balance = await fromuserAccount.getBalance()

    if (balance < amount) {
        res.status(400).json({
            messages: 'Insufficient balance, Current balance is ${balance}, Requested amount is ${amount}'
        })

    }
    let transaction;
    try {

        /**
         * Create transaction (PENDING)
         */
        const session = await mongoose.startSession()
        session.startTransaction()

        const transaction = (await transactionModel.create([{
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        }], { session }))[0];
        await transaction.save({ session })

        const debitledgerEntry = await ledgerModel.create([{
            account: fromuserAccount._id,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"

        }], { session })

        console.log("Before delay");

        await new Promise((resolve) => {
            setTimeout(resolve, 15 * 1000);
        });

        console.log("After delay");
        const creditledgerEntry = await ledgerModel.create([{
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"

        }], { session })

        await transactionModel.findOneAndUpdate(
            { _id: transaction._id },
            { status: "COMPLETED" },
            { session }
        )

        await session.commitTransaction()
        session.endSession()
    }
    catch (err) {
        return res.status(400).json({
            message: "Transaction is pending due to some issue, please retry after sometime"
        })

    }


    /**
     * 10. Send email notification
     */

    await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)
    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transaction
    })
}
async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    console.log("toAccount received:", toAccount);

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,

    })

    console.log("Account found:", toUserAccount);

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    const fromuserAccount = await accountModel.findOne({

        user: req.user._id
    })
    if (!fromuserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }

    // transaction initiation

    const session = await mongoose.startSession()
    session.startTransaction()

    const transaction = new transactionModel({
        fromAccount: fromuserAccount._id,
        toAccount,
        amount,
        idempotencyKey,
        status: "PENDING"
    })

    const debitledgerEntry = await ledgerModel.create([{
        account: fromuserAccount,
        amount: amount,
        transaction: transaction._id,
        type: "DEBIT"

    }], { session })
    const creditledgerEntry = await ledgerModel.create([{
        account: toAccount,
        amount: amount,
        transaction: transaction._id,
        type: "CREDIT"

    }], { session })
    transaction.status = "COMPLETED"
    await transaction.save({ session })

    await session.commitTransaction()
    session.endSession()

    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction
    })

}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}