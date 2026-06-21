const mongoose = require("mongoose")
const ledgerModel = require("./ledger.model")

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: [true, "Account must be associated with a user"],
        index: true // for fast searching
    },
    status: {
        type: String,
        enum: {
            values: ["ACTIVE", "FROZEN", "CLOSED"],
            message: "status can be either ACTIVE, FROZEN or CLOSED"

        },
        default: "ACTIVE"
    },
    currency: {
        type: String,
        required: [true, "Currency is required for creating an account"],
        default: "INR"
    },

}, {
    timestamps: true
})

accountSchema.index({ user: 1, status: 1 }) // compound index fro searching based


accountSchema.methods.getBalance = async function () {
    const balancedData = await ledgerModel.aggregate([
        { $match: { account: this._id } },          // to find all the ledger entries which matches with  this id
        {
            $group: {
                _id: null,
                totalDebit: {
                    $sum: {
                        $cond: [
                            {
                                $eq: ["$type", "DEBIT"]
                            },
                            "$amount",
                            0
                        ]
                    }
                },
                totalCredit: {
                    $sum: {
                        $cond: [
                            {
                                $eq: ["$type", "CREDIT"]
                            },
                            "$amount",
                            0
                        ]
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                balance: { $subtract: ["$totalCredit", "$totalDebit"] }
            }
        }

    ]);
    if (balancedData.length === 0) {
        return 0;
    }

    return balancedData[0].balance;


}


const accountModel = mongoose.model("account", accountSchema)


module.exports = accountModel