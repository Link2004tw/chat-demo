// app/search/page.tsx
import { Suspense } from 'react';
import SearchInput from '@/components/search/SearchInput';
import UserResults from '@/components/search/UserResults';

export default function SearchPage({
    searchParams,
}) {
    const query = searchParams.q || '';
    const page = Number(searchParams.page) || 1;

    return (
        <main className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-6">Find Users</h1>

            <SearchInput initialQuery={query} />

            <Suspense fallback={<div className="py-10 text-center">Loading users...</div>}>
                <UserResults query={query} page={page} />
            </Suspense>
        </main>
    );
}