export default function SystemMessageItem({ message }) {
    return (
        <div className="flex justify-center my-2">
            <span className="px-3 py-1 text-xs text-white bg-gray-500 rounded-full font-medium select-none">
                {message}
            </span>
        </div>
    );
}