import { useActionState } from "react";
import InviteRequestItem from "./InviteRequestItem";
import { acceptInvite, declineInvite } from "@/app/actions/chatsAction";

const InviteRequestList = ({ requests }) => {
    const [acceptRequestState, acceptRequestAction, isAcceptPending] = useActionState(acceptInvite, {
        success: false,
        error: null,
    });
    const [declineRequestState, declineRequestAction, isDeclinePending] = useActionState(declineInvite, {
        success: false,
        error: null,
    });

    return (
        <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                Invite Requests
            </h3>
            {requests ? (
                <div className="flex flex-col">
                    {requests?.length === 0 ? (
                        <p className="text-gray-500 text-sm">No pending requests</p>
                    ) : (
                        requests.map((request) => (
                            <InviteRequestItem
                                key={request._id} // assuming each request has a unique id
                                request={request} // or request.text depending on your data
                                onAccept={acceptRequestAction}
                                onReject={declineRequestAction}
                                disabled={isAcceptPending || isDeclinePending} // optional: disable buttons while pending
                            />
                        ))
                    )}
                </div>
            ) : (
                <p className="text-gray-500 text-sm">No pending requests</p>
            )}

            {/* Optionally show error messages */}
            {acceptRequestState.error && (
                <p className="text-red-500 text-sm mt-2">{acceptRequestState.error}</p>
            )}
            {declineRequestState.error && (
                <p className="text-red-500 text-sm mt-2">{declineRequestState.error}</p>
            )}
        </div>
    );
};

export default InviteRequestList;
