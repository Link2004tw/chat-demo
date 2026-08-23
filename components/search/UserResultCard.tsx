// components/search/UserResultCard.tsx
'use client';

import ProfileItem from '@/app/components/Friends/ProfileItem';

export default function UserResultCard({ user }) {
    return <ProfileItem user={user} onAction={() => {}} />;
}