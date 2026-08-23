"use client";
// pages/Friends.tsx (or app/friends/page.tsx if Next.js)
import { useState } from 'react';
import FriendsList from '../components/Friends/FriendList'; //from '@/components/Friends/FriendList';
import AddFriendSection from '../components/Friends/AddFriendSection';
import PendingRequests from '../components/Friends/PendingRequest'; //from '@/components/Friends/PendingRequests';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'; // shadcn/ui or your own

export default function FriendsPage() {
    const [activeTab, setActiveTab] = useState('friends');

    return (
        <div className="flex flex-col min-h-screen bg-background">
            {/* Header */}
            <header className="p-4 border-b">
                <h1 className="text-2xl font-bold">Friends</h1>
            </header>

            {/* Tabs – very useful pattern */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                <TabsList className="grid w-full grid-cols-3 sticky top-0 bg-background z-10 border-b">
                    <TabsTrigger value="friends">Friends</TabsTrigger>
                    <TabsTrigger value="add">Add Friend</TabsTrigger>
                    <TabsTrigger value="pending">Requests</TabsTrigger>
                </TabsList>

                <div className="flex-1 overflow-y-auto p-4">
                    <TabsContent value="friends">
                        <FriendsList />
                    </TabsContent>

                    <TabsContent value="add">
                        <AddFriendSection />
                    </TabsContent>

                    <TabsContent value="pending">
                        <PendingRequests />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}