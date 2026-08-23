// components/friends/PendingRequests.tsx
import { startTransition, useActionState, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { acceptFriendRequest, declineFriendRequest, deleteFriendRequest } from "@/app/actions/friendsAction";
import { IncomingRequestItem } from "./IncomingRequestItem";
import OutcomingRequestItem from "./OutcomingRestItem";
import { debugLog } from '@/lib/logger';



function PendingRequests() {
    const [loading, setLoading] = useState(true);
    const [incoming, setIncoming] = useState([]);
    const [outgoing, setOutgoing] = useState([]);
    const [deleteRequestState, deleteRequestAction, deletePending] = useActionState(deleteFriendRequest, {
        success: false,
        error: false,
    });
    const [acceptState, acceptAction, acceptPending] = useActionState(acceptFriendRequest, {
        message: null,
        success: false,
        error: false
    })
    const [declinetState, declineAction, declinePending] = useActionState(declineFriendRequest, {
        message: null,
        success: false,
        error: false
    })
    useEffect(() => {
        const fetchPendingRequests = async () => {
            setLoading(true);
            const response = await fetch("/api/friends/requests");
            const data = await response.json();
            setIncoming(data.ingoingRequests);
            debugLog(data.ingoingRequests)
            setOutgoing(data.outgoingRequests);
            setLoading(false);
        };
        fetchPendingRequests();
    }, []);
    const fetchPendingRequests = async () => {
        setLoading(true);
        const response = await fetch("/api/friends/requests");
        const data = await response.json();
        //debugLog(data.outgoingRequests)
        setIncoming(data.ingoingRequests);
        setOutgoing(data.outgoingRequests);
        setLoading(false);
    };
    useEffect(() => {
        debugLog(deleteRequestState);
        if (deleteRequestState.success) {
            alert("Request deleted successfully");
        }
        if (deletePending) {

            fetchPendingRequests();
        }
    }, [deletePending, deleteRequestState]);

    useEffect(() => {
        if (acceptState.success) {
            alert("Request Accepted successfully");
        }
        if (declinetState.success) {
            alert("Request declined successfully");
        }
        if (acceptPending || declinePending) {

            fetchPendingRequests();
        }
    }, [acceptState, acceptPending, declinetState, declinePending])
    // In real app these would call API endpoints
    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Incoming Requests */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Incoming Requests</h2>
                    <Badge variant="secondary">{incoming.length}</Badge>
                </div>

                {incoming.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No pending incoming requests
                    </div>
                ) : (
                    <div className="space-y-3">
                        {incoming.map((req) => (<IncomingRequestItem
                            key={req._id}
                            request={req}
                            onAccept={acceptAction}
                            onDecline={declineAction}
                            disabled={acceptPending || declinePending}
                        />))}
                    </div>
                )}
            </section>

            {/* Outgoing Requests */}
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Sent Requests</h2>
                    <Badge variant="secondary">{outgoing.length}</Badge>
                </div>

                {outgoing.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No pending outgoing requests
                    </div>
                ) : (
                    <div className="space-y-3">
                        {outgoing.map((req) => (
                            <OutcomingRequestItem
                                key={req._id}
                                request={req}
                                cancelAction={deleteRequestAction}
                                disabled={deletePending}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

export default PendingRequests;