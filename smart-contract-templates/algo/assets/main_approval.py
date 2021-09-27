from pyteal import *


def approval_program():
    content = Bytes("total")
    var_1 = Int(1)

    on_deployment = Seq([
        App.globalPut(Bytes("creator"), Txn.sender()),
        #Assert(Txn.application_args.length() == Int(1)),
        App.globalPut(content, Txn.application_args[0]),
        Return(var_1)
    ])

    # Checks whether the sender is creator.
    is_creator = Txn.sender() == App.globalGet(Bytes("creator"))

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
        [Txn.on_completion() == OnComplete.CloseOut, Return(var_1)],
        [Txn.on_completion() == OnComplete.OptIn, Return(var_1)]
    )

    return program


if __name__ == "__main__":
    print(compileTeal(approval_program(), Mode.Application))
