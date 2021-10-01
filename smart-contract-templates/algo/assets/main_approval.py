from pyteal import *


def approval_program():
    creator = Bytes("creator")
    contentUri = Bytes("contentUri")
    contentHash = Bytes("contentHash")
    totNFT = Bytes("totNFT")
    concatenatedNFTsID = Bytes("concatenatedNFTsID")

    on_deployment = Seq([
        Assert(Txn.application_args.length() == Int(4)),
        App.globalPut(creator, Txn.sender()),
        App.globalPut(contentUri, Txn.application_args[0]),
        App.globalPut(contentHash, Txn.application_args[1]),
        App.globalPut(totNFT, Txn.application_args[2]),
        App.globalPut(concatenatedNFTsID, Txn.application_args[3]),
        Return(Int(1))
    ])

    set_income_benef_num = Seq([
        Assert(Txn.application_args.length() == Int(2)),
        Assert(Txn.accounts.length() == Int(1)),
        App.localPut(
            Int(1),
            Bytes('beneficiaries_num'),
            Btoi(Txn.application_args[1])
        ),
        Return(Int(1))
    ])

    set_income_benef = Seq([
        Assert(Txn.application_args.length() == Int(4)),
        App.localPut(
            Int(1),
            Txn.application_args[1],
            Txn.application_args[2]
        ),
        App.localPut(
            Int(1),
            Txn.application_args[2],
            Btoi(Txn.application_args[3])
        ),
        Return(Int(1))
    ])

    # Checks whether the sender is creator.
    is_creator = Txn.sender() == App.globalGet(creator)

    # Verfies that the application_id is 0, jumps to on_deployment.
    # Verifies that DeleteApplication is used and verifies that sender is creator.
    # Verifies that UpdateApplication is used and blocks that call (unsafe for production use).
    # Verifies that closeOut is used and jumps to on_closeout.
    # Verifies that the account has opted in and jumps to on_register.
    # Verifies that first argument is "vote" and jumps to on_vote.
    program = Cond(
        [Txn.application_id() == Int(0), on_deployment],
        [Txn.on_completion() == OnComplete.UpdateApplication,
         Return(Int(0))],  # block update
        [Txn.on_completion() == OnComplete.DeleteApplication, Return(is_creator)],
        [Txn.on_completion() == OnComplete.CloseOut, Return(Int(1))],
        [Txn.on_completion() == OnComplete.OptIn, Return(Int(1))],
        [Txn.application_args[0] == Bytes(
            "set_income_benef_num"), set_income_benef_num],
        [Txn.application_args[0] == Bytes(
            "set_income_benef"), set_income_benef]
    )

    return program


if __name__ == "__main__":
    print(compileTeal(approval_program(), Mode.Application))
